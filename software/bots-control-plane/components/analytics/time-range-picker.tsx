"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

export type TimeRangePreset = "today" | "7d" | "30d" | "custom"

interface TimeRangePickerProps {
  value: TimeRangePreset
  dateRange: DateRange | undefined
  onValueChange: (value: TimeRangePreset) => void
  onDateRangeChange: (range: DateRange | undefined) => void
}

function format(date: Date, formatStr: string) {
  if (formatStr === "MMM dd, yyyy") {
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
  }
  if (formatStr === "MMM dd") {
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" })
  }
  return date.toLocaleDateString()
}

function subDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

function startOfDay(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function endOfDay(date: Date) {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

export function TimeRangePicker({ value, dateRange, onValueChange, onDateRangeChange }: TimeRangePickerProps) {
  const presets = [
    { value: "today", label: "Today" },
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "custom", label: "Custom range" },
  ]

  const getDateRangeForPreset = (preset: TimeRangePreset): DateRange | undefined => {
    const now = new Date()
    switch (preset) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now) }
      case "7d":
        return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) }
      case "30d":
        return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) }
      default:
        return dateRange
    }
  }

  const handlePresetChange = (preset: TimeRangePreset) => {
    onValueChange(preset)
    if (preset !== "custom") {
      onDateRangeChange(getDateRangeForPreset(preset))
    }
  }

  const formatDateRange = () => {
    if (!dateRange?.from) return "Select date range"
    if (!dateRange.to) return format(dateRange.from, "MMM dd, yyyy")
    return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal bg-transparent">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
