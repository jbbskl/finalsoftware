import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import MonitoringAgencyView from "@/components/monitoring/MonitoringAgencyView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AgencyMonitoringPage() {
  await requireRole("agency");
  return <MonitoringAgencyView />;
}