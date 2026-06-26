"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Star, Medal, Flame, Lock, CheckCircle2, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MILESTONES = [3, 7, 14, 30, 60, 100];
const STREAK_TYPES = ["productivity", "workout", "study", "expense_logging"];

export default function AchievementsPage() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rewRes, strRes] = await Promise.all([
          apiClient.get("/rewards"),
          apiClient.get("/streaks")
        ]);
        setRewards(rewRes.data || []);
        setStreaks(strRes.data || []);
      } catch (e) {
        toast.error("Failed to load achievements");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getNextMilestone = (current: number) => {
    return MILESTONES.find(m => m > current) || MILESTONES[MILESTONES.length - 1];
  };

  const getRewardIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "badge": return <Medal className="h-6 w-6 text-yellow-500" />;
      case "title": return <Star className="h-6 w-6 text-blue-500" />;
      default: return <Trophy className="h-6 w-6 text-purple-500" />;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground">Track your streaks, milestones, and earned rewards</p>
      </div>
      
      <Tabs defaultValue="streaks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="streaks">Active Streaks</TabsTrigger>
          <TabsTrigger value="rewards">Unlocked Rewards</TabsTrigger>
          <TabsTrigger value="locked">Locked Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="streaks" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {streaks.map((streak) => {
              const nextMilestone = getNextMilestone(streak.current_streak);
              const progress = (streak.current_streak / nextMilestone) * 100;
              
              return (
                <Card key={streak.id} className="relative overflow-hidden group hover:border-orange-500/50 transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Flame className="h-32 w-32 text-orange-500" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg capitalize flex items-center gap-2">
                      <Flame className={`h-5 w-5 ${streak.current_streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} /> 
                      {streak.streak_type.replace("_", " ")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">{streak.current_streak}</span>
                      <span className="text-sm font-medium text-muted-foreground">days</span>
                    </div>
                    
                    <div className="space-y-1 z-10 relative">
                      <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>Progress</span>
                        <span>{streak.current_streak} / {nextMilestone} to next reward</span>
                      </div>
                      <Progress value={progress} className="h-2 [&>div]:bg-orange-500" />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                      <span className="flex items-center gap-1"><Trophy className="h-3 w-3"/> Best: {streak.longest_streak}</span>
                      {streak.last_activity_date && (
                         <span>Last: {format(new Date(streak.last_activity_date), "MMM d")}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="rewards">
          {rewards.length === 0 ? (
            <div className="text-center p-12 border rounded-xl bg-card text-muted-foreground flex flex-col items-center gap-4">
              <Trophy className="h-12 w-12 text-muted-foreground/50" />
              <p>No rewards unlocked yet. Keep building your streaks!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
              {rewards.map((r: any) => (
                <Card key={r.id} className="relative overflow-hidden group border-primary/20 hover:border-primary/50 transition-colors bg-gradient-to-br from-card to-primary/5">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    {getRewardIcon(r.reward_type)}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {getRewardIcon(r.reward_type)} 
                      {r.reward_type.toUpperCase()}
                    </CardTitle>
                    <CardDescription className="text-xs uppercase tracking-wider font-semibold text-primary">
                      {r.streak_type.replace("_", " ")} • {r.streak_count} Days
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm font-medium leading-relaxed">{r.reward_text}</p>
                    <p className="text-[10px] text-muted-foreground text-right flex items-center justify-end gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" /> 
                      Unlocked {format(new Date(r.earned_at), "MMM d, yyyy")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="locked">
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
            {STREAK_TYPES.flatMap(type => MILESTONES.map(milestone => {
              // Check if user already has this reward
              const isUnlocked = rewards.some(r => r.streak_type === type && r.streak_count === milestone);
              if (isUnlocked) return null;

              return (
                <Card key={`${type}-${milestone}`} className="opacity-60 bg-muted/20 border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground capitalize">
                      <Lock className="h-4 w-4" /> {type.replace("_", " ")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-muted-foreground/50 mb-2">{milestone} Days</p>
                    <p className="text-sm text-muted-foreground">Maintain a {milestone}-day streak to unlock a mystery reward.</p>
                  </CardContent>
                </Card>
              );
            }))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
