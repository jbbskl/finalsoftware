"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { Bot } from "@/lib/types"
import { History } from "lucide-react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
// import { getBotVersions, toggleBot } from "@/lib/api" // TODO: Implement these functions
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface BotCardProps {
  bot: Bot
  onToggle: (botId: string, enabled: boolean) => void
}

export function BotCard({ bot, onToggle }: BotCardProps) {
  const [isToggling, setIsToggling] = useState(false)

  // Mock versions data for now
  const versions = [
    { version: "1.0.0", released_at: "2024-01-15T10:00:00Z", changelog: "Initial release" },
    { version: "0.9.0", released_at: "2024-01-10T10:00:00Z", changelog: "Beta release" }
  ]

  const handleToggle = async (enabled: boolean) => {
    setIsToggling(true)
    try {
      // TODO: Implement toggleBot function
      // await toggleBot(bot.id, enabled)
      onToggle(bot.id, enabled)
      toast.success(`Bot ${enabled ? "enabled" : "disabled"} successfully`)
    } catch (error) {
      toast.error("Failed to toggle bot status")
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🤖</div>
            <div>
              <CardTitle className="text-lg">{bot.name}</CardTitle>
              <CardDescription className="text-sm font-mono">{bot.key}</CardDescription>
            </div>
          </div>
          <Badge variant={bot.enabled ? "default" : "secondary"}>v{bot.current_version}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{bot.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch checked={bot.enabled} onCheckedChange={handleToggle} disabled={isToggling} />
            <span className="text-sm">{bot.enabled ? "Enabled" : "Disabled"}</span>
          </div>

          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  Versions
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{bot.name} Versions</SheetTitle>
                  <SheetDescription>Version history and changelogs for this bot</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {versions.map((version: any) => (
                    <div key={version.version} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={version.version === bot.current_version ? "default" : "outline"}>
                          {version.version}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm font-mono text-muted-foreground mb-2">{version.image_ref}</p>
                      <p className="text-sm">{version.changelog}</p>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
