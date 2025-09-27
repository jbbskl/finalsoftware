"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Users, 
  Search, 
  Filter, 
  ExternalLink,
  Eye,
  Loader2,
  Calendar,
  DollarSign,
  Bot
} from "lucide-react";
import Link from "next/link";

interface Subscription {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  plan: "creator" | "agency";
  status: "active" | "inactive" | "cancelled" | "expired";
  created_at: string;
  updated_at: string;
  next_billing_date?: string;
  amount: number;
  currency: string;
  bot_count: number;
  company_name?: string;
}

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      
      // Mock data for admin subscriptions
      const mockSubscriptions: Subscription[] = [
        {
          id: "sub_1",
          user_id: "user_123",
          user_email: "john@example.com",
          user_name: "John Creator",
          plan: "creator",
          status: "active",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-15T10:30:00Z",
          next_billing_date: "2024-02-01T00:00:00Z",
          amount: 40,
          currency: "EUR",
          bot_count: 6,
          company_name: "Creator Co."
        },
        {
          id: "sub_2",
          user_id: "org_456",
          user_email: "admin@agency.com",
          user_name: "Agency Solutions",
          plan: "agency",
          status: "active",
          created_at: "2024-01-05T00:00:00Z",
          updated_at: "2024-01-15T10:30:00Z",
          next_billing_date: "2024-02-05T00:00:00Z",
          amount: 1200,
          currency: "EUR",
          bot_count: 19,
          company_name: "Agency Solutions Ltd."
        },
        {
          id: "sub_3",
          user_id: "user_789",
          user_email: "jane@example.com",
          user_name: "Jane Content",
          plan: "creator",
          status: "inactive",
          created_at: "2023-12-15T00:00:00Z",
          updated_at: "2024-01-10T00:00:00Z",
          amount: 40,
          currency: "EUR",
          bot_count: 6
        },
        {
          id: "sub_4",
          user_id: "org_101",
          user_email: "team@startup.com",
          user_name: "Startup Team",
          plan: "agency",
          status: "cancelled",
          created_at: "2023-11-01T00:00:00Z",
          updated_at: "2024-01-05T00:00:00Z",
          amount: 800,
          currency: "EUR",
          bot_count: 13,
          company_name: "Startup Inc."
        },
        {
          id: "sub_5",
          user_id: "user_202",
          user_email: "mike@example.com",
          user_name: "Mike Influencer",
          plan: "creator",
          status: "active",
          created_at: "2024-01-10T00:00:00Z",
          updated_at: "2024-01-15T10:30:00Z",
          next_billing_date: "2024-02-10T00:00:00Z",
          amount: 40,
          currency: "EUR",
          bot_count: 6
        }
      ];

      setSubscriptions(mockSubscriptions);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "creator":
        return "bg-blue-100 text-blue-800";
      case "agency":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = 
      subscription.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subscription.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subscription.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || subscription.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage all user subscriptions
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Subscriptions</CardTitle>
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
        <h1 className="text-2xl font-semibold">Subscriptions</h1>
        <p className="text-muted-foreground">
          Manage all user subscriptions across the platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{subscriptions.length}</div>
                <div className="text-sm text-muted-foreground">Total Subscriptions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {subscriptions.filter(s => s.status === "active").length}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  €{subscriptions.reduce((sum, s) => sum + (s.status === "active" ? s.amount : 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Monthly Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">
                  {subscriptions.filter(s => s.plan === "agency").length}
                </div>
                <div className="text-sm text-muted-foreground">Agency Plans</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>
            View and manage all user subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or company..."
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      <Card>
        <CardContent className="p-0">
          {filteredSubscriptions.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subscriptions found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "No subscriptions have been created yet."
                }
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredSubscriptions.map(subscription => (
                <div key={subscription.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{subscription.user_name}</span>
                          <Badge className={getPlanColor(subscription.plan)}>
                            {subscription.plan}
                          </Badge>
                          <Badge className={getStatusColor(subscription.status)}>
                            {subscription.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {subscription.user_email}
                          {subscription.company_name && (
                            <span> • {subscription.company_name}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(subscription.created_at).toLocaleDateString()}
                          {subscription.next_billing_date && (
                            <span> • Next billing: {new Date(subscription.next_billing_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">
                          €{subscription.amount}/{subscription.plan === "creator" ? "month" : "month"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {subscription.bot_count} bots
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/invoices?user_id=${subscription.user_id}`}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Invoices
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/bots?user_id=${subscription.user_id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Bots
                          </Link>
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
          Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions
        </div>
      </div>
    </main>
  );
}