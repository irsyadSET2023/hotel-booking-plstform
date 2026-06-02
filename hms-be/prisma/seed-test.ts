import "dotenv/config";
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedReferences } from "./seeders/01-references.seeder";
import { seedUsers } from "./seeders/02-users.seeder";
import { seedHotels } from "./seeders/03-hotels.seeder";
import { seedRoomCategories } from "./seeders/04-room-categories-seeder.js";
import { seedRooms } from "./seeders/05-rooms.seeder.js";
import { seedRoomInventories } from "./seeders/06-room-inventories.seeder.js";
import serverConfig from "../src/config/server.js";

const adapter = new PrismaPg({
  connectionString: serverConfig.testDatabaseUrl,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...\n");

  await seedReferences(prisma);
  await seedUsers(prisma);
  await seedHotels(prisma);
  await seedRoomCategories(prisma);
  await seedRooms(prisma);
  await seedRoomInventories(prisma);

  console.log("✅  Seed completed.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
