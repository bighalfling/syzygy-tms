"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Order } from "@/lib/types/order";
import { Button } from "@/components/ui/button";

function SafeStatusBadge({ status }: { status?: string | null }) {
  const MAP: Record<string, string> = {
    NEW: "bg-slate-100 text-slate-800 border border-slate-200",
    PLANNED: "bg-blue-100 text-blue-800 border border-blue-200",
    IN_TRANSIT: "bg-amber-100 text-amber-800 border border-amber-200",
    DELIVERED: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    INVOICED: "bg-purple-100 text-purple-800 border border-purple-200",
    CANCELLED: "bg-red-100 text-red-800 border border-red-200",
  };

  const cls =
    MAP[status ?? ""] ??
    "bg-gray-100 text-gray-800 border border-gray-200";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status ?? "UNKNOWN"}
    </span>
  );
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${params.id}`, { cache: "no-store" });

        if (!res.ok) {
          if (!cancelled) setOrder(null);
          return;
        }

        const data = (await res.json()) as Order;
        if (!cancelled) setOrder(data);
      } catch {
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const formatDateTime = (dateTime?: string) => {
    if (!dateTime) return "—";
    const date = new Date(dateTime);
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusStr = useMemo(() => String(order?.status ?? ""), [order?.status]);
  const isInvoiced = statusStr === "INVOICED";

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/orders")}
          className="-ml-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>

        <div className="rounded-xl border bg-background p-6">
          <p className="text-sm">Order not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Button
            variant="ghost"
            onClick={() => router.push("/orders")}
            className="-ml-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              Order {order.orderRef}
            </h1>
            <SafeStatusBadge status={statusStr || null} />
          </div>
        </div>

        {/* Если инвойс уже выставлен — логично скрыть Create trip */}
        {!isInvoiced ? (
          <Link
            href={`/trips/new?orderId=${encodeURIComponent(order.id)}`}
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Create trip
          </Link>
        ) : null}
      </div>

      {isInvoiced ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          This order is <b>INVOICED</b> and locked.
        </div>
      ) : null}

      {/* Content */}
      <div className="grid gap-6">
        <section className="rounded-xl border bg-background p-6">
          <h2 className="mb-4 text-base font-semibold">Client</h2>
          <p className="text-sm text-muted-foreground mb-1">Client Name</p>
          <p>{order.clientName}</p>
        </section>

        <section className="rounded-xl border bg-background p-6">
          <h2 className="mb-4 text-base font-semibold">Route</h2>
          <p className="text-sm text-muted-foreground mb-1">Pickup Address</p>
          <p>{order.pickupAddress}</p>

          <div className="h-4" />

          <p className="text-sm text-muted-foreground mb-1">Delivery Address</p>
          <p>{order.deliveryAddress}</p>
        </section>

        <section className="rounded-xl border bg-background p-6">
          <h2 className="mb-4 text-base font-semibold">Schedule</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Pickup Date & Time
              </p>
              <p>{formatDateTime(order.pickupDateTime)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Delivery Date & Time
              </p>
              <p>{formatDateTime(order.deliveryDateTime)}</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-background p-6">
          <h2 className="mb-4 text-base font-semibold">Vehicle & Driver</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Vehicle</p>
              <p>{order.vehicle || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Driver</p>
              <p>{order.driver || "—"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-background p-6">
          <h2 className="mb-4 text-base font-semibold">Pricing</h2>
          <p className="text-sm text-muted-foreground mb-1">Price</p>
          <p>{order.price || "—"}</p>
        </section>

        {order.notes ? (
          <section className="rounded-xl border bg-background p-6">
            <h2 className="mb-4 text-base font-semibold">Notes</h2>
            <p className="whitespace-pre-wrap">{order.notes}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
