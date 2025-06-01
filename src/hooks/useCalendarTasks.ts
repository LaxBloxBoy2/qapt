"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { addDays, isPast, differenceInDays } from "date-fns";

export interface CalendarTask {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  days_overdue?: number;
  type: string;
  property_name?: string;
  unit_name?: string;
  tags?: string[];
}

export interface CalendarTaskData {
  upcoming: CalendarTask[];
  overdue: CalendarTask[];
  total: number;
}

// Map calendar event status to task priority
const getTaskPriority = (tags: string[] = [], daysUntilDue: number): 'low' | 'medium' | 'high' | 'urgent' => {
  // Check for priority tags
  if (tags.includes('urgent') || tags.includes('emergency')) return 'urgent';
  if (tags.includes('high') || tags.includes('important')) return 'high';
  if (tags.includes('low')) return 'low';
  
  // Auto-assign priority based on due date
  if (daysUntilDue < 0) return 'urgent'; // Overdue
  if (daysUntilDue <= 1) return 'high';  // Due today or tomorrow
  if (daysUntilDue <= 7) return 'medium'; // Due this week
  return 'low'; // Due later
};

// Map calendar event type to task type
const getTaskType = (tags: string[] = []): string => {
  if (tags.includes('inspection')) return 'inspection';
  if (tags.includes('maintenance')) return 'maintenance';
  if (tags.includes('lease')) return 'lease';
  if (tags.includes('rent')) return 'rent';
  if (tags.includes('expense')) return 'expense';
  if (tags.includes('insurance')) return 'insurance';
  if (tags.includes('appliance')) return 'appliance';
  return 'general';
};

export function useCalendarTasks() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['calendar-tasks', user?.id],
    queryFn: async (): Promise<CalendarTaskData> => {
      if (!user?.id) throw new Error('User not authenticated');

      const today = new Date();
      const thirtyDaysFromNow = addDays(today, 30);

      // Fetch upcoming calendar events that can be considered as tasks
      const { data: events, error } = await supabase
        .from('custom_events')
        .select(`
          *,
          property:properties(id, name),
          unit:units(id, name)
        `)
        .lte('date', thirtyDaysFromNow.toISOString().split('T')[0])
        .in('status', ['upcoming', 'overdue'])
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching calendar tasks:', error);
        throw error;
      }

      const tasks: CalendarTask[] = (events || []).map(event => {
        const dueDate = new Date(event.date);
        const daysUntilDue = differenceInDays(dueDate, today);
        const isOverdue = isPast(dueDate) && event.status !== 'completed';
        
        return {
          id: event.id,
          title: event.title,
          description: event.description || '',
          due_date: event.date,
          priority: getTaskPriority(event.tags, daysUntilDue),
          status: event.status,
          days_overdue: isOverdue ? Math.abs(daysUntilDue) : 0,
          type: getTaskType(event.tags),
          property_name: event.property?.name,
          unit_name: event.unit?.name,
          tags: event.tags
        };
      });

      // Separate into upcoming and overdue
      const upcoming = tasks.filter(task => task.days_overdue === 0);
      const overdue = tasks.filter(task => task.days_overdue && task.days_overdue > 0);

      return {
        upcoming,
        overdue,
        total: tasks.length
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to get today's due tasks for the Today section
export function useTodayTasks() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['today-tasks', user?.id],
    queryFn: async (): Promise<CalendarTask[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Fetch events due today or overdue
      const { data: events, error } = await supabase
        .from('custom_events')
        .select(`
          *,
          property:properties(id, name),
          unit:units(id, name)
        `)
        .lte('date', todayStr)
        .in('status', ['upcoming', 'overdue'])
        .order('date', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching today tasks:', error);
        throw error;
      }

      return (events || []).map(event => {
        const dueDate = new Date(event.date);
        const daysUntilDue = differenceInDays(dueDate, today);
        const isOverdue = isPast(dueDate) && event.status !== 'completed';
        
        return {
          id: event.id,
          title: event.title,
          description: event.description || '',
          due_date: event.date,
          priority: getTaskPriority(event.tags, daysUntilDue),
          status: event.status,
          days_overdue: isOverdue ? Math.abs(daysUntilDue) : 0,
          type: getTaskType(event.tags),
          property_name: event.property?.name,
          unit_name: event.unit?.name,
          tags: event.tags
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}
