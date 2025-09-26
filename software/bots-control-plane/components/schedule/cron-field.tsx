"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertCircle } from "lucide-react"

interface CronFieldProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

// Simple cron validation and next run times calculation
function validateCron(cron: string): { isValid: boolean; error?: string } {
  const parts = cron.split(' ')
  if (parts.length !== 5) {
    return { isValid: false, error: "Cron expression must have 5 parts (minute hour day month weekday)" }
  }
  
  // Basic validation - you could make this more sophisticated
  const [minute, hour, day, month, weekday] = parts
  
  if (minute !== '*' && (parseInt(minute) < 0 || parseInt(minute) > 59)) {
    return { isValid: false, error: "Minute must be 0-59 or *" }
  }
  
  if (hour !== '*' && (parseInt(hour) < 0 || parseInt(hour) > 23)) {
    return { isValid: false, error: "Hour must be 0-23 or *" }
  }
  
  if (day !== '*' && (parseInt(day) < 1 || parseInt(day) > 31)) {
    return { isValid: false, error: "Day must be 1-31 or *" }
  }
  
  if (month !== '*' && (parseInt(month) < 1 || parseInt(month) > 12)) {
    return { isValid: false, error: "Month must be 1-12 or *" }
  }
  
  if (weekday !== '*' && (parseInt(weekday) < 0 || parseInt(weekday) > 6)) {
    return { isValid: false, error: "Weekday must be 0-6 (Sunday=0) or *" }
  }
  
  return { isValid: true }
}

function getNextRunTimes(cron: string, count: number = 5): string[] {
  // This is a simplified version - in production you'd use a proper cron library
  const now = new Date()
  const times: string[] = []
  
  // For demo purposes, generate some sample times
  for (let i = 1; i <= count; i++) {
    const nextTime = new Date(now.getTime() + i * 60 * 60 * 1000) // Add hours
    times.push(nextTime.toLocaleString())
  }
  
  return times
}

function getCronDescription(cron: string): string {
  const parts = cron.split(' ')
  const [minute, hour, day, month, weekday] = parts
  
  let description = ""
  
  if (minute !== '*') description += `At minute ${minute} `
  if (hour !== '*') description += `At hour ${hour} `
  if (day !== '*') description += `On day ${day} `
  if (month !== '*') description += `In month ${month} `
  if (weekday !== '*') description += `On weekday ${weekday} `
  
  if (description === "") description = "Every minute"
  
  return description.trim()
}

export function CronField({ value, onChange, label = "Cron Expression" }: CronFieldProps) {
  const [validation, setValidation] = useState(validateCron(value))
  const [nextRuns, setNextRuns] = useState<string[]>([])
  const [description, setDescription] = useState("")

  useEffect(() => {
    const result = validateCron(value)
    setValidation(result)
    
    if (result.isValid) {
      setNextRuns(getNextRunTimes(value))
      setDescription(getCronDescription(value))
    } else {
      setNextRuns([])
      setDescription("")
    }
  }, [value])

  const handleChange = (newValue: string) => {
    onChange(newValue)
  }

  const setCommonCron = (cron: string) => {
    onChange(cron)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cron" className="text-brand-primary font-medium">{label}</Label>
        <div className="flex gap-2">
          <Input
            id="cron"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="* * * * *"
            className={cn(
              "border-brand-accent focus:ring-brand-primary focus:border-brand-primary",
              !validation.isValid && "border-red-500"
            )}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCommonCron("0 8 * * *")}
            className="border-brand-accent text-brand-primary hover:bg-brand-primary hover:text-white"
          >
            8 AM Daily
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCommonCron("0 */4 * * *")}
            className="border-brand-accent text-brand-primary hover:bg-brand-primary hover:text-white"
          >
            Every 4 Hours
          </Button>
        </div>
        
        {!validation.isValid && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {validation.error}
          </div>
        )}
      </div>

      {validation.isValid && (
        <Card className="border-brand-muted bg-brand-muted/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-brand-primary">
              <Clock className="h-4 w-4" />
              Cron Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p className="text-sm font-medium text-brand-primary">{description}</p>
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground">Next 5 Run Times</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {nextRuns.map((time, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-brand-accent text-brand-primary-dark">
                    {time}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Missing utility function
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
