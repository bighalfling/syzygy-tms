export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function s(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  const out = String(v).trim();
  return out.length ? out : undefined;
}

function sOrNull(v: any): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const out = String(v).trim();
  return out.length ? out : null;
}

function bool(v: any): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "boolean") return v;
  if (v === "true" || v === "1" || v === 1) return true;
  if (v === "false" || v === "0" || v === 0) return false;
  return undefined;
}

export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const body = await req.json();

  const name = s(body.name);
  if (!name) {
    return NextResponse.json({ message: "name is required" }, { status: 400 });
  }

  try {
    const created = await prisma.client.create({
      data: {
        name,
        street: sOrNull(body.street) ?? "",
        city: sOrNull(body.city) ?? "",
        zip: sOrNull(body.zip) ?? "",
        country: sOrNull(body.country)?.toUpperCase() ?? "",


        companyId: sOrNull(body.companyId) ?? null,
        taxId: sOrNull(body.taxId) ?? null,
        vatId: sOrNull(body.vatId) ?? null,

        email: sOrNull(body.email) ?? null,
        phone: sOrNull(body.phone) ?? null,
        contactPerson: sOrNull(body.contactPerson) ?? null,

        isVatPayer: bool(body.isVatPayer) ?? false,
        euVat: bool(body.euVat) ?? false,

        note: sOrNull(body.note) ?? null,
      },
    });

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
      { message: "Failed to create client", error: String(e?.message ?? e) },
      { status: 400 }
    );
  }
}