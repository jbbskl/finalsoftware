import { auth } from "@/lib/auth";
import AuthDialog from "@/components/auth/AuthDialog";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  
  if (session?.user) {
    // User is authenticated, redirect to role home
    const role = (session.user as any).role ?? "creator";
    const dest = role === "creator" ? "/creator" : role === "agency" ? "/agency" : "/admin";
    redirect(dest);
  }
  
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <AuthDialog />
    </div>
  );
}