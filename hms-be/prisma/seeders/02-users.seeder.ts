import type { PrismaClient } from "../../generated/prisma/index.js";
import { hashPassword } from "../../src/utils/hash";

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  console.log("👤 Seeding users...\n");

  // ─── Super Admin ────────────────────────────────────────────────────────────
  const superAdminEmail = "superadmin@hms.com";
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { email: superAdminEmail, deletedAt: null },
  });

  if (!existingSuperAdmin) {
    await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: await hashPassword("SuperAdmin@123"),
        firstName: "Super",
        lastName: "Admin",
        role: "SUPER_ADMIN",
      },
    });
    console.log("  ✓  Super admin created");
    console.log("     Email:    superadmin@hms.com");
    console.log("     Password: SuperAdmin@123");
  } else {
    console.log("  –  Super admin already exists");
  }

  console.log();
}
