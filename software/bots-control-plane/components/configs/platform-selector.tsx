"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Bot, 
  Users, 
  Globe, 
  MessageSquare, 
  Shield, 
  Zap,
  Star,
  TrendingUp,
  CheckCircle,
  ArrowRight
} from "lucide-react"

interface PlatformSelectorProps {
  onSelect: (platform: string) => void
  onCancel: () => void
}

const platforms = [
  {
    id: "f2f",
    name: "F2F (Face to Face)",
    description: "Social networking and dating platform",
    icon: Users,
    features: ["Mass DM", "Auto Follow", "Auto Like", "Invite System"],
    difficulty: "Easy",
    color: "bg-blue-500",
    popular: true,
    comingSoon: false
  },
  {
    id: "fanvue",
    name: "Fanvue",
    description: "Creator monetization platform",
    icon: Star,
    features: ["Content Posting", "Fan Management", "Analytics", "Messaging"],
    difficulty: "Medium",
    color: "bg-purple-500",
    popular: true,
    comingSoon: false
  },
  {
    id: "fancentro",
    name: "Fancentro",
    description: "Adult content platform",
    icon: Globe,
    features: ["Content Upload", "Fan Engagement", "Revenue Tracking"],
    difficulty: "Medium",
    color: "bg-pink-500",
    popular: false,
    comingSoon: false
  },
  {
    id: "onlyfans",
    name: "OnlyFans",
    description: "Premium content subscription platform",
    icon: Shield,
    features: ["Content Management", "Subscription Handling", "Payout Tracking"],
    difficulty: "Hard",
    color: "bg-orange-500",
    popular: true,
    comingSoon: true
  }
]

export function PlatformSelector({ onSelect, onCancel }: PlatformSelectorProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800"
      case "Medium": return "bg-yellow-100 text-yellow-800"
      case "Hard": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Platform</h2>
        <p className="text-muted-foreground">
          Select the platform you want to configure a bot for. Each platform has different features and setup requirements.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {platforms.map((platform) => {
          const Icon = platform.icon
          return (
            <Card 
              key={platform.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedPlatform === platform.id ? "ring-2 ring-primary" : ""
              } ${platform.comingSoon ? "opacity-60" : ""}`}
              onClick={() => !platform.comingSoon && setSelectedPlatform(platform.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${platform.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {platform.name}
                        {platform.popular && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                        {platform.comingSoon && (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            Coming Soon
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {platform.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Available Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    {platform.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Difficulty:</span>
                    <Badge className={getDifficultyColor(platform.difficulty)}>
                      {platform.difficulty}
                    </Badge>
                  </div>
                  
                  {platform.comingSoon ? (
                    <Button disabled variant="outline" size="sm">
                      Coming Soon
                    </Button>
                  ) : (
                    <Button 
                      variant={selectedPlatform === platform.id ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelect(platform.id)
                      }}
                    >
                      {selectedPlatform === platform.id ? (
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
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Platform Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Comparison</CardTitle>
          <CardDescription>
            Quick comparison of platform features and capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Platform</th>
                  <th className="text-left p-2">Mass DM</th>
                  <th className="text-left p-2">Auto Follow</th>
                  <th className="text-left p-2">Content Posting</th>
                  <th className="text-left p-2">Analytics</th>
                  <th className="text-left p-2">Setup Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((platform) => (
                  <tr key={platform.id} className="border-b">
                    <td className="p-2 font-medium">{platform.name}</td>
                    <td className="p-2">
                      {platform.features.includes("Mass DM") ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-2">
                      {platform.features.includes("Auto Follow") ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-2">
                      {platform.features.includes("Content Posting") || platform.features.includes("Content Upload") || platform.features.includes("Content Management") ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-2">
                      {platform.features.includes("Analytics") ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-2">
                      <Badge className={getDifficultyColor(platform.difficulty)}>
                        {platform.difficulty}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={() => selectedPlatform && onSelect(selectedPlatform)}
          disabled={!selectedPlatform}
        >
          Continue with {selectedPlatform?.toUpperCase()}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
