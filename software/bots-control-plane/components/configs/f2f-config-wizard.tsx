"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Bot, 
  Users, 
  User, 
  Mail, 
  Shield, 
  Clock, 
  MessageSquare, 
  Heart, 
  Star,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  ArrowLeft,
  Copy,
  Eye,
  EyeOff
} from "lucide-react"
import { toast } from "sonner"

interface F2FConfigWizardProps {
  onSave: (config: any) => void
  onCancel: () => void
  initialConfig?: any
}

type BotType = "agency" | "creator"
type Step = "type" | "agency_setup" | "creator_setup" | "actions" | "schedule" | "review"

export function F2FConfigWizard({ onSave, onCancel, initialConfig }: F2FConfigWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>("type")
  const [botType, setBotType] = useState<BotType>("agency")
  const [showSensitiveData, setShowSensitiveData] = useState(false)
  
  // Agency Configuration
  const [agencyConfig, setAgencyConfig] = useState({
    accountEmail: "",
    accountPassword: "",
    inviteEmail: "",
    agencyName: "",
    maxInvites: 50,
    inviteMessage: "Hi! I'd like to invite you to join our exclusive community. Click here to accept: {invite_link}"
  })
  
  // Creator Configuration  
  const [creatorConfig, setCreatorConfig] = useState({
    accountEmail: "",
    cookies: "",
    profileUrl: "",
    bio: "",
    profilePicture: "",
    verificationStatus: "unverified"
  })
  
  // Bot Actions Configuration
  const [actionsConfig, setActionsConfig] = useState({
    massDm: {
      enabled: false,
      message: "Hey! Thanks for following me. Check out my exclusive content!",
      delay: 5,
      maxPerDay: 100
    },
    autoFollow: {
      enabled: false,
      targetKeywords: "",
      maxPerDay: 50
    },
    autoLike: {
      enabled: false,
      targetKeywords: "",
      maxPerDay: 200
    },
    autoComment: {
      enabled: false,
      comments: ["Nice post!", "Love this!", "Amazing content!"],
      maxPerDay: 30
    }
  })
  
  // Schedule Configuration
  const [scheduleConfig, setScheduleConfig] = useState({
    enabled: false,
    timezone: "UTC",
    workingHours: {
      start: "09:00",
      end: "21:00"
    },
    daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    breakTime: 30
  })

  const steps = [
    { id: "type", title: "Bot Type", description: "Choose your F2F bot type" },
    { id: "agency_setup", title: "Agency Setup", description: "Configure agency account" },
    { id: "creator_setup", title: "Creator Setup", description: "Configure creator account" },
    { id: "actions", title: "Bot Actions", description: "Set up automation actions" },
    { id: "schedule", title: "Schedule", description: "Configure bot schedule" },
    { id: "review", title: "Review", description: "Review and save configuration" }
  ]

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep)
  const canGoNext = () => {
    switch (currentStep) {
      case "type":
        return botType !== null
      case "agency_setup":
        return agencyConfig.accountEmail && agencyConfig.inviteEmail
      case "creator_setup":
        return creatorConfig.accountEmail && creatorConfig.cookies
      case "actions":
        return true // Optional step
      case "schedule":
        return true // Optional step
      case "review":
        return false
      default:
        return false
    }
  }

  const handleNext = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as Step)
    }
  }

  const handlePrevious = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as Step)
    }
  }

  const handleSave = () => {
    const config = {
      botType,
      ...(botType === "agency" ? agencyConfig : creatorConfig),
      actions: actionsConfig,
      schedule: scheduleConfig,
      platform: "f2f",
      createdAt: new Date().toISOString()
    }
    
    onSave(config)
    toast.success("F2F bot configuration saved successfully!")
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case "type":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Choose Your F2F Bot Type</h3>
              <p className="text-muted-foreground">Select the type of F2F bot you want to configure</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  botType === "agency" ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setBotType("agency")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Agency Bot
                  </CardTitle>
                  <CardDescription>
                    Manage multiple accounts and send invites
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="secondary">Invite System</Badge>
                    <Badge variant="secondary">Multi-Account</Badge>
                    <Badge variant="secondary">Agency Management</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Perfect for agencies managing multiple F2F accounts. 
                    Send invites to potential members automatically.
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  botType === "creator" ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setBotType("creator")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Creator Bot
                  </CardTitle>
                  <CardDescription>
                    Automate your personal F2F account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="secondary">Auto DM</Badge>
                    <Badge variant="secondary">Auto Follow</Badge>
                    <Badge variant="secondary">Auto Like</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Perfect for individual creators. Automate engagement 
                    and grow your F2F presence.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "agency_setup":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Agency Account Setup</h3>
              <p className="text-muted-foreground">Configure your F2F agency account</p>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                We'll use your existing F2F account to send invites. Make sure you have 
                invite permissions on your account.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountEmail">F2F Account Email</Label>
                <Input
                  id="accountEmail"
                  type="email"
                  placeholder="your-email@example.com"
                  value={agencyConfig.accountEmail}
                  onChange={(e) => setAgencyConfig(prev => ({ ...prev, accountEmail: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountPassword">F2F Account Password</Label>
                <div className="relative">
                  <Input
                    id="accountPassword"
                    type={showSensitiveData ? "text" : "password"}
                    placeholder="Enter your password"
                    value={agencyConfig.accountPassword}
                    onChange={(e) => setAgencyConfig(prev => ({ ...prev, accountPassword: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowSensitiveData(!showSensitiveData)}
                  >
                    {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Default Invite Email</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="invite@example.com"
                  value={agencyConfig.inviteEmail}
                  onChange={(e) => setAgencyConfig(prev => ({ ...prev, inviteEmail: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  This email will be used to send invites. You can change this per campaign.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agencyName">Agency Name</Label>
                <Input
                  id="agencyName"
                  placeholder="Your Agency Name"
                  value={agencyConfig.agencyName}
                  onChange={(e) => setAgencyConfig(prev => ({ ...prev, agencyName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxInvites">Max Invites Per Day</Label>
                <Input
                  id="maxInvites"
                  type="number"
                  min="1"
                  max="1000"
                  value={agencyConfig.maxInvites}
                  onChange={(e) => setAgencyConfig(prev => ({ ...prev, maxInvites: parseInt(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteMessage">Default Invite Message</Label>
                <Textarea
                  id="inviteMessage"
                  placeholder="Enter your invite message..."
                  value={agencyConfig.inviteMessage}
                  onChange={(e) => setAgencyConfig(prev => ({ ...prev, inviteMessage: e.target.value }))}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{invite_link}"} to insert the invite link automatically.
                </p>
              </div>
            </div>
          </div>
        )

      case "creator_setup":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Creator Account Setup</h3>
              <p className="text-muted-foreground">Configure your F2F creator account</p>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Secure Cookie Authentication:</strong> We use encrypted cookies for authentication. 
                Your credentials are never stored in plain text.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="creatorEmail">F2F Account Email</Label>
                <Input
                  id="creatorEmail"
                  type="email"
                  placeholder="your-email@example.com"
                  value={creatorConfig.accountEmail}
                  onChange={(e) => setCreatorConfig(prev => ({ ...prev, accountEmail: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cookies">Authentication Cookies</Label>
                <div className="space-y-2">
                  <Textarea
                    id="cookies"
                    placeholder="Paste your F2F cookies here..."
                    value={creatorConfig.cookies}
                    onChange={(e) => setCreatorConfig(prev => ({ ...prev, cookies: e.target.value }))}
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(creatorConfig.cookies)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSensitiveData(!showSensitiveData)}
                    >
                      {showSensitiveData ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                      {showSensitiveData ? "Hide" : "Show"}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get cookies by logging into F2F in your browser, then copy the cookies from Developer Tools.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileUrl">Profile URL</Label>
                <Input
                  id="profileUrl"
                  placeholder="https://f2f.com/your-username"
                  value={creatorConfig.profileUrl}
                  onChange={(e) => setCreatorConfig(prev => ({ ...prev, profileUrl: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio/Description</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about your content..."
                  value={creatorConfig.bio}
                  onChange={(e) => setCreatorConfig(prev => ({ ...prev, bio: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="verificationStatus">Verification Status</Label>
                <Select
                  value={creatorConfig.verificationStatus}
                  onValueChange={(value) => setCreatorConfig(prev => ({ ...prev, verificationStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unverified">Unverified</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case "actions":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Bot Actions Configuration</h3>
              <p className="text-muted-foreground">Configure what your bot should do automatically</p>
            </div>

            <div className="space-y-6">
              {/* Mass DM */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Mass Direct Messages
                    <Switch
                      checked={actionsConfig.massDm.enabled}
                      onCheckedChange={(checked) => 
                        setActionsConfig(prev => ({
                          ...prev,
                          massDm: { ...prev.massDm, enabled: checked }
                        }))
                      }
                    />
                  </CardTitle>
                </CardHeader>
                {actionsConfig.massDm.enabled && (
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Message Template</Label>
                      <Textarea
                        placeholder="Enter your DM message..."
                        value={actionsConfig.massDm.message}
                        onChange={(e) => setActionsConfig(prev => ({
                          ...prev,
                          massDm: { ...prev.massDm, message: e.target.value }
                        }))}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Delay Between Messages (seconds)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={actionsConfig.massDm.delay}
                          onChange={(e) => setActionsConfig(prev => ({
                            ...prev,
                            massDm: { ...prev.massDm, delay: parseInt(e.target.value) }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Messages Per Day</Label>
                        <Input
                          type="number"
                          min="1"
                          value={actionsConfig.massDm.maxPerDay}
                          onChange={(e) => setActionsConfig(prev => ({
                            ...prev,
                            massDm: { ...prev.massDm, maxPerDay: parseInt(e.target.value) }
                          }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Auto Follow */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Auto Follow
                    <Switch
                      checked={actionsConfig.autoFollow.enabled}
                      onCheckedChange={(checked) => 
                        setActionsConfig(prev => ({
                          ...prev,
                          autoFollow: { ...prev.autoFollow, enabled: checked }
                        }))
                      }
                    />
                  </CardTitle>
                </CardHeader>
                {actionsConfig.autoFollow.enabled && (
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Target Keywords</Label>
                      <Input
                        placeholder="Enter keywords to find users to follow..."
                        value={actionsConfig.autoFollow.targetKeywords}
                        onChange={(e) => setActionsConfig(prev => ({
                          ...prev,
                          autoFollow: { ...prev.autoFollow, targetKeywords: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Follows Per Day</Label>
                      <Input
                        type="number"
                        min="1"
                        value={actionsConfig.autoFollow.maxPerDay}
                        onChange={(e) => setActionsConfig(prev => ({
                          ...prev,
                          autoFollow: { ...prev.autoFollow, maxPerDay: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Auto Like */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Auto Like
                    <Switch
                      checked={actionsConfig.autoLike.enabled}
                      onCheckedChange={(checked) => 
                        setActionsConfig(prev => ({
                          ...prev,
                          autoLike: { ...prev.autoLike, enabled: checked }
                        }))
                      }
                    />
                  </CardTitle>
                </CardHeader>
                {actionsConfig.autoLike.enabled && (
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Target Keywords</Label>
                      <Input
                        placeholder="Enter keywords to find posts to like..."
                        value={actionsConfig.autoLike.targetKeywords}
                        onChange={(e) => setActionsConfig(prev => ({
                          ...prev,
                          autoLike: { ...prev.autoLike, targetKeywords: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Likes Per Day</Label>
                      <Input
                        type="number"
                        min="1"
                        value={actionsConfig.autoLike.maxPerDay}
                        onChange={(e) => setActionsConfig(prev => ({
                          ...prev,
                          autoLike: { ...prev.autoLike, maxPerDay: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Auto Comment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Auto Comment
                    <Switch
                      checked={actionsConfig.autoComment.enabled}
                      onCheckedChange={(checked) => 
                        setActionsConfig(prev => ({
                          ...prev,
                          autoComment: { ...prev.autoComment, enabled: checked }
                        }))
                      }
                    />
                  </CardTitle>
                </CardHeader>
                {actionsConfig.autoComment.enabled && (
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Comment Templates</Label>
                      <Textarea
                        placeholder="Enter comments (one per line)..."
                        value={actionsConfig.autoComment.comments.join('\n')}
                        onChange={(e) => setActionsConfig(prev => ({
                          ...prev,
                          autoComment: { 
                            ...prev.autoComment, 
                            comments: e.target.value.split('\n').filter(c => c.trim())
                          }
                        }))}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Comments Per Day</Label>
                      <Input
                        type="number"
                        min="1"
                        value={actionsConfig.autoComment.maxPerDay}
                        onChange={(e) => setActionsConfig(prev => ({
                          ...prev,
                          autoComment: { ...prev.autoComment, maxPerDay: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        )

      case "schedule":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Bot Schedule Configuration</h3>
              <p className="text-muted-foreground">Set when your bot should be active</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Schedule Settings
                  <Switch
                    checked={scheduleConfig.enabled}
                    onCheckedChange={(checked) => 
                      setScheduleConfig(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                </CardTitle>
              </CardHeader>
              {scheduleConfig.enabled && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Working Hours Start</Label>
                      <Input
                        type="time"
                        value={scheduleConfig.workingHours.start}
                        onChange={(e) => setScheduleConfig(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, start: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Working Hours End</Label>
                      <Input
                        type="time"
                        value={scheduleConfig.workingHours.end}
                        onChange={(e) => setScheduleConfig(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, end: e.target.value }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Days of Week</Label>
                    <div className="grid grid-cols-7 gap-2">
                      {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                        <Button
                          key={day}
                          variant={scheduleConfig.daysOfWeek.includes(day) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const newDays = scheduleConfig.daysOfWeek.includes(day)
                              ? scheduleConfig.daysOfWeek.filter(d => d !== day)
                              : [...scheduleConfig.daysOfWeek, day]
                            setScheduleConfig(prev => ({ ...prev, daysOfWeek: newDays }))
                          }}
                        >
                          {day.slice(0, 3)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Break Time Between Actions (minutes)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={scheduleConfig.breakTime}
                      onChange={(e) => setScheduleConfig(prev => ({ 
                        ...prev, 
                        breakTime: parseInt(e.target.value) 
                      }))}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )

      case "review":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Review Configuration</h3>
              <p className="text-muted-foreground">Review your F2F bot configuration before saving</p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bot Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="capitalize">
                    {botType} Bot
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {botType === "agency" ? (
                    <>
                      <p><strong>Email:</strong> {agencyConfig.accountEmail}</p>
                      <p><strong>Agency:</strong> {agencyConfig.agencyName}</p>
                      <p><strong>Max Invites/Day:</strong> {agencyConfig.maxInvites}</p>
                    </>
                  ) : (
                    <>
                      <p><strong>Email:</strong> {creatorConfig.accountEmail}</p>
                      <p><strong>Profile:</strong> {creatorConfig.profileUrl}</p>
                      <p><strong>Status:</strong> {creatorConfig.verificationStatus}</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enabled Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {actionsConfig.massDm.enabled && <Badge>Mass DM</Badge>}
                    {actionsConfig.autoFollow.enabled && <Badge>Auto Follow</Badge>}
                    {actionsConfig.autoLike.enabled && <Badge>Auto Like</Badge>}
                    {actionsConfig.autoComment.enabled && <Badge>Auto Comment</Badge>}
                    {!Object.values(actionsConfig).some(action => action.enabled) && (
                      <Badge variant="outline">No actions enabled</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  {scheduleConfig.enabled ? (
                    <div className="space-y-1">
                      <p><strong>Hours:</strong> {scheduleConfig.workingHours.start} - {scheduleConfig.workingHours.end}</p>
                      <p><strong>Days:</strong> {scheduleConfig.daysOfWeek.join(", ")}</p>
                      <p><strong>Break Time:</strong> {scheduleConfig.breakTime} minutes</p>
                    </div>
                  ) : (
                    <Badge variant="outline">24/7 Operation</Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              getCurrentStepIndex() >= index 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            }`}>
              {getCurrentStepIndex() > index ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <div className="ml-2 hidden md:block">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            {index < steps.length - 1 && (
              <div className="w-8 h-px bg-border mx-4" />
            )}
          </div>
        ))}
      </div>

      <Separator />

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === "type" ? onCancel : handlePrevious}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === "type" ? "Cancel" : "Previous"}
        </Button>

        {currentStep === "review" ? (
          <Button onClick={handleSave}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        ) : (
          <Button 
            onClick={handleNext}
            disabled={!canGoNext()}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
