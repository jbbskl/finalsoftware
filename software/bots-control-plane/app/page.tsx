import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const AUTH_DISABLED = process.env.AUTH_DISABLED === "true";

export default async function RootPage() {
  if (AUTH_DISABLED) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Dev role switch (auth disabled)</h1>
        <ul className="list-disc pl-5 space-y-2">
          <li><a className="underline text-blue-600 hover:text-blue-800" href="/creator?as=creator">Open Creator Dashboard</a></li>
          <li><a className="underline text-green-600 hover:text-green-800" href="/agency?as=agency">Open Agency Dashboard</a></li>
          <li><a className="underline text-red-600 hover:text-red-800" href="/admin?as=admin">Open Admin Dashboard</a></li>
        </ul>
        <p className="text-sm text-muted-foreground">Set AUTH_DISABLED=false to re-enable real login.</p>
      </main>
    );
  }

  // When auth is enabled, check session using NextAuth
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  const role = (session.user as any).role ?? "creator";
  if (role === "creator") redirect("/creator");
  if (role === "agency") redirect("/agency");
  if (role === "admin") redirect("/admin");
  
  redirect("/login");
}