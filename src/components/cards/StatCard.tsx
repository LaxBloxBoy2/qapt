"use client";

import { cn } from "@/lib/utils";
import "remixicon/fonts/remixicon.css";

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export default function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("card", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
          <h3 className="text-2xl font-semibold mt-1">{value}</h3>
          
          {trend && (
            <div className="flex items-center mt-2">
              <span className={cn(
                "text-xs font-medium flex items-center",
                trend.positive ? "text-green-500" : "text-red-500"
              )}>
                <i className={trend.positive ? "ri-arrow-up-line" : "ri-arrow-down-line"} />
                {trend.value}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">vs last month</span>
            </div>
          )}
        </div>
        
        <div className="h-10 w-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
          <i className={cn(icon, "text-primary")} />
        </div>
      </div>
    </div>
  );
}
