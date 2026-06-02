-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'HOTEL_ADMIN');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('WEBSITE', 'THIRD_PARTY', 'RECEPTION', 'PHONE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'REFUNDED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'ONLINE_GATEWAY', 'OTA_PREPAID');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('STRIPE', 'PAYPAL', 'SQUARE', 'AUTHORIZE_NET', 'ADYEN', 'BRAINTREE', 'WORLD_PAY');

-- CreateEnum
CREATE TYPE "RoomEventType" AS ENUM ('CHECK_IN', 'CHECK_OUT', 'DAMAGE_REPORTED', 'DAMAGE_RESOLVED', 'MAINTENANCE_START', 'MAINTENANCE_END', 'INSPECTION', 'HOUSEKEEPING', 'NOTE');

-- CreateEnum
CREATE TYPE "LoyaltyPointType" AS ENUM ('EARNED', 'REDEEMED', 'EXPIRED', 'BONUS', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "IdType" AS ENUM ('PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE', 'OTHER');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CHECKED_OUT', 'ABANDONED', 'EXPIRED');

-- CreateTable
CREATE TABLE "countries" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iso2" TEXT NOT NULL,
    "iso3" TEXT NOT NULL,
    "phone_code" TEXT NOT NULL,
    "currency" TEXT,
    "flag" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timezones" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "country_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "offset" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timezones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "country_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "state_province" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "hotel_id" BIGINT,
    "customer_id" BIGINT,
    "label" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "address_line_1" TEXT NOT NULL,
    "address_line_2" TEXT,
    "city_id" BIGINT NOT NULL,
    "country_id" BIGINT NOT NULL,
    "state_province" TEXT,
    "postal_code" TEXT,
    "phone_country_id" BIGINT,
    "timezone_id" BIGINT,
    "phone_number" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_addresses" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "customer_id" BIGINT,
    "booking_id" BIGINT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "company_name" TEXT,
    "tax_id" TEXT,
    "address_line_1" TEXT NOT NULL,
    "address_line_2" TEXT,
    "city_id" BIGINT NOT NULL,
    "country_id" BIGINT NOT NULL,
    "state_province" TEXT,
    "postal_code" TEXT,
    "email" TEXT,
    "phone_country_id" BIGINT,
    "phone_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "billing_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotels" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "star_rating" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "hotel_id" BIGINT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_country_code_id" BIGINT,
    "phone_number" TEXT,
    "password" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "nationality" TEXT,
    "id_type" "IdType",
    "id_number" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "loyalty_tier_id" BIGINT,
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "customer_id" BIGINT,
    "type" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_categories" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "hotel_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "max_occupancy" INTEGER NOT NULL,
    "bed_type" TEXT,
    "size_m2" DOUBLE PRECISION,
    "base_price" DECIMAL(10,2) NOT NULL,
    "amenities" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "room_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "hotel_id" BIGINT NOT NULL,
    "room_category_id" BIGINT NOT NULL,
    "room_number" TEXT NOT NULL,
    "floor" INTEGER,
    "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_perks" (
    "room_id" BIGINT NOT NULL,
    "perk_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_perks_pkey" PRIMARY KEY ("room_id","perk_id")
);

-- CreateTable
CREATE TABLE "perks" (
    "id" TEXT NOT NULL,
    "hotel_id" BIGINT NOT NULL,
    "key" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "values" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "perks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "customer_id" BIGINT,
    "is_checked_out" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "cart_id" BIGINT NOT NULL,
    "room_category_id" BIGINT NOT NULL,
    "check_in_date" TIMESTAMP(3) NOT NULL,
    "check_out_date" TIMESTAMP(3) NOT NULL,
    "special_requests" TEXT,
    "guest_name" TEXT,
    "guest_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "cart_id" BIGINT NOT NULL,
    "billing_address_id" BIGINT,
    "subtotal_amount" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "confirmation_number" TEXT NOT NULL,
    "order_id" BIGINT NOT NULL,
    "hotel_id" BIGINT NOT NULL,
    "room_category_id" BIGINT NOT NULL,
    "room_id" BIGINT,
    "customer_id" BIGINT,
    "check_in_date" TIMESTAMP(3) NOT NULL,
    "check_out_date" TIMESTAMP(3) NOT NULL,
    "actual_check_in_at" TIMESTAMP(3),
    "actual_check_out_at" TIMESTAMP(3),
    "guest_name" TEXT NOT NULL,
    "guest_email" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "source" "BookingSource" NOT NULL DEFAULT 'WEBSITE',
    "external_ref_id" TEXT,
    "base_amount" DECIMAL(10,2) NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "special_requests" TEXT,
    "cancellation_reason" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "created_by_user_id" BIGINT,
    "cancelled_by_user_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payment_method" "PaymentMethod",
    "payment_gateway" "PaymentGateway",
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transaction_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_gateway_logs" (
    "id" BIGSERIAL NOT NULL,
    "payment_id" BIGINT NOT NULL,
    "event" TEXT NOT NULL,
    "request" JSONB NOT NULL,
    "response" JSONB NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_gateway_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_events" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "room_id" BIGINT NOT NULL,
    "booking_id" BIGINT,
    "event_type" "RoomEventType" NOT NULL,
    "description" TEXT,
    "damage_severity" TEXT,
    "repair_cost" DECIMAL(10,2),
    "reported_by_user_id" BIGINT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_inventories" (
    "id" BIGSERIAL NOT NULL,
    "hotel_id" BIGINT NOT NULL,
    "room_category_id" BIGINT NOT NULL,
    "inventory_date" TIMESTAMP(3) NOT NULL,
    "total_rooms" INTEGER NOT NULL,
    "reserved_rooms" INTEGER NOT NULL,
    "blocked_rooms" INTEGER NOT NULL,
    "available_rooms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "room_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_tiers" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "min_points" INTEGER NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "benefits" JSONB,
    "color_hex" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "loyalty_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_point_transactions" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "booking_id" BIGINT,
    "type" "LoyaltyPointType" NOT NULL,
    "points" INTEGER NOT NULL,
    "balance_before" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "description" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_point_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_id" BIGINT,
    "customer_id" BIGINT,
    "booking_id" BIGINT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" BIGINT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "customer_id" BIGINT,
    "hotel_id" BIGINT,
    "room_id" BIGINT,
    "path" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_uuid_key" ON "countries"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso2_key" ON "countries"("iso2");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso3_key" ON "countries"("iso3");

-- CreateIndex
CREATE INDEX "countries_uuid_idx" ON "countries"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "timezones_uuid_key" ON "timezones"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "timezones_name_key" ON "timezones"("name");

-- CreateIndex
CREATE INDEX "timezones_uuid_idx" ON "timezones"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "cities_uuid_key" ON "cities"("uuid");

-- CreateIndex
CREATE INDEX "cities_uuid_idx" ON "cities"("uuid");

-- CreateIndex
CREATE INDEX "cities_country_id_idx" ON "cities"("country_id");

-- CreateIndex
CREATE UNIQUE INDEX "addresses_uuid_key" ON "addresses"("uuid");

-- CreateIndex
CREATE INDEX "addresses_uuid_idx" ON "addresses"("uuid");

-- CreateIndex
CREATE INDEX "addresses_hotel_id_idx" ON "addresses"("hotel_id");

-- CreateIndex
CREATE INDEX "addresses_customer_id_idx" ON "addresses"("customer_id");

-- CreateIndex
CREATE INDEX "addresses_city_id_idx" ON "addresses"("city_id");

-- CreateIndex
CREATE INDEX "addresses_country_id_idx" ON "addresses"("country_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_addresses_uuid_key" ON "billing_addresses"("uuid");

-- CreateIndex
CREATE INDEX "billing_addresses_uuid_idx" ON "billing_addresses"("uuid");

-- CreateIndex
CREATE INDEX "billing_addresses_customer_id_idx" ON "billing_addresses"("customer_id");

-- CreateIndex
CREATE INDEX "billing_addresses_booking_id_idx" ON "billing_addresses"("booking_id");

-- CreateIndex
CREATE INDEX "billing_addresses_city_id_idx" ON "billing_addresses"("city_id");

-- CreateIndex
CREATE INDEX "billing_addresses_country_id_idx" ON "billing_addresses"("country_id");

-- CreateIndex
CREATE UNIQUE INDEX "hotels_uuid_key" ON "hotels"("uuid");

-- CreateIndex
CREATE INDEX "hotels_uuid_idx" ON "hotels"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_uuid_idx" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "customers_uuid_key" ON "customers"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_uuid_idx" ON "customers"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "otps_uuid_key" ON "otps"("uuid");

-- CreateIndex
CREATE INDEX "otps_uuid_idx" ON "otps"("uuid");

-- CreateIndex
CREATE INDEX "otps_customer_id_idx" ON "otps"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_categories_uuid_key" ON "room_categories"("uuid");

-- CreateIndex
CREATE INDEX "room_categories_uuid_idx" ON "room_categories"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_uuid_key" ON "rooms"("uuid");

-- CreateIndex
CREATE INDEX "rooms_uuid_idx" ON "rooms"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_hotel_id_room_number_key" ON "rooms"("hotel_id", "room_number");

-- CreateIndex
CREATE INDEX "room_perks_room_id_idx" ON "room_perks"("room_id");

-- CreateIndex
CREATE INDEX "room_perks_perk_id_idx" ON "room_perks"("perk_id");

-- CreateIndex
CREATE UNIQUE INDEX "perks_key_key" ON "perks"("key");

-- CreateIndex
CREATE UNIQUE INDEX "perks_hotel_id_key_key" ON "perks"("hotel_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "carts_uuid_key" ON "carts"("uuid");

-- CreateIndex
CREATE INDEX "carts_uuid_idx" ON "carts"("uuid");

-- CreateIndex
CREATE INDEX "carts_customer_id_idx" ON "carts"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_uuid_key" ON "cart_items"("uuid");

-- CreateIndex
CREATE INDEX "cart_items_uuid_idx" ON "cart_items"("uuid");

-- CreateIndex
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items"("cart_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_uuid_key" ON "orders"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "orders_cart_id_key" ON "orders"("cart_id");

-- CreateIndex
CREATE INDEX "orders_uuid_idx" ON "orders"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_uuid_key" ON "bookings"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_confirmation_number_key" ON "bookings"("confirmation_number");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_order_id_key" ON "bookings"("order_id");

-- CreateIndex
CREATE INDEX "bookings_uuid_idx" ON "bookings"("uuid");

-- CreateIndex
CREATE INDEX "bookings_hotel_id_check_in_date_check_out_date_idx" ON "bookings"("hotel_id", "check_in_date", "check_out_date");

-- CreateIndex
CREATE INDEX "bookings_room_id_check_in_date_check_out_date_idx" ON "bookings"("room_id", "check_in_date", "check_out_date");

-- CreateIndex
CREATE INDEX "bookings_customer_id_idx" ON "bookings"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_uuid_key" ON "payments"("uuid");

-- CreateIndex
CREATE INDEX "payments_uuid_idx" ON "payments"("uuid");

-- CreateIndex
CREATE INDEX "payment_gateway_logs_payment_id_idx" ON "payment_gateway_logs"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_events_uuid_key" ON "room_events"("uuid");

-- CreateIndex
CREATE INDEX "room_events_uuid_idx" ON "room_events"("uuid");

-- CreateIndex
CREATE INDEX "room_events_room_id_idx" ON "room_events"("room_id");

-- CreateIndex
CREATE INDEX "room_events_booking_id_idx" ON "room_events"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_inventories_hotel_id_room_category_id_inventory_date_key" ON "room_inventories"("hotel_id", "room_category_id", "inventory_date");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_tiers_uuid_key" ON "loyalty_tiers"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_tiers_name_key" ON "loyalty_tiers"("name");

-- CreateIndex
CREATE INDEX "loyalty_tiers_uuid_idx" ON "loyalty_tiers"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_point_transactions_uuid_key" ON "loyalty_point_transactions"("uuid");

-- CreateIndex
CREATE INDEX "loyalty_point_transactions_uuid_idx" ON "loyalty_point_transactions"("uuid");

-- CreateIndex
CREATE INDEX "loyalty_point_transactions_customer_id_idx" ON "loyalty_point_transactions"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "audit_logs_uuid_key" ON "audit_logs"("uuid");

-- CreateIndex
CREATE INDEX "audit_logs_uuid_idx" ON "audit_logs"("uuid");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_customer_id_idx" ON "audit_logs"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "images_uuid_key" ON "images"("uuid");

-- CreateIndex
CREATE INDEX "images_uuid_idx" ON "images"("uuid");

-- CreateIndex
CREATE INDEX "images_hotel_id_idx" ON "images"("hotel_id");

-- CreateIndex
CREATE INDEX "images_room_id_idx" ON "images"("room_id");

-- AddForeignKey
ALTER TABLE "timezones" ADD CONSTRAINT "timezones_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_phone_country_id_fkey" FOREIGN KEY ("phone_country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_timezone_id_fkey" FOREIGN KEY ("timezone_id") REFERENCES "timezones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_addresses" ADD CONSTRAINT "billing_addresses_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_addresses" ADD CONSTRAINT "billing_addresses_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_addresses" ADD CONSTRAINT "billing_addresses_phone_country_id_fkey" FOREIGN KEY ("phone_country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_addresses" ADD CONSTRAINT "billing_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_loyalty_tier_id_fkey" FOREIGN KEY ("loyalty_tier_id") REFERENCES "loyalty_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_phone_country_code_id_fkey" FOREIGN KEY ("phone_country_code_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_categories" ADD CONSTRAINT "room_categories_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_room_category_id_fkey" FOREIGN KEY ("room_category_id") REFERENCES "room_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_perks" ADD CONSTRAINT "room_perks_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_perks" ADD CONSTRAINT "room_perks_perk_id_fkey" FOREIGN KEY ("perk_id") REFERENCES "perks"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perks" ADD CONSTRAINT "perks_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_room_category_id_fkey" FOREIGN KEY ("room_category_id") REFERENCES "room_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_billing_address_id_fkey" FOREIGN KEY ("billing_address_id") REFERENCES "billing_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_category_id_fkey" FOREIGN KEY ("room_category_id") REFERENCES "room_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cancelled_by_user_id_fkey" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_gateway_logs" ADD CONSTRAINT "payment_gateway_logs_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_events" ADD CONSTRAINT "room_events_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_events" ADD CONSTRAINT "room_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_events" ADD CONSTRAINT "room_events_reported_by_user_id_fkey" FOREIGN KEY ("reported_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_inventories" ADD CONSTRAINT "room_inventories_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_inventories" ADD CONSTRAINT "room_inventories_room_category_id_fkey" FOREIGN KEY ("room_category_id") REFERENCES "room_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_point_transactions" ADD CONSTRAINT "loyalty_point_transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_point_transactions" ADD CONSTRAINT "loyalty_point_transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
