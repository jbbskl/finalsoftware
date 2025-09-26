"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts"

interface AnalyticsChartsProps {
  runsOverTime: Array<{ date: string; runs: number }>
  successFailure: Array<{ name: string; value: number; color: string }>
  durationByBot: Array<{ bot: string; duration: number }>
}

const chartConfig = {
  runs: {
    label: "Runs",
    color: "hsl(var(--chart-1))",
  },
  duration: {
    label: "Duration (seconds)",
    color: "hsl(var(--chart-2))",
  },
}

export function AnalyticsCharts({ runsOverTime, successFailure, durationByBot }: AnalyticsChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Runs Over Time */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Runs Over Time</CardTitle>
          <CardDescription>Bot execution trends</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={runsOverTime}>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }}
                />
                <YAxis hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Line dataKey="runs" type="monotone" stroke="var(--color-runs)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Success vs Failure */}
      <Card>
        <CardHeader>
          <CardTitle>Success Rate</CardTitle>
          <CardDescription>Run outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={successFailure}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {successFailure.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">{data.name}</span>
                              <span className="font-bold text-muted-foreground">{data.value}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Duration by Bot */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Average Duration by Bot</CardTitle>
          <CardDescription>Median execution time per bot</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationByBot}>
                <XAxis dataKey="bot" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="duration" fill="var(--color-duration)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
