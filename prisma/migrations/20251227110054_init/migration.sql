-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'PLANNED', 'IN_TRANSIT', 'DELIVERED', 'INVOICED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "orderRef" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "pickupDateTime" TIMESTAMP(3) NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryDateTime" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "vehicle" TEXT,
    "driverName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderRef_key" ON "Order"("orderRef");
