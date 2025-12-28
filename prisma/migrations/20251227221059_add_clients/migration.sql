/*
  Warnings:

  - You are about to drop the column `dueAt` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `issuedAt` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `vatRate` on the `Invoice` table. All the data in the column will be lost.
  - The `status` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[orderId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `buyerAddress` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyerName` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dueDate` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderId` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerAddress` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerName` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_tripId_fkey";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "dueAt",
DROP COLUMN "issuedAt",
DROP COLUMN "vatRate",
ADD COLUMN     "buyerAddress" TEXT NOT NULL,
ADD COLUMN     "buyerName" TEXT NOT NULL,
ADD COLUMN     "buyerVat" TEXT,
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "sellerAddress" TEXT NOT NULL,
ADD COLUMN     "sellerDic" TEXT,
ADD COLUMN     "sellerIco" TEXT,
ADD COLUMN     "sellerName" TEXT NOT NULL,
ADD COLUMN     "sellerVat" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ISSUED',
ALTER COLUMN "tripId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "clientId" TEXT;

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "vatRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "vatAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "companyId" TEXT,
    "taxId" TEXT,
    "vatId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contactPerson" TEXT,
    "isVatPayer" BOOLEAN NOT NULL DEFAULT false,
    "euVat" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Client_name_idx" ON "Client"("name");

-- CreateIndex
CREATE INDEX "Client_vatId_idx" ON "Client"("vatId");

-- CreateIndex
CREATE INDEX "Client_companyId_idx" ON "Client"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "Invoice"("orderId");

-- CreateIndex
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");

-- CreateIndex
CREATE INDEX "Order_clientId_idx" ON "Order"("clientId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
