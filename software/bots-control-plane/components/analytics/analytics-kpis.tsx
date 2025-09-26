"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Activity, Clock, Target, Zap } from "lucide-react"

interface AnalyticsKPIsProps {
  totalRuns: number
  successRate: number
  avgDuration: number
  concurrentPeak: number
}

export function AnalyticsKPIs({ totalRuns, successRate, avgDuration, concurrentPeak }: AnalyticsKPIsProps) {
  const kpis = [
    {
      title: "Total Runs",
      value: totalRuns.toLocaleString(),
      icon: Activity,
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Success Rate",
      value: `${successRate.toFixed(1)}%`,
      icon: Target,
      trend: "+2.1%",
      trendUp: true,
    },
    {
      title: "Avg Duration",
      value: `${avgDuration}s`,
      icon: Clock,
      trend: "-5.2%",
      trendUp: false,
    },
    {
      title: "Peak Concurrent",
      value: concurrentPeak.toString(),
      icon: Zap,
      trend: "+8.3%",
      trendUp: true,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <kpi.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {kpi.trendUp ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={kpi.trendUp ? "text-green-500" : "text-red-500"}>{kpi.trend}</span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
