"use client";

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useGetNotifications,
  useGetUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useRealtimeNotifications
} from '@/hooks/useNotifications';
import { Notification, NotificationType, NotificationPriority } from '@/types/notifications';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

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

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onNavigate: (url?: string) => void;
}

function NotificationItem({ notification, onRead, onNavigate }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }
    if (notification.action_url) {
      onNavigate(notification.action_url);
    }
  };

  return (
    <div
      className={cn(
        "p-3 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors",
        priorityColors[notification.priority],
        !notification.is_read && "bg-blue-50"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
          typeColors[notification.type]
        )}>
          <i className={cn(typeIcons[notification.type], "text-sm")} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn(
              "text-sm font-medium truncate",
              !notification.is_read && "font-semibold"
            )}>
              {notification.title}
            </h4>
            {!notification.is_read && (
              <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>

            <Badge variant="outline" className="text-xs">
              {notification.type}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useGetNotifications({ is_read: false });
  const { data: unreadCount = 0 } = useGetUnreadCount();
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();

  // Enable real-time notifications
  useRealtimeNotifications();

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    console.log('Mark all read button clicked');
    console.log('Unread count:', unreadCount);

    markAllAsRead.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: `Marked ${unreadCount} notification${unreadCount !== 1 ? 's' : ''} as read`,
        });
      },
      onError: (error) => {
        console.error('Mark all read error:', error);
        toast({
          title: "Error",
          description: "Failed to mark notifications as read. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleNavigate = (url?: string) => {
    setIsOpen(false);
    if (url) {
      router.push(url);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push('/notifications');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Notifications"
        >
          <i className="ri-notification-3-line text-gray-600 dark:text-gray-300 text-lg" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs min-w-[20px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0"
        sideOffset={5}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No unread notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 5).map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleMarkAsRead}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewAll}
                className="w-full text-xs"
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
