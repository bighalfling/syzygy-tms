-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_orderId_fkey";

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "orderId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
