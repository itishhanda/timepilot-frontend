"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { Target, Plus, Edit2, Trash2, PiggyBank, PlusCircle } from "lucide-react";

export default function SavingsGoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  
  // Create / Edit Modal
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    goal_name: "",
    target_amount: "",
    current_saved: "",
    deadline: "",
    description: "",
  });

  // Add Funds Modal
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState("");

  const fetchGoals = async () => {
    try {
      const res = await apiClient.get("/saving-goals");
      setGoals(res.data);
    } catch (e) {
      toast.error("Failed to load savings goals");
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        goal_name: formData.goal_name,
        target_amount: parseFloat(formData.target_amount),
        current_saved: formData.current_saved ? parseFloat(formData.current_saved) : 0,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        description: formData.description,
      };

      if (selectedGoal) {
        await apiClient.put(`/saving-goals/${selectedGoal.id}`, payload);
        toast.success("Goal updated");
      } else {
        await apiClient.post("/saving-goals", payload);
        toast.success("Goal created");
      }
      setIsOpen(false);
      fetchGoals();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error saving goal");
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!confirm("Are you sure you want to delete this saving goal?")) return;
    try {
      await apiClient.delete(`/saving-goals/${id}`);
      toast.success("Goal deleted");
      setIsOpen(false);
      fetchGoals();
    } catch (err) {
      toast.error("Error deleting goal");
    }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post(`/saving-goals/${selectedGoal.id}/add`, { amount: parseFloat(addFundsAmount) });
      toast.success("Funds added successfully!");
      setIsAddFundsOpen(false);
      fetchGoals();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error adding funds");
    }
  };

  const openModal = (goal: any = null) => {
    setSelectedGoal(goal);
    if (goal) {
      const dateLocal = goal.deadline ? new Date(new Date(goal.deadline).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
      setFormData({
        goal_name: goal.goal_name,
        target_amount: goal.target_amount.toString(),
        current_saved: goal.current_saved.toString(),
        deadline: dateLocal,
        description: goal.description || "",
      });
    } else {
      setFormData({ goal_name: "", target_amount: "", current_saved: "", deadline: "", description: "" });
    }
    setIsOpen(true);
  };

  const openAddFunds = (goal: any) => {
    setSelectedGoal(goal);
    setAddFundsAmount("");
    setIsAddFundsOpen(true);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-muted-foreground">Track progress towards your financial targets</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" /> New Goal
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.length === 0 ? (
          <div className="col-span-full p-12 text-center border rounded-xl bg-card text-muted-foreground">
            No savings goals yet. Create one to start tracking.
          </div>
        ) : (
          goals.map(goal => {
            const progress = goal.target_amount > 0 ? (goal.current_saved / goal.target_amount) * 100 : 0;
            const isCompleted = goal.is_completed || progress >= 100;

            return (
              <Card key={goal.id} className={`group hover:border-primary/50 transition-colors relative overflow-hidden ${isCompleted ? 'border-green-500/50 bg-green-500/5' : ''}`}>
                {isCompleted && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    COMPLETED
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-500/20 text-green-500' : 'bg-primary/10 text-primary'}`}>
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{goal.goal_name}</CardTitle>
                        {goal.deadline && (
                          <CardDescription className="text-xs mt-1">
                            Target: {format(new Date(goal.deadline), "MMM d, yyyy")}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openModal(goal)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-3xl font-bold">₹{goal.current_saved.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">of ₹{goal.target_amount.toLocaleString()}</p>
                    </div>
                    {!isCompleted && (
                      <Button variant="outline" size="sm" className="h-8 rounded-full px-3" onClick={() => openAddFunds(goal)}>
                        <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                      <span>{progress.toFixed(1)}%</span>
                      <span>₹{Math.max(0, goal.target_amount - goal.current_saved).toLocaleString()} left</span>
                    </div>
                    <Progress value={progress} className={`h-2 ${isCompleted ? "[&>div]:bg-green-500" : ""}`} />
                  </div>
                  
                  {goal.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 pt-2 border-t border-border/50">
                      {goal.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add / Edit Goal Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedGoal ? "Edit Goal" : "Create Savings Goal"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveGoal} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Goal Name</Label>
              <Input 
                required 
                value={formData.goal_name} 
                onChange={e => setFormData({...formData, goal_name: e.target.value})} 
                placeholder="New Macbook Pro"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Amount (₹)</Label>
                <Input 
                  type="number" 
                  required 
                  min="1"
                  step="0.01"
                  value={formData.target_amount} 
                  onChange={e => setFormData({...formData, target_amount: e.target.value})} 
                  placeholder="200000"
                />
              </div>
              <div className="space-y-2">
                <Label>Current Saved (₹)</Label>
                <Input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={formData.current_saved} 
                  onChange={e => setFormData({...formData, current_saved: e.target.value})} 
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deadline (Optional)</Label>
              <Input 
                type="datetime-local" 
                value={formData.deadline} 
                onChange={e => setFormData({...formData, deadline: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Saving for the M4 Max"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              {selectedGoal && (
                <Button type="button" variant="destructive" onClick={() => handleDeleteGoal(selectedGoal.id)} className="mr-auto">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit">Save Goal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Funds Modal */}
      <Dialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Add Funds</DialogTitle>
            <DialogDescription>
              Adding funds to {selectedGoal?.goal_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddFunds} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Amount to Add (₹)</Label>
              <Input 
                type="number" 
                required 
                min="0.01"
                step="0.01"
                value={addFundsAmount} 
                onChange={e => setAddFundsAmount(e.target.value)} 
                placeholder="5000"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddFundsOpen(false)}>Cancel</Button>
              <Button type="submit">
                <PiggyBank className="h-4 w-4 mr-2" /> Deposit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
