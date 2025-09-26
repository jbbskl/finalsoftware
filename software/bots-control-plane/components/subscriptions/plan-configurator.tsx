"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { pricePerScriptPerModel, monthlyTotal, calculateConcurrency } from "@/lib/types"
import { toast } from "sonner"

interface PlanConfiguratorProps {
  initialModels?: number
  initialScriptsPerModel?: number
  onSave?: (models: number, scriptsPerModel: number) => void
}

export function PlanConfigurator({ 
  initialModels = 3, 
  initialScriptsPerModel = 4,
  onSave 
}: PlanConfiguratorProps) {
  const [models, setModels] = useState(initialModels)
  const [scriptsPerModel, setScriptsPerModel] = useState(initialScriptsPerModel)
  const [isSaving, setIsSaving] = useState(false)

  const pricePerScript = pricePerScriptPerModel(models)
  const total = monthlyTotal(models, scriptsPerModel)
  const concurrency = calculateConcurrency(models)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSave?.(models, scriptsPerModel)
      toast.success("Plan updated successfully!")
    } catch (error) {
      toast.error("Failed to update plan")
    } finally {
      setIsSaving(false)
    }
  }

  const isEnterprise = pricePerScript === "enterprise"

  return (
    <Card className="border-brand-muted shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white">
        <CardTitle className="text-white">Plan Configurator</CardTitle>
        <CardDescription className="text-brand-muted">
          Configure your subscription plan by adjusting the number of models and scripts per model.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="models" className="text-brand-primary font-medium">Number of Models</Label>
            <Input
              id="models"
              type="number"
              min="1"
              max="30"
              value={models}
              onChange={(e) => setModels(parseInt(e.target.value) || 1)}
              className="border-brand-accent focus:ring-brand-primary focus:border-brand-primary"
            />
            <p className="text-xs text-muted-foreground">
              How many models your organization manages
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="scriptsPerModel" className="text-brand-primary font-medium">Scripts per Model</Label>
            <Input
              id="scriptsPerModel"
              type="number"
              min="1"
              max="10"
              value={scriptsPerModel}
              onChange={(e) => setScriptsPerModel(parseInt(e.target.value) || 1)}
              className="border-brand-accent focus:ring-brand-primary focus:border-brand-primary"
            />
            <p className="text-xs text-muted-foreground">
              How many scripts are enabled per model
            </p>
          </div>
        </div>

        <Separator className="bg-brand-muted" />

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-brand-muted/20 rounded-lg">
            <span className="text-sm font-medium text-brand-primary">Price per Script per Model:</span>
            {isEnterprise ? (
              <Badge variant="secondary" className="bg-brand-accent text-brand-primary-dark">Enterprise</Badge>
            ) : (
              <span className="text-lg font-bold text-brand-primary">€{pricePerScript}</span>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-brand-muted/20 rounded-lg">
            <span className="text-sm font-medium text-brand-primary">Monthly Total:</span>
            {isEnterprise ? (
              <Badge variant="secondary" className="bg-brand-accent text-brand-primary-dark">Contact Sales</Badge>
            ) : (
              <span className="text-2xl font-bold text-brand-primary">€{total}</span>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-brand-muted/20 rounded-lg">
            <span className="text-sm font-medium text-brand-primary">Max Concurrent Runs:</span>
            <span className="text-lg font-bold text-brand-secondary">{concurrency}</span>
          </div>
        </div>

        <Separator className="bg-brand-muted" />

        {isEnterprise ? (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              For enterprise plans with more than 25 models, please contact our sales team.
            </p>
            <Button variant="outline" size="lg" className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white">
              Contact Sales
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white transition-colors"
            size="lg"
          >
            {isSaving ? "Saving..." : "Save & Continue"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
