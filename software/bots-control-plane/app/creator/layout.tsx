import "server-only";
import Link from "next/link";

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 border-r border-border bg-sidebar text-sidebar-foreground flex-shrink-0">
        <div className="p-4 border-b border-sidebar-border">
          <div className="font-semibold text-lg text-sidebar-foreground">Creator</div>
        </div>
        <nav className="p-4 space-y-1">
          <Link href="/creator" className="block p-2 rounded hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">Dashboard</Link>
          <Link href="/creator/subscriptions" className="block p-2 rounded hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">Subscriptions</Link>
          <Link href="/creator/bots" className="block p-2 rounded hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">Bots</Link>
          <Link href="/creator/phases" className="block p-2 rounded hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">Phases</Link>
          <Link href="/creator/schedule" className="block p-2 rounded hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">Schedule</Link>
          <Link href="/creator/monitoring" className="block p-2 rounded hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">Monitoring</Link>
          <Link href="/creator/analytics" className="block p-2 rounded hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">Analytics</Link>
          <Link href="/creator/settings" className="block p-2 rounded hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">Settings</Link>
          <Link href="/creator/affiliate" className="block p-2 rounded hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">Affiliate</Link>
        </nav>
      </aside>
      <div className="flex-1 min-w-0 bg-background">
        <div className="h-full overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
