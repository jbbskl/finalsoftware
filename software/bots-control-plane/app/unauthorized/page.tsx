"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, ArrowLeft, Home, LogOut } from "lucide-react"
import { UserProvider, useUser } from "@/contexts/user-context"

function UnauthorizedContent() {
  const router = useRouter()
  const { user, logout } = useUser()

  const handleGoHome = () => {
    router.push("/")
  }

  const handleGoBack = () => {
    router.back()
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your account ({user?.role}) doesn't have the required permissions 
                to access this resource.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button onClick={handleGoHome} className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
              
              <Button onClick={handleGoBack} variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              
              <Button onClick={handleLogout} variant="outline" className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>

            <div className="pt-4 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Need access? Contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function UnauthorizedPage() {
  return (
    <UserProvider>
      <UnauthorizedContent />
    </UserProvider>
  )
}
