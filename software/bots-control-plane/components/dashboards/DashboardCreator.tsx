"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getMonitoringOverview, listRuns } from "@/lib/api-admin"
import type { MonitoringOverview, Run } from "@/lib/api-types"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Bot, 
  Play, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Upload,
  Clock
} from "lucide-react"

export default function DashboardCreator() {
  const router = useRouter()
  const [overview, setOverview] = useState<MonitoringOverview | null>(null)
  const [recentRuns, setRecentRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewData, runsData] = await Promise.all([
          getMonitoringOverview(),
          listRuns(undefined, 10, 0)
        ])
        setOverview(overviewData)
        setRecentRuns(runsData)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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

  const quickActions = [
    {
      title: "Create Bot",
      description: "Set up a new bot instance",
      icon: <Plus className="h-4 w-4" />,
      onClick: () => router.push("/creator/bots"),
      variant: "default" as const
    },
    {
      title: "Upload Cookies",
      description: "Upload cookies for your bots",
      icon: <Upload className="h-4 w-4" />,
      onClick: () => router.push("/creator/bots"),
      variant: "outline" as const
    },
    {
      title: "Schedule a Run",
      description: "Schedule your bots to run",
      icon: <Calendar className="h-4 w-4" />,
      onClick: () => router.push("/creator/schedule"),
      variant: "outline" as const
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Overview of your bot automation system" 
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))
        ) : overview ? (
          <>
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
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  This week
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
          </>
        ) : null}
      </div>

      {/* Chart and Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Runs per Hour</CardTitle>
              <CardDescription>
                Bot execution activity over the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                  <p>Chart coming soon</p>
                  <p className="text-sm">Runs per hour visualization</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant}
                  className="w-full justify-start"
                  onClick={action.onClick}
                >
                  {action.icon}
                  <div className="ml-2 text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-70">{action.description}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Runs */}
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
          ) : recentRuns.length > 0 ? (
            <div className="space-y-3">
              {recentRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/creator/monitoring?run=${run.id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {new Date(run.queued_at).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{run.bot_id}</div>
                      {run.summary_json?.kind && (
                        <div className="text-sm text-muted-foreground">
                          {run.summary_json.kind} run
                        </div>
                      )}
                    </div>
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
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Play className="h-12 w-12 mx-auto mb-4" />
              <p>No recent runs</p>
              <p className="text-sm">Start your first bot to see activity here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}