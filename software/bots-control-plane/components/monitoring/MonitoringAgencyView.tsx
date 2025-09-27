"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Bot, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  BarChart3,
  TrendingUp,
  Activity,
  Loader2
} from "lucide-react";
import Link from "next/link";

interface Run {
  id: string;
  bot_instance_id: string;
  status: "scheduled" | "running" | "completed" | "failed" | "cancelled";
  started_at: string;
  finished_at?: string;
  summary_json?: any;
  bot_code?: string;
}

interface OverviewStats {
  bots_total: number;
  bots_active: number;
  runs_today: number;
  runs_last_7d: number;
  errors_last_24h: number;
}

export default function MonitoringAgencyView() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock data for agency monitoring
      const mockRuns: Run[] = [
        {
          id: "run_1",
          bot_instance_id: "bot_1",
          status: "completed",
          started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          finished_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          summary_json: { posts_created: 5, messages_sent: 12, errors: 0 },
          bot_code: "f2f_post"
        },
        {
          id: "run_2",
          bot_instance_id: "bot_8",
          status: "running",
          started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          summary_json: { posts_created: 2, messages_sent: 0, errors: 0 },
          bot_code: "instagram_story"
        },
        {
          id: "run_3",
          bot_instance_id: "bot_10",
          status: "failed",
          started_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          finished_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          summary_json: { posts_created: 0, messages_sent: 0, errors: 3 },
          bot_code: "tiktok_video"
        },
        {
          id: "run_4",
          bot_instance_id: "bot_12",
          status: "completed",
          started_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          finished_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          summary_json: { posts_created: 3, messages_sent: 8, errors: 0 },
          bot_code: "twitter_tweet"
        },
        {
          id: "run_5",
          bot_instance_id: "bot_14",
          status: "scheduled",
          started_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          summary_json: {},
          bot_code: "youtube_video"
        }
      ];

      const mockOverviewStats: OverviewStats = {
        bots_total: 19, // 6 creator + 13 agency bots
        bots_active: 12,
        runs_today: 8,
        runs_last_7d: 45,
        errors_last_24h: 2
      };

      setRuns(mockRuns);
      setOverviewStats(mockOverviewStats);
    } catch (error) {
      console.error("Error loading monitoring data:", error);
      toast.error("Failed to load monitoring data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "running":
        return <Activity className="h-4 w-4 text-green-500 animate-pulse" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "running":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDuration = (startedAt: string, finishedAt?: string) => {
    const start = new Date(startedAt);
    const end = finishedAt ? new Date(finishedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  if (loading) {
    return (
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor your agency and creator bot performance
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-8 bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
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
        <h1 className="text-2xl font-semibold">Monitoring</h1>
        <p className="text-muted-foreground">
          Monitor your agency and creator bot performance
        </p>
      </div>

      {/* Overview Stats */}
      {overviewStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{overviewStats.bots_total}</div>
                  <div className="text-sm text-muted-foreground">Total Bots</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{overviewStats.bots_active}</div>
                  <div className="text-sm text-muted-foreground">Active Bots</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{overviewStats.runs_today}</div>
                  <div className="text-sm text-muted-foreground">Runs Today</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{overviewStats.runs_last_7d}</div>
                  <div className="text-sm text-muted-foreground">Runs Last 7 Days</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Runs</CardTitle>
          <CardDescription>
            Latest bot execution history across all platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No runs yet</h3>
              <p className="text-muted-foreground mb-4">
                Your bots haven't been executed yet. Set up schedules to start monitoring.
              </p>
              <Button asChild>
                <Link href="/agency/schedule">
                  Go to Schedule
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {runs.map(run => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(run.status)}
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{run.bot_code}</span>
                        <Badge className={getStatusColor(run.status)}>
                          {run.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Started: {new Date(run.started_at).toLocaleString()}
                        {run.finished_at && (
                          <span> • Finished: {new Date(run.finished_at).toLocaleString()}</span>
                        )}
                        <span> • Duration: {formatDuration(run.started_at, run.finished_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {run.summary_json && (
                      <div className="text-right text-sm space-y-1">
                        {run.summary_json.posts_created > 0 && (
                          <div className="text-green-600">
                            {run.summary_json.posts_created} posts created
                          </div>
                        )}
                        {run.summary_json.messages_sent > 0 && (
                          <div className="text-blue-600">
                            {run.summary_json.messages_sent} messages sent
                          </div>
                        )}
                        {run.summary_json.errors > 0 && (
                          <div className="text-red-600">
                            {run.summary_json.errors} errors
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/agency/monitoring/runs/${run.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/agency/bots/${run.bot_instance_id}/logs`}>
                          View Logs
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Creator Bots Performance</CardTitle>
            <CardDescription>
              Performance metrics for creator automation bots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">F2F Platform</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-sm font-medium">85%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">OnlyFans</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="text-sm font-medium">92%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Fanvue</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                  <span className="text-sm font-medium">78%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agency Bots Performance</CardTitle>
            <CardDescription>
              Performance metrics for agency automation bots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Instagram</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-pink-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                  <span className="text-sm font-medium">88%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">TikTok</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-black h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                  <span className="text-sm font-medium">95%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Twitter</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                  <span className="text-sm font-medium">82%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">YouTube</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                  <span className="text-sm font-medium">90%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}