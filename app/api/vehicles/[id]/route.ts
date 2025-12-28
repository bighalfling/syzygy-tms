export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return NextResponse.json(vehicle);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();

  const plate =
    body.plate !== undefined ? String(body.plate).trim().toUpperCase() : undefined;

  const code =
    body.code === null
      ? null
      : body.code !== undefined
        ? String(body.code).trim() || null
        : undefined;

  const vin =
    body.vin === null
      ? null
      : body.vin !== undefined
        ? String(body.vin).trim().toUpperCase().replace(/\s+/g, "") || null
        : undefined;

  const notes =
    body.notes === null
      ? null
      : body.notes !== undefined
        ? String(body.notes)
        : undefined;

  try {
    const updated = await prisma.vehicle.update({
      where: { id },
      data: {
        plate,
        code,
        vin, // ✅ добавили VIN
        type: body.type ?? undefined,
        status: body.status ?? undefined,
        notes,
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    // ✅ если уникальный индекс — показываем поле
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const fields = (e.meta?.target as string[])?.join(", ") || "unknown field";
      return NextResponse.json(
        { message: `Unique constraint failed: ${fields}` },
        { status: 409 }
      );
    }

    // ✅ если не найдено
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Failed to update vehicle", error: String(e?.message ?? e) },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  try {
    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // ✅ если не найдено
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Failed to delete vehicle", error: String(e?.message ?? e) },
      { status: 400 }
    );
  }
}
