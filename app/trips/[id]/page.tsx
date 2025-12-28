import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

function TripStatusBadge({ status }: { status: string }) {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium";

  const cls =
    status === "COMPLETED" || status === "DONE"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : status === "IN_PROGRESS"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : status === "CANCELLED"
      ? "bg-red-50 text-red-800 border-red-200"
      : "bg-slate-50 text-slate-800 border-slate-200";

  return <span className={`${base} ${cls}`}>{status}</span>;
}

function fmtDate(d?: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB");
}

export default async function TripDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      order: true,
      vehicle: true,
      driver: true,
    },
  });

  if (!trip) return notFound();

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Trip {trip.id}</h1>
        <TripStatusBadge status={String(trip.status)} />
      </div>

      {/* TRIP INFO */}
      <div className="rounded-xl border p-4 space-y-2">
        <div>
          <b>Order ID:</b> {trip.orderId}
        </div>

        <div>
          <b>Status:</b> {trip.status}
        </div>

        <div>
          <b>Notes:</b> {trip.notes ?? "—"}
        </div>
      </div>

      {/* VEHICLE */}
      <div className="rounded-xl border p-4 space-y-2">
        <div className="font-semibold">Vehicle</div>

        <div>
          <b>Plate:</b> {trip.vehicle?.plate ?? "—"}
        </div>

        <div>
          <b>Type:</b> {trip.vehicle?.type ?? "—"}
        </div>

        <div>
          <b>VIN:</b> {trip.vehicle?.vin ?? "—"}
        </div>

        <div>
          <b>Code:</b> {trip.vehicle?.code ?? "—"}
        </div>
      </div>

      {/* DRIVER */}
      <div className="rounded-xl border p-4 space-y-2">
        <div className="font-semibold">Driver</div>

        <div>
          <b>Name:</b>{" "}
          {trip.driver
            ? `${trip.driver.firstName} ${trip.driver.lastName}`.trim()
            : "—"}
        </div>

        <div>
          <b>Phone:</b> {trip.driver?.phone ?? "—"}
        </div>

        <div>
          <b>Email:</b> {trip.driver?.email ?? "—"}
        </div>

        <div>
          <b>Nationality:</b> {trip.driver?.nationality ?? "—"}
        </div>

        <div>
          <b>License:</b> {trip.driver?.licenseNumber ?? "—"}
        </div>

        <div>
          <b>License expiry:</b> {fmtDate(trip.driver?.licenseExpiry)}
        </div>
      </div>

      {/* ORDER */}
      <div className="rounded-xl border p-4 space-y-2">
        <div className="font-semibold">Order details</div>

        <div>
          <b>Reference:</b> {trip.order?.orderRef ?? "—"}
        </div>

        <div>
          <b>Client:</b> {trip.order?.clientName ?? "—"}
        </div>

        <div>
          <b>Pickup address:</b> {trip.order?.pickupAddress ?? "—"}
        </div>

        <div>
          <b>Delivery address:</b> {trip.order?.deliveryAddress ?? "—"}
        </div>

        <div>
          <b>Pickup date:</b> {fmtDate(trip.order?.pickupDateTime)}
        </div>

        <div>
          <b>Delivery date:</b> {fmtDate(trip.order?.deliveryDateTime)}
        </div>
      </div>
    </div>
  );
}
