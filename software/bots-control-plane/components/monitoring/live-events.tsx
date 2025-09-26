"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { RunEvent } from "@/lib/types"
import { Play, Pause, Trash2 } from "lucide-react"

function getEventLevelColor(level: string) {
  switch (level) {
    case "error":
      return "bg-red-500/10 text-red-700 dark:text-red-400"
    case "warn":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
    case "info":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
    case "debug":
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
  }
}

// Mock live events generator
const generateMockEvent = (): RunEvent => {
  const levels: ("info" | "warn" | "error")[] = ["info", "warn", "error"]
  const messages = [
    "Bot started successfully",
    "Processing data batch",
    "Connection established",
    "Warning: Rate limit approaching",
    "Error: Failed to connect to API",
    "Task completed successfully",
    "Retrying failed operation",
  ]

  return {
    id: Math.floor(Math.random() * 1000000),
    run_id: `run-${Math.floor(Math.random() * 1000)}`,
    ts: new Date().toISOString(),
    level: levels[Math.floor(Math.random() * levels.length)],
    code: `EVENT_${Math.floor(Math.random() * 1000)}`,
    message: messages[Math.floor(Math.random() * messages.length)],
    data_json: Math.random() > 0.7 ? { count: Math.floor(Math.random() * 100) } : undefined,
  }
}

export function LiveEvents() {
  const [events, setEvents] = useState<RunEvent[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(
      () => {
        const newEvent = generateMockEvent()
        setEvents((prev) => [newEvent, ...prev.slice(0, 99)]) // Keep last 100 events
      },
      2000 + Math.random() * 3000,
    ) // Random interval between 2-5 seconds

    return () => clearInterval(interval)
  }, [isPaused])

  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0
    }
  }, [events, autoScroll])

  const clearEvents = () => {
    setEvents([])
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Events</CardTitle>
            <CardDescription>Real-time events from all running bots</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className={isPaused ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"}
            >
              {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
              {isPaused ? "Resume" : "Pause"}
            </Button>
            <Button variant="outline" size="sm" onClick={clearEvents}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{events.length} events</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>{isPaused ? "Paused" : "Live"}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6" ref={scrollAreaRef}>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <Badge variant="secondary" className={`text-xs ${getEventLevelColor(event.level)}`}>
                  {event.level.toUpperCase()}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{event.message}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {new Date(event.ts).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{event.run_id}</span>
                    {event.data_json && (
                      <span className="bg-muted px-2 py-1 rounded font-mono">{JSON.stringify(event.data_json)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{isPaused ? "Event stream paused" : "Waiting for events..."}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
