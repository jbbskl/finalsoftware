import "server-only";
import Link from "next/link";

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r p-4 space-y-2 bg-muted/50">
        <div className="font-semibold text-lg mb-4">Creator</div>
        <nav className="flex flex-col gap-1">
          <Link href="/creator" className="p-2 rounded hover:bg-muted">Dashboard</Link>
          <Link href="/creator/subscriptions" className="p-2 rounded hover:bg-muted">Subscriptions</Link>
          <Link href="/creator/bots" className="p-2 rounded hover:bg-muted">Bots</Link>
          <Link href="/creator/phases" className="p-2 rounded hover:bg-muted">Phases</Link>
          <Link href="/creator/schedule" className="p-2 rounded hover:bg-muted">Schedule</Link>
          <Link href="/creator/monitoring" className="p-2 rounded hover:bg-muted">Monitoring</Link>
          <Link href="/creator/analytics" className="p-2 rounded hover:bg-muted">Analytics</Link>
          <Link href="/creator/settings" className="p-2 rounded hover:bg-muted">Settings</Link>
          <Link href="/creator/affiliate" className="p-2 rounded hover:bg-muted">Affiliate</Link>
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
