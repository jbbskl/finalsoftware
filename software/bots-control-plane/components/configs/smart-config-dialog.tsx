"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { BotConfig } from "@/lib/types"
import { useQuery } from "@tanstack/react-query"
import { getBots } from "@/lib/api"
import { toast } from "sonner"
import { useUser } from "@/contexts/user-context"
import { PlatformSelector } from "./platform-selector"
import { F2FConfigWizard } from "./f2f-config-wizard"
import { BotSelector } from "./bot-selector"
import { ArrowLeft, Settings, Wand2, Bot } from "lucide-react"

interface SmartConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config?: BotConfig
  onSave: (config: Partial<BotConfig>) => void
  mode: "create" | "edit" | "duplicate"
}

export function SmartConfigDialog({ open, onOpenChange, config, onSave, mode }: SmartConfigDialogProps) {
  const [name, setName] = useState("")
  const [botId, setBotId] = useState("")
  const [configJson, setConfigJson] = useState("{}")
  const [isDefault, setIsDefault] = useState(false)
  const [jsonError, setJsonError] = useState("")
  const [configMode, setConfigMode] = useState<"wizard" | "json">("wizard")
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [selectedBot, setSelectedBot] = useState<any>(null)
  const [wizardConfig, setWizardConfig] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState<"bot" | "platform" | "config">("bot")

  const { data: bots = [] } = useQuery({
    queryKey: ["bots"],
    queryFn: () => getBots(),
  })

  const { user } = useUser()
  const userSubscription = user?.subscription ? {
    plan: user.subscription.plan === "free" ? "premium" : user.subscription.plan as "premium" | "enterprise",
    features: user.subscription.features || [],
    maxBots: user.subscription.maxBots || 1
  } : {
    plan: "premium" as const,
    features: [],
    maxBots: 1
  }

  useEffect(() => {
    if (config && (mode === "edit" || mode === "duplicate")) {
      setName(mode === "duplicate" ? `${config.name} (Copy)` : config.name)
      setBotId(config.bot_id)
      setConfigJson(JSON.stringify(config.config_data, null, 2))
      setIsDefault(mode === "duplicate" ? false : config.is_default)
    } else {
      setName("")
      setBotId("")
      setConfigJson("{}")
      setIsDefault(false)
      setJsonError("")
      setSelectedPlatform(null)
      setSelectedBot(null)
      setWizardConfig(null)
      setCurrentStep("bot")
    }
  }, [config, mode, open])

  const validateJson = (jsonString: string) => {
    try {
      JSON.parse(jsonString)
      setJsonError("")
    } catch (error) {
      setJsonError("Invalid JSON format")
    }
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(configJson)
      setConfigJson(JSON.stringify(parsed, null, 2))
      setJsonError("")
    } catch (error) {
      setJsonError("Cannot format invalid JSON")
    }
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a configuration name")
      return
    }

    if (!botId) {
      toast.error("Please select a bot")
      return
    }

    try {
      const parsedConfig = JSON.parse(configJson)
      onSave({
        name: name.trim(),
        bot_id: botId,
        config_data: parsedConfig,
        is_default: isDefault,
        description: `Configuration for ${bots.find(b => b.id === botId)?.name || "selected bot"}`,
        tags: [selectedPlatform || "custom"],
        environment: "production"
      })
      onOpenChange(false)
    } catch (error) {
      setJsonError("Invalid JSON format")
      toast.error("Please fix the JSON configuration")
    }
  }

  const handleWizardSave = (wizardData: any) => {
    setWizardConfig(wizardData)
    setName(`${wizardData.botType} ${wizardData.platform?.toUpperCase()} Bot`)
    setConfigJson(JSON.stringify(wizardData, null, 2))
    setConfigMode("json") // Switch to JSON tab to show the result
    toast.success("Configuration generated! Review and save.")
  }

  const getTitle = () => {
    switch (mode) {
      case "create": return "Create Bot Phase"
      case "edit": return "Edit Phase"
      case "duplicate": return "Duplicate Phase"
      default: return "Phase"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] max-h-[98vh] h-[98vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {configMode === "wizard" ? <Wand2 className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Create a new bot configuration using our smart wizard or JSON editor."
              : mode === "edit" 
              ? "Modify the existing bot configuration."
              : "Create a copy of this configuration with a new name."
            }
          </DialogDescription>
        </DialogHeader>

        {mode === "create" ? (
          <div className="space-y-6 overflow-y-auto max-h-[calc(98vh-200px)]">
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                currentStep === "bot" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <Bot className="h-4 w-4" />
                Choose Bot
              </div>
              <div className="w-8 h-px bg-border" />
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                currentStep === "platform" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <Wand2 className="h-4 w-4" />
                Configure
              </div>
              <div className="w-8 h-px bg-border" />
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                currentStep === "config" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <Settings className="h-4 w-4" />
                Review
              </div>
            </div>

            {/* Step Content */}
            {currentStep === "bot" && (
              <BotSelector
                onSelect={(bot) => {
                  setSelectedBot(bot)
                  setBotId(bot.id)
                  setCurrentStep("platform")
                }}
                onCancel={() => onOpenChange(false)}
                userSubscription={userSubscription}
                userType={user?.userType || "creator"}
              />
            )}

            {currentStep === "platform" && selectedBot && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep("bot")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Bot Selection
                  </Button>
                  <div className="h-4 w-px bg-border" />
                  <span className="text-sm text-muted-foreground">
                    Configuring {selectedBot.name}
                  </span>
                </div>

                {selectedBot.platform === "F2F" ? (
                  <F2FConfigWizard
                    onSave={(config) => {
                      handleWizardSave(config)
                      setCurrentStep("config")
                    }}
                    onCancel={() => setCurrentStep("bot")}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Settings className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {selectedBot.platform} Configuration
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Configuration wizard for {selectedBot.platform} is coming soon!
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => setCurrentStep("bot")}
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Bot Selection
                      </Button>
                      <Button 
                        onClick={() => setCurrentStep("config")}
                      >
                        Use JSON Editor
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === "config" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep("platform")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Configuration
                  </Button>
                  <div className="h-4 w-px bg-border" />
                  <span className="text-sm text-muted-foreground">
                    Review Configuration
                  </span>
                </div>

                <Tabs value={configMode} onValueChange={(value) => setConfigMode(value as "wizard" | "json")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="wizard" className="flex items-center gap-2">
                      <Wand2 className="h-4 w-4" />
                      Smart Wizard
                    </TabsTrigger>
                    <TabsTrigger value="json" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      JSON Editor
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="wizard" className="space-y-4">
                    <div className="text-center py-8">
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Wand2 className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        Configuration Generated!
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Your {selectedBot?.name} configuration has been created. 
                        Switch to JSON Editor to review or make changes.
                      </p>
                      <Button onClick={() => setConfigMode("json")}>
                        Review Configuration
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="json" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="config-name">Configuration Name</Label>
                  <Input
                    id="config-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Configuration"
                  />
                </div>

                <div>
                  <Label htmlFor="config-bot">Bot</Label>
                  <Select value={botId} onValueChange={setBotId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a bot" />
                    </SelectTrigger>
                    <SelectContent>
                      {bots.map((bot) => (
                        <SelectItem key={bot.id} value={bot.id}>
                          <div className="flex items-center gap-2">
                            <span>🤖</span>
                            <span>{bot.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="config-json">Configuration JSON</Label>
                  <Button variant="outline" size="sm" onClick={formatJson}>
                    Format JSON
                  </Button>
                </div>
                <Textarea
                  id="config-json"
                  value={configJson}
                  onChange={(e) => {
                    setConfigJson(e.target.value)
                    validateJson(e.target.value)
                  }}
                  placeholder="Enter configuration JSON..."
                  className="min-h-[300px] font-mono text-sm"
                />
                {jsonError && (
                  <p className="text-sm text-red-500 mt-1">{jsonError}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="config-default"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
                <Label htmlFor="config-default">Set as default configuration</Label>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="config-name">Configuration Name</Label>
                <Input
                  id="config-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Configuration"
                />
              </div>

              <div>
                <Label htmlFor="config-bot">Bot</Label>
                <Select value={botId} onValueChange={setBotId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bot" />
                  </SelectTrigger>
                  <SelectContent>
                    {bots.map((bot) => (
                      <SelectItem key={bot.id} value={bot.id}>
                        <div className="flex items-center gap-2">
                          <span>🤖</span>
                          <span>{bot.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="config-json">Configuration JSON</Label>
                <Button variant="outline" size="sm" onClick={formatJson}>
                  Format JSON
                </Button>
              </div>
              <Textarea
                id="config-json"
                value={configJson}
                onChange={(e) => {
                  setConfigJson(e.target.value)
                  validateJson(e.target.value)
                }}
                placeholder="Enter configuration JSON..."
                className="min-h-[300px] font-mono text-sm"
              />
              {jsonError && (
                <p className="text-sm text-red-500 mt-1">{jsonError}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="config-default"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
              <Label htmlFor="config-default">Set as default configuration</Label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!!jsonError}>
            {mode === "create" ? "Create Configuration" : mode === "edit" ? "Save Changes" : "Duplicate Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
