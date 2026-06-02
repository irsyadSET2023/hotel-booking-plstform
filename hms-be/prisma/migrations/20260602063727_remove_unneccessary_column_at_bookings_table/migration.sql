/*
  Warnings:

  - You are about to drop the column `base_amount` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `discount_amount` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `tax_amount` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `total_amount` on the `bookings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "base_amount",
DROP COLUMN "discount_amount",
DROP COLUMN "tax_amount",
DROP COLUMN "total_amount";
