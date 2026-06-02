import prisma from "../../config/prisma";
import type { RequestingUser } from "../hotel/hotel.types";

type Query = {
  page: number;
  limit: number;
  hotelUuid?: string;
  roomCategoryId?: number;
  status?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
};

export const listRoomsService = async (query: Query, user?: RequestingUser) => {
  const {
    page,
    limit,
    hotelUuid,
    roomCategoryId,
    status,
    checkInDate,
    checkOutDate,
  } = query;

  const skip = (page - 1) * limit;

  // ─── Base filter ─────────────────────────────
  const where: any = {
    deletedAt: null,
  };

  // ─── Role-based filtering ────────────────────
  if (!user || user.role === "SUPER_ADMIN") {
    // no restriction
  }

  if (user?.role === "HOTEL_ADMIN") {
    where.hotelId = user.hotelId;
  }

  // ─── Optional filters ────────────────────────
  if (hotelUuid) {
    where.hotel = { uuid: hotelUuid };
  }

  if (roomCategoryId) {
    where.roomCategoryId = roomCategoryId;
  }

  if (status) {
    where.status = status;
  } else if (!user) {
    // public default
    where.status = "AVAILABLE";
  }

  // ─── DATE AVAILABILITY LOGIC ─────────────────
  if (checkInDate && checkOutDate) {
    where.bookings = {
      none: {
        AND: [
          {
            status: {
              in: ["CONFIRMED", "CHECKED_IN"],
            },
          },
          {
            checkInDate: {
              lt: checkOutDate,
            },
          },
          {
            checkOutDate: {
              gt: checkInDate,
            },
          },
        ],
      },
    };
  }

  // ─── Query ────────────────────────────────────
  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        hotel: {
          select: {
            uuid: true,
            name: true,
          },
        },
        roomCategory: {
          select: {
            id: true,
            uuid: true,
            name: true,
            basePrice: true,
            maxOccupancy: true,
          },
        },
      },
    }),

    prisma.room.count({ where }),
  ]);

  return {
    data: rooms,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
