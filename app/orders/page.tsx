import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      trip: true, // ✅ 1:1
      invoice: true,
      client: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage orders, create trips, and open invoices.
          </p>
        </div>

        <Link
          href="/orders/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
        >
          + Add order
        </Link>
      </div>

      {/* Table card */}
      <div className="rounded-xl border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="border-b">
                <th className="text-left px-4 py-3 font-medium">Order</th>
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium">Pickup</th>
                <th className="text-left px-4 py-3 font-medium">Delivery</th>
                <th className="text-left px-4 py-3 font-medium">Trip</th>
                <th className="text-left px-4 py-3 font-medium">Invoice</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-muted-foreground">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/orders/${o.id}`}
                        className="underline underline-offset-4 hover:opacity-80"
                      >
                        {o.orderRef}
                      </Link>
                    </td>

                    <td className="px-4 py-3">{o.client ? o.client.name : "—"}</td>

                    <td className="px-4 py-3">{o.pickupAddress}</td>
                    <td className="px-4 py-3">{o.deliveryAddress}</td>

                    <td className="px-4 py-3">
                      {o.trip ? (
                        <span className="inline-flex items-center rounded-md border px-2 py-1 text-xs">
                          {o.trip.status}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {o.invoice ? (
                        <Link className="underline underline-offset-4" href={`/invoices/${o.invoice.id}`}>
                          {o.invoice.number}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {!o.trip ? (
                        <Link
                          href={`/trips/new?orderId=${encodeURIComponent(o.id)}`}
                          className="underline underline-offset-4"
                        >
                          Create trip
                        </Link>
                      ) : (
                        <Link href={`/trips/${o.trip.id}`} className="underline underline-offset-4">
                          Open trip
                        </Link>
                      )}
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
