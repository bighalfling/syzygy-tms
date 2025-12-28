"use client";

import { useSession, signOut } from "next-auth/react";

export function UserMenu() {
  const { data } = useSession();
  const user = data?.user as any;

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl border px-3 py-1.5 text-sm">
        <span className="font-medium">{user.name ?? user.email}</span>
        <span className="ml-2 text-gray-500">{user.role}</span>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Logout
      </button>
    </div>
  );
}
