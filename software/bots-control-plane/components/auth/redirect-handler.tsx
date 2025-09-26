"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RedirectHandler() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading
    
    if (session?.user) {
      const role = (session.user as any).role ?? "creator";
      const userId = session.user.id;
      
      let dest: string;
      switch (role) {
        case "admin":
          dest = `/admin/${userId}/dashboard`;
          break;
        case "agency":
          dest = `/agency/${userId}/dashboard`;
          break;
        case "creator":
        default:
          dest = `/client/${userId}/dashboard`;
          break;
      }
      
      console.log(`[REDIRECT] Redirecting ${role} user ${userId} to ${dest}`);
      router.replace(dest);
    } else {
      router.replace("/login");
    }
  }, [session, status, router]);

  return null; // This component doesn't render anything
}
