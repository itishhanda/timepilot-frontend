"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Calendar, BarChart3, Wallet, Sparkles, Settings, Target, Trophy, BookOpen, Zap, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Budget", href: "/budget", icon: Wallet },
  { name: "Savings Goals", href: "/savings-goals", icon: Target },
  { name: "Study Planner", href: "/study-planner", icon: BookOpen },
  { name: "AI Schedule", href: "/ai-schedule", icon: Zap },
  { name: "Whiteboard", href: "/whiteboard", icon: PenTool },
  { name: "AI Insights", href: "/recommendations", icon: Sparkles },
  { name: "Achievements", href: "/achievements", icon: Trophy },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ width: 260 }}
      animate={{ width: isOpen ? 260 : 80 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative z-20 hidden md:flex flex-col border-r bg-card h-full"
    >
      <div className="flex h-16 items-center justify-between px-4">
        {isOpen ? (
          <span className="text-xl font-bold text-primary truncate tracking-tight">TimePilot AI</span>
        ) : (
          <span className="text-xl font-bold text-primary mx-auto">TP</span>
        )}
      </div>

      <nav className="flex-1 space-y-2 p-4 mt-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center rounded-lg px-3 py-3 transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={!isOpen ? item.name : undefined}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isOpen && "mr-3")} />
                {isOpen && <span className="animate-fade-in">{item.name}</span>}
              </div>
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}
