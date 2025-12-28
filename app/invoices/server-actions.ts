"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { canAccessInvoices } from "@/lib/rbac";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

function parseMoneyToNumber(input?: string | null): number {
  if (!input) return 0;

  const cleaned = input
    .toString()
    .trim()
    .replace(/\s/g, "")
    .replace(/[^\d,.\-]/g, "");

  const normalized =
    cleaned.includes(",") && !cleaned.includes(".")
      ? cleaned.replace(",", ".")
      : cleaned.replace(/,/g, "");

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const last = await prisma.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const lastSeq = last?.number ? Number(last.number.slice(prefix.length)) : 0;
  const nextSeq = lastSeq + 1;

  return `${prefix}${String(nextSeq).padStart(6, "0")}`;
}

export async function createInvoiceForTrip(tripId: string) {
  await requireRole(canAccessInvoices);

  // 1) Если уже есть invoice на этот trip — вернуть его
  const existing = await prisma.invoice.findUnique({ where: { tripId } });
  if (existing) return existing;

  // 2) Trip + Order (нам нужен orderId, clientName, адреса, price)
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { order: true },
  });
  if (!trip) throw new Error("Trip not found");
  if (!trip.order) throw new Error("Order not found for this trip");

  // 3) Деньги
  const subtotalNum = parseMoneyToNumber(trip.order.price);
  const vatRateNum = 0; // пока 0%
  const vatAmountNum = +(subtotalNum * (vatRateNum / 100)).toFixed(2);
  const totalNum = +(subtotalNum + vatAmountNum).toFixed(2);

  // 4) Даты
  const issueDate = new Date();
  const dueDate = addDays(issueDate, 14); // стандарт: 14 дней

  // 5) Номер
  const number = await nextInvoiceNumber();

  // 6) Создаём invoice
  // ВАЖНО: по твоей схеме orderId обязателен и unique
  const invoice = await prisma.invoice.create({
    data: {
      number,
      status: "DRAFT",
      currency: "EUR",

      issueDate,
      dueDate,

      orderId: trip.orderId, // ✅ обязателен
      tripId: trip.id,       // ✅ привязка к trip (unique)

      // Seller snapshot (потом вынесем в Settings)
      sellerName: "SYZYGY s.r.o.",
      sellerAddress: "Bratislava, Slovakia",
      sellerVat: null,
      sellerIco: null,
      sellerDic: null,

      // Buyer snapshot — берём из Order
      buyerName: trip.order.clientName || "Client",
      buyerAddress:
        trip.order.deliveryAddress || trip.order.pickupAddress || "Address",
      buyerVat: null,

      // Totals
      subtotal: new Prisma.Decimal(subtotalNum.toFixed(2)),
      vatAmount: new Prisma.Decimal(vatAmountNum.toFixed(2)),
      total: new Prisma.Decimal(totalNum.toFixed(2)),

      // Если хочешь сразу одну строку в items (как "Transport service"):
      items: {
        create: [
          {
            description: `Transport service (${trip.order.orderRef})`,
            qty: 1,
            unitPrice: new Prisma.Decimal(subtotalNum.toFixed(2)),
            lineTotal: new Prisma.Decimal(subtotalNum.toFixed(2)),
            vatRate: new Prisma.Decimal(vatRateNum.toFixed(2)),
            vatAmount: new Prisma.Decimal(vatAmountNum.toFixed(2)),
          },
        ],
      },
    },
    include: { items: true },
  });

  // 7) Обновляем статус Order
  await prisma.order.update({
    where: { id: trip.orderId },
    data: { status: "INVOICED" },
  });

  revalidatePath("/orders");
  revalidatePath("/invoices");
  revalidatePath("/trips");

  return invoice;
}
