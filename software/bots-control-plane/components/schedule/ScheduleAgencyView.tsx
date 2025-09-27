"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  X,
  Search,
  Filter
} from "lucide-react";

interface Bot {
  id: string;
  bot_code: string;
  status: "inactive" | "ready" | "running" | "error";
  validation_status: "pending" | "valid" | "invalid";
  platform?: string;
}

interface Phase {
  id: string;
  name: string;
  bot_instance_id: string;
  order_no: number;
  config_json: any;
  platform?: string;
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
const PLATFORMS = ["all", "instagram", "tiktok", "twitter", "youtube", "linkedin", "pinterest"];

export default function ScheduleAgencyView() {
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
  const [platformFilter, setPlatformFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
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
      
      // Mock data for agency - includes both creator and agency bots
      const mockBots: Bot[] = [
        // Creator bots
        { id: "bot_1", bot_code: "f2f_post", status: "ready", validation_status: "valid", platform: "f2f" },
        { id: "bot_2", bot_code: "f2f_dm", status: "ready", validation_status: "valid", platform: "f2f" },
        { id: "bot_3", bot_code: "of_post", status: "inactive", validation_status: "pending", platform: "onlyfans" },
        { id: "bot_4", bot_code: "of_dm", status: "ready", validation_status: "valid", platform: "onlyfans" },
        { id: "bot_5", bot_code: "fanvue_post", status: "ready", validation_status: "valid", platform: "fanvue" },
        { id: "bot_6", bot_code: "fanvue_dm", status: "inactive", validation_status: "pending", platform: "fanvue" },
        
        // Agency bots
        { id: "bot_7", bot_code: "instagram_post", status: "ready", validation_status: "valid", platform: "instagram" },
        { id: "bot_8", bot_code: "instagram_story", status: "ready", validation_status: "valid", platform: "instagram" },
        { id: "bot_9", bot_code: "instagram_reel", status: "ready", validation_status: "valid", platform: "instagram" },
        { id: "bot_10", bot_code: "tiktok_video", status: "ready", validation_status: "valid", platform: "tiktok" },
        { id: "bot_11", bot_code: "tiktok_live", status: "ready", validation_status: "valid", platform: "tiktok" },
        { id: "bot_12", bot_code: "twitter_tweet", status: "ready", validation_status: "valid", platform: "twitter" },
        { id: "bot_13", bot_code: "twitter_retweet", status: "ready", validation_status: "valid", platform: "twitter" },
        { id: "bot_14", bot_code: "youtube_video", status: "ready", validation_status: "valid", platform: "youtube" },
        { id: "bot_15", bot_code: "youtube_short", status: "ready", validation_status: "valid", platform: "youtube" },
        { id: "bot_16", bot_code: "linkedin_post", status: "ready", validation_status: "valid", platform: "linkedin" },
        { id: "bot_17", bot_code: "linkedin_article", status: "ready", validation_status: "valid", platform: "linkedin" },
        { id: "bot_18", bot_code: "pinterest_pin", status: "ready", validation_status: "valid", platform: "pinterest" },
        { id: "bot_19", bot_code: "pinterest_board", status: "ready", validation_status: "valid", platform: "pinterest" },
      ];

      const mockPhases: Phase[] = [
        { id: "phase_1", name: "Morning Content", bot_instance_id: "bot_1", order_no: 1, config_json: {}, platform: "f2f" },
        { id: "phase_2", name: "Evening Engagement", bot_instance_id: "bot_2", order_no: 1, config_json: {}, platform: "f2f" },
        { id: "phase_3", name: "Instagram Stories", bot_instance_id: "bot_8", order_no: 1, config_json: {}, platform: "instagram" },
        { id: "phase_4", name: "TikTok Viral", bot_instance_id: "bot_10", order_no: 1, config_json: {}, platform: "tiktok" },
        { id: "phase_5", name: "Twitter Engagement", bot_instance_id: "bot_12", order_no: 1, config_json: {}, platform: "twitter" },
      ];

      const mockSchedules: Schedule[] = [
        {
          id: "sched_1",
          bot_instance_id: "bot_1",
          start_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "scheduled"
        },
        {
          id: "sched_2",
          bot_instance_id: "bot_8",
          phase_id: "phase_3",
          start_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
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

  const getFilteredBots = () => {
    let filtered = bots.filter(bot => bot.validation_status === "valid");
    
    if (platformFilter !== "all") {
      filtered = filtered.filter(bot => bot.platform === platformFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(bot => 
        bot.bot_code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getFilteredPhases = () => {
    let filtered = phases;
    
    if (platformFilter !== "all") {
      filtered = filtered.filter(phase => phase.platform === platformFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(phase => 
        phase.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (phases.find(p => p.id === phase.id) && 
         bots.find(b => b.id === phase.bot_instance_id)?.bot_code.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return filtered;
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
      startAt.setHours(9, 0, 0, 0);
      
      // Mock API call
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

  const filteredBots = getFilteredBots();
  const filteredPhases = getFilteredPhases();

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
                <CardTitle>Bots & Phases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
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
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {PLATFORMS.map(platform => (
                    <option key={platform} value={platform}>
                      {platform === "all" ? "All Platforms" : platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bots..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bots */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Bots ({filteredBots.length})
              </CardTitle>
              <CardDescription>
                Drag to calendar to schedule full runs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {filteredBots.map(bot => (
                <div
                  key={bot.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, "bot", bot.id, bot.bot_code)}
                  className="flex items-center gap-2 p-2 rounded-md border cursor-grab hover:bg-muted transition-colors"
                >
                  <Bot className="h-4 w-4" />
                  <span className="text-sm font-medium flex-1">{bot.bot_code}</span>
                  <Badge variant="outline" className="text-xs">
                    {bot.platform}
                  </Badge>
                </div>
              ))}
              
              {filteredBots.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No bots found matching your filters.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Phases */}
          <Card>
            <CardHeader>
              <CardTitle>Phases ({filteredPhases.length})</CardTitle>
              <CardDescription>
                Drag to calendar to schedule specific phases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {filteredPhases.map(phase => {
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
                    <Badge variant="outline" className="text-xs">
                      {phase.platform}
                    </Badge>
                  </div>
                );
              })}
              
              {filteredPhases.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No phases found matching your filters.
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