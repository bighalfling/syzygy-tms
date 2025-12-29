"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "ISSUED";
type InvoiceLanguage = "EN" | "SK";

type InvoiceForm = {
  number: string;
  issueDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: InvoiceStatus;
  note: string;

  language: InvoiceLanguage;

  buyerName: string;
  buyerVat: string;
  buyerAddress: string;

  // Manual (single-line) pricing fields
  serviceName: string;
  netAmount: string; // "1000.00"
  vatRate: string; // "23"
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

function toLang(v: any): InvoiceLanguage {
  const s = String(v || "EN").toUpperCase();
  return s === "SK" ? "SK" : "EN";
}

function money(v: any, cur: string) {
  if (v == null) return "—";
  const n = typeof v === "number" ? v : Number(v?.toString?.() ?? v);
  if (Number.isNaN(n)) return "—";
  return `${n.toFixed(2)} ${cur || ""}`.trim();
}

function parseNum(v: string): number {
  const n = Number(String(v ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : 0;
}

function fmt2(n: number) {
  // prevent -0.00
  const x = Math.abs(n) < 0.0000001 ? 0 : n;
  return x.toFixed(2);
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

    language: "EN",

    buyerName: "",
    buyerVat: "",
    buyerAddress: "",

    serviceName: "Service",
    netAmount: "0.00",
    vatRate: "0",
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

        const isManualLoaded = !inv?.orderId && !inv?.order;
        const firstItem = Array.isArray(inv.items) && inv.items.length > 0 ? inv.items[0] : null;

        // Derive manual pricing from the first item if manual
        const derivedService = isManualLoaded ? (firstItem?.description ?? "Service") : "Service";
        const derivedNet =
          isManualLoaded && firstItem?.lineTotal != null
            ? String(Number(firstItem.lineTotal?.toString?.() ?? firstItem.lineTotal) || 0)
            : String(Number(inv.subtotal?.toString?.() ?? inv.subtotal) || 0);

        const derivedVatRate =
          isManualLoaded && firstItem?.vatRate != null
            ? String(Number(firstItem.vatRate?.toString?.() ?? firstItem.vatRate) || 0)
            : String(0);

        setForm({
          number: inv.number ?? "",
          issueDate: toDateInput(inv.issueDate),
          deliveryDate: toDateInput(inv.deliveryDate ?? inv.trip?.deliveryAt ?? null),
          dueDate: toDateInput(inv.dueDate),
          status: toStatus(inv.status),
          note: inv.note ?? "",

          language: toLang(inv.language),

          buyerName: inv.buyerName ?? "",
          buyerVat: inv.buyerVat ?? "",
          buyerAddress: inv.buyerAddress ?? "",

          serviceName: derivedService,
          netAmount: fmt2(parseNum(derivedNet)),
          vatRate: fmt2(parseNum(derivedVatRate)).replace(/\.00$/, ""), // show "23" not "23.00"
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

  const isManual = !meta?.orderId && !meta?.order;
  const currency = meta?.currency ?? "EUR";

  const net = parseNum(form.netAmount);
  const rate = parseNum(form.vatRate);
  const vatAmount = (net * rate) / 100;
  const gross = net + vatAmount;

  async function onSave() {
    setSaving(true);
    setError(null);

    const payload: any = {
      number: form.number || null,
      issueDate: form.issueDate || null,
      deliveryDate: form.deliveryDate || null,
      dueDate: form.dueDate || null,
      status: form.status,
      note: form.note ?? "",
      language: form.language,
    };

    if (isManual) {
      payload.buyerName = form.buyerName || null;
      payload.buyerVat = form.buyerVat || null;
      payload.buyerAddress = form.buyerAddress || null;

      // Manual pricing fields
      payload.serviceName = (form.serviceName || "Service").trim();
      payload.netAmount = net; // number
      payload.vatRate = rate; // number
      // vatAmount/total are computed on server
    }

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
      const re = await fetch(`/api/invoices/${id}`, { cache: "no-store" });
      if (re.ok) setMeta(await re.json());
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  const buyerNameRO = meta?.buyerName ?? meta?.client?.name ?? "—";
  const orderRef = meta?.order?.orderRef ?? meta?.order?.id ?? null;
  const totalStr = money(meta?.total, currency);

  return (
    <div className="space-y-6">
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
          {isManual ? (
            <div className="text-xs text-muted-foreground mt-1">Manual invoice (not linked to an order)</div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <select
            className="rounded-md border px-3 py-2 text-sm bg-background"
            value={form.language}
            onChange={(e) => set("language", (e.target.value as InvoiceLanguage) || "EN")}
            title="PDF language"
          >
            <option value="EN">EN</option>
            <option value="SK">SK</option>
          </select>

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

      {loading ? (
        <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">Loading…</div>
      ) : null}

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

      {/* NEW: Manual pricing (only manual invoices) */}
      {isManual ? (
        <div className="rounded-xl border bg-background p-6 md:p-8 space-y-4">
          <div>
            <div className="text-lg font-medium">Manual pricing</div>
            <div className="text-sm text-muted-foreground">
              This updates the single line in PDF table (Služby/Services) and totals.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Field label="Service title (table row)" value={form.serviceName} onChange={(v) => set("serviceName", v)} />
            </div>
            <Field
              label="Net amount"
              value={form.netAmount}
              onChange={(v) => set("netAmount", v)}
              inputMode="decimal"
              placeholder="e.g. 1000.00"
            />
            <Field
              label="VAT %"
              value={form.vatRate}
              onChange={(v) => set("vatRate", v)}
              inputMode="decimal"
              placeholder="e.g. 23"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ReadOnlyField label="VAT amount (auto)" value={`${fmt2(vatAmount)} ${currency}`} />
            <ReadOnlyField label="Gross total (auto)" value={`${fmt2(gross)} ${currency}`} />
            <ReadOnlyField label="Currency" value={currency} />
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border bg-background p-6 md:p-8 space-y-4">
        <div>
          <div className="text-lg font-medium">Buyer</div>
          <div className="text-sm text-muted-foreground">
            {isManual ? "Editable." : "Read-only (comes from Order/Client)."}
          </div>
        </div>

        {isManual ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name" value={form.buyerName} onChange={(v) => set("buyerName", v)} />
            <Field label="VAT ID" value={form.buyerVat} onChange={(v) => set("buyerVat", v)} />
            <div className="md:col-span-2">
              <Textarea label="Address" value={form.buyerAddress} onChange={(v) => set("buyerAddress", v)} rows={4} />
            </div>
          </div>
        ) : (
          <label className="block space-y-1">
            <div className="text-sm text-muted-foreground">Name</div>
            <input className="w-full rounded-md border px-3 py-2 text-sm bg-muted/30" value={buyerNameRO} disabled />
          </label>
        )}
      </div>

      <div className="rounded-xl border bg-background p-6 md:p-8 space-y-4">
        <div>
          <div className="text-lg font-medium">Notes</div>
          <div className="text-sm text-muted-foreground">This text appears in PDF.</div>
        </div>

        <Textarea label="Note" value={form.note} onChange={(v) => set("note", v)} rows={6} />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <input
        className="w-full rounded-md border px-3 py-2 text-sm bg-background"
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <input className="w-full rounded-md border px-3 py-2 text-sm bg-muted/30" value={value} disabled />
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
