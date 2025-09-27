import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import DashboardCreator from "@/components/dashboards/DashboardCreator";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CreatorDashboardPage() {
  await requireRole("creator");
  return <DashboardCreator />;
}