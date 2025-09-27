import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import ScheduleAgencyView from "@/components/schedule/ScheduleAgencyView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AgencySchedulePage() {
  await requireRole("agency");
  return <ScheduleAgencyView />;
}