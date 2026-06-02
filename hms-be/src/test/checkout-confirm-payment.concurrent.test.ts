import { describe, test, expect, beforeAll, afterAll, mock } from "bun:test";
import { prisma } from "./setup.test";
import { PaymentStatus } from "../../generated/prisma";

// ─── Mocks (must be declared before service imports) ─────────────────────────
let stripeCallCount = 0;

mock.module("../external-services/payment-gateways/stripe", () => ({
  createStripePaymentRequest: mock(async () => {
    stripeCallCount++;
    return {
      id: `cs_test_concurrent_${stripeCallCount}`,
      url: `https://checkout.stripe.com/mock-${stripeCallCount}`,
    };
  }),
}));

mock.module("../external-services/email-service", () => ({
  sendEmail: mock(async () => {}),
}));

// ─── Import services AFTER mocks ──────────────────────────────────────────────
const { checkoutCartService } =
  await import("../services/customer/checkout-cart.customer.service");
const { confirmPaymentService } =
  await import("../services/customer/confirm-payment.customer.service");

// ─── Fixtures ─────────────────────────────────────────────────────────────────
let countryUuid: string;
let phoneCountryUuid: string;
let cityUuid: string;

// Isolated hotel/category/inventory per run so we never collide with other suites
const RUN_OFFSET = Math.floor(Date.now() / 1000) % 30000;
const CHECK_IN = new Date(Date.UTC(2031, 0, 1 + (RUN_OFFSET % 300)));
const CHECK_OUT = new Date(CHECK_IN);
CHECK_OUT.setUTCDate(CHECK_OUT.getUTCDate() + 2);
const CHECK_IN_STR = CHECK_IN.toISOString().split("T")[0] as string;
const CHECK_OUT_STR = CHECK_OUT.toISOString().split("T")[0] as string;

// ─── Concurrency-specific hotel with exactly N rooms ─────────────────────────
let concurrentHotelId: bigint;
let concurrentRoomCategoryUuid: string;
let concurrentRoomCategoryId: bigint;

const AVAILABLE_ROOMS = 3; // intentionally fewer than the number of competing buyers

beforeAll(async () => {
  const country = await prisma.country.findFirstOrThrow({
    where: { iso2: "MY" },
  });
  countryUuid = country.uuid;
  phoneCountryUuid = country.uuid;

  const city = await prisma.city.findFirstOrThrow({
    where: { name: "Kuala Lumpur" },
  });
  cityUuid = city.uuid;

  const hotel = await prisma.hotel.create({
    data: { name: `Concurrent Test Hotel ${RUN_OFFSET}` },
  });
  concurrentHotelId = hotel.id;

  const category = await prisma.roomCategory.create({
    data: {
      hotelId: concurrentHotelId,
      name: "Concurrent Room",
      maxOccupancy: 2,
      basePrice: 200,
    },
  });
  concurrentRoomCategoryUuid = category.uuid;
  concurrentRoomCategoryId = category.id;

  // Seed inventory: exactly AVAILABLE_ROOMS rooms per night
  const cur = new Date(CHECK_IN);
  while (cur < CHECK_OUT) {
    await prisma.roomInventory.create({
      data: {
        hotelId: concurrentHotelId,
        roomCategoryId: concurrentRoomCategoryId,
        inventoryDate: new Date(cur),
        totalRooms: AVAILABLE_ROOMS,
        reservedRooms: 0,
        blockedRooms: 0,
        availableRooms: AVAILABLE_ROOMS,
      },
    });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
});

afterAll(async () => {
  // Clean up all concurrent test customers
  const customers = await prisma.customer.findMany({
    where: { email: { startsWith: "concurrent-test-" } },
  });

  for (const customer of customers) {
    const carts = await prisma.cart.findMany({
      where: { customerId: customer.id },
      include: { order: true },
    });

    for (const cart of carts) {
      if (cart.order) {
        await prisma.booking.deleteMany({ where: { orderId: cart.order.id } });
        await prisma.payment.deleteMany({ where: { orderId: cart.order.id } });
        await prisma.order.delete({ where: { id: cart.order.id } });
      }
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cart.delete({ where: { id: cart.id } });
    }

    await prisma.billingAddress.deleteMany({
      where: { customerId: customer.id },
    });
    await prisma.customer.delete({ where: { id: customer.id } });
  }

  await prisma.roomInventory.deleteMany({
    where: { hotelId: concurrentHotelId },
  });
  await prisma.roomCategory.deleteMany({
    where: { hotelId: concurrentHotelId },
  });
  await prisma.hotel.delete({ where: { id: concurrentHotelId } });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const createCustomer = async (tag: string) => {
  const email = `concurrent-test-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
  await prisma.customer.create({
    data: {
      email,
      password: "hashed-password",
      firstName: "Concurrent",
      lastName: "User",
      emailVerified: true,
    },
  });
  return email;
};

const buildBilling = () => ({
  firstName: "Concurrent",
  lastName: "User",
  phoneNumber: "0123456789",
  addressLine1: "1 Concurrency Lane",
  postalCode: "50000",
  countryUuid,
  cityUuid,
  phoneCountryCodeUuid: phoneCountryUuid,
});

const buildCartItem = () => ({
  roomCategoryUuid: concurrentRoomCategoryUuid,
  checkInDate: CHECK_IN_STR,
  checkOutDate: CHECK_OUT_STR,
  guestName: "Concurrent Guest",
  guestEmail: "concurrent-guest@example.com",
});

// ─── Concurrency tests ────────────────────────────────────────────────────────
describe("checkoutCartService — concurrent buyers, limited inventory", () => {
  test(`only ${AVAILABLE_ROOMS} out of N buyers succeed when inventory is exactly ${AVAILABLE_ROOMS}`, async () => {
    const BUYERS = 8; // more buyers than rooms to guarantee contention

    // Create all customers up-front (sequential — this is just setup)
    const emails: string[] = [];
    for (let i = 0; i < BUYERS; i++) {
      emails.push(await createCustomer(`checkout-${i}`));
    }

    // Fire all checkouts simultaneously
    const results = await Promise.allSettled(
      emails.map((email) =>
        checkoutCartService({
          email,
          billingDetails: buildBilling(),
          cartItems: [buildCartItem()],
        }),
      ),
    );

    const succeeded = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

    // Exactly AVAILABLE_ROOMS buyers should win
    expect(succeeded.length).toBe(AVAILABLE_ROOMS);
    expect(failed.length).toBe(BUYERS - AVAILABLE_ROOMS);

    // Every rejection must be the "no longer available" domain error
    for (const result of failed) {
      expect((result as PromiseRejectedResult).reason.message).toBe(
        "One or more rooms are no longer available",
      );
    }

    // DB must reflect: 0 available, AVAILABLE_ROOMS reserved — for every night
    const inventoryRows = await prisma.roomInventory.findMany({
      where: {
        roomCategoryId: concurrentRoomCategoryId,
        inventoryDate: { gte: CHECK_IN, lt: CHECK_OUT },
      },
    });

    for (const row of inventoryRows) {
      expect(row.availableRooms).toBe(0);
      expect(row.reservedRooms).toBe(AVAILABLE_ROOMS);
    }
  });
});

describe("confirmPaymentService — concurrent confirmations for the same payment", () => {
  test("only creates bookings once regardless of simultaneous confirm calls", async () => {
    // Bootstrap a single pending payment
    const email = await createCustomer("confirm-idempotent");

    // Temporarily bump inventory so checkout succeeds (previous test drained it)
    await prisma.roomInventory.updateMany({
      where: { roomCategoryId: concurrentRoomCategoryId },
      data: { availableRooms: { increment: 1 }, totalRooms: { increment: 1 } },
    });

    await checkoutCartService({
      email,
      billingDetails: buildBilling(),
      cartItems: [buildCartItem()],
    });

    const customer = await prisma.customer.findUniqueOrThrow({
      where: { email },
    });
    const cart = await prisma.cart.findFirstOrThrow({
      where: { customerId: customer.id },
    });
    const order = await prisma.order.findFirstOrThrow({
      where: { cartId: cart.id },
    });
    const payment = await prisma.payment.findFirstOrThrow({
      where: { orderId: order.id },
    });

    const CONCURRENT_CONFIRMS = 10;

    // Hammer the same paymentUuid simultaneously
    const results = await Promise.allSettled(
      Array.from({ length: CONCURRENT_CONFIRMS }, () =>
        confirmPaymentService({ paymentUuid: payment.uuid }),
      ),
    );

    // Because the payment row is locked with FOR UPDATE inside the transaction,
    // the idempotency check is safe: only the first caller creates bookings,
    // all subsequent callers see PAID and return early — none should throw.
    const failed = results.filter((r) => r.status === "rejected");

    // Exactly one booking must exist, not CONCURRENT_CONFIRMS
    const bookings = await prisma.booking.findMany({
      where: { orderId: order.id },
    });
    expect(bookings).toHaveLength(1);

    // Payment must be PAID exactly once
    const updatedPayment = await prisma.payment.findUniqueOrThrow({
      where: { uuid: payment.uuid },
    });
    expect(updatedPayment.status).toBe(PaymentStatus.PAID);
  });
});
