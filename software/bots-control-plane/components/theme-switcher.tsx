"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Palette, Check } from "lucide-react"

const themes = [
  {
    name: "Dark Admin",
    class: "",
    description: "Professional dark theme with white text",
    colors: ["#3b82f6", "#06b6d4", "#10b981", "#a855f7", "#f97316"],
    isDefault: true
  },
  {
    name: "Deep Blue",
    class: "theme-blue",
    description: "Professional deep blue theme",
    colors: ["#1800ad", "#2d14c8", "#4064ff", "#7896ff", "#c8d2ff"]
  },
  {
    name: "Modern Teal",
    class: "theme-teal",
    description: "Fresh and modern teal theme",
    colors: ["#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4", "#ccfbf1"]
  },
  {
    name: "Vibrant Purple",
    class: "theme-purple",
    description: "Creative purple theme",
    colors: ["#9333ea", "#a855f7", "#c4b5fd", "#ddd6fe", "#f3f0ff"]
  },
  {
    name: "Ocean Blue",
    class: "theme-ocean",
    description: "Calming ocean blue theme",
    colors: ["#0e7490", "#38bdf8", "#7dd3fc", "#bae6fd", "#e0f2fe"]
  },
  {
    name: "Emerald Green",
    class: "theme-emerald",
    description: "Natural emerald green theme",
    colors: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"]
  },
  {
    name: "Sunset Orange",
    class: "theme-sunset",
    description: "Warm sunset orange theme",
    colors: ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"]
  }
]

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState("")

  useEffect(() => {
    // Remove all theme classes first
    themes.forEach(theme => {
      if (theme.class) {
        document.documentElement.classList.remove(theme.class)
      }
    })
    
    // Apply current theme
    if (currentTheme) {
      document.documentElement.classList.add(currentTheme)
    }
  }, [currentTheme])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Color Palette Switcher
        </CardTitle>
        <CardDescription>
          Choose from different color palettes to customize your interface
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <div
              key={theme.name}
              className={`relative p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                currentTheme === theme.class ? "ring-2 ring-primary" : "hover:border-primary/50"
              }`}
              onClick={() => setCurrentTheme(theme.class)}
            >
              {currentTheme === theme.class && (
                <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                  <Check className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
              {theme.isDefault && currentTheme !== theme.class && (
                <Badge variant="secondary" className="absolute -top-2 -right-2">
                  Default
                </Badge>
              )}
              
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{theme.name}</h3>
                  <p className="text-sm text-muted-foreground">{theme.description}</p>
                </div>
                
                <div className="flex gap-1">
                  {theme.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                
                <Button
                  variant={currentTheme === theme.class ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentTheme(theme.class)
                  }}
                >
                  {currentTheme === theme.class ? "Active" : "Apply Theme"}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">How to use:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Click on any theme card to apply it instantly</li>
            <li>• The active theme is marked with a check badge</li>
            <li>• All colors are optimized for readability and accessibility</li>
            <li>• Themes work across all components and pages</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
