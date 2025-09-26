"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExternalLink } from "lucide-react"
import type { Run, RunStatus } from "@/lib/types"

interface RecentActivityProps {
  runs: Run[]
}

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

export function RecentActivity({ runs }: RecentActivityProps) {
  const recentRuns = runs.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest bot runs and their status</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Bot</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentRuns.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="font-mono text-sm">{run.id.slice(0, 8)}...</TableCell>
                <TableCell className="font-medium">{run.bot_name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getStatusColor(run.status)}>
                    {run.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {run.started_at ? formatDistanceToNow(new Date(run.started_at)) : "Not started"}
                </TableCell>
                <TableCell className="text-sm">{formatDuration(run.duration)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
