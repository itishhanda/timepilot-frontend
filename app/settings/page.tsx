"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth/context";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [profileName, setProfileName] = useState("");
  const { theme, setTheme } = useTheme();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    apiClient.get("/settings/notifications").then(res => setSettings(res.data)).catch(console.error);
    if (user) {
      setProfileName(user.full_name || "");
    }
  }, [user]);

  const saveProfile = async () => {
    try {
      await apiClient.put("/auth/me", { full_name: profileName });
      await refreshUser();
      toast.success("Profile updated");
    } catch (err) { toast.error("Failed to update profile"); }
  }

  const saveSettings = async () => {
    try {
      await apiClient.put("/settings/notifications", {
        notification_enabled: settings.notification_enabled,
        reminder_minutes: settings.reminder_minutes
      });
      toast.success("Settings saved");
    } catch (err) { toast.error("Failed to save settings"); }
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <div className="flex gap-2">
              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter your name"
                className="max-w-xs"
              />
              <Button onClick={saveProfile}>Save Name</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div><p className="font-medium">Enable Notifications</p><p className="text-sm text-muted-foreground">Receive reminders via Telegram</p></div>
            <Switch checked={settings.notification_enabled || false} onCheckedChange={(v) => setSettings({ ...settings, notification_enabled: v })} />
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
          <CardDescription>Manage your schedule using natural language on Telegram</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
            <div>
              <p className="font-bold text-primary flex items-center">
                <span className="relative flex h-3 w-3 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                Connected to Bot
              </p>
              <p className="text-sm text-muted-foreground mt-1">Ready to receive your commands</p>
            </div>
            <Button onClick={() => window.open("https://t.me/productivityhelper_bot", "_blank")}>Open Telegram</Button>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">How to use</h3>
            <div className="grid gap-3">
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <span className="font-semibold block mb-1">📅 Schedule Events</span>
                <code>"Schedule a team meeting tomorrow at 3pm"</code>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <span className="font-semibold block mb-1">💰 Log Expenses</span>
                <code>"Spent 500 on lunch today"</code>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <span className="font-semibold block mb-1">⏰ Set Reminders</span>
                <code>"Remind me to call John in 2 hours"</code>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-sm border border-primary/20 bg-primary/5">
                <span className="font-semibold text-primary block mb-1">🤖 Ask AI for Insights</span>
                <code>"Do I have time for a 1-hour gym session today?"</code>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              The AI will automatically parse your message, detect the intent, and ask for confirmation before saving.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
