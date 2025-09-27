"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { uploadCookies, validateBot, startRun, stopRun, streamLogsSSE, listRuns } from "@/lib/api"
import type { BotInstance, Run } from "@/lib/api-types"
import { toast } from "sonner"
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Square, 
  Clock,
  FileText,
  Settings,
  Activity
} from "lucide-react"

interface BotDetailCreatorViewProps {
  botId: string;
}

export default function BotDetailCreatorView({ botId }: BotDetailCreatorViewProps) {
  const router = useRouter()
  const [botInstance, setBotInstance] = useState<BotInstance | null>(null)
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [starting, setStarting] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [logsConnected, setLogsConnected] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    loadBotInstance()
    loadRuns()
  }, [botId])

  useEffect(() => {
    // Auto-scroll to bottom of logs
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  const loadBotInstance = async () => {
    try {
      // Mock data - in real app, fetch from API
      const mockInstance: BotInstance = {
        id: botId,
        bot_code: botId.includes('f2f_post') ? 'f2f_post' : 'f2f_dm',
        status: 'ready',
        validation_status: 'valid',
        last_validated_at: '2024-01-15T11:00:00Z',
        created_at: '2024-01-15T10:00:00Z'
      }
      setBotInstance(mockInstance)
    } catch (error) {
      console.error("Error loading bot instance:", error)
      toast.error("Failed to load bot instance")
    } finally {
      setLoading(false)
    }
  }

  const loadRuns = async () => {
    try {
      const runsData = await listRuns(botId, 20, 0)
      setRuns(runsData)
    } catch (error) {
      console.error("Error loading runs:", error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      toast.error("Please upload a JSON file")
      return
    }

    setUploading(true)
    try {
      await uploadCookies(botId, file)
      toast.success("Cookies uploaded successfully")
      loadBotInstance() // Refresh bot instance
    } catch (error) {
      console.error("Error uploading cookies:", error)
      toast.error("Failed to upload cookies")
    } finally {
      setUploading(false)
    }
  }

  const handleValidate = async () => {
    setValidating(true)
    try {
      await validateBot(botId)
      toast.success("Bot validation completed")
      loadBotInstance() // Refresh bot instance
    } catch (error) {
      console.error("Error validating bot:", error)
      toast.error("Failed to validate bot")
    } finally {
      setValidating(false)
    }
  }

  const handleStart = async () => {
    setStarting(true)
    try {
      const result = await startRun(botId)
      toast.success("Bot run started")
      loadRuns() // Refresh runs
    } catch (error) {
      console.error("Error starting run:", error)
      toast.error("Failed to start bot run")
    } finally {
      setStarting(false)
    }
  }

  const handleStop = async () => {
    setStopping(true)
    try {
      await stopRun(botId)
      toast.success("Bot run stopped")
      loadRuns() // Refresh runs
    } catch (error) {
      console.error("Error stopping run:", error)
      toast.error("Failed to stop bot run")
    } finally {
      setStopping(false)
    }
  }

  const connectLogs = () => {
    if (logsConnected) {
      // Disconnect
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setLogsConnected(false)
      setLogs([])
      return
    }

    // Connect
    const eventSource = streamLogsSSE(botId)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      setLogs(prev => [...prev, event.data])
    }

    eventSource.onerror = (error) => {
      console.error("SSE error:", error)
      toast.error("Log stream disconnected")
      setLogsConnected(false)
    }

    setLogsConnected(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>
      case 'running':
        return <Badge variant="default" className="bg-blue-500">Running</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'queued':
        return <Badge variant="secondary">Queued</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." description="Loading bot details..." />
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!botInstance) {
    return (
      <div className="space-y-6">
        <PageHeader title="Bot Not Found" description="The requested bot could not be found" />
        <Button onClick={() => router.push("/creator/bots")}>
          Back to Bots
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={botInstance.bot_code.replace('_', ' ').toUpperCase()}
        description="Configure and manage your bot instance"
      />

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList>
          <TabsTrigger value="setup">
            <Settings className="h-4 w-4 mr-2" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="run">
            <Play className="h-4 w-4 mr-2" />
            Run
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Activity className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          {/* Bot Status */}
          <Card>
            <CardHeader>
              <CardTitle>Bot Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {botInstance.validation_status === 'valid' ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                  )}
                  <div>
                    <div className="font-medium">
                      {botInstance.validation_status === 'valid' ? 'Ready' : 'Needs Setup'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {botInstance.validation_status === 'valid' 
                        ? 'Bot is configured and ready to run'
                        : 'Upload cookies and validate configuration'
                      }
                    </div>
                  </div>
                </div>
                <Badge variant={botInstance.status === 'active' ? 'default' : 'secondary'}>
                  {botInstance.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Upload Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Cookies</CardTitle>
              <CardDescription>
                Upload your browser cookies to authenticate with the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <Label htmlFor="cookie-file" className="cursor-pointer">
                    <Input
                      id="cookie-file"
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <Button variant="outline" disabled={uploading}>
                      {uploading ? "Uploading..." : "Choose JSON File"}
                    </Button>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-2">
                    Select your cookies JSON file
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validate Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Validate Configuration</CardTitle>
              <CardDescription>
                Verify that your bot configuration is correct
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleValidate}
                disabled={validating}
                className="w-full"
              >
                {validating ? "Validating..." : "Validate Configuration"}
              </Button>
            </CardContent>
          </Card>

          {/* File Paths */}
          <Card>
            <CardHeader>
              <CardTitle>File Paths</CardTitle>
              <CardDescription>
                Where your bot files are stored
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm font-medium">Cookies:</span>
                <span className="text-sm text-muted-foreground font-mono">
                  ./secrets/storageState.json
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm font-medium">Config:</span>
                <span className="text-sm text-muted-foreground font-mono">
                  ./config.yaml
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm font-medium">Logs:</span>
                <span className="text-sm text-muted-foreground font-mono">
                  ./logs/
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="run" className="space-y-6">
          {/* Run Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Run Controls</CardTitle>
              <CardDescription>
                Start and stop bot runs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button 
                  onClick={handleStart}
                  disabled={starting || botInstance.status === 'running'}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {starting ? "Starting..." : "Start Run"}
                </Button>
                <Button 
                  onClick={handleStop}
                  disabled={stopping || botInstance.status !== 'running'}
                  variant="destructive"
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  {stopping ? "Stopping..." : "Stop Run"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Runs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Runs</CardTitle>
              <CardDescription>
                Latest bot execution history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {runs.length > 0 ? (
                <div className="space-y-3">
                  {runs.map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {new Date(run.queued_at).toLocaleString()}
                          </div>
                          {run.summary_json?.kind && (
                            <div className="text-sm text-muted-foreground">
                              {run.summary_json.kind} run
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(run.status)}
                        {run.exit_code !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            Exit: {run.exit_code}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Play className="h-12 w-12 mx-auto mb-4" />
                  <p>No runs yet</p>
                  <p className="text-sm">Start your first run to see history here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          {/* Log Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Live Logs</CardTitle>
              <CardDescription>
                Real-time bot execution logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={connectLogs}
                variant={logsConnected ? "destructive" : "default"}
              >
                {logsConnected ? "Disconnect" : "Connect to Logs"}
              </Button>
            </CardContent>
          </Card>

          {/* Log Display */}
          <Card>
            <CardHeader>
              <CardTitle>Log Output</CardTitle>
              <CardDescription>
                {logsConnected ? "Live log stream" : "Connect to see logs"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-black text-green-400 font-mono text-sm p-4 rounded-lg overflow-y-auto">
                {logsConnected ? (
                  logs.length > 0 ? (
                    logs.map((log, index) => (
                      <div key={index} className="mb-1">
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500">Waiting for logs...</div>
                  )
                ) : (
                  <div className="text-gray-500">Click "Connect to Logs" to start streaming</div>
                )}
                <div ref={logsEndRef} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}