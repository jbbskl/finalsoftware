"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Calendar, Bot, AlertTriangle } from "lucide-react"
import type { KPIData } from "@/lib/types"

interface KPICardsProps {
  data: KPIData
}

export function KPICards({ data }: KPICardsProps) {
  const kpis = [
    {
      title: "Active Runs",
      value: data.active_runs,
      icon: Activity,
      description: "Currently running",
    },
    {
      title: "Scheduled This Week",
      value: data.scheduled_this_week,
      icon: Calendar,
      description: "Scheduled executions",
    },
    {
      title: "Bots Enabled",
      value: data.bots_enabled,
      icon: Bot,
      description: "Active bots",
    },
    {
      title: "Failed (24h)",
      value: data.failed_24h,
      icon: AlertTriangle,
      description: "Failed in last 24h",
      variant: "destructive" as const,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <kpi.icon
              className={`h-4 w-4 ${kpi.variant === "destructive" ? "text-destructive" : "text-muted-foreground"}`}
            />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpi.variant === "destructive" ? "text-destructive" : ""}`}>
              {kpi.value}
            </div>
            <p className="text-xs text-muted-foreground">{kpi.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
