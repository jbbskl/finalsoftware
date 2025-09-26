import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardClient from "@/components/dashboards/DashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ClientDashboardPageProps {
  params: {
    clientId: string;
  };
}

export default async function ClientDashboardPage({ params }: ClientDashboardPageProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  if (session.user.role !== "creator") {
    redirect("/");
  }
  
  // Verify the clientId matches the current user's ID
  if (session.user.id !== params.clientId) {
    redirect("/");
  }
  
  return <DashboardClient />;
}
