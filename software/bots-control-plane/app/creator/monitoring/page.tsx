import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import MonitoringCreatorView from "@/components/monitoring/MonitoringCreatorView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CreatorMonitoringPage() {
  await requireRole("creator");
  return <MonitoringCreatorView />;
}