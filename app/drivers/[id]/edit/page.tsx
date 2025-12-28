"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type DriverStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "OTHER";

type Driver = {
  id: string;
  firstName: string;
  lastName: string;
  status: DriverStatus | string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  notes: string | null;
};

function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function DriverEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [status, setStatus] = useState<string>("ACTIVE");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nationality, setNationality] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState(""); // YYYY-MM-DD
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/drivers/${id}`, { cache: "no-store" });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to load driver");
        }

        const data = (await res.json()) as Driver;
        if (cancelled) return;

        setDriver(data);

        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
        setStatus(data.status ?? "ACTIVE");
        setPhone(data.phone ?? "");
        setEmail(data.email ?? "");
        setNationality(data.nationality ?? "");
        setLicenseNumber(data.licenseNumber ?? "");
        setLicenseExpiry(toDateInputValue(data.licenseExpiry));
        setNotes(data.notes ?? "");
      } catch (e: any) {
        if (!cancelled) {
          setDriver(null);
          setError(e?.message ?? "Failed to load driver");
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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        status,
        phone: phone.trim() ? phone.trim() : null,
        email: email.trim() ? email.trim() : null,
        nationality: nationality.trim() ? nationality.trim() : null,
        licenseNumber: licenseNumber.trim() ? licenseNumber.trim() : null,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry).toISOString() : null,
        notes: notes.trim() ? notes : null,
      };

      const res = await fetch(`/api/drivers/${id}`, {
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
            : body?.error || body?.message || "Failed to update driver";
        throw new Error(msg);
      }

      router.push(`/drivers/${id}`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update driver");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/drivers/${id}`} className="underline underline-offset-4 hover:opacity-80">
            ← Back to driver
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Edit driver</h1>
          <p className="text-sm text-muted-foreground">Update driver details.</p>
        </div>

        <Link
          href="/drivers/new"
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          + New driver
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
        ) : !driver ? (
          <p className="text-sm">Driver not found.</p>
        ) : (
          <form onSubmit={onSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">First name *</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Last name *</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Status</label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Phone</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Email</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Nationality</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">License number</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">License expiry</label>
                <input
                  type="date"
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                />
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
                onClick={() => router.push(`/drivers/${id}`)}
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
