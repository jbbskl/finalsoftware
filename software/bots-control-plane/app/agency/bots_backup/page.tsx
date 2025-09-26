"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Grid, List, Bot, Clock, Zap, Users, MessageSquare } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge"
import { getPlatformsAndBots } from "@/lib/api"
import type { Platform, Bot as BotType } from "@/lib/types"

export default function BotsPage() {
  const [search, setSearch] = useState("")
  const [platformFilter, setPlatformFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        setIsLoading(true)
        const data = await getPlatformsAndBots()
        setPlatforms(data)
      } catch (error) {
        console.error("Failed to fetch platforms:", error)
        setPlatforms([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlatforms()
  }, [])

  const filteredPlatforms = platforms.filter((platform) => {
    const matchesSearch = 
      platform.name.toLowerCase().includes(search.toLowerCase()) ||
      platform.description?.toLowerCase().includes(search.toLowerCase()) ||
      platform.bots.some(bot => 
        bot.name.toLowerCase().includes(search.toLowerCase()) ||
        bot.description?.toLowerCase().includes(search.toLowerCase())
      )

    const matchesPlatform = platformFilter === "all" || platform.id === platformFilter

    return matchesSearch && matchesPlatform
  })

  const handleBotToggle = (botId: string, enabled: boolean) => {
    setPlatforms((prevPlatforms) =>
      prevPlatforms.map((platform) => ({
        ...platform,
        bots: platform.bots.map((bot) =>
          bot.id === botId ? { ...bot, enabled } : bot
        )
      }))
    )
  }

  const getBotIcon = (kind: string) => {
    switch (kind) {
      case "posting":
        return <Zap className="h-4 w-4" />
      case "mass_dm":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }

  const getTargetIcon = (target: string) => {
    switch (target) {
      case "creators":
        return <Users className="h-4 w-4" />
      case "agencies":
        return <Bot className="h-4 w-4" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Bots" description="Manage your automation bots and their configurations" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Bots" description="Manage your automation bots and their configurations" />

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search bots..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {platforms.map((platform) => (
                <SelectItem key={platform.id} value={platform.id}>
                  {platform.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <Grid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredPlatforms.length} platform{filteredPlatforms.length !== 1 ? 's' : ''} with bots
      </div>

      {/* Platforms and Bots */}
      {filteredPlatforms.map((platform) => (
        <Card key={platform.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {platform.name}
                  {platform.comingSoon && <ComingSoonBadge />}
                </CardTitle>
                {platform.description && (
                  <CardDescription>{platform.description}</CardDescription>
                )}
              </div>
              {platform.comingSoon && (
                <Button variant="outline" size="sm">
                  Notify Me
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {platform.bots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {platform.comingSoon ? (
                  <div className="space-y-2">
                    <Clock className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p>Bots for this platform are coming soon!</p>
                    <Button variant="outline" size="sm">
                      Get Notified
                    </Button>
                  </div>
                ) : (
                  "No bots available for this platform."
                )}
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
                {platform.bots.map((bot) => (
                  <Card key={bot.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getBotIcon(bot.kind)}
                          <div>
                            <CardTitle className="text-base">{bot.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              {getTargetIcon(bot.audience)}
                              <Badge variant="outline" className="text-xs">
                                {bot.audience}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {bot.comingSoon ? (
                          <ComingSoonBadge />
                        ) : (
                          <Switch
                            checked={bot.enabled}
                            onCheckedChange={(enabled) => handleBotToggle(bot.id, enabled)}
                          />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {bot.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {bot.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Version {bot.current_version || '1.0.0'}</span>
                        {!bot.comingSoon && (
                          <span className={`px-2 py-1 rounded-full ${
                            bot.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {bot.enabled ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {filteredPlatforms.length === 0 && (
        <div className="text-center py-12">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No platforms or bots found matching your criteria</p>
        </div>
      )}
    </div>
  )
}
