import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import SubscriptionsClientView from "@/components/subscriptions/SubscriptionsClientView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CreatorSubscriptionsPage() {
  const session = await requireRole("creator");
  return <SubscriptionsClientView userRole={session.user.role} />;
}