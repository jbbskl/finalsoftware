"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { TimeRangePicker, type TimeRangePreset } from "@/components/analytics/time-range-picker"
import { AnalyticsKPIs } from "@/components/analytics/analytics-kpis"
import { AnalyticsCharts } from "@/components/analytics/analytics-charts"
import type { DateRange } from "react-day-picker"

function subDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

// Mock data generators
const generateRunsOverTime = (days: number) => {
  const data = []
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i)
    data.push({
      date: date.toISOString(),
      runs: Math.floor(Math.random() * 50) + 10,
    })
  }
  return data
}

const successFailureData = [
  { name: "Success", value: 847, color: "hsl(var(--chart-1))" },
  { name: "Failed", value: 153, color: "hsl(var(--chart-2))" },
]

const durationByBotData = [
  { bot: "Web Scraper", duration: 145 },
  { bot: "Email Processor", duration: 89 },
  { bot: "Data Validator", duration: 234 },
  { bot: "Report Generator", duration: 167 },
  { bot: "File Processor", duration: 98 },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRangePreset>("7d")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  })

  const getDaysFromRange = () => {
    if (timeRange === "today") return 1
    if (timeRange === "7d") return 7
    if (timeRange === "30d") return 30
    if (dateRange?.from && dateRange?.to) {
      return Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    }
    return 7
  }

  const runsOverTimeData = generateRunsOverTime(getDaysFromRange())

  // Mock KPI data
  const kpiData = {
    totalRuns: 1000,
    successRate: 84.7,
    avgDuration: 156,
    concurrentPeak: 12,
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Performance insights and trends for your bot automation">
        <TimeRangePicker
          value={timeRange}
          dateRange={dateRange}
          onValueChange={setTimeRange}
          onDateRangeChange={setDateRange}
        />
      </PageHeader>

      {/* KPIs */}
      <AnalyticsKPIs {...kpiData} />

      {/* Charts */}
      <AnalyticsCharts
        runsOverTime={runsOverTimeData}
        successFailure={successFailureData}
        durationByBot={durationByBotData}
      />
    </div>
  )
}
