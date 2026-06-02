import type { CartRoomCategory, CheckoutCartRequest } from "../../interfaces";
import prisma from "../../config/prisma";
import { createStripePaymentRequest } from "../../external-services/payment-gateways/stripe";
import { AppError } from "../../utils/app-error";
import serverConfig from "../../config/server";
import type { PrismaClient } from "../../../generated/prisma/client";
import {
  OrderStatus,
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  type Cart,
} from "../../../generated/prisma";
import type { CartItem, Customer } from "../../../generated/prisma";

type CartItemWithBasePriceAndHotelId = Omit<
  CartItem,
  "id" | "createdAt" | "updatedAt" | "uuid" | "cartId" | "deletedAt"
> & {
  basePrice: number;
  hotelId: bigint;
};

export const checkoutCartService = async ({
  customerUuid,
  billingAddress,
  cartRoomCategories,
}: CheckoutCartRequest & { customerUuid: string }) => {
  //fetch necessary data for validation and processing
  const country = await prisma.country.findUnique({
    where: { uuid: billingAddress.countryUuid },
  });

  if (!country) throw new AppError("Invalid country");

  const city = await prisma.city.findUnique({
    where: { uuid: billingAddress.cityUuid },
  });

  if (!city) throw new AppError("Invalid city");

  const customer = await prisma.customer.findUnique({
    where: { uuid: customerUuid },
  });

  if (!customer) throw new AppError("Customer not found");
  if (!customer.emailVerified) throw new AppError("Email not verified");

  const mappedCartItemsData =
    await mapRoomCategoryToCartItem(cartRoomCategories);

  //Start transaction
  const result = await prisma.$transaction(async (tx) => {
    const existingBilling = await tx.billingAddress.findFirst({
      where: {
        customerId: customer.id,
        isPrimary: true,
        deletedAt: null,
      },
    });

    const billing = existingBilling
      ? await tx.billingAddress.update({
          where: { id: existingBilling.id },
          data: { ...billingAddress },
        })
      : await tx.billingAddress.create({
          data: {
            ...billingAddress,
            customerId: customer.id,
            isPrimary: true,
            countryId: country.id,
            cityId: city.id,
          },
        });

    const cart = await createCartAndCartItems(
      tx,
      mappedCartItemsData,
      customer,
    );

    const { order, payment } = await createOrderAndPayment(
      tx,
      cart,
      mappedCartItemsData,
      billing.id,
    );

    await updateRoomInventory(tx, mappedCartItemsData);

    return {
      orderId: order.uuid,
      paymentId: payment.uuid,
      amount: payment.amount,
      email: customer.email,
    };
  });

  // 2. Stripe OUTSIDE transaction
  const session = await createStripePaymentRequest({
    amount: Number(result.amount) * 100, // convert to cents
    currency: "myr",
    email: result.email,
    description: `Order #${result.orderId}`,
    reference_number: String(result.paymentId),
    successUrl: `${process.env.FRONTEND_URL}/payment/success`,
    cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
  });

  // 3. update payment with stripe session id
  await prisma.payment.update({
    where: { uuid: result.paymentId },
    data: {
      transactionId: session.id,
    },
  });

  // 4. ONLY RETURN URL
  return {
    url: session.url,
  };
};

const mapRoomCategoryToCartItem = async (
  cartRoomCategories: CartRoomCategory[],
): Promise<CartItemWithBasePriceAndHotelId[]> => {
  const roomCategories = await prisma.roomCategory.findMany({
    where: {
      uuid: {
        in: cartRoomCategories.map(
          (cartRoomCategory) => cartRoomCategory.roomCategoryUuid,
        ),
      },
      include: {
        roomCategory: true,
      },
    },
  });

  return roomCategories.map((roomCategory) => {
    const cartItem = cartRoomCategories.find(
      (item) => item.roomCategoryUuid === roomCategory.uuid,
    );

    if (!cartItem) {
      throw new AppError("Cart item not found for room category");
    }

    return {
      hotelId: roomCategory.hotelId,
      basePrice: Number(roomCategory.basePrice),
      roomCategoryId: roomCategory.id,
      checkInDate: new Date(cartItem.checkInDate),
      checkOutDate: new Date(cartItem.checkOutDate),
      guestName: cartItem.guestName ?? null,
      guestEmail: cartItem.guestEmail ?? null,
      specialRequests: cartItem.specialRequests ?? null,
    };
  });
};

const createCartAndCartItems = async (
  tx: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >,
  cartItems: CartItemWithBasePriceAndHotelId[],
  customer: Customer,
) => {
  const cart = await tx.cart.create({
    data: {
      customerId: customer.id,
      isCheckedOut: true,
      cartItems: {
        createMany: {
          data: cartItems.map((cartItem) => ({
            roomCategoryId: cartItem.roomCategoryId,
            checkInDate: new Date(cartItem.checkInDate),
            checkOutDate: new Date(cartItem.checkOutDate),
            guestName: cartItem?.guestName ?? null,
            guestEmail: cartItem?.guestEmail ?? null,
            specialRequests: cartItem?.specialRequests ?? null,
          })),
        },
      },
    },
  });

  return cart;
};

const createOrderAndPayment = async (
  tx: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >,
  cart: Cart,
  cartItems: CartItemWithBasePriceAndHotelId[],
  billingAddressId: bigint,
) => {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.basePrice),
    0,
  );

  const sst = subtotal * serverConfig.sstRate;
  const total = subtotal + sst;

  const order = await tx.order.create({
    data: {
      cartId: cart.id,
      billingAddressId: billingAddressId,
      subtotalAmount: subtotal,
      taxAmount: sst,
      discountAmount: 0,
      totalAmount: total,
      status: OrderStatus.PENDING,
    },
  });

  const payment = await tx.payment.create({
    data: {
      orderId: order.id,
      amount: total * 100, // convert to cents
      currency: "MYR",
      status: PaymentStatus.PENDING,
      method: PaymentMethod.ONLINE_GATEWAY,
      paymentGateway: PaymentGateway.STRIPE,
    },
  });

  return { order, payment };
};

const updateRoomInventory = async (
  tx: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >,
  cartItems: CartItemWithBasePriceAndHotelId[],
) => {
  if (cartItems.length === 0) return;

  // 1. Expand cart items into per-day inventory rows
  const demands: {
    hotelId: bigint;
    roomCategoryId: bigint;
    inventoryDate: Date;
  }[] = [];

  for (const item of cartItems) {
    const start = new Date(item.checkInDate);
    const end = new Date(item.checkOutDate);

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      demands.push({
        hotelId: item.hotelId,
        roomCategoryId: item.roomCategoryId,
        inventoryDate: new Date(d),
      });
    }
  }

  // 2. Lock all affected rows + validate availability
  const lockedRows = await tx.$queryRaw<
    { id: bigint; available_rooms: number }[]
  >`
    SELECT id, available_rooms
    FROM room_inventories
    WHERE (hotel_id, room_category_id, inventory_date) IN (
      ${Prisma.join(
        demands.map(
          (d) =>
            Prisma.sql`(${d.hotelId}, ${d.roomCategoryId}, ${d.inventoryDate})`,
        ),
      )}
    )
    FOR UPDATE
  `;

  // 3. Validate AFTER locking (safe from race conditions)
  const hasUnavailable = lockedRows.some((r) => r.available_rooms < 1);

  if (hasUnavailable) {
    throw new AppError("One or more rooms are no longer available");
  }

  // 4. Bulk update safely (no OR conditions)
  await tx.$executeRaw`
    UPDATE room_inventories ri
    SET
      reserved_rooms = reserved_rooms + 1,
      available_rooms = available_rooms - 1
    WHERE (ri.hotel_id, ri.room_category_id, ri.inventory_date) IN (
      ${Prisma.join(
        demands.map(
          (d) =>
            Prisma.sql`(${d.hotelId}, ${d.roomCategoryId}, ${d.inventoryDate})`,
        ),
      )}
    )
  `;
};
