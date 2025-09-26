"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, User, Settings, Eye, EyeOff } from "lucide-react"
import { useUser } from "@/contexts/user-context"

export function RoleSwitcher() {
  const { user, isAdmin, updateUser } = useUser()

  const switchToAdmin = () => {
    updateUser({
      id: "admin-1",
      email: "admin@botscontrol.com",
      name: "Admin User",
      role: "admin",
      subscription: {
        plan: "enterprise",
        features: ["all_bots", "all_platforms", "monitoring", "analytics", "subscription_management"],
        maxBots: 1000,
        maxConfigs: 5000,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }
    })
  }

  const switchToClient = () => {
    updateUser({
      id: "client-1", 
      email: "client@example.com",
      name: "Client User",
      role: "user",
      subscription: {
        plan: "premium",
        features: ["f2f_agency", "f2f_creator", "fanvue_posting"],
        maxBots: 5,
        maxConfigs: 25,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Role Switcher
        </CardTitle>
        <CardDescription>
          Switch between admin and client views for testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Role:</span>
          <Badge variant={isAdmin ? "default" : "secondary"}>
            {isAdmin ? (
              <>
                <Crown className="h-3 w-3 mr-1" />
                Admin
              </>
            ) : (
              <>
                <User className="h-3 w-3 mr-1" />
                Client
              </>
            )}
          </Badge>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={switchToAdmin}
            variant={isAdmin ? "default" : "outline"}
            className="w-full justify-start"
          >
            <Crown className="h-4 w-4 mr-2" />
            Switch to Admin
            <Badge variant="secondary" className="ml-auto">
              Enterprise
            </Badge>
          </Button>
          
          <Button 
            onClick={switchToClient}
            variant={!isAdmin ? "default" : "outline"}
            className="w-full justify-start"
          >
            <User className="h-4 w-4 mr-2" />
            Switch to Client
            <Badge variant="secondary" className="ml-auto">
              Premium
            </Badge>
          </Button>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <Eye className="h-3 w-3" />
              <span>Admin: Full access to all features</span>
            </div>
            <div className="flex items-center gap-2">
              <EyeOff className="h-3 w-3" />
              <span>Client: Limited access (no monitoring/analytics)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
