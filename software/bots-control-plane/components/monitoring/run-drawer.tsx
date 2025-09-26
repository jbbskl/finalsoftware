"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusPill } from "@/components/ui/status-pill"
import { Separator } from "@/components/ui/separator"
import { Download, ExternalLink, Clock, Calendar, Bot, Hash } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import type { Run, RunEvent } from "@/lib/types"
import { getRunEvents } from "@/lib/api"

interface RunDrawerProps {
  run: Run | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RunDrawer({ run, open, onOpenChange }: RunDrawerProps) {
  const [events, setEvents] = useState<RunEvent[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)

  useEffect(() => {
    if (run && open) {
      loadRunEvents()
    }
  }, [run, open])

  const loadRunEvents = async () => {
    if (!run) return
    
    setIsLoadingEvents(true)
    try {
      const runEvents = await getRunEvents(run.id)
      setEvents(runEvents)
    } catch (error) {
      console.error('Failed to load run events:', error)
    } finally {
      setIsLoadingEvents(false)
    }
  }

  if (!run) return null

  const getDuration = () => {
    if (!run.started_at || !run.finished_at) return null
    
    const start = new Date(run.started_at)
    const end = new Date(run.finished_at)
    const duration = end.getTime() - start.getTime()
    
    return formatDistanceToNow(start, { addSuffix: false })
  }

  const getStatusColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600'
      case 'warn': return 'text-yellow-600'
      case 'info': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Run {run.id}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Run Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Run Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <StatusPill status={run.status} />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Bot</Label>
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span className="font-medium">{run.bot_name || 'Unknown Bot'}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Platform</Label>
                  <Badge variant="outline">{run.platform || 'Unknown'}</Badge>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Exit Code</Label>
                  <span className="font-mono">{run.exit_code ?? 'N/A'}</span>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Queued At</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{run.queued_at ? format(new Date(run.queued_at), 'PPp') : 'N/A'}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Started At</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{run.started_at ? format(new Date(run.started_at), 'PPp') : 'N/A'}</span>
                  </div>
                </div>
                
                {run.finished_at && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Finished At</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(run.finished_at), 'PPp')}</span>
                    </div>
                  </div>
                )}
                
                {getDuration() && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Duration</Label>
                    <span className="font-medium">{getDuration()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Artifacts */}
          {run.artifacts && run.artifacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Artifacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {run.artifacts.map((artifact, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono text-sm">{artifact}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Run Events</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="events" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="events">Events</TabsTrigger>
                  <TabsTrigger value="logs">Raw Logs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="events" className="space-y-4">
                  {isLoadingEvents ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading events...
                    </div>
                  ) : events.length > 0 ? (
                    <div className="space-y-3">
                      {events.map((event) => (
                        <div key={event.id} className="flex items-start gap-3 p-3 border rounded">
                          <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(event.level)}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-sm font-medium ${getStatusColor(event.level)}`}>
                                {event.level.toUpperCase()}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {event.code}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(event.ts), 'HH:mm:ss')}
                              </span>
                            </div>
                            <p className="text-sm">{event.message}</p>
                            {event.data_json && (
                              <pre className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(event.data_json, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No events found for this run.
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="logs">
                  <div className="bg-muted p-4 rounded font-mono text-sm">
                    <pre className="whitespace-pre-wrap">
                      {events.map(event => 
                        `[${format(new Date(event.ts), 'yyyy-MM-dd HH:mm:ss')}] ${event.level.toUpperCase()}: ${event.message}`
                      ).join('\n')}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Missing Label component - let me create it
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={`text-sm font-medium ${className || ''}`}>
      {children}
    </label>
  )
}
