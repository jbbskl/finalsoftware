"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Search, 
  Users,
  DollarSign,
  Eye,
  Loader2,
  MousePointer,
  UserPlus,
  CheckCircle,
  Clock
} from "lucide-react";

interface Affiliate {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  code: string;
  clicks_count: number;
  signups_count: number;
  conversions_count: number;
  paid_total_eur: number;
  status: "active" | "inactive" | "suspended";
  created_at: string;
  last_activity_at?: string;
  conversion_rate: number;
  avg_order_value: number;
}

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadAffiliates();
  }, []);

  const loadAffiliates = async () => {
    try {
      setLoading(true);
      
      // Mock data for admin affiliates
      const mockAffiliates: Affiliate[] = [
        {
          id: "aff_1",
          user_id: "user_123",
          user_email: "john@example.com",
          user_name: "John Creator",
          code: "JOHN123",
          clicks_count: 156,
          signups_count: 23,
          conversions_count: 8,
          paid_total_eur: 320,
          status: "active",
          created_at: "2024-01-01T00:00:00Z",
          last_activity_at: "2024-01-15T10:30:00Z",
          conversion_rate: 34.8,
          avg_order_value: 40
        },
        {
          id: "aff_2",
          user_id: "user_456",
          user_email: "sarah@example.com",
          user_name: "Sarah Influencer",
          code: "SARAH456",
          clicks_count: 89,
          signups_count: 12,
          conversions_count: 4,
          paid_total_eur: 160,
          status: "active",
          created_at: "2024-01-05T00:00:00Z",
          last_activity_at: "2024-01-14T16:20:00Z",
          conversion_rate: 33.3,
          avg_order_value: 40
        },
        {
          id: "aff_3",
          user_id: "org_789",
          user_email: "team@agency.com",
          user_name: "Agency Team",
          code: "AGENCY789",
          clicks_count: 234,
          signups_count: 45,
          conversions_count: 12,
          paid_total_eur: 1440,
          status: "active",
          created_at: "2023-12-15T00:00:00Z",
          last_activity_at: "2024-01-15T09:45:00Z",
          conversion_rate: 26.7,
          avg_order_value: 120
        },
        {
          id: "aff_4",
          user_id: "user_101",
          user_email: "mike@example.com",
          user_name: "Mike Content",
          code: "MIKE101",
          clicks_count: 45,
          signups_count: 6,
          conversions_count: 2,
          paid_total_eur: 80,
          status: "active",
          created_at: "2024-01-10T00:00:00Z",
          last_activity_at: "2024-01-12T14:30:00Z",
          conversion_rate: 33.3,
          avg_order_value: 40
        },
        {
          id: "aff_5",
          user_id: "user_202",
          user_email: "jane@example.com",
          user_name: "Jane Creator",
          code: "JANE202",
          clicks_count: 67,
          signups_count: 8,
          conversions_count: 1,
          paid_total_eur: 40,
          status: "inactive",
          created_at: "2023-11-20T00:00:00Z",
          last_activity_at: "2024-01-05T11:15:00Z",
          conversion_rate: 12.5,
          avg_order_value: 40
        },
        {
          id: "aff_6",
          user_id: "user_303",
          user_email: "spam@fake.com",
          user_name: "Fake User",
          code: "SPAM303",
          clicks_count: 1000,
          signups_count: 0,
          conversions_count: 0,
          paid_total_eur: 0,
          status: "suspended",
          created_at: "2024-01-08T00:00:00Z",
          last_activity_at: "2024-01-10T20:00:00Z",
          conversion_rate: 0,
          avg_order_value: 0
        }
      ];

      setAffiliates(mockAffiliates);
    } catch (error) {
      console.error("Error loading affiliates:", error);
      toast.error("Failed to load affiliates");
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
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch = 
      affiliate.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || affiliate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalAffiliates = affiliates.length;
  const activeAffiliates = affiliates.filter(affiliate => affiliate.status === "active").length;
  const totalRevenue = affiliates.reduce((sum, affiliate) => sum + affiliate.paid_total_eur, 0);
  const totalClicks = affiliates.reduce((sum, affiliate) => sum + affiliate.clicks_count, 0);

  if (loading) {
    return (
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Affiliate Program</h1>
          <p className="text-muted-foreground">
            Manage affiliate partners and commissions
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Affiliates</CardTitle>
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
        <h1 className="text-2xl font-semibold">Affiliate Program</h1>
        <p className="text-muted-foreground">
          Manage affiliate partners and commission tracking
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{totalAffiliates}</div>
                <div className="text-sm text-muted-foreground">Total Affiliates</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{activeAffiliates}</div>
                <div className="text-sm text-muted-foreground">Active Affiliates</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">€{totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Commissions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MousePointer className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Clicks</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Affiliates</CardTitle>
          <CardDescription>
            View and manage all affiliate partners
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or affiliate code..."
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
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Affiliates List */}
      <Card>
        <CardContent className="p-0">
          {filteredAffiliates.length === 0 ? (
            <div className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No affiliates found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "No affiliates have joined the program yet."
                }
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredAffiliates.map(affiliate => (
                <div key={affiliate.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{affiliate.user_name}</span>
                          <Badge className={getStatusColor(affiliate.status)}>
                            {affiliate.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground font-mono">
                            {affiliate.code}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {affiliate.user_email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Joined: {new Date(affiliate.created_at).toLocaleDateString()}
                          {affiliate.last_activity_at && (
                            <span> • Last activity: {new Date(affiliate.last_activity_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-semibold">{affiliate.clicks_count}</div>
                          <div className="text-muted-foreground">Clicks</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{affiliate.signups_count}</div>
                          <div className="text-muted-foreground">Signups</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{affiliate.conversions_count}</div>
                          <div className="text-muted-foreground">Conversions</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">€{affiliate.paid_total_eur}</div>
                          <div className="text-muted-foreground">Commission</div>
                        </div>
                      </div>
                      
                      {/* Performance Stats */}
                      <div className="text-right text-sm">
                        <div className="font-semibold">
                          {affiliate.conversion_rate.toFixed(1)}%
                        </div>
                        <div className="text-muted-foreground">Conversion Rate</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Avg: €{affiliate.avg_order_value}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
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

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Program Performance</CardTitle>
          <CardDescription>
            Overall affiliate program metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {totalClicks > 0 ? ((affiliates.reduce((sum, a) => sum + a.signups_count, 0) / totalClicks) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Conversion Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                €{totalRevenue > 0 ? (totalRevenue / affiliates.reduce((sum, a) => sum + a.conversions_count, 0)).toFixed(0) : 0}
              </div>
              <div className="text-sm text-muted-foreground">Average Commission</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {activeAffiliates > 0 ? (totalRevenue / activeAffiliates).toFixed(0) : 0}
              </div>
              <div className="text-sm text-muted-foreground">Revenue per Affiliate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagination would go here */}
      <div className="flex justify-center">
        <div className="text-sm text-muted-foreground">
          Showing {filteredAffiliates.length} of {affiliates.length} affiliates
        </div>
      </div>
    </main>
  );
}