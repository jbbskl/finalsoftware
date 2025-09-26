import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import DashboardAgency from "@/components/dashboards/DashboardAgency";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AgencyDashboardPage() {
  await requireRole("agency");
  return <DashboardAgency />;
}