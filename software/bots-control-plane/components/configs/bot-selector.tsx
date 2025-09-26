"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Bot, 
  Users, 
  User,
  Globe, 
  MessageSquare, 
  Shield, 
  Zap,
  Star,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Crown,
  Lock,
  Search
} from "lucide-react"

interface BotSelectorProps {
  onSelect: (bot: any) => void
  onCancel: () => void
  userSubscription: {
    plan: "premium" | "enterprise"
    features: string[]
    maxBots: number
  }
  userType: "agency" | "creator" | "admin"
}

const availableBots = [
  {
    id: "f2f_agency",
    name: "F2F Agency Bot",
    platform: "F2F",
    type: "Agency",
    description: "Manage multiple F2F accounts and send invites",
    icon: Users,
    color: "bg-blue-500",
    features: ["Mass DM", "Auto Invite", "Multi-Account", "Analytics"],
    requiredPlan: "premium",
    difficulty: "Easy",
    popular: true
  },
  {
    id: "f2f_creator",
    name: "F2F Creator Bot",
    platform: "F2F", 
    type: "Creator",
    description: "Automate your personal F2F account",
    icon: User,
    color: "bg-blue-600",
    features: ["Auto DM", "Auto Follow", "Auto Like", "Auto Comment"],
    requiredPlan: "premium",
    difficulty: "Easy",
    popular: true
  },
  {
    id: "fanvue_posting",
    name: "Fanvue Posting Bot",
    platform: "Fanvue",
    type: "Content",
    description: "Automate content posting and fan engagement",
    icon: Star,
    color: "bg-purple-500",
    features: ["Content Upload", "Fan Management", "Analytics", "Messaging"],
    requiredPlan: "premium",
    difficulty: "Medium",
    popular: true
  },
  {
    id: "fancentro_management",
    name: "Fancentro Management Bot",
    platform: "Fancentro",
    type: "Management",
    description: "Manage your Fancentro content and fans",
    icon: Globe,
    color: "bg-pink-500",
    features: ["Content Upload", "Fan Engagement", "Revenue Tracking"],
    requiredPlan: "premium",
    difficulty: "Medium",
    popular: false
  },
  {
    id: "onlyfans_automation",
    name: "OnlyFans Automation Bot",
    platform: "OnlyFans",
    type: "Automation",
    description: "Advanced OnlyFans automation and management",
    icon: Shield,
    color: "bg-orange-500",
    features: ["Content Management", "Subscription Handling", "Payout Tracking", "Advanced Analytics"],
    requiredPlan: "enterprise",
    difficulty: "Hard",
    popular: true
  },
  {
    id: "multi_platform",
    name: "Multi-Platform Bot",
    platform: "All Platforms",
    type: "Universal",
    description: "Manage multiple platforms from one bot",
    icon: Zap,
    color: "bg-green-500",
    features: ["Cross-Platform", "Unified Analytics", "Bulk Operations", "Advanced Scheduling"],
    requiredPlan: "enterprise",
    difficulty: "Hard",
    popular: false
  }
]

export function BotSelector({ onSelect, onCancel, userSubscription, userType }: BotSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBot, setSelectedBot] = useState<string | null>(null)

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "premium": return "bg-yellow-100 text-yellow-800"
      case "enterprise": return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800"
      case "Medium": return "bg-yellow-100 text-yellow-800"
      case "Hard": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const canAccessBot = (requiredPlan: string) => {
    const planHierarchy = { premium: 1, enterprise: 2 }
    return planHierarchy[userSubscription.plan as keyof typeof planHierarchy] >= 
           planHierarchy[requiredPlan as keyof typeof planHierarchy]
  }

  const filteredBots = availableBots.filter(bot => {
    // Filter by search term
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bot.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bot.type.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filter by user type
    const matchesUserType = (() => {
      if (userType === "admin") return true // Admin can see all bots
      if (userType === "creator") {
        // Creators can only see creator bots
        return bot.id.includes('creator')
      }
      if (userType === "agency") {
        // Agencies can see all bots
        return true
      }
      return false
    })()
    
    return matchesSearch && matchesUserType
  })

  const accessibleBots = filteredBots.filter(bot => canAccessBot(bot.requiredPlan))
  const lockedBots = filteredBots.filter(bot => !canAccessBot(bot.requiredPlan))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Bot</h2>
        <p className="text-muted-foreground">
          Select the bot you want to configure based on your subscription plan
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge className={getPlanColor(userSubscription.plan)}>
            <Crown className="h-3 w-3 mr-1" />
            {userSubscription.plan.toUpperCase()} Plan
          </Badge>
          <span className="text-sm text-muted-foreground">
            {userSubscription.maxBots} bots available
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bots by name, platform, or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Available Bots */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Available Bots ({accessibleBots.length})
        </h3>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accessibleBots.map((bot) => {
            const Icon = bot.icon
            return (
              <Card 
                key={bot.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedBot === bot.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedBot(bot.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${bot.color} text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {bot.name}
                          {bot.popular && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {bot.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{bot.platform}</Badge>
                    <Badge className={getDifficultyColor(bot.difficulty)}>
                      {bot.difficulty}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Features:</h4>
                    <div className="flex flex-wrap gap-1">
                      {bot.features.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    variant={selectedBot === bot.id ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(bot)
                    }}
                  >
                    {selectedBot === bot.id ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Selected
                      </>
                    ) : (
                      <>
                        Configure
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Locked Bots */}
      {lockedBots.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Upgrade Required ({lockedBots.length})
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lockedBots.map((bot) => {
              const Icon = bot.icon
              return (
                <Card key={bot.id} className="opacity-60">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${bot.color} text-white`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {bot.name}
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                              <Lock className="h-3 w-3 mr-1" />
                              {bot.requiredPlan.toUpperCase()}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {bot.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{bot.platform}</Badge>
                      <Badge className={getDifficultyColor(bot.difficulty)}>
                        {bot.difficulty}
                      </Badge>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Features:</h4>
                      <div className="flex flex-wrap gap-1">
                        {bot.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled
                    >
                      <Lock className="h-4 w-4 mr-1" />
                      Upgrade to {bot.requiredPlan.toUpperCase()}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={() => {
            const bot = availableBots.find(b => b.id === selectedBot)
            if (bot) onSelect(bot)
          }}
          disabled={!selectedBot}
        >
          Continue with Selected Bot
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
