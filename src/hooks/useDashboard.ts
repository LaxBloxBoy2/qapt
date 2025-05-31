"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { addDays, format, startOfDay, endOfDay } from "date-fns";
import { useCalendarTasks, useTodayTasks } from "./useCalendarTasks";
import { useAppPreferences } from "./useSettings";

export interface DashboardData {
  today: TodayData;
  leases: LeaseData;
  tasks: TaskData;
  financial: FinancialData;
}

export interface TodayData {
  reminders: Reminder[];
  leaseExpirations: LeaseExpiration[];
  scheduledInspections: ScheduledInspection[];
  dueTasks: DueTask[];
}

export interface LeaseData {
  active: number;
  inProgress: number;
  drafts: number;
  ended: number;
  total: number;
}

export interface TaskData {
  upcoming: Task[];
  overdue: Task[];
  total: number;
}

export interface FinancialData {
  income30Days: number;
  expenses30Days: number;
  netIncome30Days: number;
  outstandingBalance: number;
  chartData: ChartDataPoint[];
  summaryCards: FinancialSummaryCard[];
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: string;
}

export interface LeaseExpiration {
  id: string;
  tenant_name: string;
  unit_name: string;
  property_name: string;
  end_date: string;
  days_until_expiry: number;
}

export interface ScheduledInspection {
  id: string;
  property_name: string;
  type: string;
  expiration_date: string;
  days_until_due: number;
}

export interface DueTask {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  days_overdue?: number;
}

export interface ChartDataPoint {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

export interface FinancialSummaryCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}

export function useDashboardData() {
  const { user } = useUser();

  // Get calendar tasks data
  const { data: calendarTasks } = useCalendarTasks();
  const { data: todayTasks } = useTodayTasks();
  const { data: preferences } = useAppPreferences();

  return useQuery({
    queryKey: ['dashboard-data', user?.id, calendarTasks, todayTasks, preferences?.currency],
    queryFn: async (): Promise<DashboardData> => {
      if (!user?.id) throw new Error('User not authenticated');

      const today = new Date();
      const thirtyDaysAgo = addDays(today, -30);
      const sevenDaysFromNow = addDays(today, 7);

      // Fetch all data in parallel
      const [
        leasesResult,
        transactionsResult,
        inspectionsResult,
        notificationsResult
      ] = await Promise.allSettled([
        // Leases data
        supabase
          .from('leases')
          .select(`
            *,
            unit:unit_id (
              id,
              name,
              property_id,
              properties:property_id (
                id,
                name,
                address
              )
            ),
            lease_tenants!lease_id (
              id,
              tenant_id,
              is_primary,
              tenants:tenant_id (
                id,
                first_name,
                last_name,
                email
              )
            )
          `),

        // Transactions data (last 30 days)
        supabase
          .from('transactions')
          .select('*')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false }),

        // Inspections data
        supabase
          .from('inspections')
          .select(`
            *,
            properties:property_id (
              id,
              name,
              address
            )
          `)
          .lte('expiration_date', sevenDaysFromNow.toISOString())
          .order('expiration_date', { ascending: true }),

        // Recent notifications for reminders
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      // Process leases data
      const leases = leasesResult.status === 'fulfilled' ? leasesResult.value.data || [] : [];
      const leaseData: LeaseData = {
        active: leases.filter(l => l.status === 'active').length,
        inProgress: leases.filter(l => l.status === 'upcoming').length,
        drafts: 0, // We don't have draft status in current schema
        ended: leases.filter(l => l.status === 'expired').length,
        total: leases.length
      };

      // Process transactions data
      const transactions = transactionsResult.status === 'fulfilled' ? transactionsResult.value.data || [] : [];
      const income30Days = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const expenses30Days = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Process inspections data
      const inspections = inspectionsResult.status === 'fulfilled' ? inspectionsResult.value.data || [] : [];

      // Process notifications for reminders
      const notifications = notificationsResult.status === 'fulfilled' ? notificationsResult.value.data || [] : [];

      // Build today data
      const todayData: TodayData = {
        reminders: notifications.slice(0, 5).map(n => ({
          id: n.id,
          title: n.title,
          description: n.message,
          due_date: n.created_at,
          priority: n.priority,
          type: n.type
        })),
        leaseExpirations: leases
          .filter(l => l.status === 'active' && l.end_date)
          .map(l => {
            const daysUntilExpiry = Math.ceil(
              (new Date(l.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            return {
              id: l.id,
              tenant_name: l.lease_tenants?.[0]?.tenants ?
                `${l.lease_tenants[0].tenants.first_name} ${l.lease_tenants[0].tenants.last_name}` :
                'Unknown Tenant',
              unit_name: l.unit?.name || 'Unknown Unit',
              property_name: l.unit?.properties?.name || 'Unknown Property',
              end_date: l.end_date,
              days_until_expiry: daysUntilExpiry
            };
          })
          .filter(l => l.days_until_expiry <= 30 && l.days_until_expiry >= 0)
          .sort((a, b) => a.days_until_expiry - b.days_until_expiry)
          .slice(0, 5),
        scheduledInspections: inspections.map(i => ({
          id: i.id,
          property_name: i.properties?.name || 'Unknown Property',
          type: i.type,
          expiration_date: i.expiration_date,
          days_until_due: Math.ceil(
            (new Date(i.expiration_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )
        })).slice(0, 5),
        dueTasks: (todayTasks || []).map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          due_date: task.due_date,
          priority: task.priority,
          status: task.status
        }))
      };

      // Get currency symbol for formatting
      const currencySymbol = preferences?.default_currency_symbol || '$';

      // Build financial data
      const financialData: FinancialData = {
        income30Days,
        expenses30Days,
        netIncome30Days: income30Days - expenses30Days,
        outstandingBalance: 0, // Would need to calculate from balances
        chartData: [], // Would need to group transactions by day
        summaryCards: [
          {
            title: 'Total Income',
            value: `${currencySymbol}${income30Days.toLocaleString()}`,
            change: '+12%',
            changeType: 'positive',
            icon: 'ri-money-dollar-circle-line'
          },
          {
            title: 'Total Expenses',
            value: `${currencySymbol}${expenses30Days.toLocaleString()}`,
            change: '-5%',
            changeType: 'negative',
            icon: 'ri-shopping-bag-line'
          },
          {
            title: 'Net Income',
            value: `${currencySymbol}${(income30Days - expenses30Days).toLocaleString()}`,
            change: '+18%',
            changeType: 'positive',
            icon: 'ri-line-chart-line'
          },
          {
            title: 'Occupancy Rate',
            value: `${Math.round((leaseData.active / Math.max(leaseData.total, 1)) * 100)}%`,
            change: '+3%',
            changeType: 'positive',
            icon: 'ri-home-line'
          }
        ]
      };

      return {
        today: todayData,
        leases: leaseData,
        tasks: calendarTasks || { upcoming: [], overdue: [], total: 0 },
        financial: financialData
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}
