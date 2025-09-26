import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClientSchedulePage() {
  const s = await getSession();
  const AUTH_DISABLED = process.env.AUTH_DISABLED === "true";
  if (!AUTH_DISABLED) {
    if (!s) redirect("/login");
    if (s.user.role !== "creator") redirect("/");
  }
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Schedule</h1>
      <div className="rounded-lg border p-4">Creator schedule management goes here (placeholder)</div>
    </main>
  );
}