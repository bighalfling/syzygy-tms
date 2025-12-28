// lib/invoices/generateInvoiceNumber.ts
import { prisma } from "@/lib/prisma";

export async function generateInvoiceNumber() {
  const year = new Date().getFullYear();

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      number: {
        startsWith: `INV-${year}-`,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  let nextNumber = 1;

  if (lastInvoice) {
    const lastSeq = Number(lastInvoice.number.split("-").pop());
    nextNumber = lastSeq + 1;
  }

  return `INV-${year}-${String(nextNumber).padStart(4, "0")}`;
}
