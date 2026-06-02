import prisma from "../../config/prisma";
import type { RequestingUser } from "../hotel/hotel.types";

type Query = {
  page: number;
  limit: number;
  hotelUuid?: string;
  checkInDate: string;
  checkOutDate: string;
};

export const listRoomCategoriesService = async (
  query: Query,
  user?: RequestingUser,
) => {
  const { page, limit, hotelUuid, checkInDate, checkOutDate } = query;

  const skip = (page - 1) * limit;

  // ─────────────────────────────────────────────
  // 1. Base filter
  // ─────────────────────────────────────────────
  const where: any = {
    deletedAt: null,
    isActive: true,
  };

  if (hotelUuid) {
    where.hotel = { uuid: hotelUuid };
  }

  if (user?.role === "HOTEL_ADMIN") {
    where.hotelId = user.hotelId;
  }

  // ─────────────────────────────────────────────
  // 2. Fetch categories
  // ─────────────────────────────────────────────
  const [categories, total] = await Promise.all([
    prisma.roomCategory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { sortOrder: "asc" },
      include: {
        hotel: {
          select: {
            uuid: true,
            name: true,
          },
        },
        rooms: {
          select: {
            id: true,
          },
        },
      },
    }),

    prisma.roomCategory.count({ where }),
  ]);

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  // ─────────────────────────────────────────────
  // 4. Fetch RoomInventory (NEW SOURCE OF TRUTH)
  // ─────────────────────────────────────────────
  const inventories = await prisma.roomInventory.findMany({
    where: {
      inventoryDate: {
        gte: checkIn,
        lt: checkOut,
      },
      deletedAt: null,
    },
  });

  // ─────────────────────────────────────────────
  // 5. Aggregate inventory per category
  // ─────────────────────────────────────────────
  const inventoryMap = new Map<
    number,
    {
      total: number;
      reserved: number;
      blocked: number;
      available: number;
    }
  >();

  for (const inv of inventories) {
    const key = Number(inv.roomCategoryId.toString());

    const existing = inventoryMap.get(key) || {
      total: 0,
      reserved: 0,
      blocked: 0,
      available: 0,
    };

    existing.total += inv.totalRooms;
    existing.reserved += inv.reservedRooms;
    existing.blocked += inv.blockedRooms;
    existing.available += inv.availableRooms;

    inventoryMap.set(key, existing);
  }

  // ─────────────────────────────────────────────
  // 6. Build response
  // ─────────────────────────────────────────────
  const data = categories.map((cat) => {
    const totalRooms = cat.rooms.length;

    const inv = inventoryMap.get(Number(cat.id.toString()));

    const reservedRooms = inv?.reserved || 0;
    const blockedRooms = inv?.blocked || 0;
    const availableRooms =
      inv?.available ?? totalRooms - reservedRooms - blockedRooms;

    return {
      uuid: cat.uuid,
      name: cat.name,
      basePrice: cat.basePrice,
      maxOccupancy: cat.maxOccupancy,

      hotel: cat.hotel,

      availability: {
        totalRooms,
        reservedRooms,
        blockedRooms,
        availableRooms: Math.max(availableRooms, 0),
      },
    };
  });

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
