"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  Plus, 
  Copy, 
  Trash2, 
  Bot, 
  Play, 
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react";
import { createSchedule, copyDay, deleteSchedule } from "@/lib/api-schedules";

interface Bot {
  id: string;
  bot_code: string;
  status: "inactive" | "ready" | "running" | "error";
  validation_status: "pending" | "valid" | "invalid";
}

interface Phase {
  id: string;
  name: string;
  bot_instance_id: string;
  order_no: number;
  config_json: any;
}

interface Schedule {
  id: string;
  bot_instance_id: string;
  phase_id?: string;
  start_at: string;
  end_at?: string;
  status: "scheduled" | "running" | "completed" | "failed" | "cancelled";
}

interface CalendarDay {
  date: Date;
  schedules: Schedule[];
}

const TIMEZONE = "Europe/Amsterdam";

export default function ScheduleCreatorView() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [copiedDay, setCopiedDay] = useState<Date | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ type: "bot" | "phase", id: string, name: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, date: Date } | null>(null);
  
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual API calls
      const mockBots: Bot[] = [
        { id: "bot_1", bot_code: "f2f_post", status: "ready", validation_status: "valid" },
        { id: "bot_2", bot_code: "f2f_dm", status: "ready", validation_status: "valid" },
        { id: "bot_3", bot_code: "of_post", status: "inactive", validation_status: "pending" },
        { id: "bot_4", bot_code: "of_dm", status: "ready", validation_status: "valid" },
        { id: "bot_5", bot_code: "fanvue_post", status: "ready", validation_status: "valid" },
        { id: "bot_6", bot_code: "fanvue_dm", status: "inactive", validation_status: "pending" },
      ];

      const mockPhases: Phase[] = [
        { id: "phase_1", name: "Morning Post", bot_instance_id: "bot_1", order_no: 1, config_json: {} },
        { id: "phase_2", name: "Evening DM", bot_instance_id: "bot_2", order_no: 1, config_json: {} },
        { id: "phase_3", name: "Weekend Special", bot_instance_id: "bot_4", order_no: 1, config_json: {} },
      ];

      const mockSchedules: Schedule[] = [
        {
          id: "sched_1",
          bot_instance_id: "bot_1",
          start_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          status: "scheduled"
        },
        {
          id: "sched_2",
          bot_instance_id: "bot_2",
          phase_id: "phase_2",
          start_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
          status: "scheduled"
        }
      ];

      setBots(mockBots);
      setPhases(mockPhases);
      setSchedules(mockSchedules);
    } catch (error) {
      console.error("Error loading schedule data:", error);
      toast.error("Failed to load schedule data");
    } finally {
      setLoading(false);
    }
  };

  const getCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const daySchedules = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.start_at);
        return scheduleDate.toDateString() === current.toDateString();
      });
      
      days.push({
        date: new Date(current),
        schedules: daySchedules
      });
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const canCreateSchedule = (date: Date): boolean => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    return date >= oneHourFromNow;
  };

  const canDeleteSchedule = (date: Date): boolean => {
    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    return date >= tenMinutesFromNow;
  };

  const handleDragStart = (e: React.DragEvent, type: "bot" | "phase", id: string, name: string) => {
    setDraggedItem({ type, id, name });
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    
    if (!draggedItem || !canCreateSchedule(date)) {
      if (!canCreateSchedule(date)) {
        toast.error("Cannot schedule within 1 hour of current time");
      }
      return;
    }

    try {
      const startAt = new Date(date);
      startAt.setHours(9, 0, 0, 0); // Default to 9 AM
      
      const scheduleData = {
        bot_instance_id: draggedItem.id,
        start_at: startAt.toISOString(),
        ...(draggedItem.type === "phase" && phases.find(p => p.id === draggedItem.id) && {
          phase_id: draggedItem.id
        })
      };

      // Mock API call - replace with actual createSchedule call
      // await createSchedule(scheduleData);
      
      const newSchedule: Schedule = {
        id: `sched_${Date.now()}`,
        bot_instance_id: draggedItem.id,
        phase_id: draggedItem.type === "phase" ? draggedItem.id : undefined,
        start_at: startAt.toISOString(),
        status: "scheduled"
      };

      setSchedules(prev => [...prev, newSchedule]);
      toast.success(`${draggedItem.name} scheduled successfully`);
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast.error("Failed to create schedule");
    } finally {
      setDraggedItem(null);
    }
  };

  const handleDayClick = (date: Date) => {
    if (canCreateSchedule(date)) {
      setSelectedDate(date);
      setShowAddModal(true);
    } else {
      toast.error("Cannot schedule within 1 hour of current time");
    }
  };

  const handleContextMenu = (e: React.MouseEvent, date: Date) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, date });
  };

  const handleCopyDay = async () => {
    if (!contextMenu) return;
    
    const daySchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.start_at);
      return scheduleDate.toDateString() === contextMenu.date.toDateString();
    });

    if (daySchedules.length === 0) {
      toast.error("No schedules to copy");
      setContextMenu(null);
      return;
    }

    setCopiedDay(contextMenu.date);
    toast.success("Day copied to clipboard");
    setContextMenu(null);
  };

  const handlePasteDay = async () => {
    if (!contextMenu || !copiedDay) return;

    try {
      const sourceSchedules = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.start_at);
        return scheduleDate.toDateString() === copiedDay.toDateString();
      });

      if (sourceSchedules.length === 0) {
        toast.error("No schedules to paste");
        setContextMenu(null);
        return;
      }

      // Mock API call - replace with actual copyDay call
      // await copyDay(copiedDay, contextMenu.date);

      const newSchedules: Schedule[] = sourceSchedules.map(schedule => {
        const sourceDate = new Date(schedule.start_at);
        const targetDate = new Date(contextMenu.date);
        targetDate.setHours(sourceDate.getHours(), sourceDate.getMinutes(), 0, 0);
        
        return {
          ...schedule,
          id: `sched_${Date.now()}_${Math.random()}`,
          start_at: targetDate.toISOString(),
          status: "scheduled" as const
        };
      });

      setSchedules(prev => [...prev, ...newSchedules]);
      toast.success("Day pasted successfully");
      setCopiedDay(null);
    } catch (error) {
      console.error("Error pasting day:", error);
      toast.error("Failed to paste day");
    } finally {
      setContextMenu(null);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string, scheduleDate: Date) => {
    if (!canDeleteSchedule(scheduleDate)) {
      toast.error("Cannot delete schedule within 10 minutes of start time");
      return;
    }

    try {
      // Mock API call - replace with actual deleteSchedule call
      // await deleteSchedule(scheduleId);
      
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      toast.success("Schedule deleted successfully");
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast.error("Failed to delete schedule");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="h-3 w-3 text-blue-500" />;
      case "running":
        return <Play className="h-3 w-3 text-green-500" />;
      case "completed":
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case "failed":
        return <X className="h-3 w-3 text-red-500" />;
      case "cancelled":
        return <AlertCircle className="h-3 w-3 text-gray-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
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

  const calendarDays = getCalendarDays();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const readyBots = bots.filter(bot => bot.validation_status === "valid");

  if (loading) {
    return (
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Schedule</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-muted animate-pulse rounded-md" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Schedule</h1>
          <p className="text-muted-foreground">Timezone: {TIMEZONE}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <CardDescription>
                Drag bots or phases to calendar days to create schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={calendarRef} className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((day, index) => {
                  const isCurrentMonth = day.date.getMonth() === currentDate.getMonth();
                  const isToday = day.date.toDateString() === new Date().toDateString();
                  const canSchedule = canCreateSchedule(day.date);
                  
                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[100px] p-2 border rounded-md cursor-pointer transition-colors
                        ${isCurrentMonth ? "bg-background" : "bg-muted/50"}
                        ${isToday ? "ring-2 ring-primary" : ""}
                        ${canSchedule ? "hover:bg-muted" : "opacity-50 cursor-not-allowed"}
                      `}
                      onClick={() => handleDayClick(day.date)}
                      onContextMenu={(e) => handleContextMenu(e, day.date)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day.date)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm ${isCurrentMonth ? "font-medium" : "text-muted-foreground"}`}>
                          {day.date.getDate()}
                        </span>
                        {!canSchedule && (
                          <AlertCircle className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {day.schedules.map(schedule => {
                          const bot = bots.find(b => b.id === schedule.bot_instance_id);
                          const phase = phases.find(p => p.id === schedule.phase_id);
                          const canDelete = canDeleteSchedule(day.date);
                          
                          return (
                            <div
                              key={schedule.id}
                              className="flex items-center gap-1 text-xs"
                            >
                              {getStatusIcon(schedule.status)}
                              <Badge 
                                variant="secondary" 
                                className={`text-xs px-1 py-0 ${getStatusColor(schedule.status)}`}
                              >
                                {phase ? phase.name : bot?.bot_code || "Unknown"}
                              </Badge>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSchedule(schedule.id, day.date);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Bots */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Bots
              </CardTitle>
              <CardDescription>
                Drag to calendar to schedule full runs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {readyBots.map(bot => (
                <div
                  key={bot.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, "bot", bot.id, bot.bot_code)}
                  className="flex items-center gap-2 p-2 rounded-md border cursor-grab hover:bg-muted transition-colors"
                >
                  <Bot className="h-4 w-4" />
                  <span className="text-sm font-medium">{bot.bot_code}</span>
                  <Badge variant="outline" className="text-xs">
                    {bot.status}
                  </Badge>
                </div>
              ))}
              
              {readyBots.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No ready bots available. Validate your bots first.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Phases */}
          <Card>
            <CardHeader>
              <CardTitle>Phases</CardTitle>
              <CardDescription>
                Drag to calendar to schedule specific phases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {phases.map(phase => {
                const bot = bots.find(b => b.id === phase.bot_instance_id);
                return (
                  <div
                    key={phase.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, "phase", phase.id, phase.name)}
                    className="flex items-center gap-2 p-2 rounded-md border cursor-grab hover:bg-muted transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{phase.name}</span>
                      <p className="text-xs text-muted-foreground">{bot?.bot_code}</p>
                    </div>
                  </div>
                );
              })}
              
              {phases.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No phases available. Create phases for your bots.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduling Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-green-500" />
                <span>Can create schedules ≥1 hour from now</span>
              </div>
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-500" />
                <span>Can delete schedules ≥10 minutes before start</span>
              </div>
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4 text-blue-500" />
                <span>Right-click day to copy/paste</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-background border rounded-md shadow-lg z-50 py-1"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2"
            onClick={handleCopyDay}
          >
            <Copy className="h-4 w-4" />
            Copy Day
          </button>
          {copiedDay && (
            <button
              className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2"
              onClick={handlePasteDay}
            >
              <Copy className="h-4 w-4" />
              Paste Day
            </button>
          )}
        </div>
      )}
    </main>
  );
}