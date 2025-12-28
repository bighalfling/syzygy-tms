"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type VehicleType = "TRUCK" | "VAN" | "TRAILER" | "OTHER";
type VehicleStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

type Vehicle = {
  id: string;
  plate: string;
  code: string | null;
  type: VehicleType;
  status: VehicleStatus;
  notes: string | null;
  createdAt: string;
  updatedAt?: string;
};

const statusBadgeClass: Record<VehicleStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  INACTIVE: "bg-gray-100 text-gray-800 border-gray-200",
  MAINTENANCE: "bg-orange-100 text-orange-800 border-orange-200",
};

export default function VehiclesPage() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vehicles", { cache: "no-store" });
      const data = (await res.json()) as Vehicle[];
      setVehicles(Array.isArray(data) ? data : []);
    } catch {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vehicles</h1>
          <p className="text-sm text-muted-foreground">Manage your fleet.</p>
        </div>

        <button
          onClick={() => router.push("/vehicles/new")}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
        >
          + New vehicle
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-xl border bg-background p-10">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="rounded-xl border bg-background p-10 text-center">
          <h3 className="text-lg font-semibold">No vehicles yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first vehicle to start managing your fleet.
          </p>
          <button
            onClick={() => router.push("/vehicles/new")}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            + New vehicle
          </button>
        </div>
      ) : (
        <div className="rounded-xl border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr className="border-b">
                  <th className="text-left px-4 py-3 font-medium">Plate</th>
                  <th className="text-left px-4 py-3 font-medium">Code</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Notes</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      <Link
                        href={`/vehicles/${v.id}`}
                        className="underline underline-offset-4 hover:opacity-80"
                      >
                        {v.plate}
                      </Link>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {v.code ?? "—"}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {v.type}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${statusBadgeClass[v.status]}`}
                      >
                        {v.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground max-w-[520px] truncate">
                      {v.notes ?? "—"}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/vehicles/${v.id}`}
                        className="underline underline-offset-4 hover:opacity-80"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
