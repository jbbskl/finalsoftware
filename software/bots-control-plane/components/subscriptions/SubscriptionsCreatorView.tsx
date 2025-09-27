"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createInvoice, getInvoice, postStripeWebhookDev, postCryptoWebhookDev } from "@/lib/api"
import { toast } from "sonner"
import { CreditCard, Coins, Download, Check, X } from "lucide-react"

const CREATOR_BOTS = [
  { code: "f2f_post", name: "F2F Posting" },
  { code: "f2f_dm", name: "F2F Messaging" },
  { code: "of_post", name: "OnlyFans Posting" },
  { code: "of_dm", name: "OnlyFans Messaging" },
  { code: "fanvue_post", name: "Fanvue Posting" },
  { code: "fanvue_dm", name: "Fanvue Messaging" }
]

const PRICE_PER_AUTOMATION = 40

export default function SubscriptionsCreatorView() {
  const [selectedBots, setSelectedBots] = useState<string[]>([])
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false)
  const [currentInvoice, setCurrentInvoice] = useState<any>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const [companyInfo, setCompanyInfo] = useState({
    companyName: "",
    vatNumber: ""
  })

  const handleBotToggle = (botCode: string) => {
    setSelectedBots(prev => 
      prev.includes(botCode) 
        ? prev.filter(code => code !== botCode)
        : [...prev, botCode]
    )
  }

  const totalPrice = selectedBots.length * PRICE_PER_AUTOMATION

  const handleCreateInvoice = async (provider: 'stripe' | 'crypto') => {
    if (selectedBots.length === 0) {
      toast.error("Please select at least one automation")
      return
    }

    setIsCreatingInvoice(true)
    try {
      const invoice = await createInvoice({
        kind: 'creator',
        bots: selectedBots
      })
      
      setCurrentInvoice(invoice)
      toast.success("Invoice created successfully")
      
      // Open invoice URL in new tab
      window.open(invoice.invoice_url, '_blank')
      
      // Start polling for payment status
      startPolling(invoice.invoice_id)
    } catch (error) {
      console.error("Error creating invoice:", error)
      toast.error("Failed to create invoice")
    } finally {
      setIsCreatingInvoice(false)
    }
  }

  const startPolling = async (invoiceId: string) => {
    setIsPolling(true)
    
    const pollInterval = setInterval(async () => {
      try {
        const invoice = await getInvoice(invoiceId)
        if (invoice.status === 'paid') {
          clearInterval(pollInterval)
          setIsPolling(false)
          setCurrentInvoice(null)
          toast.success("Payment successful! Access granted.")
          // Refresh billing history
          loadBillingHistory()
        }
      } catch (error) {
        console.error("Error polling invoice:", error)
      }
    }, 2000)

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      setIsPolling(false)
    }, 300000)
  }

  const handleDevPayment = async (provider: 'stripe' | 'crypto') => {
    if (!currentInvoice) return

    try {
      if (provider === 'stripe') {
        await postStripeWebhookDev(currentInvoice.invoice_id)
      } else {
        await postCryptoWebhookDev(currentInvoice.invoice_id)
      }
      toast.success("Payment marked as complete (dev mode)")
    } catch (error) {
      console.error("Error marking payment:", error)
      toast.error("Failed to mark payment")
    }
  }

  const loadBillingHistory = async () => {
    // Mock billing history - in real app, fetch from API
    setBillingHistory([
      {
        id: "inv-001",
        date: "2024-01-15",
        amount: 120,
        status: "paid",
        automations: 3,
        provider: "stripe"
      }
    ])
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Subscriptions" 
        description="Manage your automation subscriptions" 
      />

      {/* Automation Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Automations</CardTitle>
          <CardDescription>
            Choose which bot automations you want to use. Each automation costs €{PRICE_PER_AUTOMATION}/month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CREATOR_BOTS.map((bot) => (
              <div key={bot.code} className="flex items-center space-x-2">
                <Checkbox
                  id={bot.code}
                  checked={selectedBots.includes(bot.code)}
                  onCheckedChange={() => handleBotToggle(bot.code)}
                />
                <Label htmlFor={bot.code} className="text-sm font-medium">
                  {bot.name}
                </Label>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">
                {selectedBots.length} automation{selectedBots.length !== 1 ? 's' : ''} selected
              </span>
              <span className="text-lg font-bold">
                €{totalPrice}/month
              </span>
            </div>
          </div>

          <div className="mt-4">
            <Button 
              onClick={() => {/* Save & Continue opens modal */}} 
              disabled={selectedBots.length === 0}
              className="w-full"
            >
              Save & Continue
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            onClick={() => {/* This will be triggered by Save & Continue */}} 
            disabled={selectedBots.length === 0}
            className="w-full"
          >
            Save & Continue
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Choose your payment method for {selectedBots.length} automation{selectedBots.length !== 1 ? 's' : ''} (€{totalPrice}/month)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Tabs defaultValue="invoice" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="invoice">Invoice</TabsTrigger>
                <TabsTrigger value="crypto">Crypto</TabsTrigger>
              </TabsList>
              
              <TabsContent value="invoice" className="space-y-4">
                <div className="text-center py-4">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Pay with credit card or bank transfer
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name (Optional)</Label>
                  <Input
                    id="company-name"
                    placeholder="Your company name"
                    value={companyInfo.companyName}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, companyName: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vat-number">VAT Number (Optional)</Label>
                  <Input
                    id="vat-number"
                    placeholder="Your VAT number"
                    value={companyInfo.vatNumber}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, vatNumber: e.target.value }))}
                  />
                </div>
                
                <Button 
                  onClick={() => handleCreateInvoice('stripe')}
                  disabled={isCreatingInvoice}
                  className="w-full"
                >
                  {isCreatingInvoice ? "Creating..." : "Pay with Stripe"}
                </Button>
              </TabsContent>
              
              <TabsContent value="crypto" className="space-y-4">
                <div className="text-center py-4">
                  <Coins className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Pay with cryptocurrency
                  </p>
                </div>
                
                <Button 
                  onClick={() => handleCreateInvoice('crypto')}
                  disabled={isCreatingInvoice}
                  className="w-full"
                >
                  {isCreatingInvoice ? "Creating..." : "Pay with Crypto"}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Status */}
      {currentInvoice && (
        <Card>
          <CardHeader>
            <CardTitle>Payment in Progress</CardTitle>
            <CardDescription>
              Complete your payment to activate your automations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Waiting for payment...</span>
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDevPayment('stripe')}
                >
                  Mark as Paid (Dev)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(currentInvoice.invoice_url, '_blank')}
                >
                  View Invoice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            Your past and current invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {billingHistory.length > 0 ? (
            <div className="space-y-3">
              {billingHistory.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {invoice.automations} automation{invoice.automations !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(invoice.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-medium">€{invoice.amount}</div>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Download className="h-12 w-12 mx-auto mb-4" />
              <p>No billing history</p>
              <p className="text-sm">Your invoices will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}