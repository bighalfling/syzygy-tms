/*
  Warnings:

  - The primary key for the `Order` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `currency` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `driverName` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP CONSTRAINT "Order_pkey",
DROP COLUMN "currency",
DROP COLUMN "driverName",
ADD COLUMN     "driver" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "pickupDateTime" DROP NOT NULL,
ALTER COLUMN "deliveryDateTime" DROP NOT NULL,
ALTER COLUMN "price" DROP NOT NULL,
ALTER COLUMN "price" SET DATA TYPE TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ADD CONSTRAINT "Order_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Order_id_seq";
