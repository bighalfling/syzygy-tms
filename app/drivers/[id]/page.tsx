"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Driver = {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  notes: string | null;
};

export default function DriverDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/drivers/${id}`, { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setDriver(null);
          return;
        }
        const data = (await res.json()) as Driver;
        if (!cancelled) setDriver(data);
      } catch {
        if (!cancelled) setDriver(null);
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
          <Link href="/drivers" className="underline underline-offset-4 hover:opacity-80">
            ← Back to Drivers
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Driver details</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/drivers/${id}/edit`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            Edit
          </Link>

          <Link
            href="/drivers/new"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            + New driver
          </Link>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-xl border bg-background p-6 md:p-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !driver ? (
          <p className="text-sm">Driver not found.</p>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold">
                  {driver.firstName} {driver.lastName}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{driver.status}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="mt-1">{driver.phone ?? "—"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="mt-1">{driver.email ?? "—"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Nationality</div>
                <div className="mt-1">{driver.nationality ?? "—"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">License</div>
                <div className="mt-1">{driver.licenseNumber ?? "—"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">License expiry</div>
                <div className="mt-1">
                  {driver.licenseExpiry ? new Date(driver.licenseExpiry).toISOString().slice(0, 10) : "—"}
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="text-sm text-muted-foreground">Notes</div>
                <div className="mt-1 whitespace-pre-wrap">{driver.notes ?? "—"}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
