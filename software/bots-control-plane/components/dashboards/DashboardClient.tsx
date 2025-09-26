"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { RunsChart } from "@/components/dashboard/runs-chart"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { getKPIs, getChartData, getRuns } from "@/lib/api"
import type { KPIData, AnalyticsData, Run } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardClient() {
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [chartData, setChartData] = useState<AnalyticsData | null>(null)
  const [runs, setRuns] = useState<Run[] | null>(null)
  const [kpisLoading, setKpisLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)
  const [runsLoading, setRunsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("[v0] Fetching dashboard data...")
        const [kpisData, chartDataResult, runsData] = await Promise.all([getKPIs(), getChartData(), getRuns()])
        console.log("[v0] KPIs data:", kpisData)
        console.log("[v0] Chart data:", chartDataResult)
        console.log("[v0] Runs data:", runsData)
        setKpis(kpisData)
        setChartData(chartDataResult)
        setRuns(runsData)
      } catch (error) {
        console.log("[v0] Error fetching dashboard data:", error)
      } finally {
        setKpisLoading(false)
        setChartLoading(false)
        setRunsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your bot automation system" />

      {/* KPI Cards */}
      {kpisLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
                  ) : kpis ? (
                    <KPICards data={kpis} />
                  ) : null}

      {/* Chart and Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {chartLoading ? (
            <Skeleton className="h-80" />
          ) : chartData ? (
            <RunsChart data={chartData.runs_over_time} />
          ) : null}
        </div>
        <div className="space-y-6">
          <QuickActions />
        </div>
      </div>

      {/* Recent Activity */}
      {runsLoading ? (
        <Skeleton className="h-64" />
          ) : runs ? (
            <RecentActivity runs={runs} />
          ) : null}
    </div>
  )
}
