"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createTrip } from "../actions";

type OrderOption = {
  id: string;
  orderRef: string | null;
  pickupAddress: string | null;
  deliveryAddress: string | null;
  pickupDateTime: Date | string | null;
};

type DriverOption = { id: string; firstName: string; lastName: string };
type VehicleOption = { id: string; label: string };

function toDateInputValue(d: Date | string | null | undefined) {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function NewTripForm(props: {
  orders: OrderOption[];
  drivers: DriverOption[];
  vehicles: VehicleOption[];
  preselectedOrderId?: string;
}) {
  const router = useRouter();

  const firstOrderId = props.orders[0]?.id ?? "";
  const firstDriverId = props.drivers[0]?.id ?? "";
  const firstVehicleId = props.vehicles[0]?.id ?? "";

  const defaultOrderId =
    props.preselectedOrderId && props.orders.some((o) => o.id === props.preselectedOrderId)
      ? props.preselectedOrderId
      : firstOrderId;

  const [orderId, setOrderId] = useState<string>(defaultOrderId);
  const [driverId, setDriverId] = useState<string>(firstDriverId);
  const [vehicleId, setVehicleId] = useState<string>(firstVehicleId);

  const selectedOrder = useMemo(
    () => props.orders.find((o) => o.id === orderId),
    [props.orders, orderId]
  );

  const [pickupAt, setPickupAt] = useState<string>(toDateInputValue(selectedOrder?.pickupDateTime ?? null));
  const [deliveryAt, setDeliveryAt] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // если поменяли order — подтягиваем дефолтную pickup date из order.pickupDateTime
  function onChangeOrder(v: string) {
    setOrderId(v);
    const o = props.orders.find((x) => x.id === v);
    setPickupAt(toDateInputValue(o?.pickupDateTime ?? null));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!orderId || !driverId || !vehicleId) {
      setError("Select order, driver and vehicle.");
      return;
    }

    setLoading(true);
    const res = await createTrip({
      orderId,
      driverId,
      vehicleId,
      pickupAt: pickupAt || null,
      deliveryAt: deliveryAt || null,
      notes: notes || null,
    });
    setLoading(false);

    if (!res?.ok) {
      setError(res?.error ?? "Failed to create trip");
      return;
    }

    router.push("/trips");
  }

  const inputBase =
    "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-300";
  const labelBase = "text-xs font-medium text-neutral-700";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <div className={labelBase}>Order</div>
        <select className={inputBase} value={orderId} onChange={(e) => onChangeOrder(e.target.value)}>
          {props.orders.map((o) => (
            <option key={o.id} value={o.id}>
              {(o.orderRef ?? o.id) + " - " + (o.pickupAddress ?? "") + " → " + (o.deliveryAddress ?? "")}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className={labelBase}>Driver</div>
          <select className={inputBase} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            {props.drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.firstName} {d.lastName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className={labelBase}>Vehicle</div>
          <select className={inputBase} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            {props.vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className={labelBase}>Pickup date</div>
          <input
            className={inputBase}
            type="date"
            value={pickupAt}
            onChange={(e) => setPickupAt(e.target.value)}
          />
        </div>

        <div>
          <div className={labelBase}>Delivery date</div>
          <input
            className={inputBase}
            type="date"
            value={deliveryAt}
            onChange={(e) => setDeliveryAt(e.target.value)}
          />
        </div>
      </div>

      <div>
        <div className={labelBase}>Notes</div>
        <textarea
          className={`${inputBase} min-h-[110px] resize-none`}
          placeholder="Optional notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/trips")}
          className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          disabled={loading}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="rounded-xl bg-[var(--brand-green)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-green-hover)] disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
