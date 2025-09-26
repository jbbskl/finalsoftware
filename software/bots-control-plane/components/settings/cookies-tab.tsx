"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Upload, MoreHorizontal, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Cookie } from "@/lib/types"

const mockCookies: Cookie[] = [
  { label: "Session Cookie", bot: "f2f_posting", stored_at: "2024-01-15T10:00:00Z", status: "active" as const },
  { label: "Auth Token", bot: "fanvue_posting", stored_at: "2024-01-10T10:00:00Z", status: "active" as const },
]

export function CookiesTab() {
  const [cookies, setCookies] = useState<Cookie[]>(mockCookies)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [newLabel, setNewLabel] = useState("")
  const [newBot, setNewBot] = useState("")
  const [jsonInput, setJsonInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddCookie = () => {
    if (!newLabel.trim() || !newBot.trim()) {
      toast.error("Label and bot are required")
      return
    }

    const newCookie: Cookie = {
      label: newLabel.trim(),
      bot: newBot.trim(),
      stored_at: new Date().toISOString(),
      status: "active" as const,
    }

    setCookies([...cookies, newCookie])
    setNewLabel("")
    setNewBot("")
    setDialogOpen(false)
    toast.success("Cookie added successfully")
  }

  const handleUploadJson = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      if (!Array.isArray(parsed)) {
        toast.error("JSON must be an array of cookie objects")
        return
      }

      const newCookies: Cookie[] = parsed.map((item: any) => ({
        label: item.label || "Uploaded Cookie",
        bot: item.bot || "unknown",
        stored_at: new Date().toISOString(),
        status: "active" as const,
      }))

      setCookies([...cookies, ...newCookies])
      setJsonInput("")
      setUploadDialogOpen(false)
      toast.success(`${newCookies.length} cookies imported successfully`)
    } catch (error) {
      toast.error("Invalid JSON format")
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setJsonInput(content)
    }
    reader.readAsText(file)
  }

  const handleDeleteCookie = (label: string, bot: string) => {
    setCookies(cookies.filter((c) => !(c.label === label && c.bot === bot)))
    toast.success("Cookie deleted successfully")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Browser Cookies</CardTitle>
            <CardDescription>Manage cookies for bot browser sessions</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload JSON
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Cookies JSON</DialogTitle>
                  <DialogDescription>
                    Upload a JSON file containing cookie data or paste JSON directly.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Upload File</Label>
                    <Input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} />
                  </div>
                  <div>
                    <Label htmlFor="json-input">Or paste JSON</Label>
                    <Textarea
                      id="json-input"
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder='[{"domain": "example.com", "name": "session", "value": "abc123"}]'
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUploadJson}>Import Cookies</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cookie
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Cookie</DialogTitle>
                  <DialogDescription>Add a new cookie for bot browser sessions.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cookie-domain">Label</Label>
                    <Input
                      id="cookie-domain"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Session Cookie"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cookie-name">Bot</Label>
                    <Input
                      id="cookie-name"
                      value={newBot}
                      onChange={(e) => setNewBot(e.target.value)}
                      placeholder="f2f_posting"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCookie}>Add Cookie</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Bot</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stored</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cookies.map((cookie, index) => (
              <TableRow key={`${cookie.label}-${cookie.bot}-${index}`}>
                <TableCell className="font-mono">{cookie.label}</TableCell>
                <TableCell className="font-mono font-medium">{cookie.bot}</TableCell>
                <TableCell className="text-sm">
                  <Badge variant={cookie.status === "active" ? "default" : "secondary"}>
                    {cookie.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(cookie.stored_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDeleteCookie(cookie.label, cookie.bot)}
                        className="text-destructive"
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
        {cookies.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No cookies configured</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
