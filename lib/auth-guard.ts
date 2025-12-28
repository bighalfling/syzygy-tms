// lib/auth-guard.ts
import { auth } from "../auth";

export type SessionLike = {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
    role?: string | null;
  };
} | null;

export async function requireAuth() {
  const session = (await auth()) as SessionLike;

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function requireRole(canAccess: (role?: string) => boolean) {
  const session = await requireAuth();
  const role = session.user?.role ?? undefined;

  if (!canAccess(role)) {
    throw new Error("Forbidden");
  }

  return session;
}
