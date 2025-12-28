import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteTripButton from "./ui/DeleteTripButton";
import TripStatusSelect from "./ui/TripStatusSelect";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const trips = await prisma.trip.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      order: true,
      driver: true,
      vehicle: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trips</h1>
          <p className="text-sm text-muted-foreground">
            Manage trips, assign drivers and vehicles, and update statuses.
          </p>
        </div>

        <Link
          href="/trips/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
        >
          + New trip
        </Link>
      </div>

      {/* Table card */}
      <div className="rounded-xl border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Driver</th>
                <th className="px-4 py-3 text-left font-medium">Vehicle</th>
                <th className="px-4 py-3 text-left font-medium">Pickup</th>
                <th className="px-4 py-3 text-left font-medium">Delivery</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {trips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No trips yet. Click “+ New trip”.
                  </td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        <Link
                          href={`/orders/${t.order.id}`}
                          className="underline underline-offset-4 hover:opacity-80"
                        >
                          {t.order.orderRef ?? t.order.id}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(t.order as any).pickupAddress ?? ""}{" "}
                        {(t.order as any).pickupAddress ? "→" : ""}{" "}
                        {(t.order as any).deliveryAddress ?? ""}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <TripStatusSelect id={t.id} value={t.status} />
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {t.driver ? `${t.driver.firstName} ${t.driver.lastName}` : "—"}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {t.vehicle ? ((t.vehicle as any).plate ?? (t.vehicle as any).code ?? t.vehicle.id) : "—"}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {t.pickupAt ? new Date(t.pickupAt).toISOString().slice(0, 10) : "—"}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {t.deliveryAt ? new Date(t.deliveryAt).toISOString().slice(0, 10) : "—"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <DeleteTripButton id={t.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
