import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import AdminBots from "@/components/admin/AdminBots";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminBotsPage() {
  await requireRole("admin");
  return <AdminBots />;
}