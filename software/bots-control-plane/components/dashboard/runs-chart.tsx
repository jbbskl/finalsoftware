"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts"
import type { ChartDataPoint } from "@/lib/types"

interface RunsChartProps {
  data: ChartDataPoint[]
}

const chartConfig = {
  runs: {
    label: "Runs",
    color: "hsl(var(--chart-1))",
  },
}

export function RunsChart({ data }: RunsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Runs per Hour</CardTitle>
        <CardDescription>Bot executions in the last 24 hours</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value} />
              <YAxis hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Area
                dataKey="runs"
                type="monotone"
                fill="var(--color-runs)"
                fillOpacity={0.4}
                stroke="var(--color-runs)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
