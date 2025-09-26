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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Schedule, Bot, BotConfig } from "@/lib/types"
import { getBots, getConfigs } from "@/lib/api"
import { Clock } from "lucide-react"

interface ScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule?: Schedule
  onSave: (schedule: Partial<Schedule>) => void
  mode: "create" | "edit"
}

// Mock cronstrue function since we can't import it
const describeCron = (cron: string): string => {
  const patterns: Record<string, string> = {
    "0 */6 * * *": "Every 6 hours",
    "*/15 * * * *": "Every 15 minutes",
    "0 9 * * 1-5": "At 9:00 AM, Monday through Friday",
    "0 0 * * *": "Daily at midnight",
    "0 12 * * *": "Daily at noon",
    "0 0 * * 0": "Weekly on Sunday at midnight",
  }
  return patterns[cron] || "Custom schedule"
}

const computeNextFireTimes = (cron: string, timezone: string): string[] => {
  // Mock implementation - in real app would use a cron library
  const now = new Date()
  const times: string[] = []

  for (let i = 0; i < 5; i++) {
    const nextTime = new Date(now.getTime() + (i + 1) * 6 * 60 * 60 * 1000) // Mock: every 6 hours
    times.push(nextTime.toISOString())
  }

  return times
}

const timezones = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
]

export function ScheduleDialog({ open, onOpenChange, schedule, onSave, mode }: ScheduleDialogProps) {
  const [botId, setBotId] = useState("")
  const [configId, setConfigId] = useState("")
  const [cron, setCron] = useState("")
  const [timezone, setTimezone] = useState("UTC")
  const [active, setActive] = useState(true)
  const [phases, setPhases] = useState("{}")
  const [jsonError, setJsonError] = useState("")
  const [bots, setBots] = useState<Bot[]>([])
  const [allConfigs, setAllConfigs] = useState<BotConfig[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [botsData, configsData] = await Promise.all([getBots(), getConfigs()])
        setBots(botsData)
        setAllConfigs(configsData)
      } catch (error) {
        console.log("[v0] Error fetching data:", error)
      }
    }
    if (open) {
      fetchData()
    }
  }, [open])

  // Filter configs by selected bot
  const configs = allConfigs.filter((config) => !botId || config.bot_id === botId)

  useEffect(() => {
    if (schedule && mode === "edit") {
      setBotId(schedule.bot_id)
      setConfigId(schedule.config_id || "")
      setCron(schedule.cron_expr)
      setTimezone(schedule.timezone)
      setActive(schedule.is_active)
      setPhases("{}") // TODO: Add phases to Schedule type
    } else {
      setBotId("")
      setConfigId("")
      setCron("")
      setTimezone("UTC")
      setActive(true)
      setPhases("{}")
    }
    setJsonError("")
  }, [schedule, mode, open])

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

  const handleSave = () => {
    if (!botId) {
      console.log("[v0] Please select a bot")
      return
    }
    if (!configId) {
      console.log("[v0] Please select a configuration")
      return
    }
    if (!cron.trim()) {
      console.log("[v0] Please enter a cron expression")
      return
    }
    if (!validateJson(phases)) {
      console.log("[v0] Please fix JSON errors before saving")
      return
    }

    const selectedBot = bots.find((b) => b.id === botId)
    const selectedConfig = configs.find((c) => c.id === configId)

    onSave({
      id: schedule?.id || "",
      bot_id: botId,
      config_id: configId,
      name: `${selectedBot?.name || "Bot"} - ${selectedConfig?.name || "Config"}`,
      cron_expr: cron.trim(),
      timezone,
      is_active: active,
      next_fire_at: computeNextFireTimes(cron.trim(), timezone)[0],
    })
    onOpenChange(false)
  }

  const nextFireTimes = cron.trim() ? computeNextFireTimes(cron.trim(), timezone) : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Schedule" : "Edit Schedule"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Schedule a bot to run automatically." : "Edit the selected schedule."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="schedule-bot">Bot</Label>
              <Select
                value={botId}
                onValueChange={(value) => {
                  setBotId(value)
                  setConfigId("") // Reset config when bot changes
                }}
              >
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
              <Label htmlFor="schedule-config">Configuration</Label>
              <Select value={configId} onValueChange={setConfigId} disabled={!botId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a configuration" />
                </SelectTrigger>
                <SelectContent>
                  {configs.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name}
                      {config.is_default && " (Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="schedule-cron">Cron Expression</Label>
              <Input
                id="schedule-cron"
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                placeholder="0 */6 * * *"
                className="font-mono"
              />
              {cron.trim() && <p className="text-sm text-muted-foreground mt-1">{describeCron(cron.trim())}</p>}
            </div>

            <div>
              <Label htmlFor="schedule-timezone">Timezone</Label>
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

          <div>
            <Label htmlFor="schedule-phases">Phases JSON (Optional)</Label>
            <Textarea
              id="schedule-phases"
              value={phases}
              onChange={(e) => {
                setPhases(e.target.value)
                validateJson(e.target.value)
              }}
              placeholder='{"phase1": {"timeout": 300}}'
              rows={4}
              className="font-mono text-sm"
            />
            {jsonError && <p className="text-sm text-destructive mt-1">{jsonError}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="schedule-active" checked={active} onCheckedChange={setActive} />
            <Label htmlFor="schedule-active">Active schedule</Label>
          </div>

          {/* Next Fire Times Preview */}
          {nextFireTimes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Next 5 Executions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {nextFireTimes.map((time, index) => (
                    <div key={index} className="text-sm font-mono text-muted-foreground">
                      {new Date(time).toLocaleString()}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{mode === "create" ? "Create Schedule" : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
