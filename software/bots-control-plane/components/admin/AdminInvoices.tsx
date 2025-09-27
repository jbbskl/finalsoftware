"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Receipt, 
  Search, 
  Filter, 
  ExternalLink,
  Download,
  Eye,
  Loader2,
  DollarSign,
  Calendar,
  CreditCard,
  Coins
} from "lucide-react";

interface Invoice {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "cancelled";
  provider: "stripe" | "crypto" | "manual";
  created_at: string;
  paid_at?: string;
  due_date?: string;
  invoice_url?: string;
  subscription_id?: string;
  description: string;
}

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      
      // Mock data for admin invoices
      const mockInvoices: Invoice[] = [
        {
          id: "inv_001",
          user_id: "user_123",
          user_email: "john@example.com",
          user_name: "John Creator",
          amount: 40,
          currency: "EUR",
          status: "paid",
          provider: "stripe",
          created_at: "2024-01-01T00:00:00Z",
          paid_at: "2024-01-01T10:30:00Z",
          invoice_url: "https://invoice.stripe.com/inv_001",
          subscription_id: "sub_1",
          description: "Creator subscription - 6 bots"
        },
        {
          id: "inv_002",
          user_id: "org_456",
          user_email: "admin@agency.com",
          user_name: "Agency Solutions",
          amount: 1200,
          currency: "EUR",
          status: "paid",
          provider: "crypto",
          created_at: "2024-01-05T00:00:00Z",
          paid_at: "2024-01-05T14:20:00Z",
          invoice_url: "https://crypto.invoice.com/inv_002",
          subscription_id: "sub_2",
          description: "Agency subscription - 19 bots"
        },
        {
          id: "inv_003",
          user_id: "user_789",
          user_email: "jane@example.com",
          user_name: "Jane Content",
          amount: 40,
          currency: "EUR",
          status: "pending",
          provider: "stripe",
          created_at: "2024-01-10T00:00:00Z",
          due_date: "2024-01-24T00:00:00Z",
          invoice_url: "https://invoice.stripe.com/inv_003",
          subscription_id: "sub_3",
          description: "Creator subscription - 6 bots"
        },
        {
          id: "inv_004",
          user_id: "user_202",
          user_email: "mike@example.com",
          user_name: "Mike Influencer",
          amount: 40,
          currency: "EUR",
          status: "failed",
          provider: "stripe",
          created_at: "2024-01-12T00:00:00Z",
          invoice_url: "https://invoice.stripe.com/inv_004",
          subscription_id: "sub_5",
          description: "Creator subscription - 6 bots"
        },
        {
          id: "inv_005",
          user_id: "org_101",
          user_email: "team@startup.com",
          user_name: "Startup Team",
          amount: 800,
          currency: "EUR",
          status: "paid",
          provider: "manual",
          created_at: "2023-12-15T00:00:00Z",
          paid_at: "2023-12-20T09:15:00Z",
          subscription_id: "sub_4",
          description: "Agency subscription - 13 bots"
        },
        {
          id: "inv_006",
          user_id: "user_333",
          user_email: "sarah@example.com",
          user_name: "Sarah Creator",
          amount: 40,
          currency: "EUR",
          status: "cancelled",
          provider: "stripe",
          created_at: "2024-01-08T00:00:00Z",
          invoice_url: "https://invoice.stripe.com/inv_006",
          subscription_id: "sub_6",
          description: "Creator subscription - 6 bots"
        }
      ];

      setInvoices(mockInvoices);
    } catch (error) {
      console.error("Error loading invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "stripe":
        return <CreditCard className="h-4 w-4" />;
      case "crypto":
        return <Coins className="h-4 w-4" />;
      case "manual":
        return <Receipt className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      if (!invoice.invoice_url) {
        toast.error("No invoice URL available");
        return;
      }
      
      // Open invoice URL in new tab
      window.open(invoice.invoice_url, "_blank");
      toast.success("Invoice opened in new tab");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    const matchesProvider = providerFilter === "all" || invoice.provider === providerFilter;
    
    return matchesSearch && matchesStatus && matchesProvider;
  });

  const totalRevenue = invoices
    .filter(invoice => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const pendingAmount = invoices
    .filter(invoice => invoice.status === "pending")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  if (loading) {
    return (
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-muted-foreground">
            Manage all invoices and payments
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="text-muted-foreground">
          Manage all invoices and payment transactions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{invoices.length}</div>
                <div className="text-sm text-muted-foreground">Total Invoices</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">€{totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">€{pendingAmount.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Pending Amount</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {invoices.filter(i => i.status === "paid").length}
                </div>
                <div className="text-sm text-muted-foreground">Paid Invoices</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            View and manage all invoices across the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or invoice ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Providers</option>
                <option value="stripe">Stripe</option>
                <option value="crypto">Crypto</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardContent className="p-0">
          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || providerFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "No invoices have been created yet."
                }
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredInvoices.map(invoice => (
                <div key={invoice.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getProviderIcon(invoice.provider)}
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{invoice.id}</span>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground capitalize">
                            {invoice.provider}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.user_name} ({invoice.user_email})
                        </div>
                        <div className="text-sm">
                          {invoice.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(invoice.created_at).toLocaleDateString()}
                          {invoice.paid_at && (
                            <span> • Paid: {new Date(invoice.paid_at).toLocaleDateString()}</span>
                          )}
                          {invoice.due_date && (
                            <span> • Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">
                          €{invoice.amount} {invoice.currency}
                        </div>
                        {invoice.subscription_id && (
                          <div className="text-sm text-muted-foreground">
                            {invoice.subscription_id}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {invoice.invoice_url && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination would go here */}
      <div className="flex justify-center">
        <div className="text-sm text-muted-foreground">
          Showing {filteredInvoices.length} of {invoices.length} invoices
        </div>
      </div>
    </main>
  );
}