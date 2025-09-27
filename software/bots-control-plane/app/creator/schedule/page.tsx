import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import ScheduleCreatorView from "@/components/schedule/ScheduleCreatorView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CreatorSchedulePage() {
  await requireRole("creator");
  return <ScheduleCreatorView />;
}