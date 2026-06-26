"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, TrendingUp, IndianRupee, LayoutGrid } from "lucide-react";

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

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Productivity */}
        <Card className="col-span-full md:col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-primary">
              <TrendingUp className="h-5 w-5 mr-2" />
              Productivity Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-7xl font-bold text-primary">{data.productivity_score}</div>
            <p className="text-sm text-muted-foreground mt-2">Overall score based on task completion and balanced scheduling.</p>
          </CardContent>
        </Card>

        {/* Time Allocation */}
        <Card className="col-span-full md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
              Time Allocation (Minutes)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Study & Tasks</span>
              <span className="text-xl font-bold">{data.total_study_minutes} min</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Meetings</span>
              <span className="text-xl font-bold">{data.total_meeting_minutes} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Personal</span>
              <span className="text-xl font-bold">{data.total_personal_minutes} min</span>
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center">
              <IndianRupee className="h-6 w-6 mr-1" />
              {data.total_expenses}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Logged across {data.expense_count} entries</p>
          </CardContent>
        </Card>

        {/* Activity Volume */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.event_count}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled events</p>
          </CardContent>
        </Card>

        {/* Top Category */}
        <Card className="col-span-full md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Top Expense Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{data.most_active_category || "N/A"}</div>
            <p className="text-xs text-muted-foreground mt-1">Category with the highest spend this period.</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Review your schedule and spending patterns</p>
      </div>
      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList>
          <TabsTrigger value="daily">Today</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
          <TabsTrigger value="monthly">This Month</TabsTrigger>
          <TabsTrigger value="yearly">This Year</TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="mt-2">{renderData(analytics.daily)}</TabsContent>
        <TabsContent value="weekly" className="mt-2">{renderData(analytics.weekly)}</TabsContent>
        <TabsContent value="monthly" className="mt-2">{renderData(analytics.monthly)}</TabsContent>
        <TabsContent value="yearly" className="mt-2">{renderData(analytics.yearly)}</TabsContent>
      </Tabs>
    </div>
  );
}
