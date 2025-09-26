"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { BotConfig } from "@/lib/types"
import { CheckCircle, XCircle } from "lucide-react"

interface ConfigPreviewProps {
  config: BotConfig | null
}

export function ConfigPreview({ config }: ConfigPreviewProps) {
  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuration Preview</CardTitle>
          <CardDescription>Select a configuration to preview</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No configuration selected</p>
        </CardContent>
      </Card>
    )
  }

  const isValidJson = () => {
    try {
      JSON.stringify(config.config_data, null, 2)
      return true
    } catch {
      return false
    }
  }

  const valid = isValidJson()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {config.name}
              {config.is_default && <Badge variant="default">Default</Badge>}
            </CardTitle>
            <CardDescription>Bot: {config.bot_name}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {valid ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
            <span className="text-sm text-muted-foreground">{valid ? "Valid" : "Invalid"}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Configuration JSON</h4>
            <pre className="bg-muted p-3 rounded-md text-sm overflow-auto max-h-96">
              {JSON.stringify(config.config_data, null, 2)}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Created:</span>
              <p>{new Date(config.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Updated:</span>
              <p>{new Date(config.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
