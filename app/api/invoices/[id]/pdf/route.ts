// app/api/invoices/[id]/pdf/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer, Font } from "@react-pdf/renderer";
import React from "react";
import InvoicePDF from "@/lib/pdf/InvoicePDF";
import fs from "node:fs";
import path from "node:path";

type Ctx = { params: Promise<{ id: string }> };

function fileToDataUri(absPath: string): string | null {
  try {
    if (!fs.existsSync(absPath)) return null;
    const ext = path.extname(absPath).toLowerCase().replace(".", "");
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "webp"
        ? "image/webp"
        : ext === "svg"
        ? "image/svg+xml"
        : null;

    if (!mime) return null;

    const buf = fs.readFileSync(absPath);
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function ensureFontsRegistered() {
  // Регистрируем один раз (на холодном старте)
  // На Vercel это безопасно, а в dev не будет ругаться на словацкие буквы.
  const regular = path.join(process.cwd(), "public", "fonts", "Inter-Regular.otf");
  const bold = path.join(process.cwd(), "public", "fonts", "Inter-Bold.otf");

  // Если вдруг шрифтов нет — не падаем, просто рендерим дефолтом.
  try {
    if (fs.existsSync(regular)) {
      Font.register({
        family: "Inter",
        fonts: [
          { src: regular, fontWeight: "normal" as any },
          fs.existsSync(bold) ? { src: bold, fontWeight: "bold" as any } : (undefined as any),
        ].filter(Boolean),
      });
    }
  } catch {
    // no-op
  }
}

async function getInvoiceOr404(id: string) {
  // Подстрой include под свою схему, но это “универсальный” вариант:
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: true,
      order: true,
      trip: true,
      // если у тебя связь client/buyer иначе — поправишь 1 строку
      client: true,
    } as any,
  });

  return invoice;
}

function formatClientAddress(c: any): string {
  const parts: string[] = [];

  const street = String(c?.street ?? "").trim();
  const city = String(c?.city ?? "").trim();
  const zip = String(c?.zip ?? "").trim();
  const country = String(c?.country ?? "").trim();

  const line1 = street;
  const line2 = [zip, city].filter(Boolean).join(" ").trim();
  const line3 = country;

  if (line1) parts.push(line1);
  if (line2) parts.push(line2);
  if (line3) parts.push(line3);

  return parts.length ? parts.join("\n") : "—";
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;

  try {
    ensureFontsRegistered();

    const invoice = await getInvoiceOr404(id);
    if (!invoice) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    // Подкладываем buyer поля в формат, который ждёт InvoicePDF.tsx
    const buyerName = (invoice as any).client?.name ?? (invoice as any).buyerName ?? "—";
    const buyerAddress =
      (invoice as any).client ? formatClientAddress((invoice as any).client) : ((invoice as any).buyerAddress ?? "—");
    const buyerVat =
      (invoice as any).client?.vatId ?? (invoice as any).buyerVat ?? "";

    const normalizedInvoice = {
      ...(invoice as any),
      buyerName,
      buyerAddress,
      buyerVat,
    };

    // Лого: положи файл в public/logo.png (или поменяй имя/путь)
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoDataUri = fileToDataUri(logoPath);

    // КЛЮЧЕВОЕ: cast to any, чтобы TS не пытался приравнять props к DocumentProps
    const doc = React.createElement(InvoicePDF as any, {
      invoice: normalizedInvoice,
      logoDataUri,
    }) as any;

    const pdfBuffer = await renderToBuffer(doc as any);

    const filename = (normalizedInvoice.number ? String(normalizedInvoice.number) : `invoice-${id}`).replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}.pdf"`,
        "Cache-Control": "no-store",
      },
    });

  } catch (e: any) {
    return NextResponse.json(
      { error: "PDF generation failed", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
