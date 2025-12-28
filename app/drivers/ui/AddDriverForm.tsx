"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDriver } from "../actions";

export default function AddDriverForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const fd = new FormData(e.currentTarget);
    const res = await createDriver(fd);

    setPending(false);

    if (!res.ok) {
      setError(res.error ?? "Something went wrong");
      return;
    }

    router.push("/drivers");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" name="firstName" required placeholder="e.g. John" />
        <Field label="Last name" name="lastName" required placeholder="e.g. Smith" />
        <Field label="Phone" name="phone" placeholder="+421..." />
        <Field label="Email" name="email" placeholder="name@company.com" />
        <Field label="Nationality" name="nationality" placeholder="e.g. SK / UA / IN" />
        <Field label="License number" name="licenseNumber" placeholder="e.g. SK123..." />

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-neutral-700">License expiry</label>
          <input
            name="licenseExpiry"
            type="date"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-neutral-700">Notes</label>
          <textarea
            name="notes"
            rows={4}
            placeholder="Optional notes"
            className="mt-1 w-full resize-none rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/drivers")}
          className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          disabled={pending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
          disabled={pending}
        >
          {pending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-700">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
      />
    </div>
  );
}
