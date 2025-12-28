import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const buf = Buffer.from("PDF route OK");

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=invoice-${id}.pdf`,
    },
  });
}
