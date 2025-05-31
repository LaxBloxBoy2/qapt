"use client";

import { cn } from "@/lib/utils";
import "remixicon/fonts/remixicon.css";

interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: string;
  iconColor: string;
}

interface ActivityCardProps {
  activities: Activity[];
  className?: string;
}

export default function ActivityCard({ activities, className }: ActivityCardProps) {
  return (
    <div className={cn("card", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Activities</h3>
        <button className="text-sm text-primary hover:underline">View all</button>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
              `bg-${activity.iconColor}-100 dark:bg-${activity.iconColor}-900/30`
            )}>
              <i className={cn(activity.icon, `text-${activity.iconColor}-500`)} />
            </div>
            
            <div className="flex-1">
              <p className="font-medium">{activity.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
