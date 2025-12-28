-- CreateEnum
CREATE TYPE "TmsOrderStatus" AS ENUM ('NEW', 'PLANNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TmsOrder" (
    "id" TEXT NOT NULL,
    "orderRef" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "pickupDateTime" TIMESTAMP(3),
    "deliveryAddress" TEXT NOT NULL,
    "deliveryDateTime" TIMESTAMP(3),
    "status" "TmsOrderStatus" NOT NULL DEFAULT 'NEW',
    "vehicle" TEXT,
    "driver" TEXT,
    "price" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TmsOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TmsOrder_orderRef_key" ON "TmsOrder"("orderRef");
