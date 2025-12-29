export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Helpers
 */
function s(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  const out = String(v).trim();
  return out.length ? out : undefined;
}

function parseMoneyToDecimal(value: any): Prisma.Decimal {
  const raw = String(value ?? "").trim();
  if (!raw) return new Prisma.Decimal(0);

  // accepts "1234.56" or "1 234,56"
  const normalized = raw.replace(/\s+/g, "").replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return new Prisma.Decimal(0);
  return new Prisma.Decimal(n);
}

function addDays(d: Date, days: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function formatClientAddress(client: any): string {
  // safe, because schema may vary
  const parts = [
    client?.street,
    client?.zip,
    client?.city,
    client?.country,
  ]
    .map((x: any) => (x ? String(x).trim() : ""))
    .filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

async function nextInvoiceNumber(now = new Date()) {
  const year = now.getFullYear();
  const prefix = `INV-${year}-`;

  // find latest invoice that matches this prefix
  const last = await prisma.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  let seq = 0;
  if (last?.number?.startsWith(prefix)) {
    const tail = last.number.slice(prefix.length);
    const parsed = Number(tail);
    if (Number.isFinite(parsed)) seq = parsed;
  }

  const next = String(seq + 1).padStart(4, "0");
  return `${prefix}${next}`;
}

/**
 * GET /api/invoices
 */
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

/**
 * POST /api/invoices
 * Body:
 *  - { orderId: string } -> create invoice from order
 *  - { mode: "manual" }  -> create manual invoice (no order link)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const mode = s(body?.mode); // "manual"
    const orderId = s(body?.orderId);

    const now = new Date();

    // Seller defaults (can be overridden by env)
    const sellerName = process.env.INVOICE_SELLER_NAME || "SYZYGY-LOG s.r.o.";
    const sellerVat = process.env.INVOICE_SELLER_VAT || null;
    const sellerIco = process.env.INVOICE_SELLER_ICO || null;
    const sellerDic = process.env.INVOICE_SELLER_DIC || null;
    const sellerAddress =
      process.env.INVOICE_SELLER_ADDRESS || "Bratislava, Slovakia";

    // Dates
    const issueDate = now;
    const dueDate = addDays(now, 14);

    // 1) MANUAL invoice (no order connect!)
    if (mode === "manual") {
      const number = await nextInvoiceNumber(now);

      const created = await prisma.invoice.create({
        data: {
          number,
          issueDate,
          dueDate,
          deliveryDate: null,
          currency: "EUR",
          language: "EN",

          sellerName,
          sellerVat,
          sellerIco,
          sellerDic,
          sellerAddress,

          buyerName: "—",
          buyerVat: null,
          buyerAddress: "—",

          subtotal: new Prisma.Decimal(0),
          vatAmount: new Prisma.Decimal(0),
          total: new Prisma.Decimal(0),

          note: null,
          status: "DRAFT",

          // IMPORTANT: do NOT pass order connect here at all
          items: {
            create: [
              {
                description: "Service",
                qty: 1,
                unitPrice: new Prisma.Decimal(0),
                lineTotal: new Prisma.Decimal(0),
                vatRate: new Prisma.Decimal(0),
                vatAmount: new Prisma.Decimal(0),
              },
            ],
          },
        },
        include: { items: true },
      });

      return NextResponse.json({ invoice: created }, { status: 201 });
    }

    // 2) Invoice from order
    if (!orderId) {
      return NextResponse.json(
        { message: "orderId is required (or mode=manual)" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        trip: true,
        invoice: true,
      },
    });

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.invoice) {
      // already invoiced
      return NextResponse.json(
        { message: "Invoice already exists for this order", invoice: order.invoice },
        { status: 409 }
      );
    }

    const number = await nextInvoiceNumber(now);

    // Buyer data
    const client = order.client;
    const buyerName = client?.name || order.clientName || "—";
    const buyerVat = client?.vatId || null;
    const buyerAddress = client ? formatClientAddress(client) : "—";

    // Delivery date from trip/order
    const deliveryDate =
      order.trip?.deliveryAt ?? order.deliveryDateTime ?? null;

    // Single-line service item based on order
    const net = parseMoneyToDecimal(order.price);
    const qty = 1;

    const unitPrice = net;
    const lineTotal = new Prisma.Decimal(unitPrice.toNumber() * qty);

    // For now keep VAT 0 (reverse charge / intl transport)
    const vatRate = new Prisma.Decimal(0);
    const vatAmount = new Prisma.Decimal(0);

    const subtotal = lineTotal;
    const total = subtotal.add(vatAmount);

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
        language: "EN",

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

        // ✅ connect order ONLY when we have id
        order: { connect: { id: order.id } },

        // also store clientId if exists (optional)
        ...(client?.id ? { client: { connect: { id: client.id } } } : {}),

        items: {
          create: [
            {
              description: serviceDesc,
              qty,
              unitPrice,
              lineTotal,
              vatRate,
              vatAmount,
            },
          ],
        },
      },
      include: {
        items: true,
        order: { include: { client: true } },
        trip: true,
        client: true,
      },
    });

    // Mark order as invoiced
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
