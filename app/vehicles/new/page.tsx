"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type VehicleType = "TRUCK" | "VAN" | "TRAILER" | "OTHER";
type VehicleStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export default function NewVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [plate, setPlate] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<VehicleType>("TRUCK");
  const [status, setStatus] = useState<VehicleStatus>("ACTIVE");
  const [notes, setNotes] = useState("");
  const [vin, setVin] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate,
          code: code || null,
          vin: vin || null,
          type,
          status,
          notes: notes || null,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        alert("Failed to create vehicle: " + text);
        return;
      }

      const created = JSON.parse(text);
      router.push(`/vehicles/${created.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/vehicles" className="underline underline-offset-4 hover:opacity-80">
            ← Back to Vehicles
          </Link>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight">New Vehicle</h1>
          <p className="text-sm text-muted-foreground">Add a vehicle to your fleet.</p>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-xl border bg-background p-6 md:p-8">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Plate *</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="AB955DD"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-muted-foreground">VIN</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="e.g. WVWZZZ1JZXW000001"
                maxLength={17}
              />
              <p className="text-xs text-muted-foreground">
                VIN is usually 17 characters (optional).
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Code</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="TR-001"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Type</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                value={type}
                onChange={(e) => setType(e.target.value as VehicleType)}
              >
                <option value="TRUCK">TRUCK</option>
                <option value="VAN">VAN</option>
                <option value="TRAILER">TRAILER</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Status</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                value={status}
                onChange={(e) => setStatus(e.target.value as VehicleStatus)}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm text-muted-foreground">Notes</label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm bg-background min-h-[110px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes…"
              />
            </div>
          </div>

          {/* Actions (submit точно есть) */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Save vehicle"}
            </button>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              onClick={() => router.push("/vehicles")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
