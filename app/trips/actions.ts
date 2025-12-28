"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type TripStatus = "PLANNED" | "IN_PROGRESS" | "DONE" | "CANCELED";
type OrderStatus =
  | "NEW"
  | "PLANNED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "INVOICED"
  | "CANCELLED";

const ORDER_STATUS_BY_TRIP_STATUS: Record<TripStatus, OrderStatus> = {
  PLANNED: "PLANNED",
  IN_PROGRESS: "IN_TRANSIT",
  DONE: "DELIVERED",
  CANCELED: "NEW", // важно: отмена трипа возвращает заказ в NEW
};

export async function createTrip(input: {
  orderId: string;
  driverId: string;
  vehicleId: string;
  status?: TripStatus;
  pickupAt?: string | null;    // YYYY-MM-DD
  deliveryAt?: string | null;  // YYYY-MM-DD
  notes?: string | null;
}) {
  try {
    const status: TripStatus = input.status ?? "PLANNED";

    if (!input.orderId || !input.driverId || !input.vehicleId) {
      return {
        ok: false as const,
        success: false,
        error: "Missing order/driver/vehicle",
      };
    }

    const pickupAt = input.pickupAt ? new Date(input.pickupAt) : null;
    const deliveryAt = input.deliveryAt ? new Date(input.deliveryAt) : null;

    const trip = await prisma.trip.create({
      data: {
        status,
        pickupAt,
        deliveryAt,
        notes: input.notes?.trim() ? input.notes.trim() : null,

        order: { connect: { id: input.orderId } },
        driver: { connect: { id: input.driverId } },
        vehicle: { connect: { id: input.vehicleId } },
      },
      select: { id: true, orderId: true, status: true },
    });

    const order = await prisma.order.findUnique({
      where: { id: trip.orderId },
      select: { id: true, status: true },
    });

    // не трогаем invoiced
    if (order && order.status !== "INVOICED") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: ORDER_STATUS_BY_TRIP_STATUS[status] },
      });
    }

    revalidatePath("/trips");
    revalidatePath("/orders");
    revalidatePath("/");

    return { ok: true as const, success: true, tripId: trip.id };
  } catch (e: any) {
    return {
      ok: false as const,
      success: false,
      error: e?.message ?? "Failed to create trip",
    };
  }
}

export async function updateTripStatus(id: string, status: TripStatus) {
  try {
    await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.update({
        where: { id },
        data: { status },
        select: { orderId: true },
      });

      const order = await tx.order.findUnique({
        where: { id: trip.orderId },
        select: { id: true, status: true },
      });

      // invoiced = locked
      if (order && order.status !== "INVOICED") {
        await tx.order.update({
          where: { id: order.id },
          data: { status: ORDER_STATUS_BY_TRIP_STATUS[status] },
        });
      }
    });

    revalidatePath("/trips");
    revalidatePath("/orders");
    revalidatePath("/");

    return { ok: true as const, success: true };
  } catch (e: any) {
    return {
      ok: false as const,
      success: false,
      error: e?.message ?? "Failed to update status",
    };
  }
}

export async function deleteTrip(tripId: string) {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, orderId: true },
    });

    if (!trip) {
      return { ok: true as const, success: true };
    }

    await prisma.trip.delete({ where: { id: tripId } });

    // возвращаем order в NEW, если он не INVOICED
    const order = await prisma.order.findUnique({
      where: { id: trip.orderId },
      select: { id: true, status: true },
    });

    if (order && order.status !== "INVOICED") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "NEW" },
      });
    }

    revalidatePath("/trips");
    revalidatePath("/orders");
    revalidatePath("/");

    return { ok: true as const, success: true };
  } catch (e: any) {
    return {
      ok: false as const,
      success: false,
      error: e?.message ?? "Failed to delete trip",
    };
  }
}
