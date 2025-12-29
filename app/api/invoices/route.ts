export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function s(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  const out = String(v).trim();
  return out.length ? out : undefined;
}

function parseMoneyToDecimal(value: any): Prisma.Decimal {
  const raw = String(value ?? "").trim();
  if (!raw) return new Prisma.Decimal(0);

  // allow "1234,56" and "1 234.56"
  const normalized = raw.replace(/\s+/g, "").replace(",", ".");
  const n = Number(normalized);

  if (!Number.isFinite(n)) return new Prisma.Decimal(0);
  return new Prisma.Decimal(n.toFixed(2));
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function formatClientAddress(client: any): string {
  const parts: string[] = [];
  const line1 = [client?.street].filter(Boolean).join(" ").trim();
  if (line1) parts.push(line1);

  const line2 = [client?.zip, client?.city].filter(Boolean).join(" ").trim();
  if (line2) parts.push(line2);

  const line3 = [client?.country].filter(Boolean).join(" ").trim();
  if (line3) parts.push(line3);

  return parts.length ? parts.join("\n") : "—";
}

async function generateInvoiceNumber(now = new Date()) {
  const year = now.getFullYear();
  const prefix = `INV-${year}-`;

  const last = await prisma.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  let seq = 0;
  if (last?.number) {
    const tail = last.number.replace(prefix, "");
    const parsed = Number(tail);
    if (Number.isFinite(parsed)) seq = parsed;
  }

  const next = String(seq + 1).padStart(4, "0");
  return `${prefix}${next}`;
}

export async function GET() {
  const invoices = await prisma.invoice.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      items: true,
      order: { include: { client: true } },
      trip: true,
      client: true,
    },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mode = s(body?.mode); // "manual" | undefined
const orderId = s(body?.orderId);

if (!orderId) {
  // ===== MANUAL INVOICE CREATE =====
  const now = new Date();
  const number = await generateInvoiceNumber(now);

  const sellerName = process.env.INVOICE_SELLER_NAME || "SYZYGY-LOG s.r.o.";
  const sellerVat = process.env.INVOICE_SELLER_VAT || null;
  const sellerIco = process.env.INVOICE_SELLER_ICO || null;
  const sellerDic = process.env.INVOICE_SELLER_DIC || null;
  const sellerAddress = process.env.INVOICE_SELLER_ADDRESS || "Bratislava, Slovakia";

  // из body можно передать buyer, но чтобы “заработало сразу” — ставим заглушки
  const buyerName = s(body?.buyerName) || "—";
  const buyerVat = s(body?.buyerVat) || null;
  const buyerAddress = s(body?.buyerAddress) || "—";

  const issueDate = now;
  const dueDate = addDays(now, 14);
  const deliveryDate = body?.deliveryDate ? new Date(body.deliveryDate) : null;

  // items: если не передали — создадим 1 строку-заглушку
  const itemsRaw = Array.isArray(body?.items) ? body.items : [];
  const items =
    itemsRaw.length > 0
      ? itemsRaw
      : [{ description: "Service", qty: 1, unitPrice: "0", vatRate: "0" }];

  // считаем totals
  const mapped = items.map((it: any) => {
    const qty = Number(it.qty ?? 1) || 1;
    const unitPrice = parseMoneyToDecimal(it.unitPrice);
    const lineTotal = new Prisma.Decimal(unitPrice.toNumber() * qty);
    const vatRate = parseMoneyToDecimal(it.vatRate ?? 0);
    const vatAmount = new Prisma.Decimal(0); // пока оставим 0 как у тебя в reverse charge
    return { description: String(it.description || "Service"), qty, unitPrice, lineTotal, vatRate, vatAmount };
  });

  const subtotal = mapped.reduce(
  (s: Prisma.Decimal, it: any) => s.add(it.lineTotal),
  new Prisma.Decimal(0)
);
  const vatAmount = new Prisma.Decimal(0);
  const total = subtotal.add(vatAmount);

  const created = await prisma.invoice.create({
    data: {
      number,
      issueDate,
      dueDate,
      deliveryDate,
      currency: "EUR",

      sellerName,
      sellerVat,
      sellerIco,
      sellerDic,
      sellerAddress,

      buyerName,
      buyerVat,
      buyerAddress,

      subtotal,
      vatAmount,
      total,

      note: null,
      status: "ISSUED",

      // НЕТ order connect
      items: { create: mapped },
    },
    select: { id: true },
  });

  return NextResponse.json({ invoice: created }, { status: 201 });
}

    // if already invoiced
    const existing = await prisma.invoice.findUnique({
      where: { orderId },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ invoice: existing }, { status: 200 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        trip: true,
      },
    });

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const now = new Date();
    const number = await generateInvoiceNumber(now);

    // seller (ENV -> fallback)
    const sellerName = process.env.INVOICE_SELLER_NAME || "SYZYGY-LOG s.r.o.";
    const sellerVat = process.env.INVOICE_SELLER_VAT || null;
    const sellerIco = process.env.INVOICE_SELLER_ICO || null;
    const sellerDic = process.env.INVOICE_SELLER_DIC || null;
    const sellerAddress =
      process.env.INVOICE_SELLER_ADDRESS ||
      "Bratislava, Slovakia";

    // buyer
    const client = order.client;
    const buyerName = client?.name || order.clientName || "—";
    const buyerVat = client?.vatId || null;
    const buyerAddress = client ? formatClientAddress(client) : "—";

    const price = parseMoneyToDecimal(order.price);

    // dates
    const issueDate = now;
    const dueDate = addDays(now, 14);
    const deliveryDate = order.trip?.deliveryAt ?? order.deliveryDateTime ?? null;

    const serviceDesc = (() => {
      const ref = order.orderRef ?? order.id;
      const pu = order.pickupAddress ?? "";
      const dl = order.deliveryAddress ?? "";
      if (pu && dl) return `Transport service (${ref}: ${pu} → ${dl})`;
      return `Transport service (${ref})`;
    })();

    const created = await prisma.invoice.create({
      data: {
        number,
        issueDate,
        dueDate,
        deliveryDate,
        currency: "EUR",

        sellerName,
        sellerVat,
        sellerIco,
        sellerDic,
        sellerAddress,

        buyerName,
        buyerVat,
        buyerAddress,

        subtotal: price,
        vatAmount: new Prisma.Decimal(0),
        total: price,

        note: null,
        status: "ISSUED",

        order: { connect: { id: order.id } },
        trip: order.trip?.id ? { connect: { id: order.trip.id } } : undefined,
        client: client?.id ? { connect: { id: client.id } } : undefined,

        items: {
          create: [
            {
              description: serviceDesc,
              qty: 1,
              unitPrice: price,
              lineTotal: price,
              vatRate: new Prisma.Decimal(0),
              vatAmount: new Prisma.Decimal(0),
            },
          ],
        },
      },
      select: { id: true },
    });

    // optionally mark order as invoiced
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "INVOICED" },
    });

    return NextResponse.json({ invoice: created }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { message: "Failed to create invoice", error: String(e?.message ?? e) },
      { status: 400 }
    );
  }
}
