"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar as CalendarIcon, List, LayoutGrid, Clock, Trash2, Edit2, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EVENT_COLORS: Record<string, string> = {
  meeting: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  appointment: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  task: "bg-green-500/20 text-green-400 border-green-500/30",
  reminder: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  class: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  default: "bg-primary/20 text-primary border-primary/30",
};

export default function SchedulePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("week");
  
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "meeting",
    start_datetime: "",
    end_datetime: "",
  });

  const fetchEvents = async () => {
    try {
      const res = await apiClient.get("/events");
      setEvents(res.data);
    } catch (e) {
      toast.error("Failed to load events");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // --- CRUD Operations ---
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ensure ISO format with Z (UTC) or local offset for backend if needed
      // Here we assume backend handles naive or local ISO strings correctly, or we can enforce ISO:
      const payload = {
        ...formData,
        start_datetime: new Date(formData.start_datetime).toISOString(),
        end_datetime: formData.end_datetime ? new Date(formData.end_datetime).toISOString() : null,
      };

      if (selectedEvent) {
        await apiClient.put(`/events/${selectedEvent.id}`, payload);
        toast.success("Event updated");
      } else {
        await apiClient.post("/events", payload);
        toast.success("Event created");
      }
      setIsAddOpen(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error saving event");
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await apiClient.delete(`/events/${id}`);
      toast.success("Event deleted");
      setSelectedEvent(null);
      setIsAddOpen(false);
      fetchEvents();
    } catch (err) {
      toast.error("Error deleting event");
    }
  };

  const openEditModal = (event: any) => {
    // Format to YYYY-MM-DDThh:mm for the local datetime-local input
    const startIso = new Date(event.start_datetime);
    const startLocal = new Date(startIso.getTime() - startIso.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    let endLocal = "";
    if (event.end_datetime) {
      const endIso = new Date(event.end_datetime);
      endLocal = new Date(endIso.getTime() - endIso.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } else {
      // Default to 1 hour after start
      const defaultEnd = new Date(startIso);
      defaultEnd.setHours(defaultEnd.getHours() + 1);
      endLocal = new Date(defaultEnd.getTime() - defaultEnd.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    setFormData({
      title: event.title,
      description: event.description || "",
      event_type: event.event_type,
      start_datetime: startLocal,
      end_datetime: endLocal,
    });
    setSelectedEvent(event);
    setIsAddOpen(true);
  };

  const openAddModal = (date?: Date) => {
    const now = date ? new Date(date) : new Date();
    if (date) {
        now.setHours(new Date().getHours() + 1, 0, 0, 0); // Next hour on selected day
    } else {
        now.setHours(now.getHours() + 1, 0, 0, 0);
    }

    const startIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    const end = new Date(now);
    end.setHours(end.getHours() + 1);
    const endIso = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setFormData({
      title: "",
      description: "",
      event_type: "meeting",
      start_datetime: startIso,
      end_datetime: endIso,
    });
    setSelectedEvent(null);
    setIsAddOpen(true);
  };

  // --- Date Calculations ---
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding for month view grid
  const startOffset = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
  const monthGrid = Array.from({ length: startOffset }).map(() => null).concat(monthDays as any);

  const getEventColor = (type: string) => EVENT_COLORS[type?.toLowerCase()] || EVENT_COLORS.default;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">{format(currentDate, "MMMM yyyy")}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={setView} className="mr-4">
            <TabsList>
              <TabsTrigger value="month"><LayoutGrid className="h-4 w-4 mr-2" /> Month</TabsTrigger>
              <TabsTrigger value="week"><CalendarIcon className="h-4 w-4 mr-2" /> Week</TabsTrigger>
              <TabsTrigger value="agenda"><List className="h-4 w-4 mr-2" /> Agenda</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button variant="outline" onClick={() => setCurrentDate(view === "month" ? addDays(currentDate, -30) : addDays(currentDate, -7))}>Prev</Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <Button variant="outline" onClick={() => setCurrentDate(view === "month" ? addDays(currentDate, 30) : addDays(currentDate, 7))}>Next</Button>
          
          <Button onClick={() => openAddModal()} className="ml-2">
            <Plus className="h-4 w-4 mr-2" /> Add Event
          </Button>
        </div>
      </div>

      {/* Week View */}
      {view === "week" && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map(day => {
            const dayEvents = events.filter(e => isSameDay(new Date(e.start_datetime), day));
            const isToday = isSameDay(day, new Date());
            return (
              <Card key={day.toISOString()} className={`min-h-[400px] transition-colors ${isToday ? 'border-primary/50 bg-primary/5' : ''}`}>
                <CardHeader className="p-4 border-b text-center cursor-pointer hover:bg-muted/50" onClick={() => openAddModal(day)}>
                  <CardTitle className="text-sm text-muted-foreground font-medium">{format(day, "EEE")}</CardTitle>
                  <div className={`text-2xl font-bold mt-1 ${isToday ? 'text-primary' : ''}`}>{format(day, "d")}</div>
                </CardHeader>
                <CardContent className="p-2 space-y-2">
                  {dayEvents.sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()).map(e => (
                    <div 
                      key={e.id} 
                      onClick={() => openEditModal(e)}
                      className={`p-2 text-xs rounded-md border cursor-pointer hover:opacity-80 transition-opacity ${getEventColor(e.event_type)}`}
                    >
                      <div className="font-semibold">{format(new Date(e.start_datetime), "HH:mm")}</div>
                      <div className="truncate font-medium mt-0.5">{e.title}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Month View */}
      {view === "month" && (
        <div className="border rounded-xl bg-card overflow-hidden">
          <div className="grid grid-cols-7 border-b bg-muted/50">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
              <div key={d} className="p-3 text-center text-sm font-semibold text-muted-foreground">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-[120px]">
            {monthGrid.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="border-b border-r bg-muted/20" />;
              
              const dayEvents = events.filter(e => isSameDay(new Date(e.start_datetime), day));
              const isToday = isSameDay(day, new Date());
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={`border-b border-r p-2 overflow-y-auto cursor-pointer hover:bg-muted/30 transition-colors ${isToday ? 'bg-primary/5' : ''}`}
                  onClick={() => openAddModal(day)}
                >
                  <div className={`text-right text-sm mb-1 ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(e => (
                      <div 
                        key={e.id} 
                        onClick={(ev) => { ev.stopPropagation(); openEditModal(e); }}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate border cursor-pointer hover:opacity-80 ${getEventColor(e.event_type)}`}
                      >
                        {format(new Date(e.start_datetime), "HH:mm")} {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-muted-foreground text-center font-medium mt-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agenda View */}
      {view === "agenda" && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {events.length === 0 ? (
            <div className="text-center p-12 border rounded-xl bg-card text-muted-foreground">
              No upcoming events found.
            </div>
          ) : (
            events
              .filter(e => new Date(e.start_datetime) >= new Date(new Date().setHours(0,0,0,0)))
              .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
              .map(e => (
                <Card key={e.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openEditModal(e)}>
                  <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="flex-shrink-0 text-left md:text-center md:w-20">
                      <div className="text-sm font-semibold text-primary">{format(new Date(e.start_datetime), "MMM d")}</div>
                      <div className="text-xl font-bold">{format(new Date(e.start_datetime), "HH:mm")}</div>
                    </div>
                    <div className="hidden md:block h-10 w-px bg-border"></div>
                    <div className="flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-lg">{e.title}</h3>
                        <Badge variant="outline" className={getEventColor(e.event_type)}>{e.event_type}</Badge>
                      </div>
                      {e.description && <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{e.description}</p>}
                    </div>
                    <div className="self-end md:self-center">
                      <Button variant="ghost" size="icon" onClick={(ev) => { ev.stopPropagation(); openEditModal(e); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      )}

      {/* Add / Edit Event Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? "Edit Event" : "Create Event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEvent} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input 
                required 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="Meeting with Team"
              />
            </div>
            <div className="space-y-2">
              <Label>Event Type</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.event_type}
                onChange={e => setFormData({...formData, event_type: e.target.value})}
              >
                <option value="meeting">Meeting</option>
                <option value="appointment">Appointment</option>
                <option value="task">Task</option>
                <option value="class">Class</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input 
                  type="datetime-local" 
                  required 
                  value={formData.start_datetime}
                  onChange={e => setFormData({...formData, start_datetime: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input 
                  type="datetime-local" 
                  value={formData.end_datetime}
                  onChange={e => setFormData({...formData, end_datetime: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Discuss project roadmap..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              {selectedEvent && (
                <Button type="button" variant="destructive" onClick={() => handleDeleteEvent(selectedEvent.id)} className="mr-auto">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
