import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardAlias() {
  const s = await getSession();
  if (!s) redirect("/login");
  const r = s.user.role;
  if (r === "creator") redirect("/client");
  if (r === "agency") redirect("/agency");
  if (r === "admin")  redirect("/admin");
  redirect("/login");
}