"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Bot, 
  Search, 
  Filter, 
  Eye,
  Loader2,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";

interface BotInstance {
  id: string;
  bot_code: string;
  status: "inactive" | "ready" | "running" | "error";
  validation_status: "pending" | "valid" | "invalid";
  owner_type: "user" | "org";
  owner_id: string;
  owner_email: string;
  owner_name: string;
  created_at: string;
  last_validated_at?: string;
  last_run_at?: string;
  run_count: number;
}

export default function AdminBots() {
  const [bots, setBots] = useState<BotInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerTypeFilter, setOwnerTypeFilter] = useState("all");

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      setLoading(true);
      
      // Mock data for admin bots inventory
      const mockBots: BotInstance[] = [
        // Creator bots
        {
          id: "bot_1",
          bot_code: "f2f_post",
          status: "ready",
          validation_status: "valid",
          owner_type: "user",
          owner_id: "user_123",
          owner_email: "john@example.com",
          owner_name: "John Creator",
          created_at: "2024-01-01T00:00:00Z",
          last_validated_at: "2024-01-15T10:30:00Z",
          last_run_at: "2024-01-15T08:00:00Z",
          run_count: 45
        },
        {
          id: "bot_2",
          bot_code: "f2f_dm",
          status: "inactive",
          validation_status: "pending",
          owner_type: "user",
          owner_id: "user_123",
          owner_email: "john@example.com",
          owner_name: "John Creator",
          created_at: "2024-01-01T00:00:00Z",
          run_count: 0
        },
        {
          id: "bot_3",
          bot_code: "of_post",
          status: "ready",
          validation_status: "valid",
          owner_type: "user",
          owner_id: "user_789",
          owner_email: "jane@example.com",
          owner_name: "Jane Content",
          created_at: "2023-12-15T00:00:00Z",
          last_validated_at: "2024-01-10T14:20:00Z",
          last_run_at: "2024-01-14T09:30:00Z",
          run_count: 28
        },
        {
          id: "bot_4",
          bot_code: "of_dm",
          status: "running",
          validation_status: "valid",
          owner_type: "user",
          owner_id: "user_789",
          owner_email: "jane@example.com",
          owner_name: "Jane Content",
          created_at: "2023-12-15T00:00:00Z",
          last_validated_at: "2024-01-10T14:20:00Z",
          last_run_at: "2024-01-15T10:00:00Z",
          run_count: 32
        },
        {
          id: "bot_5",
          bot_code: "fanvue_post",
          status: "error",
          validation_status: "invalid",
          owner_type: "user",
          owner_id: "user_202",
          owner_email: "mike@example.com",
          owner_name: "Mike Influencer",
          created_at: "2024-01-10T00:00:00Z",
          last_validated_at: "2024-01-12T16:45:00Z",
          last_run_at: "2024-01-12T16:45:00Z",
          run_count: 5
        },
        
        // Agency bots
        {
          id: "bot_6",
          bot_code: "instagram_post",
          status: "ready",
          validation_status: "valid",
          owner_type: "org",
          owner_id: "org_456",
          owner_email: "admin@agency.com",
          owner_name: "Agency Solutions",
          created_at: "2024-01-05T00:00:00Z",
          last_validated_at: "2024-01-15T11:00:00Z",
          last_run_at: "2024-01-15T07:30:00Z",
          run_count: 89
        },
        {
          id: "bot_7",
          bot_code: "instagram_story",
          status: "ready",
          validation_status: "valid",
          owner_type: "org",
          owner_id: "org_456",
          owner_email: "admin@agency.com",
          owner_name: "Agency Solutions",
          created_at: "2024-01-05T00:00:00Z",
          last_validated_at: "2024-01-15T11:00:00Z",
          last_run_at: "2024-01-15T08:15:00Z",
          run_count: 67
        },
        {
          id: "bot_8",
          bot_code: "tiktok_video",
          status: "running",
          validation_status: "valid",
          owner_type: "org",
          owner_id: "org_456",
          owner_email: "admin@agency.com",
          owner_name: "Agency Solutions",
          created_at: "2024-01-05T00:00:00Z",
          last_validated_at: "2024-01-15T11:00:00Z",
          last_run_at: "2024-01-15T10:30:00Z",
          run_count: 124
        },
        {
          id: "bot_9",
          bot_code: "twitter_tweet",
          status: "ready",
          validation_status: "valid",
          owner_type: "org",
          owner_id: "org_101",
          owner_email: "team@startup.com",
          owner_name: "Startup Team",
          created_at: "2023-11-01T00:00:00Z",
          last_validated_at: "2024-01-05T09:20:00Z",
          last_run_at: "2024-01-14T15:45:00Z",
          run_count: 156
        },
        {
          id: "bot_10",
          bot_code: "youtube_video",
          status: "error",
          validation_status: "invalid",
          owner_type: "org",
          owner_id: "org_101",
          owner_email: "team@startup.com",
          owner_name: "Startup Team",
          created_at: "2023-11-01T00:00:00Z",
          last_validated_at: "2024-01-05T09:20:00Z",
          last_run_at: "2024-01-13T12:00:00Z",
          run_count: 78
        }
      ];

      setBots(mockBots);
    } catch (error) {
      console.error("Error loading bots:", error);
      toast.error("Failed to load bots");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getValidationStatusIcon = (validation_status: string) => {
    switch (validation_status) {
      case "valid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "invalid":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOwnerTypeColor = (owner_type: string) => {
    switch (owner_type) {
      case "user":
        return "bg-blue-100 text-blue-800";
      case "org":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredBots = bots.filter(bot => {
    const matchesSearch = 
      bot.bot_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.owner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.owner_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || bot.status === statusFilter;
    const matchesOwnerType = ownerTypeFilter === "all" || bot.owner_type === ownerTypeFilter;
    
    return matchesSearch && matchesStatus && matchesOwnerType;
  });

  const totalBots = bots.length;
  const activeBots = bots.filter(bot => bot.status === "ready" || bot.status === "running").length;
  const runningBots = bots.filter(bot => bot.status === "running").length;
  const errorBots = bots.filter(bot => bot.status === "error").length;

  if (loading) {
    return (
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Bot Inventory</h1>
          <p className="text-muted-foreground">
            Global view of all bot instances
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Bots</CardTitle>
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
        <h1 className="text-2xl font-semibold">Bot Inventory</h1>
        <p className="text-muted-foreground">
          Global view of all bot instances across all users and organizations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{totalBots}</div>
                <div className="text-sm text-muted-foreground">Total Bots</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{activeBots}</div>
                <div className="text-sm text-muted-foreground">Active Bots</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{runningBots}</div>
                <div className="text-sm text-muted-foreground">Running Now</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{errorBots}</div>
                <div className="text-sm text-muted-foreground">With Errors</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Bots</CardTitle>
          <CardDescription>
            View and monitor all bot instances across the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by bot code, owner email, or owner name..."
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
                <option value="ready">Ready</option>
                <option value="running">Running</option>
                <option value="inactive">Inactive</option>
                <option value="error">Error</option>
              </select>
              
              <select
                value={ownerTypeFilter}
                onChange={(e) => setOwnerTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Owners</option>
                <option value="user">Users</option>
                <option value="org">Organizations</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bots List */}
      <Card>
        <CardContent className="p-0">
          {filteredBots.length === 0 ? (
            <div className="p-8 text-center">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bots found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || ownerTypeFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "No bot instances have been created yet."
                }
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredBots.map(bot => (
                <div key={bot.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Bot className="h-5 w-5 text-muted-foreground" />
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{bot.bot_code}</span>
                          <Badge className={getStatusColor(bot.status)}>
                            {bot.status}
                          </Badge>
                          <Badge className={getOwnerTypeColor(bot.owner_type)}>
                            {bot.owner_type}
                          </Badge>
                          {getValidationStatusIcon(bot.validation_status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Owner: {bot.owner_name} ({bot.owner_email})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(bot.created_at).toLocaleDateString()}
                          {bot.last_validated_at && (
                            <span> • Last validated: {new Date(bot.last_validated_at).toLocaleDateString()}</span>
                          )}
                          {bot.last_run_at && (
                            <span> • Last run: {new Date(bot.last_run_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">
                          {bot.run_count} runs
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {bot.id}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/subscriptions?user_id=${bot.owner_id}`}>
                            <Users className="h-4 w-4 mr-1" />
                            View Owner
                          </Link>
                        </Button>
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
          Showing {filteredBots.length} of {bots.length} bots
        </div>
      </div>
    </main>
  );
}