"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  allowedRoles?: ("admin" | "user")[]
  allowedUserTypes?: ("admin" | "creator" | "agency")[]
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  allowedRoles = ["admin", "user"],
  allowedUserTypes = ["admin", "creator", "agency"]
}: AuthGuardProps) {
  const { user, loading, isAdmin, isClient } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (requireAuth && !user) {
      router.push("/login")
      return
    }

    if (user) {
      // Check role permission
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        router.push("/unauthorized")
        return
      }

      // Check user type permission
      if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(user.userType)) {
        router.push("/unauthorized")
        return
      }
    }
  }, [user, loading, requireAuth, allowedRoles, allowedUserTypes, router])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (requireAuth && !user) {
    return <LoadingSkeleton />
  }

  if (user) {
    // Check role permission
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return <LoadingSkeleton />
    }

    // Check user type permission
    if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(user.userType)) {
      return <LoadingSkeleton />
    }
  }

  return <>{children}</>
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

