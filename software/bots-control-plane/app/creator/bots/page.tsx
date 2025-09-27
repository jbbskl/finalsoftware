import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import BotsCreatorView from "@/components/bots/BotsCreatorView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CreatorBotsPage() {
  await requireRole("creator");
  return <BotsCreatorView />;
}