import { describe, test, expect, beforeAll } from "bun:test";
import { prisma } from "./setup.test";
import { updateRoomInventory } from "../services/customer/checkout-cart.customer.service";
import type { PrismaClient } from "../../generated/prisma";

describe("Room Inventory Concurrency", () => {
  let hotelId: bigint;
  let roomCategoryId: bigint;

  beforeAll(async () => {
    const hotel = await prisma.hotel.create({
      data: { name: "Test Hotel" },
    });

    hotelId = hotel.id;

    const category = await prisma.roomCategory.create({
      data: {
        hotelId,
        name: "Deluxe",
        maxOccupancy: 2,
        basePrice: 100,
      },
    });

    roomCategoryId = category.id;

    await prisma.roomInventory.create({
      data: {
        hotelId,
        roomCategoryId,
        inventoryDate: new Date("2026-06-10"),
        totalRooms: 1,
        reservedRooms: 0,
        blockedRooms: 0,
        availableRooms: 1,
      },
    });
  });

  test("prevents overselling under concurrency", async () => {
    const attempts = 10;

    const results = await Promise.allSettled(
      Array.from({ length: attempts }, () =>
        prisma.$transaction(
          async (
            tx: Omit<
              PrismaClient,
              | "$connect"
              | "$disconnect"
              | "$on"
              | "$transaction"
              | "$use"
              | "$extends"
            >,
          ) => {
            await updateRoomInventory(tx, [
              {
                hotelId,
                roomCategoryId,
                basePrice: 100,
                checkInDate: new Date("2026-06-10"),
                checkOutDate: new Date("2026-06-11"),
                guestName: null,
                guestEmail: null,
                specialRequests: null,
              },
            ]);
          },
        ),
      ),
    );

    const success = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    expect(success).toBe(1);
    expect(failed).toBe(9);

    const inventory = await prisma.roomInventory.findFirstOrThrow({
      where: { hotelId, roomCategoryId },
    });

    expect(inventory.availableRooms).toBe(0);
    expect(inventory.reservedRooms).toBe(1);
  });
});
