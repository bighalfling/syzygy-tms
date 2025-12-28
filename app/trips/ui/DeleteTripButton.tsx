"use client";

import { useState } from "react";
import { deleteTrip } from "../actions";

export default function DeleteTripButton({ id }: { id: string }) {
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this trip?")) return;
    setPending(true);
    await deleteTrip(id);
    setPending(false);
  }

  return (
    <button
      onClick={onDelete}
      disabled={pending}
      className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
