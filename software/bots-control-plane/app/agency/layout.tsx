import "server-only";
import Link from "next/link";

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 border-r p-4 space-y-2 bg-sidebar-background">
        <div className="font-semibold text-lg mb-4">Agency</div>
        <nav className="flex flex-col gap-1">
          <Link href="/agency" className="p-2 rounded hover:bg-sidebar-accent">Dashboard</Link>
          <Link href="/agency/subscriptions" className="p-2 rounded hover:bg-sidebar-accent">Subscriptions</Link>
          <Link href="/agency/bots" className="p-2 rounded hover:bg-sidebar-accent">Bots</Link>
          <Link href="/agency/phases" className="p-2 rounded hover:bg-sidebar-accent">Phases</Link>
          <Link href="/agency/schedule" className="p-2 rounded hover:bg-sidebar-accent">Schedule</Link>
          <Link href="/agency/monitoring" className="p-2 rounded hover:bg-sidebar-accent">Monitoring</Link>
          <Link href="/agency/analytics" className="p-2 rounded hover:bg-sidebar-accent">Analytics</Link>
          <Link href="/agency/settings" className="p-2 rounded hover:bg-sidebar-accent">Settings</Link>
          <Link href="/agency/affiliate" className="p-2 rounded hover:bg-sidebar-accent">Affiliate</Link>
        </nav>
      </aside>
      <div className="flex-1 bg-background min-h-screen">{children}</div>
    </div>
  );
}
