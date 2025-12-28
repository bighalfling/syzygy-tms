"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function fmtDate(v: any) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function money(v: any, cur: string) {
  if (v == null) return "—";
  const n = typeof v === "number" ? v : Number(v?.toString?.() ?? v);
  if (Number.isNaN(n)) return "—";
  return `${n.toFixed(2)} ${cur || ""}`.trim();
}

export default function InvoicesListPage() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [ready, setReady] = useState<any[]>([]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [invRes, readyRes] = await Promise.all([
        fetch("/api/invoices", { cache: "no-store" }),
        fetch("/api/invoices/ready", { cache: "no-store" }),
      ]);

      if (!invRes.ok) throw new Error((await invRes.text()) || "Failed to load invoices");
      if (!readyRes.ok) throw new Error((await readyRes.text()) || "Failed to load ready-to-invoice");

      const invData = await invRes.json();
      const readyData = await readyRes.json();

      setInvoices(Array.isArray(invData) ? invData : []);
      setReady(Array.isArray(readyData) ? readyData : []);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createInvoice(orderId: string) {
    try {
      setCreating(orderId);
      setError(null);

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!res.ok) throw new Error((await res.text()) || "Failed to create invoice");
      const data = await res.json();

      const invoiceId = data?.invoice?.id;
      if (!invoiceId) throw new Error("Invoice created, but missing invoice.id in response");

      window.location.href = `/invoices/${invoiceId}`;
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setCreating(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Create invoices from completed trips and manage statuses.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          onClick={loadAll}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
          {error}
        </div>
      ) : null}

      {/* INVOICES TABLE */}
      <div className="rounded-xl border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/20">
          <div className="font-medium">All invoices</div>
          <div className="text-sm text-muted-foreground">Click an invoice to open it.</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1050px]">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium">Number</th>
                <th className="px-4 py-3 text-left font-medium">Buyer</th>
                <th className="px-4 py-3 text-left font-medium">Issue</th>
                <th className="px-4 py-3 text-left font-medium">Delivery</th>
                <th className="px-4 py-3 text-left font-medium">Due</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No invoices yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="underline underline-offset-4 hover:opacity-80"
                      >
                        {inv.number ?? inv.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{inv.buyerName ?? inv.client?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(inv.issueDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {fmtDate(inv.deliveryDate ?? inv.trip?.deliveryAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(inv.dueDate)}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {money(inv.total, inv.currency)}
                    </td>
                    <td className="px-4 py-3">{inv.status ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* READY TO INVOICE */}
      <div className="rounded-xl border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/20 flex items-start justify-between gap-4">
          <div>
            <div className="font-medium">Ready to invoice</div>
            <div className="text-sm text-muted-foreground">
              Orders with a trip and no invoice yet.
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1050px]">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-left font-medium">Trip</th>
                <th className="px-4 py-3 text-left font-medium">Delivery</th>
                <th className="px-4 py-3 text-left font-medium">Trip status</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : ready.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No orders ready to invoice.
                  </td>
                </tr>
              ) : (
                ready.map((o: any) => (
                  <tr key={o.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">{o.orderRef ?? o.id}</td>
                    <td className="px-4 py-3">{o.client?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.trip?.tripNo ?? o.tripId ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {fmtDate(o.trip?.deliveryAt ?? o.deliveryDateTime)}
                    </td>
                    <td className="px-4 py-3">{o.trip?.status ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
                        onClick={() => createInvoice(o.id)}
                        disabled={creating === o.id}
                      >
                        {creating === o.id ? "Creating…" : "Create invoice"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
