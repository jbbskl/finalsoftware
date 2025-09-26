import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import DashboardAdmin from "@/components/dashboards/DashboardAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboardPage() {
  await requireRole("admin");
  return <DashboardAdmin />;
}