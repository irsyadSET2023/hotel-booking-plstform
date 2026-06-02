import { describe, test, expect, beforeAll, afterAll, mock } from "bun:test";
import { prisma } from "./setup.test";
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentGateway,
} from "../../generated/prisma";

// ─── Mock Stripe (ignore stripe integration) ──────────────────────────────────
const MOCK_STRIPE_SESSION_ID = "cs_test_mock_session_id";
const MOCK_STRIPE_URL = "https://checkout.stripe.com/mock-payment";

mock.module("../external-services/payment-gateways/stripe", () => ({
  createStripePaymentRequest: mock(async () => ({
    id: MOCK_STRIPE_SESSION_ID,
    url: MOCK_STRIPE_URL,
  })),
}));

// ─── Mock email service ───────────────────────────────────────────────────────
mock.module("../external-services/email-service", () => ({
  sendEmail: mock(async () => {}),
}));

// ─── Import services AFTER mocks are declared ─────────────────────────────────
const { checkoutCartService } =
  await import("../services/customer/checkout-cart.customer.service");
const { confirmPaymentService } =
  await import("../services/customer/confirm-payment.customer.service");

// ─── Shared fixtures (resolved in beforeAll) ──────────────────────────────────
let countryUuid: string;
let phoneCountryUuid: string;
let cityUuid: string;
let roomCategoryUuid: string;
let testRoomCategoryId: bigint;
let testHotelId: bigint;

// Unique run-scoped dates so successive runs never share inventory rows
const RUN_OFFSET = Math.floor(Date.now() / 1000) % 30000;
const CHECK_IN = new Date(Date.UTC(2030, 0, 1 + (RUN_OFFSET % 300)));
const CHECK_OUT = new Date(CHECK_IN);
CHECK_OUT.setUTCDate(CHECK_OUT.getUTCDate() + 2);
const CHECK_IN_STR = CHECK_IN.toISOString().split("T")[0] as string;
const CHECK_OUT_STR = CHECK_OUT.toISOString().split("T")[0] as string;

// ─── Setup: isolated test hotel + room category + inventory ───────────────────
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

  const testHotel = await prisma.hotel.create({
    data: { name: `E2E Test Hotel ${RUN_OFFSET}` },
  });
  testHotelId = testHotel.id;

  const testCategory = await prisma.roomCategory.create({
    data: {
      hotelId: testHotelId,
      name: "E2E Standard Room",
      maxOccupancy: 2,
      basePrice: 150,
    },
  });
  roomCategoryUuid = testCategory.uuid;
  testRoomCategoryId = testCategory.id;

  // 10 rooms per night so multiple tests can book without depleting inventory
  const cur = new Date(CHECK_IN);
  while (cur < CHECK_OUT) {
    await prisma.roomInventory.create({
      data: {
        hotelId: testHotelId,
        roomCategoryId: testRoomCategoryId,
        inventoryDate: new Date(cur),
        totalRooms: 10,
        reservedRooms: 0,
        blockedRooms: 0,
        availableRooms: 10,
      },
    });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
});

// ─── Teardown: remove all data owned by this test run ─────────────────────────
afterAll(async () => {
  const customers = await prisma.customer.findMany({
    where: { email: { startsWith: "e2e-test-" } },
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

  await prisma.roomInventory.deleteMany({ where: { hotelId: testHotelId } });
  await prisma.roomCategory.deleteMany({ where: { hotelId: testHotelId } });
  await prisma.hotel.delete({ where: { id: testHotelId } });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const buildBillingDetails = () => ({
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "0123456789",
  addressLine1: "123 Test Street",
  postalCode: "50000",
  countryUuid,
  cityUuid,
  phoneCountryCodeUuid: phoneCountryUuid,
});

const buildCartItem = () => ({
  roomCategoryUuid,
  checkInDate: CHECK_IN_STR,
  checkOutDate: CHECK_OUT_STR,
  guestName: "John Doe",
  guestEmail: "guest@example.com",
});

// ─── checkoutCartService ──────────────────────────────────────────────────────
describe("checkoutCartService", () => {
  test("returns a stripe URL and persists order + payment + cart", async () => {
    const email = `e2e-test-checkout-${Date.now()}@test.com`;

    await prisma.customer.create({
      data: {
        email,
        password: "hashed-password",
        firstName: "John",
        lastName: "Doe",
        emailVerified: true,
      },
    });

    const result = await checkoutCartService({
      email,
      billingDetails: buildBillingDetails(),
      cartItems: [buildCartItem()],
    });

    expect(result).toEqual({ url: MOCK_STRIPE_URL });

    const customer = await prisma.customer.findUniqueOrThrow({
      where: { email },
    });
    const cart = await prisma.cart.findFirstOrThrow({
      where: { customerId: customer.id },
    });
    expect(cart.isCheckedOut).toBe(true);

    const order = await prisma.order.findFirstOrThrow({
      where: { cartId: cart.id },
    });
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(Number(order.totalAmount)).toBeGreaterThan(0);

    const payment = await prisma.payment.findFirstOrThrow({
      where: { orderId: order.id },
    });
    expect(payment.status).toBe(PaymentStatus.PENDING);
    expect(payment.paymentGateway).toBe(PaymentGateway.STRIPE);
    expect(payment.paymentMethod).toBe(PaymentMethod.ONLINE_GATEWAY);
    expect(payment.transactionId).toBe(MOCK_STRIPE_SESSION_ID);
  });

  test("total = subtotal + SST tax", async () => {
    const email = `e2e-test-sst-${Date.now()}@test.com`;

    await prisma.customer.create({
      data: {
        email,
        password: "hashed-password",
        firstName: "Jane",
        lastName: "Doe",
        emailVerified: true,
      },
    });

    await checkoutCartService({
      email,
      billingDetails: buildBillingDetails(),
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

    const subtotal = Number(order.subtotalAmount);
    const tax = Number(order.taxAmount);
    const total = Number(order.totalAmount);

    // SST rate comes from env — verify internal math consistency
    expect(tax).toBeGreaterThan(0);
    expect(total).toBeCloseTo(subtotal + tax, 2);
  });

  test("creates primary billing address on first checkout, updates on second", async () => {
    const email = `e2e-test-billing-${Date.now()}@test.com`;

    await prisma.customer.create({
      data: {
        email,
        password: "hashed-password",
        firstName: "Billing",
        lastName: "Test",
        emailVerified: true,
      },
    });

    // First checkout — creates billing address
    await checkoutCartService({
      email,
      billingDetails: buildBillingDetails(),
      cartItems: [buildCartItem()],
    });

    const customer = await prisma.customer.findUniqueOrThrow({
      where: { email },
    });
    const billings = await prisma.billingAddress.findMany({
      where: { customerId: customer.id, isPrimary: true, deletedAt: null },
    });
    expect(billings).toHaveLength(1);
    expect(billings[0]?.firstName).toBe("John");

    // Second checkout — should update existing record, not create a new one
    await checkoutCartService({
      email,
      billingDetails: { ...buildBillingDetails(), firstName: "UpdatedName" },
      cartItems: [buildCartItem()],
    });

    const updatedBillings = await prisma.billingAddress.findMany({
      where: { customerId: customer.id, isPrimary: true, deletedAt: null },
    });
    expect(updatedBillings).toHaveLength(1);
    expect(updatedBillings[0]?.firstName).toBe("UpdatedName");
  });

  test("decrements available_rooms and increments reserved_rooms per booked night", async () => {
    const email = `e2e-test-inventory-${Date.now()}@test.com`;

    const inventoryBefore = await prisma.roomInventory.findMany({
      where: {
        roomCategoryId: testRoomCategoryId,
        inventoryDate: { gte: CHECK_IN, lt: CHECK_OUT },
      },
      orderBy: { inventoryDate: "asc" },
    });

    await prisma.customer.create({
      data: {
        email,
        password: "hashed-password",
        firstName: "Inv",
        lastName: "Test",
        emailVerified: true,
      },
    });

    await checkoutCartService({
      email,
      billingDetails: buildBillingDetails(),
      cartItems: [buildCartItem()],
    });

    const inventoryAfter = await prisma.roomInventory.findMany({
      where: {
        roomCategoryId: testRoomCategoryId,
        inventoryDate: { gte: CHECK_IN, lt: CHECK_OUT },
      },
      orderBy: { inventoryDate: "asc" },
    });

    expect(inventoryAfter).toHaveLength(inventoryBefore.length);

    for (const before of inventoryBefore) {
      const after = inventoryAfter.find((a) => a.id === before.id)!;
      expect(after.availableRooms).toBe(before.availableRooms - 1);
      expect(after.reservedRooms).toBe(before.reservedRooms + 1);
    }
  });

  test("throws when customer does not exist", async () => {
    await expect(
      checkoutCartService({
        email: "nonexistent-e2e@test.com",
        billingDetails: buildBillingDetails(),
        cartItems: [buildCartItem()],
      }),
    ).rejects.toThrow("Customer not found");
  });

  test("throws when customer email is not verified", async () => {
    const email = `e2e-test-unverified-${Date.now()}@test.com`;

    await prisma.customer.create({
      data: {
        email,
        password: "hashed-password",
        firstName: "Unverified",
        lastName: "User",
        emailVerified: false,
      },
    });

    await expect(
      checkoutCartService({
        email,
        billingDetails: buildBillingDetails(),
        cartItems: [buildCartItem()],
      }),
    ).rejects.toThrow("Email not verified");
  });

  test("throws when country UUID is invalid", async () => {
    const email = `e2e-test-badcountry-${Date.now()}@test.com`;

    await prisma.customer.create({
      data: {
        email,
        password: "hashed-password",
        firstName: "Bad",
        lastName: "Country",
        emailVerified: true,
      },
    });

    await expect(
      checkoutCartService({
        email,
        billingDetails: {
          ...buildBillingDetails(),
          countryUuid: "00000000-0000-0000-0000-000000000000",
        },
        cartItems: [buildCartItem()],
      }),
    ).rejects.toThrow("Invalid country");
  });
});

// ─── confirmPaymentService ────────────────────────────────────────────────────
describe("confirmPaymentService", () => {
  let paymentUuid: string;

  beforeAll(async () => {
    // Bootstrap a PENDING payment via the checkout flow
    const email = `e2e-test-confirm-${Date.now()}@test.com`;

    await prisma.customer.create({
      data: {
        email,
        password: "hashed-password",
        firstName: "Confirm",
        lastName: "User",
        emailVerified: true,
      },
    });

    await checkoutCartService({
      email,
      billingDetails: buildBillingDetails(),
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

    paymentUuid = payment.uuid;
  });

  test("marks payment as PAID and order as PAID", async () => {
    await confirmPaymentService({ paymentUuid });

    const payment = await prisma.payment.findUniqueOrThrow({
      where: { uuid: paymentUuid },
    });
    expect(payment.status).toBe(PaymentStatus.PAID);

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: payment.orderId },
    });
    expect(order.status).toBe(OrderStatus.PAID);
  });

  test("creates a booking record for each cart item", async () => {
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { uuid: paymentUuid },
      include: {
        order: { include: { cart: { include: { cartItems: true } } } },
      },
    });

    const bookings = await prisma.booking.findMany({
      where: { orderId: payment.order.id },
    });

    expect(bookings).toHaveLength(payment.order.cart.cartItems.length);
    expect(bookings[0]?.checkInDate).toEqual(CHECK_IN);
    expect(bookings[0]?.checkOutDate).toEqual(CHECK_OUT);
  });

  test("is idempotent — calling confirm twice does not throw or double-book", async () => {
    await expect(
      confirmPaymentService({ paymentUuid }),
    ).resolves.toBeUndefined();

    const payment = await prisma.payment.findUniqueOrThrow({
      where: { uuid: paymentUuid },
    });
    const bookings = await prisma.booking.findMany({
      where: { orderId: payment.orderId },
    });
    expect(bookings).toHaveLength(1);
  });

  test("throws when payment UUID does not exist", async () => {
    await expect(
      confirmPaymentService({
        paymentUuid: "00000000-0000-0000-0000-000000000000",
      }),
    ).rejects.toThrow("Payment not found");
  });
});
