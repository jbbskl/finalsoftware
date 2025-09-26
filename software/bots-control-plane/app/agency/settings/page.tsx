import "server-only";
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AgencySettingsPage() {
  await requireRole("agency");
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Agency · Settings</h1>
      <div className="rounded-lg border p-4">Agency settings interface goes here (placeholder)</div>
    </main>
  );
}