"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setErr("Wrong email or password");
      return;
    }

    router.push("/orders");
    router.refresh();
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Sign in</h1>

        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="w-full rounded-xl bg-black px-3 py-2 text-white">
            Login
          </button>
        </div>
      </form>
    </div>
  );
}
