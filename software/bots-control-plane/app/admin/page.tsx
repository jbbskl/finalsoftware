import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboardPage() {
  await requireRole("admin");
  return <AdminDashboard />;
}