import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  Notification,
  NotificationPreferences,
  CreateNotificationParams,
  NotificationFilters,
  NotificationStats
} from '@/types/notifications';
import { useUser } from '@/contexts/UserContext';
import { useEffect, useState } from 'react';

// Get notifications with filters
export function useGetNotifications(filters?: NotificationFilters) {
  const { user } = useUser();

  return useQuery({
    queryKey: ['notifications', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.type && filters.type.length > 0) {
        query = query.in('type', filters.type);
      }

      if (filters?.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }

      if (filters?.is_read !== undefined) {
        query = query.eq('is_read', filters.is_read);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
  });
}

// Get unread notification count
export function useGetUnreadCount() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['notifications', 'unread-count', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('get_unread_notification_count');

      if (error) throw error;
      return data as number;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Get notification statistics
export function useGetNotificationStats() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['notifications', 'stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('type, priority, is_read')
        .eq('user_id', user.id);

      if (error) throw error;

      const stats: NotificationStats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.is_read).length,
        by_type: {
          maintenance: 0,
          finance: 0,
          inspection: 0,
          lease: 0,
          application: 0,
          tenant: 0,
          property: 0,
          system: 0,
        },
        by_priority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0,
        },
      };

      notifications.forEach(notification => {
        stats.by_type[notification.type]++;
        stats.by_priority[notification.priority]++;
      });

      return stats;
    },
    enabled: !!user?.id,
  });
}

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('mark_notification_read', {
        notification_id: notificationId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate and refetch notification queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Mark all notifications as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async () => {
      console.log('Calling mark_all_notifications_read function...');
      console.log('User ID:', user?.id);

      const { data, error } = await supabase.rpc('mark_all_notifications_read');

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Error in mark_all_notifications_read:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('mark_all_notifications_read succeeded:', data);
      // Invalidate and refetch notification queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error('mark_all_notifications_read failed:', error);
    },
  });
}

// Create notification (for manual notifications)
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateNotificationParams) => {
      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: params.user_id,
        p_title: params.title,
        p_message: params.message,
        p_type: params.type,
        p_priority: params.priority || 'medium',
        p_related_entity_type: params.related_entity_type,
        p_related_entity_id: params.related_entity_id,
        p_action_url: params.action_url,
        p_metadata: params.metadata || {}
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch notification queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Get notification preferences
export function useGetNotificationPreferences() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Return default preferences if none exist
      if (!data) {
        return {
          id: '',
          user_id: user.id,
          maintenance_enabled: true,
          finance_enabled: true,
          inspection_enabled: true,
          lease_enabled: true,
          application_enabled: true,
          tenant_enabled: true,
          property_enabled: true,
          system_enabled: true,
          email_notifications: false,
          push_notifications: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as NotificationPreferences;
      }

      return data as NotificationPreferences;
    },
    enabled: !!user?.id,
  });
}

// Update notification preferences
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as NotificationPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });
}

// Real-time notifications hook
export function useRealtimeNotifications() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New notification received:', payload);
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Notification updated:', payload);
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [user?.id, queryClient]);

  return { isConnected };
}
