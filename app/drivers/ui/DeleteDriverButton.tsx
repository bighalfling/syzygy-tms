"use client";

import { useState } from "react";
import { deleteDriver } from "../actions";

export default function DeleteDriverButton({ id }: { id: string }) {
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this driver?")) return;
    setPending(true);
    await deleteDriver(id);
    setPending(false);
  }

  return (
    <button
      onClick={onDelete}
      disabled={pending}
      className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
      title="Delete driver"
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
