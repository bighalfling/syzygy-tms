export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function normStr(v: any) {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

export async function GET() {
  const drivers = await prisma.driver.findMany({
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json(drivers);
}

export async function POST(req: Request) {
  const body = await req.json();

  const firstName = normStr(body.firstName);
  const lastName = normStr(body.lastName);

  if (!firstName || !lastName) {
    return NextResponse.json(
      { message: "firstName and lastName are required" },
      { status: 400 }
    );
  }

  const data: any = {
    firstName,
    lastName,
    status: normStr(body.status) ?? "ACTIVE",
    phone: normStr(body.phone) ?? null,
    email: normStr(body.email) ?? null,
    nationality: normStr(body.nationality) ?? null,
    licenseNumber: normStr(body.licenseNumber) ?? null,
    notes: body.notes === null ? null : body.notes !== undefined ? String(body.notes) : null,
  };

  // licenseExpiry: принимаем либо ISO, либо YYYY-MM-DD
  if (body.licenseExpiry === null) {
    data.licenseExpiry = null;
  } else if (body.licenseExpiry !== undefined && body.licenseExpiry !== "") {
    const raw = String(body.licenseExpiry);
    const d = raw.length === 10 ? new Date(raw + "T00:00:00.000Z") : new Date(raw);
    if (!Number.isNaN(d.getTime())) data.licenseExpiry = d;
  }

  try {
    const created = await prisma.driver.create({ data });
    return NextResponse.json(created);
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const fields = (e.meta?.target as string[])?.join(", ") || "unknown field";
      return NextResponse.json(
        { message: `Unique constraint failed: ${fields}` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create driver", error: String(e?.message ?? e) },
      { status: 400 }
    );
  }
}
