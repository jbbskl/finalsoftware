import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import SettingsCreatorView from "@/components/settings/SettingsCreatorView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CreatorSettingsPage() {
  await requireRole("creator");
  return <SettingsCreatorView />;
}