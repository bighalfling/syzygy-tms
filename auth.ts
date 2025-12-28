// auth.ts
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "./lib/authOptions";

export async function auth(): Promise<Session | null> {
  return getServerSession(authOptions);
}
