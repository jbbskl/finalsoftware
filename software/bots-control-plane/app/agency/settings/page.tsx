import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import SettingsAgencyView from "@/components/settings/SettingsAgencyView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AgencySettingsPage() {
  await requireRole("agency");
  return <SettingsAgencyView />;
}