import {
  OrderStatus,
  PaymentStatus,
  PrismaClient,
} from "../../../generated/prisma";
import prisma from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import type {
  CartItem,
  Customer,
  RoomCategory,
  Order,
} from "../../../generated/prisma";
import { sendEmail } from "../../external-services/email-service";

interface EmailBookingData {
  customerEmail: string;
  orderUuid: string;
  bookings: {
    hotelName: string;
    roomCategoryId: bigint;
    checkInDate: Date;
    checkOutDate: Date;
    guestName: string;
    guestEmail: string;
    specialRequests?: string | null;
  }[];
}

export const confirmPaymentService = async ({
  paymentUuid,
}: {
  paymentUuid: string;
}) => {
  const result = await prisma.$transaction(async (tx) => {
    // 1. LOCK PAYMENT
    const paymentRows = await tx.$queryRaw<any[]>`
      SELECT *
      FROM payments
      WHERE uuid = ${paymentUuid}
      FOR UPDATE
    `;

    const payment = paymentRows[0];

    if (!payment) throw new AppError("Payment not found");

    // 2. IDEMPOTENCY CHECK (SAFE HERE)
    if (payment.status === PaymentStatus.PAID) {
      return null;
    }

    // 3. LOCK ORDER + CART + ITEMS
    const orderRows = await tx.$queryRaw<
      { id: bigint; cart_id: bigint; uuid: string }[]
    >`
      SELECT id, cart_id, uuid
      FROM orders
      WHERE id = ${payment.order_id}
      FOR UPDATE
    `;

    const order = orderRows[0];

    if (!order) throw new AppError("Order not found");

    const cartItems = await tx.cartItem.findMany({
      where: {
        cartId: order.cart_id,
      },
      include: {
        roomCategory: {
          include: {
            hotel: {
              select: { name: true },
            },
          },
        },
      },
    });

    const cart = await tx.cart.findUnique({
      where: { id: order.cart_id },
      include: { customer: true },
    });

    const customer = cart?.customer;

    if (!customer) throw new AppError("Customer not found");

    // 4. UPDATE STATE
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.PAID },
    });

    await tx.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID },
    });

    const emailBookingData = await createBooking(
      tx,
      cartItems,
      customer,
      order as unknown as Order,
    );
    return emailBookingData;

    // 5. CREATE BOOKINGS
  });

  if (result) {
    await sendBookingConfirmationEmail(result);
  }
};

const createBooking = async (
  tx: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >,
  cartItems: (CartItem & {
    roomCategory: RoomCategory & { hotel: { name: string } };
  })[],
  customer: Customer,
  order: Order,
): Promise<EmailBookingData> => {
  const bookingsData = cartItems.map((cartItem) => ({
    orderId: order.id,
    customerId: customer.id,
    hotelId: cartItem.roomCategory.hotelId,
    roomCategoryId: cartItem.roomCategoryId,
    checkInDate: cartItem.checkInDate,
    checkOutDate: cartItem.checkOutDate,
    guestName: cartItem.guestName as string,
    guestEmail: cartItem.guestEmail as string,
    specialRequests: cartItem.specialRequests,
  }));

  await tx.booking.createMany({
    data: bookingsData,
  });

  const emailData = {
    customerEmail: customer.email,
    orderUuid: order.uuid,
    bookings: bookingsData.map((booking) => ({
      hotelName: cartItems.find(
        (item) => item.roomCategoryId === booking.roomCategoryId,
      )?.roomCategory.hotel.name as string,
      roomCategoryId: booking.roomCategoryId,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      specialRequests: booking.specialRequests,
    })),
  };

  return emailData;
};

const sendBookingConfirmationEmail = async (emailData: EmailBookingData) => {
  for (const booking of emailData.bookings) {
    const emailContent = `

    <tr> <td style="padding:6px 0;font-weight:bold;color:#374151;"> Check-in Date </td> <td style="padding:6px 0;color:#111827;"> ${booking.checkInDate.toDateString()} </td> </tr> <tr> <td style="padding:6px 0;font-weight:bold;color:#374151;"> Check-out Date </td> <td style="padding:6px 0;color:#111827;"> ${booking.checkOutDate.toDateString()} </td> </tr> <tr> <td style="padding:6px 0;font-weight:bold;color:#374151;"> Guest Name </td> <td style="padding:6px 0;color:#111827;"> ${booking.guestName} </td> </tr> <tr> <td style="padding:6px 0;font-weight:bold;color:#374151;"> Guest Email </td> <td style="padding:6px 0;color:#111827;"> ${booking.guestEmail} </td> </tr> <tr> <td style="padding:6px 0;font-weight:bold;color:#374151;vertical-align:top;"> Special Requests </td> <td style="padding:6px 0;color:#111827;"> ${booking.specialRequests || "None"} </td> </tr>
                                            `;

    await sendEmail({
      to: [booking.guestEmail],
      subject: `Booking Confirmation - ${booking.hotelName}`,
      html: emailContent,
    });
  }
};
