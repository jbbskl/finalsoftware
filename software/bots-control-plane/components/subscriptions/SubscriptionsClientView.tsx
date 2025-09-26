"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CreditCard, Download, Calendar, Euro, Users, Zap, Clock } from "lucide-react"
import { PlanConfigurator } from "@/components/subscriptions/plan-configurator"
import { getSubscription, getBillingHistory, getPaymentMethods } from "@/lib/api"
import { toast } from "sonner"
import type { Subscription, BillingHistory, PaymentMethod } from "@/lib/types"

interface SubscriptionsClientViewProps {
  userRole: "creator" | "agency" | "admin";
}

export default function SubscriptionsClientView({ userRole }: SubscriptionsClientViewProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [contactSalesOpen, setContactSalesOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [subData, billingData, paymentData] = await Promise.all([
          getSubscription(),
          getBillingHistory(),
          getPaymentMethods()
        ])
        setSubscription(subData)
        setBillingHistory(billingData)
        setPaymentMethods(paymentData)
      } catch (error) {
        console.error("Failed to fetch subscription data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handlePlanUpdate = (models: number, scriptsPerModel: number) => {
    if (subscription) {
      setSubscription({
        ...subscription,
        entitlements: {
          ...subscription.entitlements,
          models,
          scriptsPerModel
        }
      })
    }
  }

  const handleContactSales = async (formData: FormData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success("Sales team will contact you soon!")
      setContactSalesOpen(false)
    } catch (error) {
      toast.error("Failed to submit request")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Subscriptions" description="Manage your subscription plan and billing" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <PageHeader title="Subscriptions" description="Manage your subscription plan and billing" />
        <div className="text-center py-12">
          <p className="text-muted-foreground">No subscription found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Subscriptions" description="Manage your subscription plan and billing" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan Configurator */}
        <PlanConfigurator
          initialModels={subscription.entitlements.models}
          initialScriptsPerModel={subscription.entitlements.scriptsPerModel}
          onSave={handlePlanUpdate}
        />

        {/* Current Plan Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Plan
            </CardTitle>
            <CardDescription>Your current subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan Type</span>
                <Badge variant="outline">{subscription.plan}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge 
                  variant={subscription.status === 'active' ? 'default' : 'destructive'}
                >
                  {subscription.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Models</span>
                <span className="font-medium">{subscription.entitlements.models}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Scripts per Model</span>
                <span className="font-medium">{subscription.entitlements.scriptsPerModel}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Max Concurrent Runs</span>
                <span className="font-medium">{subscription.entitlements.concurrency}</span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly Total</span>
                <span className="text-2xl font-bold">
                  €{typeof subscription.monthlyTotal === 'number' ? subscription.monthlyTotal : subscription.monthlyTotal}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Next Renewal</span>
                <span className="text-sm">
                  {new Date(subscription.nextRenewalAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>Manage your payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentMethods.length > 0 ? (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {method.brand} •••• {method.last4}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Expires {method.expiry}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.is_default && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No payment methods added</p>
              <Button>
                <CreditCard className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>Your recent billing transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {billingHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>{new Date(bill.date).toLocaleDateString()}</TableCell>
                    <TableCell>{bill.description}</TableCell>
                    <TableCell className="font-medium">€{bill.amount}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          bill.status === 'paid' ? 'default' : 
                          bill.status === 'pending' ? 'secondary' : 'destructive'
                        }
                      >
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Invoice
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No billing history available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Sales Dialog */}
      <Dialog open={contactSalesOpen} onOpenChange={setContactSalesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Sales Team</DialogTitle>
            <DialogDescription>
              Our sales team will get back to you within 24 hours to discuss enterprise pricing.
            </DialogDescription>
          </DialogHeader>
          <form action={handleContactSales} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Tell us about your needs..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setContactSalesOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Send Request</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Missing components - let me create them
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className || ''}`} />
}
