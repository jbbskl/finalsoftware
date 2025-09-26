"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mail, Send, CheckCircle, AlertTriangle, Clock } from "lucide-react"
import { toast } from "sonner"

export function EmailNotifications() {
  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    email: "admin@example.com",
    notifyOnFailure: true,
    notifyOnSuccess: false,
    notifyOnSchedule: true,
    dailyDigest: true
  })

  const [isSending, setIsSending] = useState(false)

  const handleSendTestEmail = async () => {
    setIsSending(true)
    try {
      // Simulate sending test email
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success("Test email sent successfully!")
    } catch (error) {
      toast.error("Failed to send test email")
    } finally {
      setIsSending(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      // Simulate saving settings
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success("Email settings saved!")
    } catch (error) {
      toast.error("Failed to save settings")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Configure email notifications for bot activities and system alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Address */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={emailSettings.email}
            onChange={(e) => setEmailSettings({ ...emailSettings, email: e.target.value })}
            placeholder="admin@example.com"
          />
        </div>

        <Separator />

        {/* Notification Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">Notification Types</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Bot Failures</span>
              </div>
              <Switch
                checked={emailSettings.notifyOnFailure}
                onCheckedChange={(checked) => 
                  setEmailSettings({ ...emailSettings, notifyOnFailure: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Bot Success</span>
              </div>
              <Switch
                checked={emailSettings.notifyOnSuccess}
                onCheckedChange={(checked) => 
                  setEmailSettings({ ...emailSettings, notifyOnSuccess: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Scheduled Runs</span>
              </div>
              <Switch
                checked={emailSettings.notifyOnSchedule}
                onCheckedChange={(checked) => 
                  setEmailSettings({ ...emailSettings, notifyOnSchedule: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Daily Digest</span>
              </div>
              <Switch
                checked={emailSettings.dailyDigest}
                onCheckedChange={(checked) => 
                  setEmailSettings({ ...emailSettings, dailyDigest: checked })
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Status and Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Email Status</span>
            <Badge variant={emailSettings.enabled ? "default" : "secondary"}>
              {emailSettings.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSendTestEmail}
              disabled={isSending}
              variant="outline"
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? "Sending..." : "Send Test Email"}
            </Button>
            
            <Button 
              onClick={handleSaveSettings}
              size="sm"
            >
              Save Settings
            </Button>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Recent Notifications</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
              <span>Bot failure alert sent</span>
              <span className="text-muted-foreground">2 min ago</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
              <span>Daily digest sent</span>
              <span className="text-muted-foreground">1 hour ago</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
              <span>Scheduled run notification</span>
              <span className="text-muted-foreground">3 hours ago</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}