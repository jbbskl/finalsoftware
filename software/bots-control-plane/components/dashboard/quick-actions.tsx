"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Settings, Calendar, Loader2 } from "lucide-react"
import { createRunDev, getBots } from "@/lib/api"
import type { Bot } from "@/lib/types"

export function QuickActions() {
  const [runExampleOpen, setRunExampleOpen] = useState(false)
  const [newConfigOpen, setNewConfigOpen] = useState(false)
  const [createScheduleOpen, setCreateScheduleOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [bots, setBots] = useState<Bot[]>([])

  useEffect(() => {
    const fetchBots = async () => {
      try {
        const botsData = await getBots()
        setBots(botsData)
      } catch (error) {
        console.log("[v0] Error fetching bots:", error)
      }
    }
    fetchBots()
  }, [])

  const handleRunExample = async () => {
    setIsRunning(true)
    try {
      const runId = `ui-test-${Date.now()}`
      await createRunDev({
        image_ref: "example-bot:dev",
        run_id: runId,
        config: { url: "https://example.com" },
      })
      console.log("[v0] Example bot started successfully!")
      setRunExampleOpen(false)
    } catch (error) {
      console.log("[v0] Failed to start example bot:", error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and operations</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => setRunExampleOpen(true)} className="gap-2">
            <Play className="h-4 w-4" />
            Run Example Bot
          </Button>
          <Button variant="outline" onClick={() => setNewConfigOpen(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            New Config
          </Button>
          <Button variant="outline" onClick={() => setCreateScheduleOpen(true)} className="gap-2">
            <Calendar className="h-4 w-4" />
            Create Schedule
          </Button>
        </CardContent>
      </Card>

      {/* Run Example Bot Dialog */}
      <Dialog open={runExampleOpen} onOpenChange={setRunExampleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run Example Bot</DialogTitle>
            <DialogDescription>
              This will start an example bot with default configuration for testing purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bot Image</Label>
              <Input value="example-bot:dev" disabled />
            </div>
            <div>
              <Label>Configuration</Label>
              <Textarea value={JSON.stringify({ url: "https://example.com" }, null, 2)} disabled rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRunExampleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRunExample} disabled={isRunning}>
              {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run Bot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Config Dialog */}
      <Dialog open={newConfigOpen} onOpenChange={setNewConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Configuration</DialogTitle>
            <DialogDescription>Create a new configuration for your bots.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="config-name">Configuration Name</Label>
              <Input id="config-name" placeholder="My Config" />
            </div>
            <div>
              <Label htmlFor="config-bot">Bot</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a bot" />
                </SelectTrigger>
                <SelectContent>
                  {bots.map((bot) => (
                    <SelectItem key={bot.id} value={bot.id}>
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="config-json">Configuration JSON</Label>
              <Textarea id="config-json" placeholder='{"key": "value"}' rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewConfigOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log("[v0] Configuration created!")
                setNewConfigOpen(false)
              }}
            >
              Create Config
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Schedule Dialog */}
      <Dialog open={createScheduleOpen} onOpenChange={setCreateScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Schedule</DialogTitle>
            <DialogDescription>Schedule a bot to run automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="schedule-bot">Bot</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a bot" />
                </SelectTrigger>
                <SelectContent>
                  {bots.map((bot) => (
                    <SelectItem key={bot.id} value={bot.id}>
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="schedule-cron">Cron Expression</Label>
              <Input id="schedule-cron" placeholder="0 */6 * * *" />
            </div>
            <div>
              <Label htmlFor="schedule-timezone">Timezone</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateScheduleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log("[v0] Schedule created!")
                setCreateScheduleOpen(false)
              }}
            >
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
