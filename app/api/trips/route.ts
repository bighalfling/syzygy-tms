import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs"; // ✅ ВАЖНО для Prisma

function toDateOrNull(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

// ✅ чтобы ты могла открыть /api/trips и увидеть что роут реально работает
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/trips" });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const orderId = String(form.get("orderId") || "").trim();
    const driverId = String(form.get("driverId") || "").trim();
    const vehicleId = String(form.get("vehicleId") || "").trim();

    const pickupAt = toDateOrNull(form.get("pickupAt"));
    const deliveryAt = toDateOrNull(form.get("deliveryAt"));
    const notes = String(form.get("notes") || "").trim() || null;

    if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    if (!driverId) return NextResponse.json({ error: "driverId is required" }, { status: 400 });
    if (!vehicleId) return NextResponse.json({ error: "vehicleId is required" }, { status: 400 });

    // order должен существовать
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // 1:1 — на заказ только один trip
    const existing = await prisma.trip.findFirst({ where: { orderId } });
    if (existing) {
      // не создаём второй
      return NextResponse.redirect(new URL("/trips", req.url));
    }

    const trip = await prisma.trip.create({
      data: {
        orderId,
        driverId,
        vehicleId,
        status: "PLANNED",
        pickupAt,
        deliveryAt,
        notes,
      },
    });

    // ✅ ЖЁСТКАЯ проверка: если создалось — вернём tripId (и потом редирект)
    // Если хочешь, можешь временно НЕ редиректить, а смотреть JSON:
    // return NextResponse.json({ ok: true, tripId: trip.id });

    return NextResponse.redirect(new URL("/trips", req.url));
  } catch (e: any) {
    console.error("CREATE TRIP ERROR:", e);
    return NextResponse.json(
      { error: e?.message ?? "Failed to create trip" },
      { status: 500 }
    );
  }
}
