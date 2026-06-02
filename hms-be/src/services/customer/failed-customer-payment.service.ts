import { OrderStatus, PaymentStatus, Prisma } from "../../../generated/prisma";
import prisma from "../../config/prisma";
import { AppError } from "../../utils/app-error";

export const failedOrCancelCustomerPaymentService = async ({
  paymentUuid,
  status,
}: {
  paymentUuid: string;
  status: "FAILED" | "CANCELLED";
}) => {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: {
        uuid: paymentUuid,
      },
      include: {
        order: {
          include: {
            cart: {
              include: {
                cartItems: {
                  include: {
                    roomCategory: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new AppError("Payment not found");
    }

    // Idempotency protection
    if (
      (status === "FAILED" && payment.status === PaymentStatus.FAILED) ||
      (status === "CANCELLED" && payment.status === PaymentStatus.CANCELLED)
    ) {
      return;
    }

    const demandMap = new Map<
      string,
      {
        hotelId: bigint;
        roomCategoryId: bigint;
        inventoryDate: string;
        quantity: number;
      }
    >();

    const toDateKey = (date: Date): string => {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");

      return `${y}-${m}-${d}`;
    };

    // Build inventory release demands
    for (const item of payment.order.cart.cartItems) {
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

        const key = [
          item.roomCategory.hotelId,
          item.roomCategoryId,
          inventoryDate,
        ].join("|");

        const existing = demandMap.get(key);

        if (existing) {
          existing.quantity += 1;
        } else {
          demandMap.set(key, {
            hotelId: item.roomCategory.hotelId,
            roomCategoryId: item.roomCategoryId,
            inventoryDate,
            quantity: 1,
          });
        }
      }
    }

    const demands = [...demandMap.values()];

    if (demands.length) {
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
          reserved_rooms = ri.reserved_rooms - v.quantity,
          available_rooms = ri.available_rooms + v.quantity,
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
    }

    await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.FAILED,
      },
    });

    await tx.order.update({
      where: {
        id: payment.orderId,
      },
      data: {
        status: OrderStatus.CANCELLED,
      },
    });
  });
};
