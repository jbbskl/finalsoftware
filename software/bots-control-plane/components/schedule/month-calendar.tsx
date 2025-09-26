"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalendarDay {
  date: string
  runs: number
  isToday: boolean
  isCurrentMonth: boolean
}

interface MonthCalendarProps {
  itemsByDay: Record<string, number>
  onDayClick?: (date: string) => void
}

export function MonthCalendar({ itemsByDay, onDayClick }: MonthCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const generateCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = []
    const today = new Date()
    
    // Get first day of month and last day of month
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    
    // Get first day of week (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay()
    
    // Add days from previous month to fill first week
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth, -i)
      days.push({
        date: date.toISOString().split('T')[0],
        runs: itemsByDay[date.toISOString().split('T')[0]] || 0,
        isToday: date.toDateString() === today.toDateString(),
        isCurrentMonth: false
      })
    }
    
    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day)
      days.push({
        date: date.toISOString().split('T')[0],
        runs: itemsByDay[date.toISOString().split('T')[0]] || 0,
        isToday: date.toDateString() === today.toDateString(),
        isCurrentMonth: true
      })
    }
    
    // Add days from next month to fill last week
    const remainingDays = 42 - days.length // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day)
      days.push({
        date: date.toISOString().split('T')[0],
        runs: itemsByDay[date.toISOString().split('T')[0]] || 0,
        isToday: date.toDateString() === today.toDateString(),
        isCurrentMonth: false
      })
    }
    
    return days
  }

  const calendarDays = generateCalendarDays()

  return (
    <Card className="border-brand-muted shadow-sm">
      <CardHeader className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5" />
            {monthNames[currentMonth]} {currentYear}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday} className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth} className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-brand-primary">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={cn(
                "min-h-[80px] p-2 border rounded-lg cursor-pointer hover:bg-brand-muted/20 transition-colors",
                day.isToday && "ring-2 ring-brand-primary bg-brand-muted/30",
                !day.isCurrentMonth && "opacity-50 bg-gray-50",
                day.runs > 0 && "bg-brand-muted/30 border-brand-accent"
              )}
              onClick={() => onDayClick?.(day.date)}
            >
              <div className="text-sm font-medium mb-1">
                {new Date(day.date).getDate()}
              </div>
              
              {day.runs > 0 && (
                <div className="text-xs text-brand-primary font-medium">
                  {day.runs} run{day.runs !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
