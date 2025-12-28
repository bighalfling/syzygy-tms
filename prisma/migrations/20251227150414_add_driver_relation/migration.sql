-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "nationality" TEXT,
    "licenseNumber" TEXT,
    "licenseExpiry" TIMESTAMP(3),
    "notes" TEXT,
    "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
    "vehicleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Driver_vehicleId_key" ON "Driver"("vehicleId");

-- CreateIndex
CREATE INDEX "Driver_lastName_firstName_idx" ON "Driver"("lastName", "firstName");

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
