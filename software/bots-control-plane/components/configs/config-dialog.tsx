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
import { PlatformSelector } from "./platform-selector"
import { F2FConfigWizard } from "./f2f-config-wizard"

interface ConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config?: BotConfig
  onSave: (config: Partial<BotConfig>) => void
  mode: "create" | "edit" | "duplicate"
}

export function ConfigDialog({ open, onOpenChange, config, onSave, mode }: ConfigDialogProps) {
  const [name, setName] = useState("")
  const [botId, setBotId] = useState("")
  const [configJson, setConfigJson] = useState("{}")
  const [isDefault, setIsDefault] = useState(false)
  const [jsonError, setJsonError] = useState("")
  const [configMode, setConfigMode] = useState<"wizard" | "json">("wizard")
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [wizardConfig, setWizardConfig] = useState<any>(null)

  const { data: bots = [] } = useQuery({
    queryKey: ["bots"],
    queryFn: () => getBots(),
  })

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
    }
    setJsonError("")
  }, [config, mode, open])

  const validateJson = (json: string) => {
    try {
      JSON.parse(json)
      setJsonError("")
      return true
    } catch (error) {
      setJsonError("Invalid JSON format")
      return false
    }
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(configJson)
      setConfigJson(JSON.stringify(parsed, null, 2))
      setJsonError("")
      toast.success("JSON formatted successfully")
    } catch (error) {
      toast.error("Invalid JSON - cannot format")
    }
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Configuration name is required")
      return
    }
    if (!botId) {
      toast.error("Please select a bot")
      return
    }
    if (!validateJson(configJson)) {
      toast.error("Please fix JSON errors before saving")
      return
    }

    const selectedBot = bots.find((b) => b.id === botId)
    onSave({
      name: name.trim(),
      bot_id: botId,
      bot_name: selectedBot?.name || "",
      config_data: JSON.parse(configJson),
      is_default: isDefault,
    })
    onOpenChange(false)
  }

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Create Configuration"
      case "edit":
        return "Edit Configuration"
      case "duplicate":
        return "Duplicate Configuration"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {mode === "create" && "Create a new configuration for your bots."}
            {mode === "edit" && "Edit the selected configuration."}
            {mode === "duplicate" && "Create a copy of the selected configuration."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
              placeholder='{"key": "value"}'
              rows={8}
              className="font-mono text-sm"
            />
            {jsonError && <p className="text-sm text-destructive mt-1">{jsonError}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="is-default" checked={isDefault} onCheckedChange={setIsDefault} />
            <Label htmlFor="is-default">Set as default configuration</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{mode === "create" ? "Create" : mode === "edit" ? "Save" : "Duplicate"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
