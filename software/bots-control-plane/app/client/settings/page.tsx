"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { SecretsTab } from "@/components/settings/secrets-tab"
import { RoleSwitcher } from "@/components/role-switcher"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"

const timezones = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles", 
  "Europe/London",
  "Europe/Paris",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
]

export default function SettingsPage() {
  const { user, updateUser } = useUser()
  const { toast } = useToast()
  const [orgName, setOrgName] = useState("My Organization")
  const [timezone, setTimezone] = useState("UTC")
  const [emailNotifications, setEmailNotifications] = useState(true)

  // Load user's current timezone
  useEffect(() => {
    if (user?.timezone) {
      setTimezone(user.timezone)
    }
  }, [user])

  const handleSaveGeneral = async () => {
    if (!user) return

    try {
      await updateUser({
        timezone
      })
      
      // Save to localStorage for persistence
      localStorage.setItem('orgName', orgName)
      localStorage.setItem('timezone', timezone)
      
      toast({
        title: "Settings saved",
        description: "Your general settings have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleSaveNotifications = async () => {
    try {
      // Save to localStorage for persistence
      localStorage.setItem('emailNotifications', emailNotifications.toString())
      
      toast({
        title: "Notifications saved",
        description: "Your notification preferences have been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings. Please try again.",
        variant: "destructive"
      })
    }
  }

  const isAdmin = user?.role === "admin"

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Settings" 
        description="Configure your organization and application preferences" 
      />

      {/* Timezone Notice */}
      <div className="bg-muted p-3 rounded-lg">
        <p className="text-sm text-muted-foreground">
          All times displayed in the application are shown in <strong>{timezone}</strong>
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          {isAdmin && <TabsTrigger value="secrets">Secrets</TabsTrigger>}
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic organization and system preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Enter organization name"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="secrets">
            <SecretsTab />
          </TabsContent>
        )}

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email about bot status, errors, and updates
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}