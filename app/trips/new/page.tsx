import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewTripPage({
  searchParams,
}: {
  searchParams?: Promise<{ orderId?: string; error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const preselectedOrderId = String(sp.orderId ?? "").trim();
  const error = sp.error ? decodeURIComponent(String(sp.error)) : "";

  const [orders, drivers, vehicles] = await Promise.all([
    prisma.order.findMany({
      orderBy: [{ createdAt: "desc" }],
      where: { trip: { is: null } }, // 1:1 => trip is null
      select: {
        id: true,
        orderRef: true,
        pickupAddress: true,
        deliveryAddress: true,
      },
    }),
    prisma.driver.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.vehicle.findMany({
      orderBy: [{ code: "asc" }],
      select: { id: true, code: true, plate: true },
    }),
  ]);

  const defaultOrderId = preselectedOrderId || (orders[0]?.id ?? "");
  const defaultDriverId = drivers[0]?.id ?? "";
  const defaultVehicleId = vehicles[0]?.id ?? "";

  const disabled = orders.length === 0 || drivers.length === 0 || vehicles.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create trip</h1>
          <p className="text-sm text-muted-foreground">
            Select an order, assign driver & vehicle, set pickup/delivery.
          </p>
        </div>

        <Link href="/trips" className="underline underline-offset-4 hover:opacity-80">
          Back to trips
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Form card */}
      <div className="rounded-xl border bg-background p-6 md:p-8">
        <form action="/api/trips" method="post" className="space-y-6">
          {/* Order */}
          <div className="space-y-2">
            <label className="block text-sm text-muted-foreground">Order</label>
            <select
              name="orderId"
              defaultValue={defaultOrderId}
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              required
            >
              {orders.length === 0 ? (
                <option value="" disabled>
                  No available orders (all already have trips)
                </option>
              ) : (
                orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderRef} — {o.pickupAddress} → {o.deliveryAddress}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Driver + Vehicle */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm text-muted-foreground">Driver</label>
              <select
                name="driverId"
                defaultValue={defaultDriverId}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                required
              >
                {drivers.length === 0 ? (
                  <option value="" disabled>
                    No drivers — add driver first
                  </option>
                ) : (
                  drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.lastName} {d.firstName}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-muted-foreground">Vehicle</label>
              <select
                name="vehicleId"
                defaultValue={defaultVehicleId}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                required
              >
                {vehicles.length === 0 ? (
                  <option value="" disabled>
                    No vehicles — add vehicle first
                  </option>
                ) : (
                  vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {(v.code ? `${v.code} — ` : "") + (v.plate || v.id)}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Dates + Notes */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm text-muted-foreground">Pickup date & time</label>
              <input
                type="datetime-local"
                name="pickupAt"
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-muted-foreground">Delivery date & time</label>
              <input
                type="datetime-local"
                name="deliveryAt"
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm text-muted-foreground">Notes</label>
              <textarea
                name="notes"
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              Create trip
            </button>

            <Link
              href="/trips"
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </Link>

            {orders.length === 0 ? (
              <Link
                href="/orders"
                className="ml-auto text-sm underline underline-offset-4 text-muted-foreground hover:opacity-80"
              >
                No available orders — create an order →
              </Link>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
