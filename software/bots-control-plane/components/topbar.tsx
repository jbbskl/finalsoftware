"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, Search, LogOut, Palette, Crown, Settings, CreditCard } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { useRouter } from "next/navigation"

export function Topbar() {
  const { user, logout } = useUser()
  const router = useRouter()
  const isAdmin = user?.role === "admin"
  
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold">Bots Control Plane</h2>
        <Badge variant="secondary" className="text-xs">
          {isAdmin ? "Admin" : "Client"}
        </Badge>
        {user && (
          <Badge variant="outline" className="text-xs">
            <Crown className="h-3 w-3 mr-1" />
            {user.subscription.plan.toUpperCase()}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="w-64 pl-9" />
        </div>

        {/* Quick Theme Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Palette className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => document.documentElement.className = ""}>
              Dark Admin
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => document.documentElement.className = "theme-blue"}>
              Deep Blue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => document.documentElement.className = "theme-teal"}>
              Modern Teal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => document.documentElement.className = "theme-purple"}>
              Vibrant Purple
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => document.documentElement.className = "theme-ocean"}>
              Ocean Blue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => document.documentElement.className = "theme-emerald"}>
              Emerald Green
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => document.documentElement.className = "theme-sunset"}>
              Sunset Orange
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="profile-menu">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'user@example.com'}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {isAdmin ? 'Admin' : 'Client'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {user?.subscription.plan.toUpperCase() || 'FREE'}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/subscriptions#billing')} data-testid="menu-payments">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Payments</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')} data-testid="menu-settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} data-testid="menu-logout">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
