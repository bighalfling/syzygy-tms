"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type FormState = {
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  companyId: string;
  taxId: string;
  vatId: string;
  email: string;
  phone: string;
  contactPerson: string;
  isVatPayer: boolean;
  euVat: boolean;
  note: string;
};

const initialState: FormState = {
  name: "",
  street: "",
  city: "",
  zip: "",
  country: "",
  companyId: "",
  taxId: "",
  vatId: "",
  email: "",
  phone: "",
  contactPerson: "",
  isVatPayer: false,
  euVat: false,
  note: "",
};

export default function NewClientPage() {
  const router = useRouter();
  const [data, setData] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (key: keyof FormState, value: any) => {
    setData((s) => ({ ...s, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        const msg = ct.includes("application/json")
          ? JSON.stringify(await res.json())
          : await res.text();
        setError(msg);
        setSaving(false);
        return;
      }

      router.push("/clients");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Unknown error");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New client</h1>
          <p className="text-sm text-muted-foreground">Create a company profile for orders & invoices.</p>
        </div>

        <Link
          href="/clients"
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Back
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Form card */}
      <div className="rounded-xl border bg-background p-6 md:p-8">
        <form onSubmit={onSubmit} className="space-y-6">
          <section className="rounded-xl border bg-background p-5">
            <h2 className="font-semibold">Company</h2>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name *">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={data.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  required
                />
              </Field>

              <Field label="Contact person">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={data.contactPerson}
                  onChange={(e) => onChange("contactPerson", e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Email">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  type="email"
                  value={data.email}
                  onChange={(e) => onChange("email", e.target.value)}
                />
              </Field>

              <Field label="Phone">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={data.phone}
                  onChange={(e) => onChange("phone", e.target.value)}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-xl border bg-background p-5">
            <h2 className="font-semibold">Address</h2>

            <div className="mt-4">
              <Field label="Street">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={data.street}
                  onChange={(e) => onChange("street", e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="City">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={data.city}
                  onChange={(e) => onChange("city", e.target.value)}
                />
              </Field>

              <Field label="ZIP">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={data.zip}
                  onChange={(e) => onChange("zip", e.target.value)}
                />
              </Field>

              <Field label="Country">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  placeholder="SK / CZ / DE / GB"
                  value={data.country}
                  onChange={(e) => onChange("country", e.target.value.toUpperCase())}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-xl border bg-background p-5">
            <h2 className="font-semibold">Tax</h2>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Company ID (IČO)">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={data.companyId}
                  onChange={(e) => onChange("companyId", e.target.value)}
                />
              </Field>

              <Field label="Tax ID (DIČ)">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={data.taxId}
                  onChange={(e) => onChange("taxId", e.target.value)}
                />
              </Field>

              <Field label="VAT ID">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={data.vatId}
                  onChange={(e) => onChange("vatId", e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.isVatPayer}
                  onChange={(e) => onChange("isVatPayer", e.target.checked)}
                />
                VAT payer
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.euVat}
                  onChange={(e) => onChange("euVat", e.target.checked)}
                />
                EU VAT / reverse charge
              </label>
            </div>

            <div className="mt-4">
              <Field label="Note">
                <textarea
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background min-h-[110px]"
                  value={data.note}
                  onChange={(e) => onChange("note", e.target.value)}
                />
              </Field>
            </div>
          </section>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save client"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/clients")}
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
