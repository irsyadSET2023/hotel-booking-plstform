import type { PrismaClient } from "../../generated/prisma/index.js";

const ROOM_CATEGORIES = [
  {
    name: "Standard Room",
    description: "Comfortable room for leisure and business travelers.",
    maxOccupancy: 2,
    bedType: "Queen",
    sizeM2: 25,
    basePrice: 150,
    amenities: ["WiFi", "Air Conditioning", "TV"],
    sortOrder: 1,
  },
  {
    name: "Deluxe Room",
    description: "Spacious room with additional comfort and amenities.",
    maxOccupancy: 3,
    bedType: "King",
    sizeM2: 35,
    basePrice: 250,
    amenities: ["WiFi", "Air Conditioning", "TV", "Mini Bar"],
    sortOrder: 2,
  },
  {
    name: "Suite",
    description: "Luxury suite with separate living area.",
    maxOccupancy: 4,
    bedType: "King",
    sizeM2: 55,
    basePrice: 500,
    amenities: ["WiFi", "Air Conditioning", "TV", "Mini Bar", "Living Room"],
    sortOrder: 3,
  },
];

export async function seedRoomCategories(prisma: PrismaClient): Promise<void> {
  console.log("🛏️ Seeding room categories...\n");

  const hotels = await prisma.hotel.findMany({
    where: { deletedAt: null },
  });

  for (const hotel of hotels) {
    for (const category of ROOM_CATEGORIES) {
      const existing = await prisma.roomCategory.findFirst({
        where: {
          hotelId: hotel.id,
          name: category.name,
          deletedAt: null,
        },
      });

      if (existing) continue;

      await prisma.roomCategory.create({
        data: {
          hotelId: hotel.id,
          name: category.name,
          description: category.description,
          maxOccupancy: category.maxOccupancy,
          bedType: category.bedType,
          sizeM2: category.sizeM2,
          basePrice: category.basePrice,
          amenities: category.amenities,
          sortOrder: category.sortOrder,
        },
      });
    }

    console.log(`  ✓ ${hotel.name}`);
  }

  console.log();
}
