/*
  Warnings:

  - You are about to alter the column `subtotal_amount` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `BigInt`.
  - You are about to alter the column `tax_amount` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `BigInt`.
  - You are about to alter the column `discount_amount` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `BigInt`.
  - You are about to alter the column `total_amount` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `BigInt`.
  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `BigInt`.

*/
-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "subtotal_amount" SET DATA TYPE BIGINT,
ALTER COLUMN "tax_amount" SET DATA TYPE BIGINT,
ALTER COLUMN "discount_amount" SET DATA TYPE BIGINT,
ALTER COLUMN "total_amount" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "amount" SET DATA TYPE BIGINT;
