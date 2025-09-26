"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Copy, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Mail,
  ExternalLink,
  CheckCircle,
  Clock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AffiliatePage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  
  // Mock data
  const referralLink = "https://botscontrol.com/ref/creator123"
  const stats = {
    clicks: 42,
    signups: 8,
    conversions: 3,
    payouts: 240
  }
  
  const payouts = [
    {
      id: "payout_001",
      amount: 120,
      currency: "EUR",
      status: "paid",
      date: "2024-01-15",
      description: "Commission for 3 referrals"
    },
    {
      id: "payout_002",
      amount: 80,
      currency: "EUR", 
      status: "pending",
      date: "2024-01-01",
      description: "Commission for 2 referrals"
    },
    {
      id: "payout_003",
      amount: 40,
      currency: "EUR",
      status: "paid",
      date: "2023-12-15",
      description: "Commission for 1 referral"
    }
  ]

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    toast({
      title: "Link copied!",
      description: "Your referral link has been copied to clipboard.",
    })
  }

  const handleInvite = () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address.",
        variant: "destructive"
      })
      return
    }
    
    toast({
      title: "Invitation sent!",
      description: `Invitation sent to ${email}`,
    })
    setEmail("")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Affiliate Program"
        description="Earn commissions by referring new users to our platform"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Stats Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clicks}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.signups}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.signups / stats.clicks) * 100).toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversions}</div>
            <p className="text-xs text-muted-foreground">
              Paid subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.payouts}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="referral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="referral">Referral Link</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="terms">Terms</TabsTrigger>
        </TabsList>

        <TabsContent value="referral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
              <CardDescription>
                Share this link to earn 20% commission on all referrals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="flex-1"
                />
                <Button onClick={handleCopyLink} variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Invite by Email</h4>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                  />
                  <Button onClick={handleInvite}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invite
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>
                Track your commission payments and earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>{payout.date}</TableCell>
                      <TableCell>{payout.description}</TableCell>
                      <TableCell>€{payout.amount}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={payout.status === "paid" ? "default" : "secondary"}
                          className={payout.status === "paid" ? "bg-green-100 text-green-800" : ""}
                        >
                          {payout.status === "paid" ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commission Plan</CardTitle>
              <CardDescription>
                How our affiliate program works
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <h4>Commission Structure</h4>
                <ul>
                  <li><strong>20% Commission:</strong> Earn 20% of the first month's subscription for each successful referral</li>
                  <li><strong>Recurring Commission:</strong> Earn 10% of ongoing subscription fees for the first 12 months</li>
                  <li><strong>Minimum Payout:</strong> €50 minimum before payout is processed</li>
                  <li><strong>Payout Schedule:</strong> Monthly payouts on the 15th of each month</li>
                </ul>
                
                <h4>Requirements</h4>
                <ul>
                  <li>Referral must sign up using your unique link</li>
                  <li>Referral must complete their first payment</li>
                  <li>No self-referrals or fraudulent activity</li>
                </ul>
                
                <h4>Terms & Conditions</h4>
                <p>
                  By participating in our affiliate program, you agree to our terms of service. 
                  We reserve the right to modify or terminate the program at any time.
                </p>
                
                <Button variant="outline" className="mt-4">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Terms
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
