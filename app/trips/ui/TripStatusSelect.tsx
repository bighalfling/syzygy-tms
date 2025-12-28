"use client";

import { useState } from "react";
import { updateTripStatus } from "../actions";

const STATUSES = ["PLANNED", "IN_PROGRESS", "DONE", "CANCELED"] as const;
type Status = (typeof STATUSES)[number];

export default function TripStatusSelect({
  id,
  value,
}: {
  id: string;
  value: Status;
}) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status>(value);

  async function onChange(next: Status) {
  const prev = status; // локальный предыдущий
  setStatus(next);
  setPending(true);

  try {
    const res = await updateTripStatus(id, next);
    setPending(false);

    if (!res?.ok) {
      setStatus(prev);
      alert(res?.error ?? "Failed to update status");
    }
  } catch (e: any) {
    setPending(false);
    setStatus(prev);
    alert(e?.message ?? "Failed to update status");
  }
}

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => onChange(e.target.value as Status)}
      className="rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-900 outline-none hover:bg-neutral-50 disabled:opacity-60"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
