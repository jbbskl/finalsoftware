import "server-only";
import { getSession } from "@/lib/auth/session";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function DebugSession() {
  const s = await getSession();
  return <pre className="p-6">{JSON.stringify(s, null, 2)}</pre>;
}