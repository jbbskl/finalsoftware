import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/lib/auth/types";

export async function requireRole(expected: UserRole) {
  const AUTH_DISABLED = process.env.AUTH_DISABLED === "true";
  
  if (AUTH_DISABLED) {
    // In dev mode, return a mock session
    return { user: { id: "dev-user", email: `${expected}@example.com`, role: expected } };
  }
  
  const session = await auth();
  
  if (!session?.user) {
    console.log(`[AUTH] No session found, redirecting to login`);
    redirect("/login");
  }
  
  const userRole = (session.user as any).role;
  if (userRole !== expected) {
    console.log(`[AUTH] Role mismatch: expected ${expected}, got ${userRole}`);
    redirect("/login");
  }
  
  console.log(`[AUTH] Role check passed: ${userRole} === ${expected}`);
  return session;
}
