import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import AdminSubscriptions from "@/components/admin/AdminSubscriptions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSubscriptionsPage() {
  await requireRole("admin");
  return <AdminSubscriptions />;
}