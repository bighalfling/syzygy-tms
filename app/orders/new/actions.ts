"use server";

import { prisma } from "@/lib/prisma";

type OrderPayload = {
  orderRef: string;
  clientId: string;

  pickupAddress: string;
  pickupDateTime?: string;

  deliveryAddress: string;
  deliveryDateTime?: string;

  price?: string;
  vehicle?: string;
  driver?: string;
  notes?: string;
};

function toDateOrNull(v?: string) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

export async function createOrderAction(data: OrderPayload) {
  const orderRef = String(data?.orderRef ?? "").trim();
  const clientId = String(data?.clientId ?? "").trim();

  if (!orderRef) throw new Error("orderRef is required");
  if (!clientId) throw new Error("clientId is required");

  const pickupAddress = String(data?.pickupAddress ?? "").trim();
  const deliveryAddress = String(data?.deliveryAddress ?? "").trim();

  if (!pickupAddress) throw new Error("pickupAddress is required");
  if (!deliveryAddress) throw new Error("deliveryAddress is required");

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error("Client not found");

  await prisma.order.create({
    data: {
      orderRef,

      // ✅ legacy required field (keep for now)
      clientName: client.name,

      // ✅ new relation
      clientId,

      pickupAddress,
      pickupDateTime: toDateOrNull(data?.pickupDateTime),

      deliveryAddress,
      deliveryDateTime: toDateOrNull(data?.deliveryDateTime),

      price: String(data?.price ?? "").trim() || null,
      vehicle: String(data?.vehicle ?? "").trim() || null,
      driver: String(data?.driver ?? "").trim() || null,
      notes: String(data?.notes ?? "").trim() || null,
    },
  });
}
