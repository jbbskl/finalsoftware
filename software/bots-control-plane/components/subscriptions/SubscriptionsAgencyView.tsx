"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  CreditCard, 
  Coins, 
  Check, 
  X, 
  Calculator,
  Crown,
  Building,
  Bot,
  Star,
  Loader2
} from "lucide-react";

interface InvoiceData {
  kind: "agency";
  creator_bots: string[];
  agency_bots: string[];
  platforms: string[];
  models_per_platform: { [platform: string]: number };
  company_name?: string;
  vat_id?: string;
}

interface PricingTier {
  min_models: number;
  max_models: number;
  price_per_model: number;
  label: string;
}

const CREATOR_BOTS = [
  { code: "f2f_post", name: "F2F Post" },
  { code: "f2f_dm", name: "F2F DM" },
  { code: "of_post", name: "OF Post" },
  { code: "of_dm", name: "OF DM" },
  { code: "fanvue_post", name: "Fanvue Post" },
  { code: "fanvue_dm", name: "Fanvue DM" },
];

const AGENCY_BOTS = [
  { platform: "instagram", bots: ["post", "story", "reel"] },
  { platform: "tiktok", bots: ["video", "live"] },
  { platform: "twitter", bots: ["tweet", "retweet"] },
  { platform: "youtube", bots: ["video", "short"] },
  { platform: "linkedin", bots: ["post", "article"] },
  { platform: "pinterest", bots: ["pin", "board"] },
];

const PRICING_TIERS: PricingTier[] = [
  { min_models: 0, max_models: 49, price_per_model: 65, label: "Standard" },
  { min_models: 50, max_models: 99, price_per_model: 60, label: "Professional" },
  { min_models: 100, max_models: Infinity, price_per_model: 50, label: "Enterprise" },
];

export default function SubscriptionsAgencyView() {
  const [selectedCreatorBots, setSelectedCreatorBots] = useState<string[]>([]);
  const [selectedAgencyBots, setSelectedAgencyBots] = useState<{ [platform: string]: string[] }>({});
  const [modelsPerPlatform, setModelsPerPlatform] = useState<{ [platform: string]: number }>({});
  const [showModal, setShowModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"invoice" | "crypto">("invoice");
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [companyInfo, setCompanyInfo] = useState({
    company_name: "",
    vat_id: "",
  });

  const calculatePricing = () => {
    const totalModels = Object.values(modelsPerPlatform).reduce((sum, count) => sum + count, 0);
    const creatorCost = selectedCreatorBots.length * 40; // €40 per automation (not multiplied by models)
    
    let agencyCost = 0;
    let currentTier = PRICING_TIERS[0];
    
    // Find the appropriate pricing tier
    for (const tier of PRICING_TIERS) {
      if (totalModels >= tier.min_models && totalModels <= tier.max_models) {
        currentTier = tier;
        break;
      }
    }
    
    // Calculate agency cost: platforms × models × price_per_model
    for (const [platform, models] of Object.entries(modelsPerPlatform)) {
      if (selectedAgencyBots[platform]?.length > 0) {
        agencyCost += selectedAgencyBots[platform].length * models * currentTier.price_per_model;
      }
    }
    
    return {
      creatorCost,
      agencyCost,
      totalCost: creatorCost + agencyCost,
      totalModels,
      currentTier,
    };
  };

  const handleCreatorBotToggle = (botCode: string) => {
    setSelectedCreatorBots(prev => 
      prev.includes(botCode) 
        ? prev.filter(code => code !== botCode)
        : [...prev, botCode]
    );
  };

  const handleAgencyBotToggle = (platform: string, bot: string) => {
    setSelectedAgencyBots(prev => ({
      ...prev,
      [platform]: prev[platform]?.includes(bot)
        ? prev[platform].filter(b => b !== bot)
        : [...(prev[platform] || []), bot]
    }));
  };

  const handleModelsChange = (platform: string, models: number) => {
    setModelsPerPlatform(prev => ({
      ...prev,
      [platform]: Math.max(0, models)
    }));
  };

  const handleSaveAndContinue = () => {
    const pricing = calculatePricing();
    const selectedPlatforms = Object.keys(selectedAgencyBots).filter(
      platform => selectedAgencyBots[platform]?.length > 0
    );

    if (selectedCreatorBots.length === 0 && selectedPlatforms.length === 0) {
      toast.error("Please select at least one bot or platform");
      return;
    }

    setInvoiceData({
      kind: "agency",
      creator_bots: selectedCreatorBots,
      agency_bots: selectedPlatforms.flatMap(platform => 
        selectedAgencyBots[platform].map(bot => `${platform}_${bot}`)
      ),
      platforms: selectedPlatforms,
      models_per_platform: modelsPerPlatform,
      company_name: companyInfo.company_name,
      vat_id: companyInfo.vat_id,
    });

    setShowModal(true);
  };

  const handleCreateInvoice = async () => {
    if (!invoiceData) return;

    try {
      setLoading(true);
      
      // TODO: Replace with actual API call
      // const response = await createInvoice(invoiceData);
      // const result = await response.json();
      
      // Mock response
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockInvoiceUrl = "https://invoice.example.com/inv_123456";
      
      toast.success("Invoice created successfully");
      window.open(mockInvoiceUrl, "_blank");
      
      // Start polling for payment status
      // pollInvoiceStatus(result.invoice_id);
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  const pricing = calculatePricing();
  const selectedPlatforms = Object.keys(selectedAgencyBots).filter(
    platform => selectedAgencyBots[platform]?.length > 0
  );

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Agency Subscriptions</h1>
        <p className="text-muted-foreground">
          Choose your automation packages and scale your business
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creator Bots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Creator Bots
            </CardTitle>
            <CardDescription>
              Essential automation tools for content creators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">€40</div>
              <div className="text-sm text-muted-foreground">per automation</div>
              <div className="text-xs text-muted-foreground mt-1">
                (not multiplied by models)
              </div>
            </div>
            
            <div className="space-y-2">
              {CREATOR_BOTS.map(bot => (
                <div
                  key={bot.code}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCreatorBots.includes(bot.code)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  }`}
                  onClick={() => handleCreatorBotToggle(bot.code)}
                >
                  <div className="flex items-center gap-3">
                    {selectedCreatorBots.includes(bot.code) ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <div className="h-4 w-4 rounded border border-border" />
                    )}
                    <span className="font-medium">{bot.name}</span>
                  </div>
                  <Badge variant="outline">Creator</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agency Bots */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Agency Bots
            </CardTitle>
            <CardDescription>
              Advanced automation for agencies and businesses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRICING_TIERS.map((tier, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    pricing.currentTier === tier
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold">€{tier.price_per_model}</div>
                    <div className="text-sm text-muted-foreground">per model</div>
                    <Badge variant={pricing.currentTier === tier ? "default" : "outline"} className="mt-2">
                      {tier.label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Platform Selection */}
            <div className="space-y-4">
              {AGENCY_BOTS.map(platformGroup => (
                <div key={platformGroup.platform} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold capitalize">{platformGroup.platform}</h3>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`models-${platformGroup.platform}`} className="text-sm">
                        Models:
                      </Label>
                      <Input
                        id={`models-${platformGroup.platform}`}
                        type="number"
                        min="0"
                        value={modelsPerPlatform[platformGroup.platform] || 0}
                        onChange={(e) => handleModelsChange(platformGroup.platform, parseInt(e.target.value) || 0)}
                        className="w-20 h-8"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {platformGroup.bots.map(bot => (
                      <div
                        key={bot}
                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                          selectedAgencyBots[platformGroup.platform]?.includes(bot)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted"
                        }`}
                        onClick={() => handleAgencyBotToggle(platformGroup.platform, bot)}
                      >
                        {selectedAgencyBots[platformGroup.platform]?.includes(bot) ? (
                          <Check className="h-3 w-3 text-primary" />
                        ) : (
                          <div className="h-3 w-3 rounded border border-border" />
                        )}
                        <span className="text-sm capitalize">{bot}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Support Badge */}
            {pricing.totalModels >= 30 && (
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                <Star className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-semibold text-purple-900">Custom Support & Setup</div>
                  <div className="text-sm text-purple-700">
                    With {pricing.totalModels}+ models, you get dedicated support and custom setup
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pricing Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Pricing Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Creator Bots ({selectedCreatorBots.length} automations)</span>
                <span>€{pricing.creatorCost}</span>
              </div>
              
              {selectedPlatforms.map(platform => {
                const bots = selectedAgencyBots[platform]?.length || 0;
                const models = modelsPerPlatform[platform] || 0;
                const cost = bots * models * pricing.currentTier.price_per_model;
                
                return (
                  <div key={platform} className="flex justify-between">
                    <span className="capitalize">
                      {platform} ({bots} bots × {models} models)
                    </span>
                    <span>€{cost}</span>
                  </div>
                );
              })}
              
              <Separator />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>€{pricing.totalCost}</span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Total Models: {pricing.totalModels}</p>
                <p>Pricing Tier: {pricing.currentTier.label}</p>
                <p>€{pricing.currentTier.price_per_model} per model</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name (Optional)</Label>
                <Input
                  id="company_name"
                  value={companyInfo.company_name}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Enter company name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vat_id">VAT ID (Optional)</Label>
                <Input
                  id="vat_id"
                  value={companyInfo.vat_id}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, vat_id: e.target.value }))}
                  placeholder="Enter VAT ID"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleSaveAndContinue}
              disabled={selectedCreatorBots.length === 0 && selectedPlatforms.length === 0}
              className="px-8"
            >
              Save & Continue
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showModal && invoiceData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Complete Your Subscription</CardTitle>
              <CardDescription>
                Choose your payment method to activate your agency subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Method Selection */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={paymentMethod === "invoice" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("invoice")}
                  className="h-16 flex flex-col gap-2"
                >
                  <CreditCard className="h-6 w-6" />
                  <span>Invoice</span>
                </Button>
                <Button
                  variant={paymentMethod === "crypto" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("crypto")}
                  className="h-16 flex flex-col gap-2"
                >
                  <Coins className="h-6 w-6" />
                  <span>Crypto</span>
                </Button>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold">€{pricing.totalCost}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {paymentMethod === "invoice" 
                      ? "You'll receive an invoice via email"
                      : "Crypto payment will be processed immediately"
                    }
                  </div>
                </div>

                {paymentMethod === "invoice" && (
                  <div className="space-y-2">
                    <Label>Invoice Details</Label>
                    <div className="text-sm space-y-1">
                      <p>• Invoice will be sent to your registered email</p>
                      <p>• Payment terms: 14 days</p>
                      <p>• Access will be granted after payment confirmation</p>
                    </div>
                  </div>
                )}

                {paymentMethod === "crypto" && (
                  <div className="space-y-2">
                    <Label>Crypto Payment</Label>
                    <div className="text-sm space-y-1">
                      <p>• Supported: Bitcoin, Ethereum, USDC</p>
                      <p>• Real-time conversion rate</p>
                      <p>• Access granted immediately after confirmation</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateInvoice}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {paymentMethod === "invoice" ? <CreditCard className="h-4 w-4" /> : <Coins className="h-4 w-4" />}
                      {paymentMethod === "invoice" ? "Create Invoice" : "Pay with Crypto"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}