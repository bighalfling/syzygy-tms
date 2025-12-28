export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(vehicles);
}

export async function POST(req: Request) {
  const body = await req.json();

  // минимальная валидация
  if (!body?.plate || typeof body.plate !== "string") {
    return NextResponse.json({ message: "plate is required" }, { status: 400 });
  }

  const plate = body.plate.trim().toUpperCase();
  const code = body.code ? String(body.code).trim() : null;

  try {
    const created = await prisma.vehicle.create({
      data: {
        plate,
        code: code && code.length ? code : null,
        vin: body.vin,
        type: body.type ?? "TRUCK",
        status: body.status ?? "ACTIVE",
        notes: body.notes ? String(body.notes) : null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { message: "Failed to create vehicle", error: String(e?.message ?? e) },
      { status: 400 }
    );
  }
}
