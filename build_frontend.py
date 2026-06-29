import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. Dashboard
DASHBOARD = """\
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { apiClient } from "@/lib/api/client";
import { useSSE } from "@/lib/hooks/useSSE";
import { Calendar, CheckCircle2, Wallet, Activity, Zap, Flame, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();
  const { lastEvent } = useSSE();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [overviewRes, analyticsRes, streaksRes, insightsRes] = await Promise.all([
        apiClient.get("/overview").catch(() => ({ data: {} })),
        apiClient.get("/analytics/daily").catch(() => ({ data: {} })),
        apiClient.get("/streaks").catch(() => ({ data: {} })),
        apiClient.get("/ai/insights").catch(() => ({ data: [] }))
      ]);
      setData({
        overview: overviewRes.data,
        analytics: analyticsRes.data,
        streaks: streaksRes.data,
        insights: insightsRes.data
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (lastEvent) fetchData(); }, [lastEvent]);

  if (loading) return <div className="p-8 animate-pulse"><Skeleton className="h-12 w-64 mb-8" /></div>;

  const events = data?.overview?.today_events || [];
  const tasks = data?.overview?.tasks_due || [];
  const prodScore = data?.analytics?.productivity_score || 0;
  const streak = data?.streaks?.current_streak || 0;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.full_name || "User"}. Here is your briefing for {format(new Date(), "EEEE, MMMM do")}.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium">Events Today</CardTitle><Calendar className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{events.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium">Pending Tasks</CardTitle><CheckCircle2 className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{tasks.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium">Productivity</CardTitle><Activity className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{prodScore}/100</div></CardContent></Card>
        <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium">Current Streak</CardTitle><Flame className="h-4 w-4 text-orange-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{streak} Days</div></CardContent></Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader><CardTitle>Upcoming Schedule</CardTitle></CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between p-4 border rounded-xl">
                    <div><p className="font-medium">{e.title}</p><p className="text-sm text-muted-foreground">{format(new Date(e.start_datetime), "h:mm a")}</p></div>
                    <Badge>{e.event_type}</Badge>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No events scheduled.</p>}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>AI Daily Briefing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/10 text-primary rounded-xl text-sm leading-relaxed">
              Based on your schedule today, you have {events.length} meetings. Try to focus on deep work during your {events.length > 0 ? 'gaps between meetings' : 'open morning'}.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
"""

# 2. Calendar / Schedule
SCHEDULE = """\
"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SchedulePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    apiClient.get("/events").then(res => setEvents(res.data)).catch(console.error);
  }, []);

  const start = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start, end: addDays(start, 6) });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentDate(addDays(currentDate, -7))}>Prev</Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <Button variant="outline" onClick={() => setCurrentDate(addDays(currentDate, 7))}>Next</Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map(day => {
          const dayEvents = events.filter(e => new Date(e.start_datetime).toDateString() === day.toDateString());
          return (
            <Card key={day.toISOString()} className="min-h-[400px]">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-center text-sm">{format(day, "EEE")}<br/><span className="text-2xl">{format(day, "d")}</span></CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {dayEvents.map(e => (
                  <div key={e.id} className="p-2 text-xs bg-primary/10 rounded-md border border-primary/20 cursor-pointer hover:bg-primary/20">
                    <div className="font-semibold">{format(new Date(e.start_datetime), "HH:mm")}</div>
                    <div className="truncate">{e.title}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
"""

# 3. Analytics
ANALYTICS = """\
"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>({});
  
  useEffect(() => {
    Promise.all([
      apiClient.get("/analytics/daily"),
      apiClient.get("/analytics/weekly"),
      apiClient.get("/analytics/monthly"),
      apiClient.get("/analytics/yearly")
    ]).then(([d, w, m, y]) => {
      setAnalytics({ daily: d.data, weekly: w.data, monthly: m.data, yearly: y.data });
    }).catch(console.error);
  }, []);

  const renderData = (data: any) => {
    if (!data) return null;
    const expenseData = Object.entries(data.expenses_by_category || {}).map(([name, value]) => ({ name, value }));
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7'];

    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Productivity Score</CardTitle></CardHeader>
          <CardContent className="flex justify-center items-center h-64 text-6xl font-bold text-primary">
            {data.productivity_score}/100
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Expenses by Category</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {expenseData.map((entry, index) => <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Today</TabsTrigger>
          <TabsTrigger value="weekly">Week</TabsTrigger>
          <TabsTrigger value="monthly">Month</TabsTrigger>
          <TabsTrigger value="yearly">Year</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">{renderData(analytics.daily)}</TabsContent>
        <TabsContent value="weekly">{renderData(analytics.weekly)}</TabsContent>
        <TabsContent value="monthly">{renderData(analytics.monthly)}</TabsContent>
        <TabsContent value="yearly">{renderData(analytics.yearly)}</TabsContent>
      </Tabs>
    </div>
  );
}
"""

# 4. Budget & Savings Goals
BUDGET = """\
"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  useEffect(() => { apiClient.get("/budget").then(res => setBudgets(res.data)).catch(console.error); }, []);
  
  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Budget Center</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((b: any) => (
          <Card key={b.id}>
            <CardHeader><CardTitle>{b.category}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Spent: ₹{b.current_spent}</span>
                <span>Limit: ₹{b.monthly_limit}</span>
              </div>
              <Progress value={(b.current_spent / b.monthly_limit) * 100} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
"""

SAVINGS_GOALS = """\
"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function SavingsGoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  useEffect(() => { apiClient.get("/saving-goals").then(res => setGoals(res.data)).catch(console.error); }, []);
  
  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((g: any) => (
          <Card key={g.id}>
            <CardHeader><CardTitle>{g.name}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Saved: ₹{g.current_amount}</span>
                <span>Target: ₹{g.target_amount}</span>
              </div>
              <Progress value={(g.current_amount / g.target_amount) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">Deadline: {g.target_date}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
"""

# 5. AIAssistant Component
AI_ASSISTANT = """\
"use client";
import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ role: "ai", text: "Hi! I am your TimePilot AI Assistant. What can I do for you today?" }]);

  const sendMessage = async () => {
    if(!input.trim()) return;
    const userMsg = input;
    setMessages(p => [...p, { role: "user", text: userMsg }]);
    setInput("");
    
    try {
      // Re-using the schedule parsing logic from the backend
      const res: any = await apiClient.post("/schedule/parse", { text: userMsg, timezone: "UTC" });
      const msg = res.data.message || "I have processed your request.";
      setMessages(p => [...p, { role: "ai", text: msg }]);
    } catch(err) {
      setMessages(p => [...p, { role: "ai", text: "Sorry, I encountered an error communicating with the backend." }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-16 right-0 w-80 bg-card border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[400px]">
            <div className="bg-primary p-3 flex justify-between items-center text-primary-foreground">
              <div className="flex items-center gap-2 font-medium"><Sparkles className="h-4 w-4"/> AI Assistant</div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-6 w-6 text-primary-foreground hover:bg-primary/50"><X className="h-4 w-4" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t flex gap-2 bg-background">
              <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Ask AI..." className="rounded-full" />
              <Button size="icon" className="rounded-full shrink-0" onClick={sendMessage}><Send className="h-4 w-4" /></Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Button size="lg" className="h-14 w-14 rounded-full shadow-2xl bg-primary text-primary-foreground" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  );
}
"""

# Modify layout to include AIAssistant
LAYOUT_MOD = """\
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import { AIAssistant } from "@/components/ui/AIAssistant";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = { title: "TimePilot AI", description: "Productivity SaaS" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <AppLayout>{children}</AppLayout>
            <AIAssistant />
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
"""

# 8. Achievements
ACHIEVEMENTS = """\
"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, Medal } from "lucide-react";

export default function AchievementsPage() {
  const [rewards, setRewards] = useState<any[]>([]);
  useEffect(() => { apiClient.get("/rewards").then(res => setRewards(res.data)).catch(console.error); }, []);
  
  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {rewards.map((r: any) => (
          <Card key={r.id} className="relative overflow-hidden group border-primary/20 hover:border-primary transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Trophy className="h-24 w-24" /></div>
            <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Medal className="h-5 w-5 text-yellow-500" /> {r.badge_name}</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{r.description}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
"""

# 9. Streaks
STREAKS = """\
"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";

export default function StreaksPage() {
  const [streaks, setStreaks] = useState<any>(null);
  useEffect(() => { apiClient.get("/streaks").then(res => setStreaks(res.data)).catch(console.error); }, []);
  
  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Streaks Dashboard</h1>
      {streaks && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
            <CardHeader><CardTitle className="flex items-center gap-2"><Flame className="text-orange-500" /> Current Streak</CardTitle></CardHeader>
            <CardContent className="text-6xl font-bold text-orange-500">{streaks.current_streak} <span className="text-xl font-normal text-muted-foreground">Days</span></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Longest Streak</CardTitle></CardHeader>
            <CardContent className="text-6xl font-bold text-primary">{streaks.longest_streak} <span className="text-xl font-normal text-muted-foreground">Days</span></CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
"""

# 10. Settings
SETTINGS = """\
"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const { theme, setTheme } = useTheme();
  
  useEffect(() => { 
    apiClient.get("/settings/notifications").then(res => setSettings(res.data)).catch(console.error);
  }, []);

  const saveSettings = async () => {
    try {
      await apiClient.put("/settings/notifications", {
        notification_enabled: settings.notification_enabled,
        reminder_minutes: settings.reminder_minutes
      });
      toast.success("Settings saved");
    } catch(err) { toast.error("Failed to save settings"); }
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div><p className="font-medium">Enable Notifications</p><p className="text-sm text-muted-foreground">Receive reminders via Telegram</p></div>
            <Switch checked={settings.notification_enabled || false} onCheckedChange={(v) => setSettings({...settings, notification_enabled: v})} />
          </div>
          <Button onClick={saveSettings}>Save Notification Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>Light</Button>
            <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>Dark</Button>
            <Button variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')}>System</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Telegram Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl">
            <div><p className="font-bold text-primary">Connected to Bot</p><p className="text-sm text-muted-foreground">Status: Active</p></div>
            <Button variant="outline" onClick={() => window.open("https://t.me/productivityhelper_bot", "_blank")}>Open Telegram</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
"""

# AI Insights
INSIGHTS = """\
"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit } from "lucide-react";

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [procrastination, setProcrastination] = useState<any>(null);

  useEffect(() => { 
    apiClient.get("/ai/insights").then(res => setInsights(res.data)).catch(console.error);
    apiClient.get("/ai/procrastination").then(res => setProcrastination(res.data)).catch(console.error);
  }, []);
  
  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
      
      {procrastination && (
         <Card className="bg-primary/5 border-primary/20 mb-8">
            <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit className="text-primary"/> Procrastination Analysis</CardTitle></CardHeader>
            <CardContent>
              <p className="font-medium text-lg mb-2">Trend: {procrastination.procrastination_trend}</p>
              <p className="text-muted-foreground">{procrastination.recommendation}</p>
            </CardContent>
         </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight: any, i: number) => (
          <Card key={i}>
            <CardHeader><CardTitle className="text-lg">{insight.category}</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{insight.message}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
"""

def main():
    base = r"d:\CreatED\WhatsApp_Scheduler\TimePilotAI\timepilot-frontend"
    write_file(f"{base}/app/dashboard/page.tsx", DASHBOARD)
    write_file(f"{base}/app/schedule/page.tsx", SCHEDULE)
    write_file(f"{base}/app/analytics/page.tsx", ANALYTICS)
    write_file(f"{base}/app/budget/page.tsx", BUDGET)
    write_file(f"{base}/app/savings-goals/page.tsx", SAVINGS_GOALS)
    write_file(f"{base}/app/achievements/page.tsx", ACHIEVEMENTS)
    write_file(f"{base}/app/streaks/page.tsx", STREAKS)
    write_file(f"{base}/app/settings/page.tsx", SETTINGS)
    write_file(f"{base}/app/recommendations/page.tsx", INSIGHTS) # Map to AI Insights

    write_file(f"{base}/components/ui/AIAssistant.tsx", AI_ASSISTANT)
    write_file(f"{base}/app/layout.tsx", LAYOUT_MOD)

    print("All frontend files generated successfully!")

if __name__ == "__main__":
    main()
