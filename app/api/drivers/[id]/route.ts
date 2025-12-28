export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

function normStr(v: any) {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return NextResponse.json(driver);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();

  const data: any = {
    firstName: body.firstName !== undefined ? String(body.firstName).trim() : undefined,
    lastName: body.lastName !== undefined ? String(body.lastName).trim() : undefined,
    status: body.status !== undefined ? String(body.status).trim() : undefined,
    phone: body.phone === null ? null : body.phone !== undefined ? (normStr(body.phone) ?? null) : undefined,
    email: body.email === null ? null : body.email !== undefined ? (normStr(body.email) ?? null) : undefined,
    nationality:
      body.nationality === null
        ? null
        : body.nationality !== undefined
          ? (normStr(body.nationality) ?? null)
          : undefined,
    licenseNumber:
      body.licenseNumber === null
        ? null
        : body.licenseNumber !== undefined
          ? (normStr(body.licenseNumber) ?? null)
          : undefined,
    notes:
      body.notes === null ? null : body.notes !== undefined ? String(body.notes) : undefined,
  };

  if (body.licenseExpiry === null) {
    data.licenseExpiry = null;
  } else if (body.licenseExpiry !== undefined && body.licenseExpiry !== "") {
    const raw = String(body.licenseExpiry);
    const d = raw.length === 10 ? new Date(raw + "T00:00:00.000Z") : new Date(raw);
    if (!Number.isNaN(d.getTime())) data.licenseExpiry = d;
  }

  try {
    const updated = await prisma.driver.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const fields = (e.meta?.target as string[])?.join(", ") || "unknown field";
      return NextResponse.json(
        { message: `Unique constraint failed: ${fields}` },
        { status: 409 }
      );
    }

    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Failed to update driver", error: String(e?.message ?? e) },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  try {
    await prisma.driver.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Failed to delete driver", error: String(e?.message ?? e) },
      { status: 400 }
    );
  }
}
