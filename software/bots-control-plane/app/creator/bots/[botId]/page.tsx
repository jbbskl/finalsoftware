import "server-only";
import { requireRole } from "@/lib/auth/require-role";
import BotDetailCreatorView from "@/components/bots/BotDetailCreatorView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface BotDetailPageProps {
  params: {
    botId: string;
  };
}

export default async function BotDetailPage({ params }: BotDetailPageProps) {
  await requireRole("creator");
  return <BotDetailCreatorView botId={params.botId} />;
}