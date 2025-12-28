"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type VehicleType = "TRUCK" | "VAN" | "TRAILER" | "OTHER";
type VehicleStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

type Vehicle = {
  id: string;
  plate: string;
  code: string | null;
  vin: string | null;
  type: VehicleType;
  status: VehicleStatus;
  notes: string | null;
};

function normalizeVin(input: string) {
  const v = input.trim().toUpperCase();
  // VIN обычно 17 символов; часто без I/O/Q. Мягко чистим пробелы.
  return v.replace(/\s+/g, "");
}

export default function VehicleEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [plate, setPlate] = useState("");
  const [code, setCode] = useState("");
  const [vin, setVin] = useState("");
  const [type, setType] = useState<VehicleType>("TRUCK");
  const [status, setStatus] = useState<VehicleStatus>("ACTIVE");
  const [notes, setNotes] = useState("");

  const vinNormalized = useMemo(() => normalizeVin(vin), [vin]);
  const vinLooksInvalid = useMemo(() => {
    if (!vinNormalized) return false;
    // мягкая проверка длины
    return vinNormalized.length !== 17;
  }, [vinNormalized]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/vehicles/${id}`, { cache: "no-store" });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to load vehicle");
        }

        const data = (await res.json()) as Vehicle;

        if (cancelled) return;

        setVehicle(data);

        setPlate(data.plate ?? "");
        setCode(data.code ?? "");
        setVin(data.vin ?? "");
        setType(data.type ?? "TRUCK");
        setStatus(data.status ?? "ACTIVE");
        setNotes(data.notes ?? "");
      } catch (e: any) {
        if (!cancelled) {
          setVehicle(null);
          setError(e?.message ?? "Failed to load vehicle");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        plate: plate.trim().toUpperCase(),
        code: code.trim() ? code.trim() : null,
        vin: vinNormalized ? vinNormalized : null,
        type,
        status,
        notes: notes.trim() ? notes : null,
      };

      const res = await fetch(`/api/vehicles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      const body = contentType.includes("application/json") ? await res.json() : await res.text();

      if (!res.ok) {
        const msg =
          typeof body === "string"
            ? body
            : body?.error || body?.message || "Failed to update vehicle";
        throw new Error(msg);
      }

      router.push(`/vehicles/${id}`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update vehicle");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/vehicles/${id}`} className="underline underline-offset-4 hover:opacity-80">
            ← Back to vehicle
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Edit vehicle</h1>
          <p className="text-sm text-muted-foreground">Update vehicle details.</p>
        </div>

        <Link
          href="/vehicles/new"
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          + New vehicle
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border bg-background p-6 md:p-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !vehicle ? (
          <p className="text-sm">Vehicle not found.</p>
        ) : (
          <form onSubmit={onSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Plate *</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Code</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. RM03"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-muted-foreground">VIN</label>
                <input
                  className={`w-full rounded-md border px-3 py-2 text-sm bg-background ${
                    vinLooksInvalid ? "border-orange-400" : ""
                  }`}
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  placeholder="17 characters (optional)"
                  maxLength={32}
                />
                {vinLooksInvalid ? (
                  <p className="text-xs text-orange-700">
                    VIN usually has 17 characters (you entered {vinNormalized.length}).
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Optional. Saved uppercase, without spaces.</p>
                )}
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

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-muted-foreground">Notes</label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background min-h-[110px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>

              <button
                type="button"
                onClick={() => router.push(`/vehicles/${id}`)}
                className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
