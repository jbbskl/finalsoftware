"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  ArrowRight,
  Settings,
  Users,
  BarChart3
} from "lucide-react"
import { UserProvider, useUser } from "@/contexts/user-context"
import { toast } from "sonner"

function AdminLoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const { login } = useUser()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const success = await login(email, password)
      
      if (success) {
        toast.success("Welcome back, Administrator!")
        router.push("/")
      } else {
        setError("Invalid admin credentials")
        toast.error("Access denied")
      }
    } catch (err) {
      setError("Login failed. Please try again.")
      toast.error("Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = () => {
    setEmail("admin@botscontrol.com")
    setPassword("admin123")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-destructive rounded-lg">
              <Shield className="h-8 w-8 text-destructive-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Admin Portal</h1>
          </div>
          <p className="text-muted-foreground">
            System administrator access only
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Administrator Sign In</CardTitle>
            <CardDescription>
              Access the system administration dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@botscontrol.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In as Admin"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            {/* Demo Admin */}
            <div className="mt-6 space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Demo Access
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleDemoLogin}
                disabled={isLoading}
              >
                <Shield className="mr-2 h-4 w-4 text-red-500" />
                Demo Admin Access
                <Badge variant="destructive" className="ml-auto text-xs">
                  ADMIN
                </Badge>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Admin Features */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold">Admin Capabilities:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  User Management
                </div>
                <div className="flex items-center gap-1">
                  <Settings className="h-3 w-3" />
                  System Settings
                </div>
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  Full Analytics
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  All Access
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <UserProvider>
      <AdminLoginForm />
    </UserProvider>
  )
}
