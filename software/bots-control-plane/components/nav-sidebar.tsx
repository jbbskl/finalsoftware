"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  CreditCard,
  Bot,
  Settings2,
  Calendar,
  Activity,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  Cookie,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useUser } from "@/contexts/user-context"

const adminNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { name: "Bots", href: "/bots", icon: Bot },
  { name: "Phases", href: "/configs", icon: Settings2 },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Monitoring", href: "/monitoring", icon: Activity },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
]

const clientNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { name: "Affiliate", href: "/affiliate", icon: Users },
  { name: "Bots", href: "/bots", icon: Bot },
  { name: "Phases", href: "/configs", icon: Settings2 },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Cookies", href: "/cookies", icon: Cookie },
]

interface NavSidebarProps {
  className?: string
}

export function NavSidebar({ className }: NavSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useUser()
  const isAdmin = user?.role === "admin"
  
  const navigation = isAdmin ? adminNavigation : clientNavigation

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && <h1 className="text-lg font-semibold text-sidebar-foreground">Bots Control</h1>}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 text-sidebar-foreground",
                    collapsed && "justify-center px-2",
                    isActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90",
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
    </div>
  )
}
