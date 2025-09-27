"use client"

import type React from "react"
import { NavSidebar } from "@/components/nav-sidebar"
import { Topbar } from "@/components/topbar"
import { QueryProvider } from "@/components/query-provider"
import { UserProvider } from "@/contexts/user-context"
import { AuthGuard } from "@/components/auth-guard"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      <QueryProvider>
        <AuthGuard allowedRoles={["user"]} allowedUserTypes={["creator"]}>
          <div className="flex h-screen bg-background">
            <NavSidebar />
            <div className="flex flex-1 flex-col overflow-hidden bg-background">
              <Topbar />
              <main className="flex-1 overflow-auto p-6 bg-background">
                <div className="mb-4">
                  <h1 className="text-2xl font-bold text-blue-600">Creator Dashboard</h1>
                  <p className="text-muted-foreground">Manage your content creation bots</p>
                </div>
                {children}
              </main>
            </div>
          </div>
        </AuthGuard>
      </QueryProvider>
    </UserProvider>
  )
}
