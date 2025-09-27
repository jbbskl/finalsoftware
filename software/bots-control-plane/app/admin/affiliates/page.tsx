import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import AdminAffiliates from "@/components/admin/AdminAffiliates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAffiliatesPage() {
  await requireRole("admin");
  return <AdminAffiliates />;
}