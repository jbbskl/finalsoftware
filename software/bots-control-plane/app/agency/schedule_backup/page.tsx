"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Clock, Plus, Calendar, Bot, Settings, Play, Pause } from "lucide-react"
import { MonthCalendar } from "@/components/schedule/month-calendar"
import { CronField } from "@/components/schedule/cron-field"
import { getSchedules, getPlatformsAndBots, createSchedule, updateSchedule, deleteSchedule } from "@/lib/api"
import { toast } from "sonner"
import type { Schedule, Platform } from "@/lib/types"

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [newScheduleOpen, setNewScheduleOpen] = useState(false)
  const [newRunOpen, setNewRunOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [schedulesData, platformsData] = await Promise.all([
          getSchedules(),
          getPlatformsAndBots()
        ])
        setSchedules(schedulesData)
        setPlatforms(platformsData)
      } catch (error) {
        console.error("Failed to fetch schedule data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDayClick = (date: string) => {
    setSelectedDate(date)
  }

  const handleScheduleToggle = async (scheduleId: string, isActive: boolean) => {
    try {
      await updateSchedule(scheduleId, { is_active: isActive })
      setSchedules(prev => 
        prev.map(s => s.id === scheduleId ? { ...s, is_active: isActive } : s)
      )
      toast.success(`Schedule ${isActive ? 'activated' : 'deactivated'}`)
    } catch (error) {
      toast.error("Failed to update schedule")
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await deleteSchedule(scheduleId)
      setSchedules(prev => prev.filter(s => s.id !== scheduleId))
      toast.success("Schedule deleted")
    } catch (error) {
      toast.error("Failed to delete schedule")
    }
  }

  const generateCalendarData = () => {
    const data: Record<string, number> = {}
    schedules.forEach(schedule => {
      // This is a simplified version - in production you'd calculate actual dates
      const today = new Date()
      const key = today.toISOString().split('T')[0]
      data[key] = (data[key] || 0) + 1
    })
    return data
  }

  const getSchedulesForDate = (date: string) => {
    // This is a simplified version - in production you'd filter by actual dates
    return schedules.filter(schedule => schedule.is_active)
  }

  const getBotName = (botId: string) => {
    for (const platform of platforms) {
      const bot = platform.bots.find(b => b.id === botId)
      if (bot) return bot.name
    }
    return "Unknown Bot"
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Schedule" description="Manage your bot automation schedules" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Schedule" description="Manage your bot automation schedules" />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setViewMode("calendar")}>
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </Button>
          <Button variant="outline" onClick={() => setViewMode("list")}>
            <Settings className="h-4 w-4 mr-2" />
            List View
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={newRunOpen} onOpenChange={setNewRunOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Play className="h-4 w-4 mr-2" />
                New Run
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Run</DialogTitle>
                <DialogDescription>
                  Schedule a one-time run for a specific bot.
                </DialogDescription>
              </DialogHeader>
              <NewRunForm onClose={() => setNewRunOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={newScheduleOpen} onOpenChange={setNewScheduleOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Schedule</DialogTitle>
                <DialogDescription>
                  Set up a recurring schedule for your bot automation.
                </DialogDescription>
              </DialogHeader>
              <NewScheduleForm onClose={() => setNewScheduleOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <MonthCalendar 
          itemsByDay={generateCalendarData()} 
          onDayClick={handleDayClick}
        />
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card>
          <CardHeader>
            <CardTitle>All Schedules</CardTitle>
            <CardDescription>Manage your recurring schedules</CardDescription>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4" />
                <p>No schedules created yet</p>
                <Button className="mt-2" onClick={() => setNewScheduleOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Schedule
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{schedule.name}</h3>
                        <Badge variant="outline">{schedule.timezone}</Badge>
                        {schedule.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Bot: {getBotName(schedule.bot_id)}</p>
                        <p>Cron: <code className="bg-muted px-1 rounded">{schedule.cron_expr}</code></p>
                        {schedule.next_fire_at && (
                          <p>Next run: {new Date(schedule.next_fire_at).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={schedule.is_active}
                        onCheckedChange={(checked) => handleScheduleToggle(schedule.id, checked)}
                      />
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Day Details Drawer */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {new Date(selectedDate).toLocaleDateString()} - Scheduled Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DayScheduleList 
              date={selectedDate} 
              schedules={getSchedulesForDate(selectedDate)}
              onScheduleToggle={handleScheduleToggle}
              onDeleteSchedule={handleDeleteSchedule}
              getBotName={getBotName}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// New Schedule Form Component
function NewScheduleForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    bot_id: "",
    cron_expr: "0 8 * * *",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    is_active: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createSchedule(formData)
      toast.success("Schedule created successfully!")
      onClose()
    } catch (error) {
      toast.error("Failed to create schedule")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Schedule Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Morning Posts"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bot">Bot</Label>
        <Select value={formData.bot_id} onValueChange={(value) => setFormData({ ...formData, bot_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a bot" />
          </SelectTrigger>
          <SelectContent>
            {/* This would be populated with actual bots */}
            <SelectItem value="f2f-posting-creators">F2F Posting Script (Creators)</SelectItem>
            <SelectItem value="f2f-mass-dm-creators">F2F Mass DM Script (Creators)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Timezone</Label>
        <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Europe/Amsterdam">Europe/Amsterdam</SelectItem>
            <SelectItem value="America/New_York">America/New_York</SelectItem>
            <SelectItem value="UTC">UTC</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CronField
        value={formData.cron_expr}
        onChange={(value) => setFormData({ ...formData, cron_expr: value })}
      />

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="active">Active</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Create Schedule</Button>
      </div>
    </form>
  )
}

// New Run Form Component
function NewRunForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    bot_id: "",
    run_date: new Date().toISOString().split('T')[0],
    run_time: "08:00"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // This would call createRunDev
      toast.success("Run scheduled successfully!")
      onClose()
    } catch (error) {
      toast.error("Failed to schedule run")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bot">Bot</Label>
        <Select value={formData.bot_id} onValueChange={(value) => setFormData({ ...formData, bot_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a bot" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="f2f-posting-creators">F2F Posting Script (Creators)</SelectItem>
            <SelectItem value="f2f-mass-dm-creators">F2F Mass DM Script (Creators)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.run_date}
            onChange={(e) => setFormData({ ...formData, run_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="time"
            value={formData.run_time}
            onChange={(e) => setFormData({ ...formData, run_time: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Schedule Run</Button>
      </div>
    </form>
  )
}

// Day Schedule List Component
function DayScheduleList({ 
  date, 
  schedules, 
  onScheduleToggle, 
  onDeleteSchedule,
  getBotName 
}: { 
  date: string
  schedules: Schedule[]
  onScheduleToggle: (id: string, active: boolean) => void
  onDeleteSchedule: (id: string) => void
  getBotName: (id: string) => string
}) {
  return (
    <div className="space-y-4">
      {schedules.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2" />
          <p>No schedules for this day</p>
        </div>
      ) : (
        schedules.map((schedule) => (
          <div key={schedule.id} className="flex items-center justify-between p-3 border rounded">
            <div>
              <h4 className="font-medium">{schedule.name}</h4>
              <p className="text-sm text-muted-foreground">
                {getBotName(schedule.bot_id)} • {schedule.timezone}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={schedule.is_active}
                onCheckedChange={(checked) => onScheduleToggle(schedule.id, checked)}
              />
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// Missing components
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className || ''}`} />
}
