import "server-only";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 border-r p-4 space-y-2 bg-sidebar-background">
        <div className="font-semibold text-lg mb-4">Admin</div>
        <nav className="flex flex-col gap-1">
          <Link href="/admin" className="p-2 rounded hover:bg-sidebar-accent">Dashboard</Link>
          <Link href="/admin/subscriptions" className="p-2 rounded hover:bg-sidebar-accent">Subscriptions</Link>
          <Link href="/admin/bots" className="p-2 rounded hover:bg-sidebar-accent">Bots</Link>
          <Link href="/admin/phases" className="p-2 rounded hover:bg-sidebar-accent">Phases</Link>
          <Link href="/admin/schedule" className="p-2 rounded hover:bg-sidebar-accent">Schedule</Link>
          <Link href="/admin/monitoring" className="p-2 rounded hover:bg-sidebar-accent">Monitoring</Link>
          <Link href="/admin/analytics" className="p-2 rounded hover:bg-sidebar-accent">Analytics</Link>
          <Link href="/admin/settings" className="p-2 rounded hover:bg-sidebar-accent">Settings</Link>
          <Link href="/admin/affiliate" className="p-2 rounded hover:bg-sidebar-accent">Affiliate</Link>
        </nav>
      </aside>
      <div className="flex-1 bg-background min-h-screen">{children}</div>
    </div>
  );
}
