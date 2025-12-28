export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

function s(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  const out = String(v).trim();
  return out.length ? out : undefined;
}

function toDateOpt(v: any): Date | undefined {
  if (v === undefined || v === null) return undefined;

  // если уже Date
  if (v instanceof Date) return isNaN(v.getTime()) ? undefined : v;

  // строки/числа
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
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
    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        number: body.number === null ? undefined : s(body.number),
        issueDate: toDateOpt(body.issueDate),
        deliveryDate: toDateOpt(body.deliveryDate),
        dueDate: toDateOpt(body.dueDate),
        status: body.status === undefined ? undefined : String(body.status),
        note: body.note === null ? null : body.note !== undefined ? String(body.note) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json(
      { message: "Failed to update invoice", error: String(e?.message ?? e) },
      { status: 400 }
    );
  }
}
