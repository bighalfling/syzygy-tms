import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    if (!id) {
      return NextResponse.json({ error: "Missing id param" }, { status: 400 });
    }

    // ищем и по id, и по orderRef
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderRef: id }],
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (e: any) {
    console.error("GET /api/orders/[id] failed:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    if (!id) {
      return NextResponse.json({ error: "Missing id param" }, { status: 400 });
    }

    const body = await req.json();

    // находим заказ
    const current = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderRef: id }],
      },
      select: { id: true, status: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 🔒 защита: INVOICED нельзя менять
    if (current.status === "INVOICED") {
      return NextResponse.json(
        { error: "Order is INVOICED and locked" },
        { status: 409 }
      );
    }

    // разрешаем менять только эти поля
    const data: any = {};
    if (typeof body.vehicle === "string") data.vehicle = body.vehicle;
    if (typeof body.driver === "string") data.driver = body.driver;
    if (typeof body.price === "string") data.price = body.price;

    const updated = await prisma.order.update({
      where: { id: current.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/orders/[id] failed:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
