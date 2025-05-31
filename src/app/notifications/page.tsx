"use client";

import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  useGetNotifications, 
  useGetNotificationStats,
  useMarkNotificationRead, 
  useMarkAllNotificationsRead,
  useRealtimeNotifications 
} from '@/hooks/useNotifications';
import { Notification, NotificationType, NotificationPriority, NotificationFilters } from '@/types/notifications';
import { useRouter } from 'next/navigation';

const typeIcons: Record<NotificationType, string> = {
  maintenance: 'ri-tools-line',
  finance: 'ri-money-dollar-circle-line',
  inspection: 'ri-search-eye-line',
  lease: 'ri-file-text-line',
  application: 'ri-user-add-line',
  tenant: 'ri-user-line',
  property: 'ri-home-line',
  system: 'ri-settings-line',
};

const typeColors: Record<NotificationType, string> = {
  maintenance: 'bg-orange-100 text-orange-600',
  finance: 'bg-green-100 text-green-600',
  inspection: 'bg-blue-100 text-blue-600',
  lease: 'bg-purple-100 text-purple-600',
  application: 'bg-yellow-100 text-yellow-600',
  tenant: 'bg-indigo-100 text-indigo-600',
  property: 'bg-gray-100 text-gray-600',
  system: 'bg-red-100 text-red-600',
};

const priorityColors: Record<NotificationPriority, string> = {
  low: 'border-l-gray-300',
  medium: 'border-l-blue-400',
  high: 'border-l-orange-400',
  urgent: 'border-l-red-500',
};

interface NotificationCardProps {
  notification: Notification;
  onRead: (id: string) => void;
  onNavigate: (url?: string) => void;
}

function NotificationCard({ notification, onRead, onNavigate }: NotificationCardProps) {
  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }
    if (notification.action_url) {
      onNavigate(notification.action_url);
    }
  };

  return (
    <Card 
      className={cn(
        "border-l-4 cursor-pointer hover:shadow-md transition-all",
        priorityColors[notification.priority],
        !notification.is_read && "bg-blue-50/50"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
            typeColors[notification.type]
          )}>
            <i className={cn(typeIcons[notification.type], "text-lg")} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className={cn(
                "text-sm font-medium",
                !notification.is_read && "font-semibold"
              )}>
                {notification.title}
              </h3>
              
              <div className="flex items-center gap-2">
                {!notification.is_read && (
                  <div className="h-2 w-2 bg-blue-500 rounded-full" />
                )}
                <Badge variant="outline" className="text-xs">
                  {notification.priority}
                </Badge>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {notification.type}
                </Badge>
              </div>
              
              <span>
                {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NotificationsPage() {
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');
  const router = useRouter();
  
  const { data: allNotifications = [], isLoading } = useGetNotifications(
    activeTab === 'unread' ? { ...filters, is_read: false } : filters
  );
  const { data: stats } = useGetNotificationStats();
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();
  
  // Enable real-time notifications
  useRealtimeNotifications();

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleNavigate = (url?: string) => {
    if (url) {
      router.push(url);
    }
  };

  const handleTypeFilter = (type: string) => {
    if (type === 'all') {
      setFilters(prev => ({ ...prev, type: undefined }));
    } else {
      setFilters(prev => ({ ...prev, type: [type as NotificationType] }));
    }
  };

  const handlePriorityFilter = (priority: string) => {
    if (priority === 'all') {
      setFilters(prev => ({ ...prev, priority: undefined }));
    } else {
      setFilters(prev => ({ ...prev, priority: [priority as NotificationPriority] }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with important activities across your properties
          </p>
        </div>
        
        {stats && stats.unread > 0 && (
          <Button onClick={handleMarkAllAsRead}>
            <i className="ri-check-double-line mr-2" />
            Mark all as read ({stats.unread})
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.by_priority.high + stats.by_priority.urgent}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.by_type.maintenance}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="lease">Lease</SelectItem>
                <SelectItem value="application">Application</SelectItem>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="property">Property</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            
            <Select onValueChange={handlePriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread')}>
        <TabsList>
          <TabsTrigger value="unread">
            Unread {stats && stats.unread > 0 && `(${stats.unread})`}
          </TabsTrigger>
          <TabsTrigger value="all">
            All Notifications
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading notifications...</p>
            </div>
          ) : allNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <i className="ri-notification-off-line text-4xl text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'unread' 
                    ? "You're all caught up! No unread notifications."
                    : "No notifications found with the current filters."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {allNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onRead={handleMarkAsRead}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
