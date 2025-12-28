"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Vehicle = {
  id: string;
  plate: string;
  code: string | null;
  vin: string | null;
  type: string;
  status: string;
  notes: string | null;
};

export default function VehicleDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/vehicles/${id}`, { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setVehicle(null);
          return;
        }
        const data = (await res.json()) as Vehicle;
        if (!cancelled) setVehicle(data);
      } catch {
        if (!cancelled) setVehicle(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/vehicles" className="underline underline-offset-4 hover:opacity-80">
            ← Back to Vehicles
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Vehicle details</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/vehicles/${id}/edit`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            Edit
          </Link>

          <Link
            href="/vehicles/new"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            + New vehicle
          </Link>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-xl border bg-background p-6 md:p-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !vehicle ? (
          <p className="text-sm">Vehicle not found.</p>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold">{vehicle.plate}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{vehicle.code ?? "No code"}</p>
              </div>

              <div className="text-right">
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="font-medium">{vehicle.status}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">Type</div>
                <div className="mt-1">{vehicle.type}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">VIN</div>
                <div className="mt-1 font-mono text-sm">
                  {vehicle.vin ? vehicle.vin : "—"}
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="text-sm text-muted-foreground">Notes</div>
                <div className="mt-1 whitespace-pre-wrap">{vehicle.notes ?? "—"}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
