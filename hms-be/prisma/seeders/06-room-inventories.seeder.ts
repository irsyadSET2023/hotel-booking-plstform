import type { PrismaClient } from "../../generated/prisma/index.js";

const INVENTORY_CONFIG: Record<string, number> = {
  "Standard Room": 10,
  "Deluxe Room": 8,
  Suite: 2,
};

const DAYS_AHEAD = 180;

export async function seedRoomInventories(prisma: PrismaClient): Promise<void> {
  console.log("📊 Seeding room inventories...\n");

  const hotels = await prisma.hotel.findMany({
    where: { deletedAt: null },
    include: {
      roomCategories: true,
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const hotel of hotels) {
    console.log(`🏨 ${hotel.name}`);

    for (const category of hotel.roomCategories) {
      const totalRooms = INVENTORY_CONFIG[category.name] ?? 0;

      if (!totalRooms) {
        console.warn(`  ⚠ No inventory config for category: ${category.name}`);
        continue;
      }

      for (let i = 0; i < DAYS_AHEAD; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const existing = await prisma.roomInventory.findFirst({
          where: {
            hotelId: hotel.id,
            roomCategoryId: category.id,
            inventoryDate: date,
          },
          select: { id: true },
        });

        if (existing) continue;

        await prisma.roomInventory.create({
          data: {
            hotelId: hotel.id,
            roomCategoryId: category.id,
            inventoryDate: date,
            totalRooms,
            reservedRooms: 0,
            blockedRooms: 0,
            availableRooms: totalRooms,
          },
        });
      }

      console.log(
        `  ✓ ${category.name} → ${totalRooms} rooms × ${DAYS_AHEAD} days`,
      );
    }
  }

  console.log();
}
