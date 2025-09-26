import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Clock } from "lucide-react"

interface ComingSoonBadgeProps {
  className?: string
}

export function ComingSoonBadge({ className }: ComingSoonBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="secondary" className={`gap-1 ${className}`}>
            <Clock className="h-3 w-3" />
            Coming Soon
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>This feature is coming soon!</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
