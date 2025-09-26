import "server-only";
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CreatorSettingsPage() {
  await requireRole("creator");
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Creator · Settings</h1>
      <div className="rounded-lg border p-4">Creator settings interface goes here (placeholder)</div>
    </main>
  );
}