export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type Ctx = { params: Promise<{ id?: string }> };

function s(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  const out = String(v).trim();
  return out.length ? out : undefined;
}

/**
 * Optional string for Prisma update:
 * - undefined/null/"" -> undefined (do not update field)
 * - otherwise -> trimmed string
 *
 * IMPORTANT: avoids returning null, because many String fields are NOT nullable.
 */
function sOpt(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  const out = String(v).trim();
  return out.length ? out : undefined;
}

function boolOpt(v: any): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "boolean") return v;

  if (v === "true" || v === "1" || v === 1) return true;
  if (v === "false" || v === "0" || v === 0) return false;

  return undefined;
}

async function getId(ctx: Ctx) {
  const p = await ctx.params;
  const id = p?.id ? String(p.id) : "";
  return id;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const id = await getId(ctx);

  if (!id) {
    return NextResponse.json({ message: "Missing id param" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const id = await getId(ctx);
  if (!id) {
    return NextResponse.json({ message: "Missing id param" }, { status: 400 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const updated = await prisma.client.update({
      where: { id },
      data: {
        // required-ish
        name: s(body.name),

        // address (НЕ даём null)
        street: sOpt(body.street),
        city: sOpt(body.city),
        zip: sOpt(body.zip),
        country:
          body.country === undefined
            ? undefined
            : sOpt(body.country)?.toUpperCase(),

        // ids / registration (НЕ даём null)
        companyId: sOpt(body.companyId),
        taxId: sOpt(body.taxId),
        vatId: sOpt(body.vatId),

        // contacts (НЕ даём null)
        email: sOpt(body.email),
        phone: sOpt(body.phone),
        contactPerson: sOpt(body.contactPerson),

        // booleans
        isVatPayer: boolOpt(body.isVatPayer),
        euVat: boolOpt(body.euVat),

        // misc
        note: sOpt(body.note),
      },
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
      { message: "Failed to update client", error: String(e?.message ?? e) },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const id = await getId(ctx);
  if (!id) {
    return NextResponse.json({ message: "Missing id param" }, { status: 400 });
  }

  try {
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Failed to delete client", error: String(e?.message ?? e) },
      { status: 400 }
    );
  }
}
