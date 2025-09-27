"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Users, 
  Bot, 
  Activity, 
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import Link from "next/link";

interface AdminOverviewStats {
  active_subscriptions: number;
  active_bots: number;
  daily_runs: number;
  total_revenue: number;
  errors_last_24h: number;
  system_health: "healthy" | "warning" | "critical";
}

interface RecentActivity {
  id: string;
  type: "subscription" | "bot_run" | "error" | "user_signup";
  description: string;
  timestamp: string;
  severity?: "low" | "medium" | "high";
}

export default function AdminDashboard() {
  const [overviewStats, setOverviewStats] = useState<AdminOverviewStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock data for admin dashboard
      const mockOverviewStats: AdminOverviewStats = {
        active_subscriptions: 156,
        active_bots: 892,
        daily_runs: 2847,
        total_revenue: 24750,
        errors_last_24h: 23,
        system_health: "healthy"
      };

      const mockRecentActivity: RecentActivity[] = [
        {
          id: "act_1",
          type: "user_signup",
          description: "New agency user signed up: Agency Solutions Ltd.",
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          severity: "low"
        },
        {
          id: "act_2",
          type: "subscription",
          description: "Subscription activated: Creator plan for john@example.com",
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          severity: "low"
        },
        {
          id: "act_3",
          type: "bot_run",
          description: "Bot run completed: f2f_post (user_123) - 5 posts created",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          severity: "low"
        },
        {
          id: "act_4",
          type: "error",
          description: "Bot run failed: instagram_story (org_456) - Authentication error",
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          severity: "medium"
        },
        {
          id: "act_5",
          type: "subscription",
          description: "Payment received: €240 for agency subscription (org_789)",
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          severity: "low"
        },
        {
          id: "act_6",
          type: "bot_run",
          description: "Bot run completed: tiktok_video (org_456) - 3 videos uploaded",
          timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
          severity: "low"
        },
        {
          id: "act_7",
          type: "error",
          description: "System error: High memory usage detected on worker-3",
          timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          severity: "high"
        }
      ];

      setOverviewStats(mockOverviewStats);
      setRecentActivity(mockRecentActivity);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "subscription":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case "bot_run":
        return <Bot className="h-4 w-4 text-blue-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "user_signup":
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case "healthy":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System overview and monitoring
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-8 bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System overview and monitoring
        </p>
      </div>

      {/* Overview Stats */}
      {overviewStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{overviewStats.active_subscriptions}</div>
                  <div className="text-sm text-muted-foreground">Active Subscriptions</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{overviewStats.active_bots}</div>
                  <div className="text-sm text-muted-foreground">Active Bots</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{overviewStats.daily_runs.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Daily Runs</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">€{overviewStats.total_revenue.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest system events and user activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {getActivityIcon(activity.type)}
                  
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{activity.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                      {activity.severity && (
                        <Badge className={`text-xs ${getSeverityColor(activity.severity)}`}>
                          {activity.severity}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/monitoring">
                  View All Activity
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Current system status and metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Overall Status</span>
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 ${getSystemHealthColor(overviewStats?.system_health || "healthy")}`} />
                <span className={`text-sm font-medium ${getSystemHealthColor(overviewStats?.system_health || "healthy")}`}>
                  {overviewStats?.system_health || "healthy"}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Database</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                  </div>
                  <span className="text-sm font-medium">98%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Redis</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                  <span className="text-sm font-medium">95%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Workers</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="text-sm font-medium">92%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">API</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '99%' }}></div>
                  </div>
                  <span className="text-sm font-medium">99%</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-2">Errors (24h)</div>
              <div className="text-2xl font-bold text-red-600">
                {overviewStats?.errors_last_24h || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" asChild>
              <Link href="/admin/subscriptions">
                <Users className="h-4 w-4 mr-2" />
                Manage Subscriptions
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/admin/invoices">
                <DollarSign className="h-4 w-4 mr-2" />
                View Invoices
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/admin/bots">
                <Bot className="h-4 w-4 mr-2" />
                Bot Inventory
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/admin/affiliates">
                <TrendingUp className="h-4 w-4 mr-2" />
                Affiliate Program
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              User Growth
            </CardTitle>
            <CardDescription>
              New user registrations over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <LineChart className="h-12 w-12 mx-auto mb-2" />
                <p>User growth chart would be displayed here</p>
                <p className="text-sm">Integration with analytics service needed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Subscription Distribution
            </CardTitle>
            <CardDescription>
              Breakdown by subscription type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-2" />
                <p>Subscription distribution chart would be displayed here</p>
                <p className="text-sm">Integration with analytics service needed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}