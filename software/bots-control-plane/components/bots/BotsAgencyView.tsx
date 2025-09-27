"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Bot, 
  Play, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";

interface BotInstance {
  id: string;
  bot_code: string;
  status: "inactive" | "ready" | "running" | "error";
  validation_status: "pending" | "valid" | "invalid";
  owner_type: "user" | "org";
  owner_id: string;
  created_at: string;
  last_validated_at?: string;
}

export default function BotsAgencyView() {
  const [bots, setBots] = useState<BotInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      setLoading(true);
      
      // Mock data for agency - includes both creator and agency bots
      const mockBots: BotInstance[] = [
        // Creator bots
        { id: "bot_1", bot_code: "f2f_post", status: "ready", validation_status: "valid", owner_type: "user", owner_id: "user_123", created_at: "2024-01-01T00:00:00Z", last_validated_at: "2024-01-15T10:30:00Z" },
        { id: "bot_2", bot_code: "f2f_dm", status: "inactive", validation_status: "pending", owner_type: "user", owner_id: "user_123", created_at: "2024-01-01T00:00:00Z" },
        { id: "bot_3", bot_code: "of_post", status: "ready", validation_status: "valid", owner_type: "user", owner_id: "user_123", created_at: "2024-01-01T00:00:00Z", last_validated_at: "2024-01-15T10:30:00Z" },
        { id: "bot_4", bot_code: "of_dm", status: "ready", validation_status: "valid", owner_type: "user", owner_id: "user_123", created_at: "2024-01-01T00:00:00Z", last_validated_at: "2024-01-15T10:30:00Z" },
        { id: "bot_5", bot_code: "fanvue_post", status: "inactive", validation_status: "pending", owner_type: "user", owner_id: "user_123", created_at: "2024-01-01T00:00:00Z" },
        { id: "bot_6", bot_code: "fanvue_dm", status: "ready", validation_status: "valid", owner_type: "user", owner_id: "user_123", created_at: "2024-01-01T00:00:00Z", last_validated_at: "2024-01-15T10:30:00Z" },
        
        // Agency bots
        { id: "bot_7", bot_code: "instagram_post", status: "ready", validation_status: "valid", owner_type: "org", owner_id: "org_456", created_at: "2024-01-01T00:00:00Z", last_validated_at: "2024-01-15T10:30:00Z" },
        { id: "bot_8", bot_code: "instagram_story", status: "inactive", validation_status: "pending", owner_type: "org", owner_id: "org_456", created_at: "2024-01-01T00:00:00Z" },
        { id: "bot_9", bot_code: "instagram_reel", status: "ready", validation_status: "valid", owner_type: "org", owner_id: "org_456", created_at: "2024-01-01T00:00:00Z", last_validated_at: "2024-01-15T10:30:00Z" },
        { id: "bot_10", bot_code: "tiktok_video", status: "ready", validation_status: "valid", owner_type: "org", owner_id: "org_456", created_at: "2024-01-01T00:00:00Z", last_validated_at: "2024-01-15T10:30:00Z" },
        { id: "bot_11", bot_code: "tiktok_live", status: "inactive", validation_status: "pending", owner_type: "org", owner_id: "org_456", created_at: "2024-01-01T00:00:00Z" },
        { id: "bot_12", bot_code: "twitter_tweet", status: "ready", validation_status: "valid", owner_type: "org", owner_id: "org_456", created_at: "2024-01-01T00:00:00Z", last_validated_at: "2024-01-15T10:30:00Z" },
        { id: "bot_13", bot_code: "twitter_retweet", status: "inactive", validation_status: "pending", owner_type: "org", owner_id: "org_456", created_at: "2024-01-01T00:00:00Z" },
        { id: "bot_14", bot_code: "youtube_video", status: "ready", validation_status: "valid", owner_type: "org", owner_id: "org_456", created_at: "2024-01-01T00:00:00Z", last_validated_at: "2024-01-15T10:30:00Z" },
        { id: "bot_15", bot_code: "youtube_short", status: "ready", validation_status: "valid", owner_type: "org", owner_id: "org_456", created_at: "2024-01-01T00:00:00Z", last_validated_at: "2024-01-15T10:30:00Z" },
        { id: "bot_16", bot_code: "linkedin_post", status: "inactive", validation_status: "pending", owner_type: "org", owner_id: "org_456", created_at: "2024-01-01T00:00:00Z" },
        { id: "bot_17", bot_code: "linkedin_article", status: "ready", validation_status: "valid", owner_type: "org", owner_id: "org_456", created_at: "2024-01-01T00:00:00Z", last_validated_at: "2024-01-15T10:30:00Z" },
        { id: "bot_18", bot_code: "pinterest_pin", status: "ready", validation_status: "valid", owner_type: "org", owner_id: "org_456", created_at: "2024-01-01T00:00:00Z", last_validated_at: "2024-01-15T10:30:00Z" },
        { id: "bot_19", bot_code: "pinterest_board", status: "inactive", validation_status: "pending", owner_type: "org", owner_id: "org_456", created_at: "2024-01-01T00:00:00Z" },
      ];

      // Sort: inactive first, then by bot_code
      const sortedBots = mockBots.sort((a, b) => {
        if (a.status === "inactive" && b.status !== "inactive") return -1;
        if (a.status !== "inactive" && b.status === "inactive") return 1;
        return a.bot_code.localeCompare(b.bot_code);
      });

      setBots(sortedBots);
    } catch (error) {
      console.error("Error loading bots:", error);
      toast.error("Failed to load bots");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (botId: string) => {
    try {
      // TODO: Replace with actual API call
      // await activateBot(botId);
      
      setBots(prev => prev.map(bot => 
        bot.id === botId 
          ? { ...bot, status: "ready" as const }
          : bot
      ));
      
      toast.success("Bot activated successfully");
    } catch (error) {
      console.error("Error activating bot:", error);
      toast.error("Failed to activate bot");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "running":
        return "bg-blue-100 text-blue-800";
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
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBotCategory = (bot_code: string) => {
    const creatorBots = ["f2f_post", "f2f_dm", "of_post", "of_dm", "fanvue_post", "fanvue_dm"];
    return creatorBots.includes(bot_code) ? "creator" : "agency";
  };

  const getBotDescription = (bot_code: string) => {
    const descriptions: { [key: string]: string } = {
      // Creator bots
      "f2f_post": "Post content to F2F platform",
      "f2f_dm": "Send direct messages on F2F",
      "of_post": "Post content to OnlyFans",
      "of_dm": "Send direct messages on OnlyFans",
      "fanvue_post": "Post content to Fanvue",
      "fanvue_dm": "Send direct messages on Fanvue",
      
      // Agency bots
      "instagram_post": "Post content to Instagram",
      "instagram_story": "Post stories to Instagram",
      "instagram_reel": "Post reels to Instagram",
      "tiktok_video": "Upload videos to TikTok",
      "tiktok_live": "Go live on TikTok",
      "twitter_tweet": "Post tweets on Twitter",
      "twitter_retweet": "Retweet content on Twitter",
      "youtube_video": "Upload videos to YouTube",
      "youtube_short": "Upload shorts to YouTube",
      "linkedin_post": "Post content to LinkedIn",
      "linkedin_article": "Publish articles on LinkedIn",
      "pinterest_pin": "Pin content to Pinterest",
      "pinterest_board": "Manage Pinterest boards",
    };
    
    return descriptions[bot_code] || "Automation bot";
  };

  const creatorBots = bots.filter(bot => getBotCategory(bot.bot_code) === "creator");
  const agencyBots = bots.filter(bot => getBotCategory(bot.bot_code) === "agency");
  const inactiveBots = bots.filter(bot => bot.status === "inactive");
  const readyBots = bots.filter(bot => bot.status === "ready");

  if (loading) {
    return (
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Agency Bots</h1>
          <p className="text-muted-foreground">
            Manage your creator and agency automation bots
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                  <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Agency Bots</h1>
        <p className="text-muted-foreground">
          Manage your creator and agency automation bots
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{bots.length}</div>
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
                <div className="text-2xl font-bold">{readyBots.length}</div>
                <div className="text-sm text-muted-foreground">Ready</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{inactiveBots.length}</div>
                <div className="text-sm text-muted-foreground">Inactive</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{bots.filter(b => b.status === "running").length}</div>
                <div className="text-sm text-muted-foreground">Running</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Creator Bots */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Creator Bots</h2>
          <p className="text-sm text-muted-foreground">
            Essential automation tools for content creators
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creatorBots.map(bot => (
            <Card key={bot.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    <span className="font-medium">{bot.bot_code}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Creator
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {getBotDescription(bot.bot_code)}
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(bot.status)}>
                    {bot.status}
                  </Badge>
                  {getValidationStatusIcon(bot.validation_status)}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/agency/bots/${bot.id}`}>
                      <Settings className="h-4 w-4 mr-1" />
                      Setup
                    </Link>
                  </Button>
                  
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={bot.validation_status !== "valid"}
                    onClick={() => handleActivate(bot.id)}
                  >
                    {bot.validation_status === "valid" ? (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Activate
                      </>
                    ) : (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Validate
                      </>
                    )}
                  </Button>
                </div>
                
                {bot.last_validated_at && (
                  <p className="text-xs text-muted-foreground">
                    Last validated: {new Date(bot.last_validated_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Agency Bots */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Agency Bots</h2>
          <p className="text-sm text-muted-foreground">
            Advanced automation tools for agencies and businesses
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agencyBots.map(bot => (
            <Card key={bot.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    <span className="font-medium">{bot.bot_code}</span>
                  </div>
                  <Badge variant="default" className="text-xs">
                    Agency
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {getBotDescription(bot.bot_code)}
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(bot.status)}>
                    {bot.status}
                  </Badge>
                  {getValidationStatusIcon(bot.validation_status)}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/agency/bots/${bot.id}`}>
                      <Settings className="h-4 w-4 mr-1" />
                      Setup
                    </Link>
                  </Button>
                  
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={bot.validation_status !== "valid"}
                    onClick={() => handleActivate(bot.id)}
                  >
                    {bot.validation_status === "valid" ? (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Activate
                      </>
                    ) : (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Validate
                      </>
                    )}
                  </Button>
                </div>
                
                {bot.last_validated_at && (
                  <p className="text-xs text-muted-foreground">
                    Last validated: {new Date(bot.last_validated_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {bots.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bots available</h3>
            <p className="text-muted-foreground mb-4">
              You need to subscribe to access automation bots.
            </p>
            <Button asChild>
              <Link href="/agency/subscriptions">
                View Subscriptions
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}