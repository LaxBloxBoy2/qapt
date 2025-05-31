"use client";

import { useState } from 'react';
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateNotification, useGetNotifications, useGetUnreadCount, useRealtimeNotifications } from '@/hooks/useNotifications';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { NotificationType, NotificationPriority } from '@/types/notifications';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

function TestNotificationsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const createNotification = useCreateNotification();
  const queryClient = useQueryClient();

  // Add debugging hooks
  const { data: unreadNotifications = [], isLoading: isLoadingUnread } = useGetNotifications({ is_read: false });
  const { data: unreadCount = 0 } = useGetUnreadCount();
  const { isConnected } = useRealtimeNotifications();

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'system' as NotificationType,
    priority: 'medium' as NotificationPriority,
    action_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Creating notification with data:', {
        user_id: user.id,
        title: formData.title,
        message: formData.message,
        type: formData.type,
        priority: formData.priority,
        action_url: formData.action_url || undefined,
      });

      const result = await createNotification.mutateAsync({
        user_id: user.id,
        title: formData.title,
        message: formData.message,
        type: formData.type,
        priority: formData.priority,
        action_url: formData.action_url || undefined,
      });

      console.log('Notification created successfully:', result);

      toast({
        title: "Success",
        description: "Notification created successfully!",
      });

      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'system',
        priority: 'medium',
        action_url: '',
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      let errorMessage = "Failed to create notification";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const testDirectSupabaseCall = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Testing direct Supabase call...');
      console.log('User ID:', user.id);

      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_title: 'Direct Supabase Test',
        p_message: 'This is a direct Supabase call test',
        p_type: 'system',
        p_priority: 'medium',
        p_action_url: '/test-notifications'
      });

      if (error) {
        console.error('Direct Supabase call error:', error);
        toast({
          title: "Direct Test Failed",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('Direct Supabase call success:', data);

        // Manually invalidate notification queries to force refresh
        console.log('Invalidating notification queries...');
        queryClient.invalidateQueries({ queryKey: ['notifications'] });

        toast({
          title: "Direct Test Success",
          description: `Notification created with ID: ${data}`,
        });
      }
    } catch (error) {
      console.error('Direct test error:', error);
      toast({
        title: "Direct Test Error",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const refreshNotifications = () => {
    console.log('Manually refreshing notifications...');
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    toast({
      title: "Refreshed",
      description: "Notification queries have been refreshed",
    });
  };

  const createSampleNotifications = async () => {
    if (!user?.id) return;

    const samples = [
      {
        title: "New Maintenance Request",
        message: "Urgent plumbing issue reported at Property A - Unit 101",
        type: "maintenance" as NotificationType,
        priority: "urgent" as NotificationPriority,
        action_url: "/maintenance",
      },
      {
        title: "Lease Expiring Soon",
        message: "Lease for John Doe at Property B expires in 30 days",
        type: "lease" as NotificationType,
        priority: "high" as NotificationPriority,
        action_url: "/leases",
      },
      {
        title: "Payment Received",
        message: "Rent payment of $1,200 received from Jane Smith",
        type: "finance" as NotificationType,
        priority: "medium" as NotificationPriority,
        action_url: "/transactions",
      },
      {
        title: "Inspection Completed",
        message: "Move-out inspection completed for Property C - Unit 205",
        type: "inspection" as NotificationType,
        priority: "low" as NotificationPriority,
        action_url: "/inspections",
      },
    ];

    try {
      console.log('Creating sample notifications for user:', user.id);

      for (const sample of samples) {
        console.log('Creating sample notification:', sample);
        const result = await createNotification.mutateAsync({
          user_id: user.id,
          ...sample,
        });
        console.log('Sample notification created:', result);
      }

      toast({
        title: "Success",
        description: "Sample notifications created!",
      });
    } catch (error) {
      console.error('Error creating sample notifications:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      let errorMessage = "Failed to create sample notifications";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Test Notifications</h1>
          <p className="text-muted-foreground">
            Create test notifications to verify the notification system
          </p>
          {/* Debug info */}
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
            <p><strong>Debug Info:</strong></p>
            <p>User ID: {user?.id || 'Not authenticated'}</p>
            <p>User Email: {user?.email || 'No email'}</p>
            <p>Mutation Status: {createNotification.isPending ? 'Pending' : 'Ready'}</p>
            <p>Mutation Error: {createNotification.error ? String(createNotification.error) : 'None'}</p>
            <p>Real-time Connected: {isConnected ? '✅ Yes' : '❌ No'}</p>
            <p>Unread Count: {unreadCount}</p>
            <p>Unread Notifications: {unreadNotifications.length} (Loading: {isLoadingUnread ? 'Yes' : 'No'})</p>
            {unreadNotifications.length > 0 && (
              <div className="mt-2">
                <p><strong>Recent Unread:</strong></p>
                <ul className="list-disc list-inside ml-4 max-h-20 overflow-y-auto">
                  {unreadNotifications.slice(0, 3).map((notif) => (
                    <li key={notif.id} className="text-xs">
                      {notif.title} ({notif.type}) - {new Date(notif.created_at).toLocaleTimeString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manual Notification Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create Manual Notification</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Notification title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Notification message"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as NotificationType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as NotificationPriority }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="action_url">Action URL (optional)</Label>
                  <Input
                    id="action_url"
                    value={formData.action_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, action_url: e.target.value }))}
                    placeholder="/maintenance, /leases, etc."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createNotification.isPending}
                >
                  {createNotification.isPending ? 'Creating...' : 'Create Notification'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={testDirectSupabaseCall}
                variant="outline"
                className="w-full"
              >
                Test Direct Supabase Call
              </Button>

              <Button
                onClick={refreshNotifications}
                variant="secondary"
                className="w-full"
              >
                🔄 Refresh Notifications
              </Button>

              <Button
                onClick={createSampleNotifications}
                disabled={createNotification.isPending}
                className="w-full"
              >
                Create Sample Notifications
              </Button>

              <div className="text-sm text-muted-foreground">
                <p>This will create 4 sample notifications:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Urgent maintenance request</li>
                  <li>High priority lease expiration</li>
                  <li>Medium priority payment received</li>
                  <li>Low priority inspection completed</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>1. <strong>Create notifications</strong> using the form above</p>
              <p>2. <strong>Check the notification dropdown</strong> in the top bar to see new notifications</p>
              <p>3. <strong>Visit the notifications page</strong> at /notifications to see all notifications</p>
              <p>4. <strong>Test real-time updates</strong> by creating notifications and watching them appear instantly</p>
              <p>5. <strong>Configure preferences</strong> in Settings → Notifications</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default withAuth(TestNotificationsPage);
