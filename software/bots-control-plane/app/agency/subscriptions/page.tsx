import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import SubscriptionsAgencyView from "@/components/subscriptions/SubscriptionsAgencyView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AgencySubscriptionsPage() {
  await requireRole("agency");
  return <SubscriptionsAgencyView />;
}