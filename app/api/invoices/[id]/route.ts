export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

function s(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  const out = String(v).trim();
  return out.length ? out : undefined;
}

function toDateOpt(v: any): Date | undefined {
  if (v === undefined || v === null) return undefined;
  if (v instanceof Date) return isNaN(v.getTime()) ? undefined : v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

function toLang(v: any): "EN" | "SK" | undefined {
  if (v === undefined || v === null) return undefined;
  const x = String(v).toUpperCase();
  if (x === "SK") return "SK";
  if (x === "EN") return "EN";
  return undefined;
}

function num(v: any): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function dec(n: number) {
  // store as Decimal with 2 dp for money; vatRate we store as number-ish Decimal too
  return new Prisma.Decimal(n);
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: true,
      trip: true,
      order: { include: { client: true } },
      client: true,
    },
  });

  if (!invoice) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();

  try {
    // Load invoice to know if it's manual
    const current = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true, order: true },
    });
    if (!current) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const isManual = !current.orderId && !current.order;

    // Always allow these safe fields
    const baseData: any = {
      number: body.number === null ? undefined : s(body.number),
      issueDate: toDateOpt(body.issueDate),
      deliveryDate: toDateOpt(body.deliveryDate),
      dueDate: toDateOpt(body.dueDate),
      status: body.status === undefined ? undefined : String(body.status),
      note: body.note === null ? null : body.note !== undefined ? String(body.note) : undefined,
      language: toLang(body.language),

      buyerName: body.buyerName === null ? null : body.buyerName !== undefined ? String(body.buyerName) : undefined,
      buyerVat: body.buyerVat === null ? null : body.buyerVat !== undefined ? String(body.buyerVat) : undefined,
      buyerAddress:
        body.buyerAddress === null ? null : body.buyerAddress !== undefined ? String(body.buyerAddress) : undefined,
    };

    // If manual pricing fields are present AND invoice is manual -> update items + totals
    const serviceName = s(body.serviceName);
    const netAmount = num(body.netAmount);
    const vatRate = num(body.vatRate);

    if (isManual && (serviceName !== undefined || netAmount !== undefined || vatRate !== undefined)) {
      const name = serviceName ?? (current.items?.[0]?.description || "Service");
      const net = netAmount ?? Number(current.subtotal?.toString?.() ?? current.subtotal ?? 0);
      const rate = vatRate ?? Number(current.items?.[0]?.vatRate?.toString?.() ?? current.items?.[0]?.vatRate ?? 0);

      const vat = (net * rate) / 100;
      const total = net + vat;

      // Keep it as ONE row in items
      const existingItemId = current.items?.[0]?.id;

      await prisma.$transaction(async (tx) => {
        if (existingItemId) {
          await tx.invoiceItem.update({
            where: { id: existingItemId },
            data: {
              description: name,
              qty: 1,
              unitPrice: dec(net),
              lineTotal: dec(net),
              vatRate: dec(rate),
              vatAmount: dec(vat),
            },
          });
        } else {
          await tx.invoiceItem.create({
            data: {
              invoiceId: current.id,
              description: name,
              qty: 1,
              unitPrice: dec(net),
              lineTotal: dec(net),
              vatRate: dec(rate),
              vatAmount: dec(vat),
            },
          });
        }

        await tx.invoice.update({
          where: { id: current.id },
          data: {
            ...baseData,
            subtotal: dec(net),
            vatAmount: dec(vat),
            total: dec(total),
          },
        });
      });

      const updated = await prisma.invoice.findUnique({
        where: { id: current.id },
        include: { items: true, trip: true, order: { include: { client: true } }, client: true },
      });

      return NextResponse.json(updated);
    }

    // Default update (no manual pricing)
    const updated = await prisma.invoice.update({
      where: { id },
      data: baseData,
      include: { items: true, trip: true, order: { include: { client: true } }, client: true },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json(
      { message: "Failed to update invoice", error: String(e?.message ?? e) },
      { status: 400 }
    );
  }
}
