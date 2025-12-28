"use client";

import { useState } from "react";

const STATUSES = ["NEW", "PLANNED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "INVOICED"];

export default function OrderRowClient({
  id,
  initialStatus,
  initialVehicle,
  initialDriver,
}: {
  id: number;
  initialStatus: string;
  initialVehicle: string | null;
  initialDriver: string | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [vehicle, setVehicle] = useState(initialVehicle ?? "");
  const [driver, setDriver] = useState(initialDriver ?? "");
  const [saving, setSaving] = useState(false);

  async function save(next: {
    status?: string;
    vehicle?: string;
    driverName?: string;
  }) {
    setSaving(true);
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...next }),
      });
    } finally {
      setSaving(false);
    }
  }

  function strOrUndef(v: string): string | undefined {
    const t = v.trim();
    return t.length ? t : undefined;
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {/* STATUS */}
      <select
        value={status}
        onChange={async (e) => {
          const v = e.target.value;
          setStatus(v);
          await save({ status: v });
        }}
        disabled={saving}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* VEHICLE */}
      <input
        placeholder="Vehicle"
        value={vehicle}
        onChange={(e) => setVehicle(e.target.value)}
        onBlur={() => save({ vehicle: strOrUndef(vehicle) })}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          }
        }}
        disabled={saving}
        style={{ width: 120, border: "1px solid #000", padding: "4px 6px" }}
      />

      {/* DRIVER */}
      <input
        placeholder="Driver"
        value={driver}
        onChange={(e) => setDriver(e.target.value)}
        onBlur={() => save({ driverName: strOrUndef(driver) })}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          }
        }}
        disabled={saving}
        style={{ width: 140, border: "1px solid #000", padding: "4px 6px" }}
      />

      {saving ? <span style={{ fontSize: 12 }}>Saving...</span> : null}
    </div>
  );
}
