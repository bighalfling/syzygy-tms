"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "ISSUED";

type InvoiceForm = {
  number: string;
  issueDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: InvoiceStatus;
  note: string;
};

function toDateInput(value: any) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function toStatus(v: any): InvoiceStatus {
  const s = String(v || "").toUpperCase();
  if (s === "DRAFT") return "DRAFT";
  if (s === "SENT") return "SENT";
  if (s === "PAID" || s === "PAYED") return "PAID";
  if (s === "ISSUED") return "ISSUED";
  return "DRAFT";
}

function money(v: any, cur: string) {
  if (v == null) return "—";
  const n = typeof v === "number" ? v : Number(v?.toString?.() ?? v);
  if (Number.isNaN(n)) return "—";
  return `${n.toFixed(2)} ${cur || ""}`.trim();
}

export default function InvoiceEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [meta, setMeta] = useState<any>(null);

  const [form, setForm] = useState<InvoiceForm>({
    number: "",
    issueDate: "",
    deliveryDate: "",
    dueDate: "",
    status: "DRAFT",
    note: "",
  });

  const pdfUrl = useMemo(() => `/api/invoices/${id}/pdf`, [id]);

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/invoices/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error((await res.text()) || "Failed to load invoice");
        const inv = await res.json();

        setMeta(inv);
        setForm({
          number: inv.number ?? "",
          issueDate: toDateInput(inv.issueDate),
          deliveryDate: toDateInput(inv.deliveryDate ?? inv.trip?.deliveryAt ?? null),
          dueDate: toDateInput(inv.dueDate),
          status: toStatus(inv.status),
          note: inv.note ?? "",
        });
      } catch (e: any) {
        setError(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function set<K extends keyof InvoiceForm>(key: K, value: InvoiceForm[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function onSave() {
    setSaving(true);
    setError(null);

    const payload = {
      number: form.number || null,
      issueDate: form.issueDate || null,
      deliveryDate: form.deliveryDate || null,
      dueDate: form.dueDate || null,
      status: form.status,
      note: form.note ?? "",
    };

    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        const errText = contentType.includes("application/json")
          ? JSON.stringify(await res.json())
          : await res.text();
        throw new Error(errText || "Save failed");
      }

      router.refresh();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  const buyerName = meta?.buyerName ?? meta?.client?.name ?? "—";
  const orderRef = meta?.order?.orderRef ?? meta?.order?.id ?? null;
  const totalStr = money(meta?.total, meta?.currency ?? "EUR");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/invoices" className="underline underline-offset-4 hover:opacity-80">
            ← Back to Invoices
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Invoice</h1>
          <div className="text-sm text-muted-foreground">{id}</div>
          {orderRef ? <div className="text-sm text-muted-foreground">Order: {orderRef}</div> : null}
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-medium text-foreground">{totalStr}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="rounded-md border px-3 py-2 text-sm bg-background"
            value={form.status}
            onChange={(e) => set("status", e.target.value as any)}
            title="Invoice status"
          >
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="ISSUED">Issued</option>
          </select>

          <a
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
          >
            Preview PDF
          </a>

          <button
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
          {error}
        </div>
      ) : null}

      {/* BASIC */}
      <div className="rounded-xl border bg-background p-6 md:p-8 space-y-4">
        <div>
          <div className="text-lg font-medium">Basic</div>
          <div className="text-sm text-muted-foreground">Invoice dates and number.</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field label="Invoice number" value={form.number} onChange={(v) => set("number", v)} />
          <Field type="date" label="Issue date" value={form.issueDate} onChange={(v) => set("issueDate", v)} />
          <Field type="date" label="Delivery date" value={form.deliveryDate} onChange={(v) => set("deliveryDate", v)} />
          <Field type="date" label="Due date" value={form.dueDate} onChange={(v) => set("dueDate", v)} />
        </div>
      </div>

      {/* BUYER */}
      <div className="rounded-xl border bg-background p-6 md:p-8 space-y-4">
        <div>
          <div className="text-lg font-medium">Buyer</div>
          <div className="text-sm text-muted-foreground">Read-only.</div>
        </div>

        <label className="block space-y-1">
          <div className="text-sm text-muted-foreground">Name</div>
          <input className="w-full rounded-md border px-3 py-2 text-sm bg-muted/30" value={buyerName} disabled />
        </label>
      </div>

      {/* NOTES */}
      <div className="rounded-xl border bg-background p-6 md:p-8 space-y-4">
        <div>
          <div className="text-lg font-medium">Notes</div>
          <div className="text-sm text-muted-foreground">This text appears in PDF.</div>
        </div>

        <Textarea
          label="Note"
          value={form.note}
          onChange={(v) => set("note", v)}
          rows={6}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <input
        className="w-full rounded-md border px-3 py-2 text-sm bg-background"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <textarea
        className="w-full rounded-md border px-3 py-2 text-sm bg-background"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
