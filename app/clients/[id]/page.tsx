"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Client = {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;

  street: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;

  companyId: string | null;
  taxId: string | null;
  vatId: string | null;

  isVatPayer: boolean;
  euVat: boolean;
  note: string | null;
};

export default function ClientDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/clients/${id}`, { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setClient(null);
          return;
        }
        const data = (await res.json()) as Client;
        if (!cancelled) setClient(data);
      } catch {
        if (!cancelled) setClient(null);
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
          <Link href="/clients" className="underline underline-offset-4 hover:opacity-80">
            ← Back to Clients
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Client details</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/clients/${id}/edit`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            Edit
          </Link>

          <Link
            href="/clients/new"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            + New client
          </Link>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-xl border bg-background p-6 md:p-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !client ? (
          <p className="text-sm">Client not found.</p>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold">{client.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {client.country ?? "—"} {client.city ? `• ${client.city}` : ""}
                </p>
              </div>

              <div className="text-right">
                <div className="text-sm text-muted-foreground">VAT</div>
                <div className="font-medium">{client.vatId ?? "—"}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">Contact person</div>
                <div className="mt-1">{client.contactPerson ?? "—"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="mt-1">{client.email ?? "—"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="mt-1">{client.phone ?? "—"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Address</div>
                <div className="mt-1">
                  {[client.street, client.zip, client.city, client.country].filter(Boolean).join(", ") || "—"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Company ID (IČO)</div>
                <div className="mt-1">{client.companyId ?? "—"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Tax ID (DIČ)</div>
                <div className="mt-1">{client.taxId ?? "—"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">VAT payer</div>
                <div className="mt-1">{client.isVatPayer ? "Yes" : "No"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">EU VAT / reverse charge</div>
                <div className="mt-1">{client.euVat ? "Yes" : "No"}</div>
              </div>

              <div className="md:col-span-2">
                <div className="text-sm text-muted-foreground">Note</div>
                <div className="mt-1 whitespace-pre-wrap">{client.note ?? "—"}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
