// app/lib/auth-guard.ts
export type SessionUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  role?: string;
};

export type SessionLike = {
  user?: SessionUser;
} | null;

export async function requireRole(
  getSession: () => Promise<SessionLike>,
  check?: (role?: string) => boolean
) {
  const session = await getSession();

  if (!session?.user) throw new Error("Unauthorized");

  const role = session.user.role;

  if (check && !check(role)) throw new Error("Forbidden");

  return { session, role };
}
