"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { BotInstance } from "@/lib/api-types"
import { 
  Bot, 
  Play, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Upload,
  Settings
} from "lucide-react"

const CREATOR_BOTS = [
  { code: "f2f_post", name: "F2F Posting", description: "Automated posting to F2F" },
  { code: "f2f_dm", name: "F2F Messaging", description: "Automated messaging on F2F" },
  { code: "of_post", name: "OnlyFans Posting", description: "Automated posting to OnlyFans" },
  { code: "of_dm", name: "OnlyFans Messaging", description: "Automated messaging on OnlyFans" },
  { code: "fanvue_post", name: "Fanvue Posting", description: "Automated posting to Fanvue" },
  { code: "fanvue_dm", name: "Fanvue Messaging", description: "Automated messaging on Fanvue" }
]

export default function BotsCreatorView() {
  const router = useRouter()
  const [botInstances, setBotInstances] = useState<BotInstance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBotInstances = async () => {
      try {
        // Mock data - in real app, fetch from API
        const mockInstances: BotInstance[] = [
          {
            id: "bot-001",
            bot_code: "f2f_post",
            status: "inactive",
            validation_status: null,
            created_at: "2024-01-15T10:00:00Z"
          },
          {
            id: "bot-002", 
            bot_code: "f2f_dm",
            status: "ready",
            validation_status: "valid",
            last_validated_at: "2024-01-15T11:00:00Z",
            created_at: "2024-01-15T10:00:00Z"
          },
          {
            id: "bot-003",
            bot_code: "of_post", 
            status: "running",
            validation_status: "valid",
            last_validated_at: "2024-01-15T09:00:00Z",
            created_at: "2024-01-15T10:00:00Z"
          }
        ]
        
        // Sort: inactive first, then by name
        const sorted = mockInstances.sort((a, b) => {
          if (a.status === 'inactive' && b.status !== 'inactive') return -1
          if (a.status !== 'inactive' && b.status === 'inactive') return 1
          return a.bot_code.localeCompare(b.bot_code)
        })
        
        setBotInstances(sorted)
      } catch (error) {
        console.error("Error loading bot instances:", error)
      } finally {
        setLoading(false)
      }
    }

    loadBotInstances()
  }, [])

  const getStatusBadge = (status: string, validationStatus?: string | null) => {
    if (status === 'inactive') {
      return <Badge variant="secondary">Inactive</Badge>
    }
    if (status === 'ready' && validationStatus === 'valid') {
      return <Badge variant="default" className="bg-green-500">Ready</Badge>
    }
    if (status === 'running') {
      return <Badge variant="default" className="bg-blue-500">Running</Badge>
    }
    if (status === 'error') {
      return <Badge variant="destructive">Error</Badge>
    }
    return <Badge variant="outline">{status}</Badge>
  }

  const getStatusIcon = (status: string, validationStatus?: string | null) => {
    if (status === 'inactive') {
      return <Bot className="h-5 w-5 text-muted-foreground" />
    }
    if (status === 'ready' && validationStatus === 'valid') {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    if (status === 'running') {
      return <Play className="h-5 w-5 text-blue-500" />
    }
    if (status === 'error') {
      return <AlertCircle className="h-5 w-5 text-red-500" />
    }
    return <Clock className="h-5 w-5 text-muted-foreground" />
  }

  const canActivate = (status: string, validationStatus?: string | null) => {
    return status === 'inactive' && validationStatus === 'valid'
  }

  const handleActivate = (botId: string) => {
    // In real app, call activate API
    console.log("Activating bot:", botId)
  }

  const getBotInfo = (botCode: string) => {
    return CREATOR_BOTS.find(bot => bot.code === botCode) || {
      code: botCode,
      name: botCode,
      description: "Bot automation"
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Bots" 
        description="Manage your bot instances and automations" 
      />

      {/* Bot Instances Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))
        ) : (
          CREATOR_BOTS.map((bot) => {
            const instance = botInstances.find(inst => inst.bot_code === bot.code)
            const isInactive = !instance || instance.status === 'inactive'
            
            return (
              <Card 
                key={bot.code} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isInactive ? 'opacity-75' : ''
                }`}
                onClick={() => router.push(`/creator/bots/${instance?.id || bot.code}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(instance?.status || 'inactive', instance?.validation_status)}
                      <CardTitle className="text-lg">{bot.name}</CardTitle>
                    </div>
                    {getStatusBadge(instance?.status || 'inactive', instance?.validation_status)}
                  </div>
                  <CardDescription>{bot.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  {instance ? (
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(instance.created_at).toLocaleDateString()}
                      </div>
                      
                      {instance.validation_status && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Last validated: </span>
                          <span className="font-medium">
                            {instance.last_validated_at 
                              ? new Date(instance.last_validated_at).toLocaleDateString()
                              : 'Never'
                            }
                          </span>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/creator/bots/${instance.id}`)
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                        
                        {canActivate(instance.status, instance.validation_status) && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleActivate(instance.id)
                            }}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        Bot instance not yet created
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/creator/bots/${bot.code}`)
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Setup
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Status Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Inactive</Badge>
              <span className="text-sm text-muted-foreground">Not configured</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-green-500">Ready</Badge>
              <span className="text-sm text-muted-foreground">Ready to activate</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-blue-500">Running</Badge>
              <span className="text-sm text-muted-foreground">Currently active</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="destructive">Error</Badge>
              <span className="text-sm text-muted-foreground">Needs attention</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Click on a bot to configure it</p>
            <p>2. Upload your cookies and validate the configuration</p>
            <p>3. Once validated, you can activate the bot</p>
            <p>4. Use the Schedule page to set up automated runs</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}