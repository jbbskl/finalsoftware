import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import BotsAgencyView from "@/components/bots/BotsAgencyView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AgencyBotsPage() {
  await requireRole("agency");
  return <BotsAgencyView />;
}