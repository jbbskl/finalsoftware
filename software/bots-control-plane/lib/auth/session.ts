import "server-only";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import type { UserRole } from "@/lib/auth/types";

const AUTH_DISABLED = process.env.AUTH_DISABLED === "true";

export type Session = { user: { id: string; email: string; role: UserRole } } | null;

export async function getSession(): Promise<Session> {
  if (AUTH_DISABLED) {
    const h = headers();
    const url = new URL(h.get("x-url") ?? "http://localhost/");
    const asParam = (url.searchParams.get("as") as UserRole) || "creator";
    return { user: { id: "dev-user", email: `${asParam}@example.com`, role: asParam } };
  }
  const ck = cookies();
  const uid = ck.get("uid")?.value;
  const email = ck.get("email")?.value;
  const role = ck.get("role")?.value as UserRole | undefined;
  if (!uid || !email || !role) return null;
  return { user: { id: uid, email, role } };
}