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
  const payment = await prisma.payment.findUnique({
    where: { uuid: paymentUuid },
    include: {
      order: {
        include: {
          cart: {
            include: {
              cartItems: {
                include: {
                  roomCategory: {
                    include: {
                      hotel: {
                        select: { name: true },
                      },
                    },
                  },
                },
              },
              customer: true,
            },
          },
        },
      },
    },
  });

  if (!payment) throw new AppError("Payment not found");

  if (payment.status === PaymentStatus.PAID) {
    return; // Idempotency protection: if already marked as PAID, do nothing
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { uuid: paymentUuid },
      data: {
        status: PaymentStatus.PAID,
      },
    });

    await tx.order.update({
      where: { uuid: payment.order.uuid },
      data: {
        status: OrderStatus.PAID,
      },
    });

    const emailBookingData = await createBooking(
      tx,
      payment.order.cart.cartItems,
      payment.order.cart.customer,
      payment.order,
    );

    return { emailBookingData };
  });

  const emailBookingData = result?.emailBookingData;

  if (emailBookingData) {
    (async () => {
      await sendBookingConfirmationEmail(emailBookingData);
    })();
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
