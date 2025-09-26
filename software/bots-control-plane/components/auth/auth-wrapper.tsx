"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import AuthDialog from "./AuthDialog";
import RedirectHandler from "./redirect-handler";

export default function AuthWrapper() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state during hydration
  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="animate-pulse">
          <div className="w-96 h-96 bg-muted rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // User is authenticated
  if (session?.user) {
    return <RedirectHandler />;
  }

  // Show auth dialog for unauthenticated users
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <AuthDialog />
    </div>
  );
}
