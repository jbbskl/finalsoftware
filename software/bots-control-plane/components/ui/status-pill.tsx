"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react"

interface StatusPillProps {
  status: "queued" | "running" | "success" | "error"
  className?: string
}

const statusConfig = {
  queued: {
    label: "Queued",
    variant: "secondary" as const,
    icon: Clock,
    className: "bg-brand-muted text-brand-primary-dark border-brand-accent"
  },
  running: {
    label: "Running",
    variant: "default" as const,
    icon: Clock,
    className: "bg-brand-primary text-white border-brand-primary-dark"
  },
  success: {
    label: "Success",
    variant: "default" as const,
    icon: CheckCircle,
    className: "bg-green-100 text-green-800 border-green-200"
  },
  error: {
    label: "Error",
    variant: "destructive" as const,
    icon: XCircle,
    className: "bg-red-100 text-red-800 border-red-200"
  }
}

export function StatusPill({ status, className }: StatusPillProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
