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
import type { checkoutCartSchema } from "../../validators/customer.validator";
import { z } from "zod";
type CartItemWithBasePriceAndHotelId = Omit<
  CartItem,
  "id" | "createdAt" | "updatedAt" | "uuid" | "cartId" | "deletedAt"
> & {
  basePrice: number;
  hotelId: bigint;
};

type CheckoutCartPayload = z.infer<typeof checkoutCartSchema>;

export const checkoutCartService = async ({
  email,
  billingDetails,
  cartItems,
}: CheckoutCartPayload) => {
  //fetch necessary data for validation and processing
  const country = await prisma.country.findUnique({
    where: { uuid: billingDetails.countryUuid },
  });

  if (!country) throw new AppError("Invalid country");

  const phoneCountry = await prisma.country.findUnique({
    where: { uuid: billingDetails.phoneCountryCodeUuid },
  });

  if (!phoneCountry) throw new AppError("Invalid phone country");

  const city = await prisma.city.findUnique({
    where: { uuid: billingDetails.cityUuid },
  });

  if (!city) throw new AppError("Invalid city");

  const customer = await prisma.customer.findUnique({
    where: { email },
  });

  if (!customer) throw new AppError("Customer not found");
  if (!customer.emailVerified) throw new AppError("Email not verified");

  const mappedCartItemsData = await mapRoomCategoryToCartItem(cartItems);

  //Start transaction
  const result = await prisma.$transaction(async (tx) => {
    const existingBilling = await tx.billingAddress.findFirst({
      where: {
        customerId: customer.id,
        isPrimary: true,
        deletedAt: null,
      },
    });

    const billing = await updateOrCreateCustomerPrimaryBillingAddress(
      tx,
      customer,
      billingDetails,
      country,
      city,
      phoneCountry,
    );

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
      orderUuid: order.uuid,
      paymentUuid: payment.uuid,
      amount: order.totalAmount,
      email: customer.email,
    };
  });

  // 2. Stripe OUTSIDE transaction
  const session = await createStripePaymentRequest({
    amount: Number(result.amount),
    currency: "myr",
    email: result.email,
    description: `Order for room booking with order number ${result.orderUuid}`,
    reference_number: result.paymentUuid,
    successUrl: `${process.env.FRONTEND_URL}/success`,
    cancelUrl: `${process.env.FRONTEND_URL}/cancel`,
  });

  // 3. update payment with stripe session id
  await prisma.payment.update({
    where: { uuid: result.paymentUuid },
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
  cartRoomCategories: CheckoutCartPayload["cartItems"],
): Promise<CartItemWithBasePriceAndHotelId[]> => {
  const roomCategories = await prisma.roomCategory.findMany({
    where: {
      uuid: {
        in: cartRoomCategories.map(
          (cartRoomCategory) => cartRoomCategory.roomCategoryUuid,
        ),
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

const updateOrCreateCustomerPrimaryBillingAddress = async (
  tx: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >,
  customer: Customer,
  billingDetails: CheckoutCartPayload["billingDetails"],
  country: { id: bigint },
  city: { id: bigint },
  phoneCountry: { id: bigint },
) => {
  const existingBilling = await tx.billingAddress.findFirst({
    where: {
      customerId: customer.id,
      isPrimary: true,
      deletedAt: null,
    },
  });

  return existingBilling
    ? await tx.billingAddress.update({
        where: { id: existingBilling.id },
        data: {
          customerId: customer.id,
          countryId: country.id,
          cityId: city.id,
          phoneCountryId: phoneCountry.id,
          phoneNumber: billingDetails.phoneNumber,
          firstName: billingDetails.firstName,
          lastName: billingDetails.lastName,
          addressLine1: billingDetails.addressLine1,
          addressLine2: billingDetails.addressLine2,
          postalCode: billingDetails.postalCode,
        },
      })
    : await tx.billingAddress.create({
        data: {
          customerId: customer.id,
          countryId: country.id,
          cityId: city.id,
          phoneCountryId: phoneCountry.id,
          phoneNumber: billingDetails.phoneNumber,
          firstName: billingDetails.firstName,
          lastName: billingDetails.lastName,
          addressLine1: billingDetails.addressLine1,
          addressLine2: billingDetails.addressLine2,
          postalCode: billingDetails.postalCode,
          isPrimary: true,
        },
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
      paymentMethod: PaymentMethod.ONLINE_GATEWAY,
      paymentGateway: PaymentGateway.STRIPE,
    },
  });

  return { order, payment };
};

export const updateRoomInventory = async (
  tx: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >,
  cartItems: CartItemWithBasePriceAndHotelId[],
) => {
  if (!cartItems.length) return;

  type Demand = {
    hotelId: bigint;
    roomCategoryId: bigint;
    inventoryDate: string; // YYYY-MM-DD
    quantity: number;
  };

  const toDateKey = (date: Date): string => {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const demandMap = new Map<string, Demand>();

  // 1. Build + aggregate demand (UTC-safe)
  for (const item of cartItems) {
    const start = new Date(item.checkInDate);
    const end = new Date(item.checkOutDate);

    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    for (
      let cur = new Date(start);
      cur < end;
      cur.setUTCDate(cur.getUTCDate() + 1)
    ) {
      const inventoryDate = toDateKey(cur);

      const key = `${item.hotelId}-${item.roomCategoryId}-${inventoryDate}`;

      const existing = demandMap.get(key);

      if (existing) {
        existing.quantity += 1;
      } else {
        demandMap.set(key, {
          hotelId: item.hotelId,
          roomCategoryId: item.roomCategoryId,
          inventoryDate,
          quantity: 1,
        });
      }
    }
  }

  let demands = [...demandMap.values()];

  if (!demands.length) return;

  // 2. 🔒 DEADLOCK PREVENTION: deterministic lock order
  demands = demands.sort((a, b) => {
    if (a.hotelId !== b.hotelId) {
      return a.hotelId < b.hotelId ? -1 : 1;
    }

    if (a.roomCategoryId !== b.roomCategoryId) {
      return a.roomCategoryId < b.roomCategoryId ? -1 : 1;
    }

    return a.inventoryDate < b.inventoryDate ? -1 : 1;
  });

  // 3. Lock rows in deterministic order
  const lockedRows = await tx.$queryRaw<
    {
      hotel_id: bigint;
      room_category_id: bigint;
      inventory_date: Date;
      available_rooms: number;
    }[]
  >`
    SELECT
      hotel_id,
      room_category_id,
      inventory_date,
      available_rooms
    FROM room_inventories
    WHERE (hotel_id, room_category_id, inventory_date) IN (
      ${Prisma.join(
        demands.map(
          (d) => Prisma.sql`
            (${d.hotelId}, ${d.roomCategoryId}, ${d.inventoryDate}::date)
          `,
        ),
      )}
    )
    FOR UPDATE
  `;

  // 4. Ensure no missing inventory rows
  if (lockedRows.length !== demands.length) {
    throw new AppError(
      "Inventory records missing for one or more requested dates",
    );
  }

  // 5. Build availability map
  const availabilityMap = new Map<string, number>();

  for (const row of lockedRows) {
    const key = `${row.hotel_id}-${row.room_category_id}-${toDateKey(
      row.inventory_date,
    )}`;

    availabilityMap.set(key, row.available_rooms);
  }

  // 6. Validate stock
  for (const d of demands) {
    const key = `${d.hotelId}-${d.roomCategoryId}-${d.inventoryDate}`;

    const available = availabilityMap.get(key);

    if (available === undefined || available < d.quantity) {
      throw new AppError("One or more rooms are no longer available");
    }
  }

  // 7. Single bulk update (safe + fast)
  const values = Prisma.join(
    demands.map(
      (d) => Prisma.sql`
        (
          ${d.hotelId},
          ${d.roomCategoryId},
          ${d.inventoryDate},
          ${d.quantity}
        )
      `,
    ),
  );

  await tx.$executeRaw`
  UPDATE room_inventories ri
  SET
    reserved_rooms = ri.reserved_rooms + v.quantity,
    available_rooms = ri.available_rooms - v.quantity,
    updated_at = NOW()
  FROM (
    SELECT
      hotel_id::bigint,
      room_category_id::bigint,
      inventory_date::date,
      quantity::integer
    FROM (
      VALUES
      ${values}
    ) AS raw(
      hotel_id,
      room_category_id,
      inventory_date,
      quantity
    )
  ) v
  WHERE
    ri.hotel_id = v.hotel_id
    AND ri.room_category_id = v.room_category_id
    AND ri.inventory_date = v.inventory_date
`;
};
