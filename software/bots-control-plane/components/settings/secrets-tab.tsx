"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Eye, EyeOff, Trash2 } from "lucide-react"
import { toast } from "sonner"
type SecretItem = {
  key: string
  value: string
  created_at: string
}

const mockSecrets: SecretItem[] = [
  { key: "API_KEY", value: "sk-1234567890abcdef", created_at: "2024-01-15T10:00:00Z" },
  { key: "DATABASE_URL", value: "postgresql://user:pass@host:5432/db", created_at: "2024-01-10T10:00:00Z" },
  { key: "WEBHOOK_SECRET", value: "whsec_abcdef123456", created_at: "2024-01-05T10:00:00Z" },
]

export function SecretsTab() {
  const [secrets, setSecrets] = useState<SecretItem[]>(mockSecrets)
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set())

  const handleAddSecret = () => {
    if (!newKey.trim() || !newValue.trim()) {
      toast.error("Both key and value are required")
      return
    }

    if (secrets.some((s) => s.key === newKey.trim())) {
      toast.error("Secret key already exists")
      return
    }

    const newSecret: SecretItem = {
      key: newKey.trim(),
      value: newValue.trim(),
      created_at: new Date().toISOString(),
    }

    setSecrets([...secrets, newSecret])
    setNewKey("")
    setNewValue("")
    setDialogOpen(false)
    toast.success("Secret added successfully")
  }

  const handleDeleteSecret = (key: string) => {
    setSecrets(secrets.filter((s) => s.key !== key))
    toast.success("Secret deleted successfully")
  }

  const toggleSecretVisibility = (key: string) => {
    const newVisible = new Set(visibleSecrets)
    if (newVisible.has(key)) {
      newVisible.delete(key)
    } else {
      newVisible.add(key)
    }
    setVisibleSecrets(newVisible)
  }

  const maskValue = (value: string) => {
    if (value.length <= 8) return "•".repeat(value.length)
    return value.slice(0, 4) + "•".repeat(value.length - 8) + value.slice(-4)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Environment Secrets</CardTitle>
            <CardDescription>Manage sensitive configuration values</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Secret
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Secret</DialogTitle>
                <DialogDescription>Add a new environment secret for your bots to use.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="secret-key">Key</Label>
                  <Input
                    id="secret-key"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="API_KEY"
                  />
                </div>
                <div>
                  <Label htmlFor="secret-value">Value</Label>
                  <Input
                    id="secret-value"
                    type="password"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Enter secret value"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSecret}>Add Secret</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {secrets.map((secret) => (
              <TableRow key={secret.key}>
                <TableCell className="font-mono font-medium">{secret.key}</TableCell>
                <TableCell className="font-mono">
                  <div className="flex items-center gap-2">
                    <span>{visibleSecrets.has(secret.key) ? secret.value : maskValue(secret.value)}</span>
                    <Button variant="ghost" size="sm" onClick={() => toggleSecretVisibility(secret.key)}>
                      {visibleSecrets.has(secret.key) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(secret.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDeleteSecret(secret.key)} className="text-destructive">
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
        {secrets.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No secrets configured</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
