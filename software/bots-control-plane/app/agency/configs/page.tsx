"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { PageHeader } from "@/components/page-header"
import { SmartConfigDialog } from "@/components/configs/smart-config-dialog"
import { ConfigPreview } from "@/components/configs/config-preview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getConfigs, createConfig, updateConfig, deleteConfig } from "@/lib/api"
import type { BotConfig } from "@/lib/types"
import { Search, Plus, MoreHorizontal, Edit, Copy, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/contexts/user-context"

export default function ConfigsPage() {
  const { user } = useUser()
  const [search, setSearch] = useState("")
  const [selectedConfig, setSelectedConfig] = useState<BotConfig | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "duplicate">("create")
  const [dialogConfig, setDialogConfig] = useState<BotConfig | undefined>()

  const queryClient = useQueryClient()

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["configs", user?.id],
    queryFn: () => getConfigs(user?.id),
  })

  const filteredConfigs = configs.filter(
    (config) =>
      config.name.toLowerCase().includes(search.toLowerCase()) ||
      config.bot_name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleCreateConfig = () => {
    setDialogMode("create")
    setDialogConfig(undefined)
    setDialogOpen(true)
  }

  const handleEditConfig = (config: BotConfig) => {
    setDialogMode("edit")
    setDialogConfig(config)
    setDialogOpen(true)
  }

  const handleDuplicateConfig = (config: BotConfig) => {
    setDialogMode("duplicate")
    setDialogConfig(config)
    setDialogOpen(true)
  }

  const handleMakeDefault = async (config: BotConfig) => {
    try {
      await updateConfig(config.id, { is_default: true })
      queryClient.invalidateQueries({ queryKey: ["configs"] })
      toast.success("Configuration set as default")
    } catch (error) {
      toast.error("Failed to set as default")
    }
  }

  const handleDeleteConfig = async (config: BotConfig) => {
    if (config.is_default) {
      toast.error("Cannot delete default configuration")
      return
    }

    try {
      await deleteConfig(config.id)
      queryClient.invalidateQueries({ queryKey: ["configs"] })
      if (selectedConfig?.id === config.id) {
        setSelectedConfig(null)
      }
      toast.success("Configuration deleted")
    } catch (error) {
      toast.error("Failed to delete configuration")
    }
  }

  const handleSaveConfig = async (configData: Partial<BotConfig>) => {
    try {
      if (dialogMode === "create" || dialogMode === "duplicate") {
        await createConfig(configData as Omit<BotConfig, "id" | "created_at" | "updated_at">)
        toast.success("Configuration created successfully")
      } else {
        await updateConfig(dialogConfig!.id, configData)
        toast.success("Configuration updated successfully")
      }
      queryClient.invalidateQueries({ queryKey: ["configs"] })
    } catch (error) {
      toast.error("Failed to save configuration")
    }
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <PageHeader title="Phases" description="Manage bot phases and settings">
          <Button onClick={handleCreateConfig}>
            <Plus className="h-4 w-4 mr-2" />
            New Phase
          </Button>
        </PageHeader>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search configurations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground">{filteredConfigs.length} configurations</div>
        </div>

        {/* Configurations Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Bot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConfigs.map((config) => (
                  <TableRow
                    key={config.id}
                    className={`cursor-pointer ${selectedConfig?.id === config.id ? "bg-muted/50" : ""}`}
                    onClick={() => setSelectedConfig(config)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {config.name}
                        {config.is_default && (
                          <Badge variant="default" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{config.bot_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(config.updated_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditConfig(config)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateConfig(config)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          {!config.is_default && (
                            <DropdownMenuItem onClick={() => handleMakeDefault(config)}>
                              <Star className="h-4 w-4 mr-2" />
                              Make Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteConfig(config)}
                            className="text-destructive"
                            disabled={config.is_default}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredConfigs.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No configurations found</p>
          </div>
        )}
      </div>

      {/* Preview Sidebar */}
      <div className="w-96 flex-shrink-0">
        <ConfigPreview config={selectedConfig} />
      </div>

      {/* Config Dialog */}
              <SmartConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={dialogConfig}
        onSave={handleSaveConfig}
        mode={dialogMode}
      />
    </div>
  )
}
