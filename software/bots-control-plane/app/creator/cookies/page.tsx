"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Upload, 
  Trash2, 
  Plus, 
  Cookie,
  Calendar,
  Shield,
  AlertTriangle
} from "lucide-react"
import { mockCookies } from "@/lib/mocks"
import { useToast } from "@/hooks/use-toast"

export default function CookiesPage() {
  const { toast } = useToast()
  const [cookies, setCookies] = useState(mockCookies)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [jsonInput, setJsonInput] = useState("")

  const handleDeleteCookie = (cookieKey: string) => {
    const [label, index] = cookieKey.split('-')
    const indexNum = parseInt(index)
    setCookies(prev => prev.filter((_, i) => i !== indexNum))
    toast({
      title: "Cookie deleted",
      description: "The cookie has been removed successfully.",
    })
  }

  const handleUploadJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      
      if (!Array.isArray(parsed)) {
        throw new Error("JSON must be an array")
      }

      const newCookies = parsed.map((item: any, index: number) => ({
        label: item.label || `Uploaded Cookie ${index + 1}`,
        bot: item.bot || "unknown",
        stored_at: new Date().toISOString(),
        status: "active" as const
      }))

      setCookies(prev => [...prev, ...newCookies])
      setJsonInput("")
      setUploadDialogOpen(false)
      
      toast({
        title: "Cookies uploaded",
        description: `${newCookies.length} cookies have been added successfully.`,
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Invalid JSON format. Please check your input.",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case "expired":
        return <Badge variant="secondary">Expired</Badge>
      case "invalid":
        return <Badge variant="destructive">Invalid</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cookies Management"
        description="Manage authentication cookies for your bots"
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Stats Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cookies</CardTitle>
            <Cookie className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cookies.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all platforms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cookies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {cookies.filter(c => c.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {cookies.filter(c => c.status !== "active").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Cookie Storage</CardTitle>
              <CardDescription>
                Manage authentication cookies for your automation bots
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload JSON
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload Cookies from JSON</DialogTitle>
                    <DialogDescription>
                      Paste your cookies JSON data to import multiple cookies at once
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="jsonInput">JSON Data</Label>
                      <Textarea
                        id="jsonInput"
                        placeholder='[{"label": "OnlyFans Session", "bot": "onlyfans_posting", "domain": "onlyfans.com", "name": "session_id", "value": "abc123"}]'
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUploadJSON}>
                        Upload Cookies
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Cookie
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Bot</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cookies.map((cookie, index) => (
                <TableRow key={`${cookie.label}-${index}`}>
                  <TableCell className="font-medium">{cookie.label}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{cookie.bot}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(cookie.stored_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(cookie.status)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCookie(`${cookie.label}-${index}`)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {cookies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Cookie className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No cookies found</p>
              <p className="text-sm">Upload cookies or add them manually to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cookie Information */}
      <Card>
        <CardHeader>
          <CardTitle>Cookie Information</CardTitle>
          <CardDescription>
            Understanding how cookies work with your bots
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <h4>What are cookies?</h4>
            <p>
              Cookies are small pieces of data that websites store on your browser to maintain your login session. 
              Our bots use these cookies to authenticate with platforms like OnlyFans, Fanvue, and F2F.
            </p>
            
            <h4>How to get cookies:</h4>
            <ol>
              <li>Log into the platform manually in your browser</li>
              <li>Open Developer Tools (F12)</li>
              <li>Go to Application/Storage → Cookies</li>
              <li>Copy the relevant session cookies</li>
              <li>Upload them here using the JSON format</li>
            </ol>
            
            <h4>Security:</h4>
            <p>
              Cookies are stored securely and only used for legitimate automation purposes. 
              Never share your cookies with others as they provide access to your accounts.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
