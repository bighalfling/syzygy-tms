import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    // 1) найдём orderId, на которые уже есть invoice
    const existing = await prisma.invoice.findMany({
      select: { orderId: true },
    });
    const invoicedOrderIds = new Set(existing.map((x) => x.orderId));

    // 2) берём заказы, у которых есть trip (relation trip), и которых нет в invoicedOrderIds
    const orders = await prisma.order.findMany({
      where: {
        trip: { isNot: null }, // ✅ вместо tripId
      },
      orderBy: { updatedAt: "desc" },
      include: {
        client: true,
        trip: true,
      },
      take: 50,
    });

    const ready = orders.filter((o) => !invoicedOrderIds.has(o.id));

    return NextResponse.json(ready);
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to load ready-to-invoice orders", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
