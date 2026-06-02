/*
  Warnings:

  - You are about to drop the column `booking_id` on the `billing_addresses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customer_id,is_primary]` on the table `billing_addresses` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "billing_addresses_booking_id_idx";

-- AlterTable
ALTER TABLE "billing_addresses" DROP COLUMN "booking_id";

-- CreateIndex
CREATE UNIQUE INDEX "billing_addresses_customer_id_is_primary_key" ON "billing_addresses"("customer_id", "is_primary");
