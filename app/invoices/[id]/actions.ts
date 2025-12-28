"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { canAccessInvoices } from "@/lib/rbac";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

function toNumber(v: any): number {
  if (v == null) return 0;
  const s = typeof v === "string" ? v : String(v);
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export async function updateInvoiceAmounts(invoiceId: string, formData: FormData) {
  await requireRole(canAccessInvoices);

  const subtotal = round2(toNumber(formData.get("subtotal")));
  // vatRate есть в форме, но НЕ сохраняем в Invoice (поля нет)
  const vatRate = toNumber(formData.get("vatRate")); // например 0 или 20

  const vatAmount = round2(subtotal * (vatRate / 100));
  const total = round2(subtotal + vatAmount);

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
      vatAmount: new Prisma.Decimal(vatAmount.toFixed(2)),
      total: new Prisma.Decimal(total.toFixed(2)),
    },
  });

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath(`/invoices`);
}

export async function setInvoiceStatus(
  invoiceId: string,
  status: "DRAFT" | "SENT" | "PAID" | "CANCELED"
) {
  await requireRole(canAccessInvoices);

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status },
  });

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath(`/invoices`);
}
