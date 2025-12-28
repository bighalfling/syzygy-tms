"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Input } from "@/components/ui/input";

type OrderStatus =
  | "NEW"
  | "PLANNED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "INVOICED"
  | "CANCELLED";

type TripStatus = "PLANNED" | "IN_PROGRESS" | "DONE" | "CANCELED";

type OrderRow = {
  id: string;
  orderRef: string;
  clientName: string;
  pickupAddress: string;
  pickupDateTime: string | null;
  deliveryAddress: string;
  deliveryDateTime: string | null;
  status: OrderStatus;
  vehicle: string | null;
  driver: string | null;
  price: string | null;
  createdAt: string;
  updatedAt: string;
  trip: { id: string; status: TripStatus } | null;
};

const statusClassMap: Record<OrderStatus, string> = {
  NEW: "bg-gray-100 text-gray-800",
  PLANNED: "bg-blue-100 text-blue-800",
  IN_TRANSIT: "bg-orange-100 text-orange-800",
  DELIVERED: "bg-green-100 text-green-800",
  INVOICED: "bg-slate-200 text-slate-700 border border-slate-300",
  CANCELLED: "bg-red-100 text-red-800",
};

function formatDateTime(dateTime: string | null) {
  if (!dateTime) return "-";
  const d = new Date(dateTime);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersTable({ initialOrders }: { initialOrders: OrderRow[] }) {
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [editing, setEditing] = useState<{
    orderId: string;
    field: "vehicle" | "driver" | "price";
  } | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  async function reload() {
    const res = await fetch("/api/orders", { cache: "no-store" });
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
  }

  function startEdit(order: OrderRow, field: "vehicle" | "driver" | "price") {
    if (order.status === "INVOICED") return;
    setEditing({ orderId: order.id, field });
    setEditValue(order[field] ?? "");
  }

  async function saveEdit() {
    if (!editing) return;
    const { orderId, field } = editing;

    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, [field]: editValue } : o)));
    setEditing(null);

    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: editValue }),
    });

    if (!res.ok) {
      alert("Failed to save");
      reload();
    }
  }

  return (
    <div className="w-full bg-white rounded-lg border border-[#E5E7EB] overflow-x-auto">
      <table className="w-full min-w-[1280px]">
        <thead>
          <tr className="border-b">
            <th className="px-6 py-4 text-left text-xs font-semibold w-[140px]">Order</th>
            <th className="px-6 py-4 text-left text-xs font-semibold w-[160px]">Pickup</th>
            <th className="px-6 py-4 text-left text-xs font-semibold w-[160px]">Delivery</th>
            <th className="px-6 py-4 text-left text-xs font-semibold w-[220px]">Client</th>
            <th className="px-6 py-4 text-left text-xs font-semibold">From</th>
            <th className="px-6 py-4 text-left text-xs font-semibold">To</th>
            <th className="px-6 py-4 text-left text-xs font-semibold w-[170px]">Trip</th>
            <th className="px-6 py-4 text-left text-xs font-semibold w-[190px]">Status</th>
            <th className="px-6 py-4 text-left text-xs font-semibold w-[160px]">Vehicle</th>
            <th className="px-6 py-4 text-left text-xs font-semibold w-[180px]">Driver</th>
            <th className="px-6 py-4 text-left text-xs font-semibold w-[120px]">Price</th>
            <th className="px-6 py-4 text-left text-xs font-semibold w-[90px]">Actions</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => {
            const isLocked = order.status === "INVOICED";

            return (
              <tr key={order.id} className="border-b">
                <td className="px-6 py-4 whitespace-nowrap">{order.orderRef}</td>

                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDateTime(order.pickupDateTime)}
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDateTime(order.deliveryDateTime)}
                </td>

                <td className="px-6 py-4">{order.clientName}</td>

                <td className="px-6 py-4">
                  <div className="truncate max-w-[320px]">{order.pickupAddress}</div>
                </td>

                <td className="px-6 py-4">
                  <div className="truncate max-w-[320px]">{order.deliveryAddress}</div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  {order.trip ? (
                    <Link href="/trips" className="underline text-sm">
                      {order.trip.status}
                    </Link>
                  ) : order.status === "DELIVERED" || order.status === "INVOICED" ? (
                    <span className="text-xs text-neutral-400 italic">—</span>
                  ) : (
                    <Link
                      href={`/trips/new?orderId=${order.id}`}
                      className="inline-flex min-w-[120px] justify-center items-center whitespace-nowrap rounded-full bg-[var(--brand-green)] px-3 py-1 text-xs font-semibold text-white"
                    >
                      + Create trip
                    </Link>
                  )}
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClassMap[order.status]}`}
                    title={order.status}
                  >
                    {order.status}
                  </span>

                  {order.status === "INVOICED" && (
                    <span className="ml-2 text-xs text-neutral-500">locked</span>
                  )}
                </td>

                {(["vehicle", "driver", "price"] as const).map((field) => (
                  <td key={field} className="px-6 py-4 whitespace-nowrap">
                    {editing?.orderId === order.id && editing.field === field ? (
                      <Input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") setEditing(null);
                        }}
                        className="h-9"
                      />
                    ) : (
                      <button
                        disabled={isLocked}
                        className={`${isLocked ? "opacity-50 cursor-not-allowed" : "hover:underline"}`}
                        onClick={() => startEdit(order, field)}
                      >
                        {order[field] || "-"}
                      </button>
                    )}
                  </td>
                ))}

                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/orders/${order.id}`} className="text-blue-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            );
          })}

          {orders.length === 0 && (
            <tr>
              <td colSpan={12} className="px-6 py-10 text-center text-gray-500">
                No orders yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
