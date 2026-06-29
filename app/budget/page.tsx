"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Edit2, Trash2, PieChart, Receipt } from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  
  // Modals state
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any | null>(null);
  const [budgetForm, setBudgetForm] = useState({ category: "", monthly_limit: "" });

  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [expenseForm, setExpenseForm] = useState({ amount: "", category: "", description: "", expense_date: "" });

  const fetchData = async () => {
    try {
      const [bRes, eRes, sRes] = await Promise.all([
        apiClient.get("/budget"),
        apiClient.get("/expenses"),
        apiClient.get("/budget/summary").catch(() => ({ data: [] })),
      ]);
      setBudgets(bRes.data);
      setExpenses(eRes.data);
      setBudgetSummary(Array.isArray(sRes.data) ? sRes.data : []);
    } catch (e) {
      toast.error("Failed to load budget data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Budget CRUD ---
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { category: budgetForm.category, monthly_limit: parseFloat(budgetForm.monthly_limit) };
      if (selectedBudget) {
        await apiClient.put(`/budget/${selectedBudget.id}`, payload);
        toast.success("Budget updated");
      } else {
        await apiClient.post("/budget", payload);
        toast.success("Budget created");
      }
      setIsBudgetOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error saving budget");
    }
  };

  const handleDeleteBudget = async (id: number) => {
    if (!confirm("Delete this budget?")) return;
    try {
      await apiClient.delete(`/budget/${id}`);
      toast.success("Budget deleted");
      setIsBudgetOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Error deleting budget");
    }
  };

  const openBudgetModal = (budget: any = null) => {
    setSelectedBudget(budget);
    if (budget) {
      setBudgetForm({ category: budget.category, monthly_limit: budget.monthly_limit.toString() });
    } else {
      setBudgetForm({ category: "", monthly_limit: "" });
    }
    setIsBudgetOpen(true);
  };

  // --- Expense CRUD ---
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        description: expenseForm.description,
        expense_date: new Date(expenseForm.expense_date).toISOString()
      };
      if (selectedExpense) {
        await apiClient.put(`/expenses/${selectedExpense.id}`, payload);
        toast.success("Expense updated");
      } else {
        await apiClient.post("/expenses", payload);
        toast.success("Expense logged");
      }
      setIsExpenseOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error saving expense");
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await apiClient.delete(`/expenses/${id}`);
      toast.success("Expense deleted");
      setIsExpenseOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Error deleting expense");
    }
  };

  const openExpenseModal = (expense: any = null) => {
    setSelectedExpense(expense);
    if (expense) {
      const dateLocal = new Date(new Date(expense.expense_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setExpenseForm({
        amount: expense.amount.toString(),
        category: expense.category,
        description: expense.description || "",
        expense_date: dateLocal,
      });
    } else {
      const now = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setExpenseForm({ amount: "", category: "Food", description: "", expense_date: now });
    }
    setIsExpenseOpen(true);
  };

  // Use server-computed summary if available, fallback to local calculation
  const budgetsWithSpent = budgetSummary.length > 0
    ? budgetSummary
    : budgets.map((b) => {
        const spent = expenses
          .filter((e) => e.category.toLowerCase() === b.category.toLowerCase())
          .reduce((acc, e) => acc + parseFloat(e.amount), 0);
        const limit = parseFloat(b.monthly_limit);
        const remaining = Math.max(0, limit - spent);
        const percentage = limit > 0 ? Math.round(spent / limit * 100) : 0;
        return { ...b, current_spent: spent, spent, monthly_limit: limit, remaining, percentage };
      });

  const totalLimit = budgetsWithSpent.reduce((acc, b) => acc + (b.monthly_limit || 0), 0);
  const totalSpent = budgetsWithSpent.reduce((acc, b) => acc + (b.spent || b.current_spent || 0), 0);
  const totalProgress = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;


  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Center</h1>
          <p className="text-muted-foreground">Track expenses and manage monthly limits</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openBudgetModal()}>
            <PieChart className="h-4 w-4 mr-2" /> New Budget
          </Button>
          <Button onClick={() => openExpenseModal()}>
            <Plus className="h-4 w-4 mr-2" /> Log Expense
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Expense History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Master Budget Card */}
            <Card className="lg:col-span-2 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
              <CardContent className="p-6 h-full flex flex-col justify-center">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Monthly Budget</p>
                    <h2 className="text-4xl font-bold">₹{totalSpent.toLocaleString()} <span className="text-xl text-muted-foreground font-normal">/ ₹{totalLimit.toLocaleString()}</span></h2>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Remaining</p>
                    <p className="text-2xl font-bold text-primary">₹{Math.max(0, totalLimit - totalSpent).toLocaleString()}</p>
                  </div>
                </div>
                <Progress value={totalProgress} className="h-3 mb-2" />
                <p className="text-xs text-muted-foreground text-right">{totalProgress.toFixed(1)}% used</p>
              </CardContent>
            </Card>

            {/* Pie Chart Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Spending Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-[200px]">
                {totalSpent > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={budgetsWithSpent.filter(b => (b.spent || b.current_spent) > 0)}
                        dataKey="spent"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {budgetsWithSpent.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${0.9 - (index * 0.15)})`} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No spending data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Individual Budgets Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {budgetsWithSpent.length === 0 ? (
              <div className="col-span-full p-12 text-center border rounded-xl bg-card text-muted-foreground">
                No budgets set up yet. Create one to start tracking.
              </div>
            ) : (
              budgetsWithSpent.map((b: any) => {
                const spent = b.spent ?? b.current_spent ?? 0;
                const limit = b.monthly_limit ?? 0;
                const remaining = b.remaining ?? Math.max(0, limit - spent);
                const progress = b.percentage ?? (limit > 0 ? Math.round(spent / limit * 100) : 0);
                const isOver    = progress >= 100;
                const isWarning = progress >= 80 && !isOver;
                const statusColor = isOver ? "text-destructive" : isWarning ? "text-orange-500" : "text-emerald-500";
                
                return (
                  <Card key={b.id} className="group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => openBudgetModal(b)}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{b.category}</CardTitle>
                          <p className={`text-xs font-medium mt-0.5 ${statusColor}`}>
                            {isOver ? "⚠️ Over budget" : isWarning ? "⚠️ Near limit" : "✅ On track"}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); openBudgetModal(b); }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className={isOver ? "text-destructive font-bold" : ""}>₹{spent.toLocaleString(undefined, {maximumFractionDigits: 0})} spent</span>
                        <span className="text-muted-foreground">₹{Number(limit).toLocaleString(undefined, {maximumFractionDigits: 0})} limit</span>
                      </div>
                      <Progress 
                        value={Math.min(progress, 100)} 
                        className={`h-2.5 ${isOver ? "[&>div]:bg-destructive" : isWarning ? "[&>div]:bg-orange-500" : ""}`} 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{progress}% used</span>
                        <span className="text-emerald-600 font-medium">₹{Number(remaining).toLocaleString(undefined, {maximumFractionDigits: 0})} remaining</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>A history of all your logged expenses</CardDescription>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">No expenses logged yet.</div>
              ) : (
                <div className="space-y-0 divide-y">
                  {expenses.sort((a,b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()).map(e => (
                    <div key={e.id} className="flex items-center justify-between py-4 hover:bg-muted/30 px-4 -mx-4 rounded-lg cursor-pointer transition-colors" onClick={() => openExpenseModal(e)}>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Receipt className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{e.category}</p>
                          <p className="text-sm text-muted-foreground">{e.description || "No description"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{e.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(e.expense_date), "MMM d, HH:mm")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Budget Modal */}
      <Dialog open={isBudgetOpen} onOpenChange={setIsBudgetOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedBudget ? "Edit Budget" : "Create Budget"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveBudget} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input 
                required 
                value={budgetForm.category} 
                onChange={e => setBudgetForm({...budgetForm, category: e.target.value})} 
                placeholder="e.g. Food, Transport, Utilities"
              />
            </div>
            <div className="space-y-2">
              <Label>Monthly Limit (₹)</Label>
              <Input 
                type="number" 
                required 
                min="0"
                step="0.01"
                value={budgetForm.monthly_limit} 
                onChange={e => setBudgetForm({...budgetForm, monthly_limit: e.target.value})} 
                placeholder="5000"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              {selectedBudget && (
                <Button type="button" variant="destructive" onClick={() => handleDeleteBudget(selectedBudget.id)} className="mr-auto">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setIsBudgetOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Expense Modal */}
      <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedExpense ? "Edit Expense" : "Log Expense"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveExpense} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input 
                type="number" 
                required 
                min="0"
                step="0.01"
                value={expenseForm.amount} 
                onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} 
                placeholder="450"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input 
                required 
                value={expenseForm.category} 
                onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} 
                placeholder="Food"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input 
                value={expenseForm.description} 
                onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} 
                placeholder="Lunch at cafe"
              />
            </div>
            <div className="space-y-2">
              <Label>Date & Time</Label>
              <Input 
                type="datetime-local" 
                required 
                value={expenseForm.expense_date} 
                onChange={e => setExpenseForm({...expenseForm, expense_date: e.target.value})} 
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              {selectedExpense && (
                <Button type="button" variant="destructive" onClick={() => handleDeleteExpense(selectedExpense.id)} className="mr-auto">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setIsExpenseOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
