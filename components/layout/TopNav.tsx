"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Menu, Bell, Search, Sun, Moon, BookOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { useTheme } from "next-themes";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function TopNav({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean; setIsSidebarOpen: (val: boolean) => void }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  
  // Search State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>({ events: [], tasks: [], expenses: [] });

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);

  // Load persistent notifications from API
  const loadNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get("/notifications");
      if (Array.isArray(res.data)) {
        setNotifications(res.data.map((n: any) => ({
          ...n,
          text: n.title || n.body || "Notification",
          timestamp: new Date(n.notification_time || n.created_at),
          read: n.is_read,
        })));
      }
    } catch {
      // Silently fail if notifications endpoint unavailable
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Connect to SSE
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/events/stream?token=${token}`);

    eventSource.addEventListener("update", (e) => {
      try {
        const data = JSON.parse(e.data);
        
        let text = `Update: ${data.type?.replace(/_/g, ' ')}`;
        if (data.type === "notification_sent") {
          text = data.message || "New Reminder";
        } else if (data.type === "event_created") {
          text = `New event created: ${data.title}`;
        } else if (data.type === "streak_updated") {
          text = `Streak updated! Now at ${data.current_streak} days.`;
        } else if (data.type === "study_plan_created") {
          text = `Study plan created: ${data.count} sessions added!`;
        } else if (data.type === "schedule_negotiated") {
          text = `AI schedule saved: ${data.count} events added!`;
        } else if (data.type === "budget_updated") {
          text = "Budget updated from Telegram.";
        }

        const newNotif = {
          id: Date.now(),
          text,
          data,
          read: false,
          timestamp: new Date(),
        };

        setNotifications(prev => [newNotif, ...prev].slice(0, 50));
        
        toast.info(text, { icon: <Bell className="h-4 w-4" /> });

        // Reload API notifications to sync
        loadNotifications();
      } catch (err) {
        console.error("SSE parse error", err);
      }
    });

    eventSource.onerror = (error) => {
      console.error("SSE error", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [loadNotifications]);

  // CMD+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search effect
  useEffect(() => {
    if (searchQuery.length > 2) {
      const delay = setTimeout(() => {
        apiClient.get(`/search?q=${searchQuery}`)
          .then(res => setSearchResults(res.data))
          .catch(console.error);
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setSearchResults({ events: [], tasks: [], expenses: [] });
    }
  }, [searchQuery]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await apiClient.put("/notifications/read-all");
    } catch {
      // Silently fail
    }
  };

  const handleSearchResultClick = (type: string, item: any) => {
    setSearchOpen(false);
    setSearchQuery("");
    if (type === "event") router.push("/schedule");
    else if (type === "expense") router.push("/budget");
    else if (type === "task") router.push("/schedule");
    else router.push("/dashboard");
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 md:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden md:flex hover:bg-primary/10 transition-colors">
            <Menu className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="outline" 
            className="hidden md:flex items-center gap-2 text-muted-foreground w-64 justify-start bg-muted/30 border-muted-foreground/20 hover:bg-muted/50 transition-all rounded-full px-4"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left font-normal text-sm">Search anything...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-colors" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-primary/10 transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary border-2 border-card animate-pulse" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>Notifications</span>
                {unreadCount > 0 && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{unreadCount} New</span>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
                ) : (
                  notifications.map(n => (
                    <DropdownMenuItem key={n.id} className="flex justify-between items-start p-3 cursor-default border-b last:border-0">
                      <div className="flex gap-2 items-start">
                        {!n.read && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                        <div>
                          <span className={`text-sm block ${n.read ? 'text-muted-foreground' : 'font-medium'}`}>{n.text}</span>
                          <span className="text-[10px] text-muted-foreground">{n.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-primary font-medium cursor-pointer" onClick={() => { setNotifications(notifications.map(n => ({...n, read: true }))); markAllRead(); }}>
                    Mark all as read
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-2 ring-2 ring-transparent hover:ring-primary/20 transition-all">
                <Avatar className="h-9 w-9 border shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold">
                    {user?.full_name?.charAt(0) || user?.phone_number?.substring(1, 3) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.full_name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.phone_number}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer font-medium">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl border bg-card/95 backdrop-blur-xl">
          <div className="flex items-center border-b px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground mr-3" />
            <input
              className="flex-1 bg-transparent outline-none text-lg placeholder:text-muted-foreground"
              placeholder="Search events, tasks, budgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {searchQuery.length > 2 ? (
              <div className="space-y-4 p-2">
                {searchResults.events?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-2 uppercase tracking-wider">Events</h3>
                    {searchResults.events.map((e: any) => (
                      <div key={e.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/10 cursor-pointer transition-colors" onClick={() => handleSearchResultClick("event", e)}>
                        <span className="font-medium text-sm">{e.title}</span>
                        <span className="text-xs text-muted-foreground capitalize">{e.event_type}</span>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.tasks?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-2 uppercase tracking-wider">Tasks</h3>
                    {searchResults.tasks.map((e: any) => (
                      <div key={e.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/10 cursor-pointer transition-colors" onClick={() => handleSearchResultClick("task", e)}>
                        <span className="font-medium text-sm">{e.title}</span>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.expenses?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-2 uppercase tracking-wider">Expenses</h3>
                    {searchResults.expenses.map((e: any) => (
                      <div key={e.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/10 cursor-pointer transition-colors" onClick={() => handleSearchResultClick("expense", e)}>
                        <span className="font-medium text-sm">{e.description || e.category}</span>
                        <span className="text-xs font-medium text-primary">₹{e.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {searchResults.events?.length === 0 && searchResults.tasks?.length === 0 && searchResults.expenses?.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Type at least 3 characters to search
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
