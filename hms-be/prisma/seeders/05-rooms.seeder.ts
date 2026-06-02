import type { PrismaClient } from "../../generated/prisma/index.js";

export async function seedRooms(prisma: PrismaClient): Promise<void> {
  console.log("🚪 Seeding rooms...\n");

  const hotels = await prisma.hotel.findMany({
    where: { deletedAt: null },
    include: {
      roomCategories: true,
    },
  });

  for (const hotel of hotels) {
    const standard = hotel.roomCategories.find(
      (c) => c.name === "Standard Room",
    );

    const deluxe = hotel.roomCategories.find((c) => c.name === "Deluxe Room");

    const suite = hotel.roomCategories.find((c) => c.name === "Suite");

    if (!standard || !deluxe || !suite) {
      console.warn(`  ⚠ Missing room categories for ${hotel.name}, skipping`);
      continue;
    }

    // Standard Rooms (101-110)
    for (let roomNumber = 101; roomNumber <= 110; roomNumber++) {
      await prisma.room.upsert({
        where: {
          hotelId_roomNumber: {
            hotelId: hotel.id,
            roomNumber: roomNumber.toString(),
          },
        },
        update: {},
        create: {
          hotelId: hotel.id,
          roomCategoryId: standard.id,
          roomNumber: roomNumber.toString(),
          floor: 1,
        },
      });
    }

    // Deluxe Rooms (201-208)
    for (let roomNumber = 201; roomNumber <= 208; roomNumber++) {
      await prisma.room.upsert({
        where: {
          hotelId_roomNumber: {
            hotelId: hotel.id,
            roomNumber: roomNumber.toString(),
          },
        },
        update: {},
        create: {
          hotelId: hotel.id,
          roomCategoryId: deluxe.id,
          roomNumber: roomNumber.toString(),
          floor: 2,
        },
      });
    }

    // Suites (301-302)
    for (let roomNumber = 301; roomNumber <= 302; roomNumber++) {
      await prisma.room.upsert({
        where: {
          hotelId_roomNumber: {
            hotelId: hotel.id,
            roomNumber: roomNumber.toString(),
          },
        },
        update: {},
        create: {
          hotelId: hotel.id,
          roomCategoryId: suite.id,
          roomNumber: roomNumber.toString(),
          floor: 3,
        },
      });
    }

    console.log(`  ✓ ${hotel.name} (20 rooms)`);
  }

  console.log();
}
