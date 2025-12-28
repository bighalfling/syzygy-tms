import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function money(n: any, cur = "EUR") {
  const v = typeof n === "number" ? n : Number(n?.toString?.() ?? n);
  if (!Number.isFinite(v)) return "—";
  return `${v.toFixed(2)} ${cur}`.trim();
}

export default async function HomePage() {
  const now = new Date();
  const d30 = new Date(now);
  d30.setDate(d30.getDate() - 30);

  const d7 = new Date(now);
  d7.setDate(d7.getDate() - 7);

  const [
    activeTrips,
    plannedTrips,
    doneTrips,
    driversTotal,
    vehiclesTotal,
    ordersTotal,
    invoicesTotal,
    invoicesPaid,
    invoicesUnpaid,
    ordersWithTrip,
    invoicedOrderIds,
    revenuePaidLast30,
    revenueIssuedLast30,
    tripsLast7d,
  ] = await Promise.all([
    prisma.trip.count({ where: { status: "IN_PROGRESS" } }),
    prisma.trip.count({ where: { status: "PLANNED" } }),
    prisma.trip.count({ where: { status: "DONE" } }),
    prisma.driver.count(),
    prisma.vehicle.count(),
    prisma.order.count(),
    prisma.invoice.count(),
    prisma.invoice.count({ where: { status: "PAID" } }),
    prisma.invoice.count({ where: { status: { in: ["ISSUED", "SENT", "DRAFT"] } } }),

    // ✅ orders that have a trip (no tripId field in schema)
    prisma.order.count({
      where: { trip: { isNot: null } },
    }),

    // ✅ get invoice.orderId list, then compute "ready to invoice"
    prisma.invoice.findMany({
      select: { orderId: true },
    }),

    prisma.invoice
      .aggregate({
        where: { status: "PAID", issueDate: { gte: d30 } },
        _sum: { total: true },
      })
      .then((r) => r._sum.total ?? new Prisma.Decimal(0)),

    prisma.invoice
      .aggregate({
        where: { status: { in: ["ISSUED", "SENT", "PAID"] }, issueDate: { gte: d30 } },
        _sum: { total: true },
      })
      .then((r) => r._sum.total ?? new Prisma.Decimal(0)),

    prisma.trip.count({ where: { createdAt: { gte: d7 } } }),
  ]);

  const invoicedCount = new Set(
      invoicedOrderIds.map((x: any) => x.orderId).filter(Boolean)
    ).size;

  const ordersReadyToInvoice = Math.max(0, ordersWithTrip - invoicedCount);

  const avgInvoiceValue = invoicesTotal
    ? Number((await prisma.invoice.aggregate({ _avg: { total: true } }))._avg.total ?? 0)
    : 0;

  const recentTrips = await prisma.trip.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 8,
    include: { driver: true, vehicle: true, order: true },
  });

  // Top clients by paid revenue last 30 days (fallback to buyerName)
  const topClients = await prisma.invoice.groupBy({
    by: ["buyerName"],
    where: { status: "PAID", issueDate: { gte: d30 } },
    _sum: { total: true },
    orderBy: { _sum: { total: "desc" } },
    take: 5,
  });

  const utilization = vehiclesTotal > 0 ? Math.round((tripsLast7d / vehiclesTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Quick overview of operations, invoicing, and cashflow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/trips/new"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            + New trip
          </Link>
          <Link
            href="/orders/new"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            + New order
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi title="Active trips" value={activeTrips} hint="IN_PROGRESS" />
        <Kpi title="Planned trips" value={plannedTrips} hint="PLANNED" />
        <Kpi title="Done trips" value={doneTrips} hint="DONE" />
        <Kpi title="Ready to invoice" value={ordersReadyToInvoice} hint="Trip exists, no invoice yet" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi title="Invoices total" value={invoicesTotal} hint="All statuses" />
        <Kpi title="Unpaid invoices" value={invoicesUnpaid} hint="DRAFT / SENT / ISSUED" />
        <Kpi title="Paid invoices" value={invoicesPaid} hint="PAID" />
        <Kpi title="Orders total" value={ordersTotal} hint="All orders" />
      </div>

      {/* Finance cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-background p-6">
          <div className="text-sm text-muted-foreground">Paid revenue (last 30 days)</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{money(revenuePaidLast30, "EUR")}</div>
          <div className="mt-2 text-xs text-muted-foreground">
            Based on invoices with status <span className="font-medium text-foreground">PAID</span> and issue date within 30 days.
          </div>
        </div>

        <div className="rounded-xl border bg-background p-6">
          <div className="text-sm text-muted-foreground">Issued revenue (last 30 days)</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{money(revenueIssuedLast30, "EUR")}</div>
          <div className="mt-2 text-xs text-muted-foreground">
            Includes <span className="font-medium text-foreground">ISSUED / SENT / PAID</span>.
          </div>
        </div>

        <div className="rounded-xl border bg-background p-6">
          <div className="text-sm text-muted-foreground">Utilization (7 days)</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{vehiclesTotal > 0 ? `${utilization}%` : "—"}</div>
          <div className="mt-2 text-xs text-muted-foreground">
            {tripsLast7d} trips created in 7 days / {vehiclesTotal} vehicles.
          </div>
        </div>
      </div>

      {/* Secondary widgets */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-background p-6">
          <div className="text-sm font-medium">Fleet & people</div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <MiniKpi title="Drivers" value={driversTotal} href="/drivers" />
            <MiniKpi title="Vehicles" value={vehiclesTotal} href="/vehicles" />
          </div>

          <div className="mt-4 rounded-lg border bg-muted/20 p-4 text-sm">
            Avg invoice value: <span className="font-medium">{money(avgInvoiceValue, "EUR")}</span>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Top clients (paid, last 30 days)</div>
              <div className="text-xs text-muted-foreground">Quick cashflow concentration view.</div>
            </div>
            <Link href="/invoices" className="text-sm underline underline-offset-4 hover:opacity-80">
              Open invoices
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {topClients.length === 0 ? (
              <div className="text-sm text-muted-foreground">No paid invoices in the last 30 days.</div>
            ) : (
              topClients.map((c) => (
                <div key={c.buyerName} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div className="text-sm font-medium truncate">{c.buyerName || "—"}</div>
                  <div className="text-sm">{money(c._sum.total ?? 0, "EUR")}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent trips */}
      <div className="rounded-xl border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">Recent trips</div>
            <div className="text-sm text-muted-foreground">Last 8 created trips.</div>
          </div>
          <Link href="/trips" className="text-sm underline underline-offset-4 hover:opacity-80">
            Open trips
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Driver</th>
                <th className="px-4 py-3 text-left font-medium">Vehicle</th>
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-right font-medium">Go</th>
              </tr>
            </thead>

            <tbody>
              {recentTrips.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No trips yet.
                  </td>
                </tr>
              ) : (
                recentTrips.map((t) => (
                  <tr key={t.id} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="px-4 py-3">{t.status}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.driver ? `${t.driver.firstName} ${t.driver.lastName}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {(t.vehicle as any)?.plate ?? (t.vehicle as any)?.id ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {(t.order as any)?.orderRef ?? (t.order as any)?.id ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/trips/${t.id}`} className="underline underline-offset-4 hover:opacity-80">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-4 text-sm">
        <Link className="underline underline-offset-4 hover:opacity-80" href="/orders">
          Orders
        </Link>
        <Link className="underline underline-offset-4 hover:opacity-80" href="/vehicles">
          Vehicles
        </Link>
        <Link className="underline underline-offset-4 hover:opacity-80" href="/drivers">
          Drivers
        </Link>
        <Link className="underline underline-offset-4 hover:opacity-80" href="/trips">
          Trips
        </Link>
        <Link className="underline underline-offset-4 hover:opacity-80" href="/invoices">
          Invoices
        </Link>
        <Link className="underline underline-offset-4 hover:opacity-80" href="/clients">
          Clients
        </Link>
      </div>
    </div>
  );
}

function Kpi({ title, value, hint }: { title: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border bg-background p-5">
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {hint ? <div className="mt-2 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

function MiniKpi({ title, value, href }: { title: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-lg border p-4 hover:bg-muted/30">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight">{value}</div>
      <div className="mt-2 text-xs underline underline-offset-4 text-muted-foreground">Open</div>
    </Link>
  );
}
