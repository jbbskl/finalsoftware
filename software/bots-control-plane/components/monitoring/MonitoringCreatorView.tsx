"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getMonitoringOverview, listRuns } from "@/lib/api-admin"
import type { MonitoringOverview, Run } from "@/lib/api-types"
import { 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  TrendingUp,
  Activity,
  Bot
} from "lucide-react"

export default function MonitoringCreatorView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [overview, setOverview] = useState<MonitoringOverview | null>(null)
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [overviewData, runsData] = await Promise.all([
        getMonitoringOverview(),
        listRuns(undefined, 50, 0)
      ])
      setOverview(overviewData)
      setRuns(runsData)
    } catch (error) {
      console.error("Error loading monitoring data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>
      case 'running':
        return <Badge variant="default" className="bg-blue-500">Running</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'queued':
        return <Badge variant="secondary">Queued</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'running':
        return <Play className="h-4 w-4 text-blue-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Monitoring" 
        description="Monitor your bot runs and system status" 
      />

      {/* Overview Stats */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : overview ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.bots_total}</div>
              <p className="text-xs text-muted-foreground">
                {overview.bots_active} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Runs Today</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.runs_today}</div>
              <p className="text-xs text-muted-foreground">
                {overview.runs_last_7d} this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview.runs_today > 0 
                  ? Math.round(((overview.runs_today - overview.errors_last_24h) / overview.runs_today) * 100)
                  : 0
                }%
              </div>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors (24h)</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.errors_last_24h}</div>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Recent Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Runs</CardTitle>
          <CardDescription>
            Latest bot execution activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : runs.length > 0 ? (
            <div className="space-y-3">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/creator/bots?run=${run.id}`)}
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(run.status)}
                    <div>
                      <div className="font-medium">{run.bot_id}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(run.queued_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      {run.started_at && (
                        <div className="text-sm text-muted-foreground">
                          Started: {new Date(run.started_at).toLocaleTimeString()}
                        </div>
                      )}
                      {run.finished_at && (
                        <div className="text-sm text-muted-foreground">
                          Finished: {new Date(run.finished_at).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(run.status)}
                      {run.exit_code !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          Exit: {run.exit_code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4" />
              <p>No runs yet</p>
              <p className="text-sm">Start your bots to see activity here</p>
              <Button 
                className="mt-4" 
                onClick={() => router.push("/creator/bots")}
              >
                Go to Bots
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common monitoring tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button 
              variant="outline" 
              onClick={() => router.push("/creator/bots")}
              className="h-auto p-4"
            >
              <div className="text-left">
                <div className="font-medium">Manage Bots</div>
                <div className="text-sm text-muted-foreground">Configure and start your bots</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push("/creator/schedule")}
              className="h-auto p-4"
            >
              <div className="text-left">
                <div className="font-medium">View Schedule</div>
                <div className="text-sm text-muted-foreground">See upcoming bot runs</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => loadData()}
              className="h-auto p-4"
            >
              <div className="text-left">
                <div className="font-medium">Refresh Data</div>
                <div className="text-sm text-muted-foreground">Update monitoring information</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}