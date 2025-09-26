"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { RunDrawer } from "@/components/monitoring/run-drawer"
import { LiveEvents } from "@/components/monitoring/live-events"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getRuns } from "@/lib/api"
import type { RunStatus, Run } from "@/lib/types"
import { Search, ExternalLink, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

function getStatusColor(status: RunStatus) {
  switch (status) {
    case "success":
      return "bg-green-500/10 text-green-700 dark:text-green-400"
    case "error":
      return "bg-red-500/10 text-red-700 dark:text-red-400"
    case "running":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
    case "queued":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
  }
}

function formatDuration(duration?: number) {
  if (!duration) return "-"
  if (duration < 60) return `${duration}s`
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}m ${seconds}s`
}

function formatDistanceToNow(date: Date) {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  return `${Math.floor(diffInSeconds / 86400)} days ago`
}

export default function MonitoringPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [runs, setRuns] = useState<Run[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchRuns = async () => {
    try {
      const runsData = await getRuns()
      setRuns(runsData)
    } catch (error) {
      console.log("[v0] Error fetching runs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRuns()
    // Set up auto-refresh every 5 seconds
    const interval = setInterval(fetchRuns, 5000)
    return () => clearInterval(interval)
  }, [])

  const filteredRuns = runs.filter((run) => {
    const matchesSearch =
      (run.bot_name || "").toLowerCase().includes(search.toLowerCase()) || run.id.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" || run.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleViewRun = (runId: string) => {
    setSelectedRunId(runId)
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Monitoring" description="Monitor bot runs and real-time events">
        <Button variant="outline" onClick={fetchRuns}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </PageHeader>

      <Tabs defaultValue="runs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="runs">Runs</TabsTrigger>
          <TabsTrigger value="events">Live Events</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-1 gap-4 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search runs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">{filteredRuns.length} runs</div>
          </div>

          {/* Runs Table */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Bot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Queued</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Exit Code</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-mono text-sm">{run.id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-medium">{run.bot_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(run.status)}>
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {run.queued_at ? formatDistanceToNow(new Date(run.queued_at)) : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {run.started_at ? formatDistanceToNow(new Date(run.started_at)) : "-"}
                      </TableCell>
                      <TableCell className="text-sm">{formatDuration(run.duration)}</TableCell>
                      <TableCell className="text-sm">{run.exit_code !== undefined ? run.exit_code : "-"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleViewRun(run.id)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredRuns.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No runs found matching your criteria</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="events">
          <LiveEvents />
        </TabsContent>
      </Tabs>

      {/* Run Details Drawer */}
      <RunDrawer 
        open={drawerOpen} 
        onOpenChange={setDrawerOpen} 
        run={selectedRunId ? runs.find(r => r.id === selectedRunId) || null : null} 
      />
    </div>
  )
}
