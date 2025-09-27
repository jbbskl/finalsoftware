import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import AdminInvoices from "@/components/admin/AdminInvoices";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminInvoicesPage() {
  await requireRole("admin");
  return <AdminInvoices />;
}