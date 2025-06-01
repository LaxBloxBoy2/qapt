"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import {
  UserProfile,
  AppPreferences,
  NotificationSettings,
  TeamMember,
  Integration,
  UserSubscription,
  BillingInfo,
  Invoice
} from "@/types/settings";

// Profile Settings
export function useUserProfile() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async (): Promise<UserProfile> => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('Fetching profile for user:', user.id);

      try {
        // Try to get profile using helper function first
        const { data: profileData, error: rpcError } = await supabase
          .rpc('get_user_profile', { p_user_id: user.id });

        if (rpcError) {
          console.warn('⚠️ RPC function failed, trying direct query:', rpcError);

          // Fallback to direct query
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.warn('⚠️ Direct query failed, creating profile:', error);

            // Create profile if it doesn't exist
            const { data: newProfile, error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                id: user.id,
                email: user.email,
                full_name: user.email,
                role: 'user',
                status: 'active'
              })
              .select()
              .single();

            if (insertError) {
              console.error('❌ Failed to create profile:', insertError);
              throw insertError;
            }

            console.log('✅ Created new profile:', newProfile);
            return newProfile;
          }

          console.log('✅ Direct query successful:', data);
          return data;
        }

        console.log('✅ RPC successful:', profileData);
        return profileData;

      } catch (error) {
        console.error('❌ Profile fetch failed:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('🔄 Updating profile for user:', user.id);
      console.log('🔄 Update data:', updates);

      try {
        // First ensure profile exists
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          console.log('🔄 Profile not found, creating...');
          // Create profile first
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              full_name: user.email,
              role: 'admin',
              ...updates
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Failed to create profile:', createError);
            throw createError;
          }

          console.log('✅ Created profile:', newProfile);
          return newProfile;
        }

        // Update existing profile (don't include updated_at since it may not exist)
        console.log('🔄 Updating existing profile with:', updates);

        const { data, error } = await supabase
          .from('user_profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single();

        if (error) {
          console.error('❌ Update failed:', error);
          throw error;
        }

        console.log('✅ Profile updated successfully:', data);
        return data;

      } catch (error) {
        console.error('❌ Profile update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: any) => {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: `Failed to update profile: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
}

// App Preferences
export function useAppPreferences() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['app-preferences', user?.id],
    queryFn: async (): Promise<AppPreferences> => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('Fetching preferences for user:', user.id);

      const defaultPrefs = {
        currency: 'USD' as const,
        date_format: 'MM/DD/YYYY' as const,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en' as const,
        theme: 'system' as const,
        default_country: 'US',
        default_rent_status: 'active' as const,
        default_lease_term: 12,
        default_currency_symbol: '$',
      };

      try {
        // Try to get from database first
        const { data, error } = await supabase
          .rpc('get_user_preferences', { p_user_id: user.id });

        if (error) {
          console.warn('⚠️ RPC failed, trying direct query:', error);

          // Try direct query
          const { data: directData, error: directError } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (directError) {
            console.warn('⚠️ Database query failed, checking localStorage:', directError);

            // Check localStorage
            const storageKey = `user_preferences_${user.id}`;
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              const parsedPrefs = JSON.parse(stored);
              console.log('✅ Found preferences in localStorage:', parsedPrefs);
              return { ...defaultPrefs, ...parsedPrefs };
            }

            console.log('📝 No preferences found, returning defaults');
            return defaultPrefs;
          }

          console.log('✅ Direct query successful:', directData);
          return directData || defaultPrefs;
        }

        console.log('✅ RPC successful:', data);
        return data || defaultPrefs;

      } catch (error) {
        console.warn('⚠️ All database attempts failed, checking localStorage:', error);

        // Final fallback to localStorage
        const storageKey = `user_preferences_${user.id}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsedPrefs = JSON.parse(stored);
          console.log('✅ Using localStorage preferences:', parsedPrefs);
          return { ...defaultPrefs, ...parsedPrefs };
        }

        console.log('📝 No preferences found anywhere, returning defaults');
        return defaultPrefs;
      }
    },
    enabled: !!user?.id,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (preferences: Partial<AppPreferences>) => {
      if (!user?.id) {
        console.error('❌ User not authenticated');
        throw new Error('User not authenticated');
      }

      console.log('🔄 Updating preferences for user:', user.id);
      console.log('🔄 New preferences data:', preferences);

      try {
        // Try database first
        console.log('🔄 Trying database update...');

        // First ensure preferences exist by calling the helper function
        const { data: existingPrefs, error: getError } = await supabase.rpc('get_user_preferences', { p_user_id: user.id });
        if (getError) {
          console.warn('⚠️ RPC function failed, trying direct upsert:', getError);

          // Try direct upsert if RPC fails
          const { data, error } = await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              ...preferences,
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) {
            console.warn('⚠️ Database update failed, using localStorage fallback:', error);

            // Fallback to localStorage
            const storageKey = `user_preferences_${user.id}`;
            const existing = localStorage.getItem(storageKey);
            const currentPrefs = existing ? JSON.parse(existing) : {};
            const updatedPrefs = { ...currentPrefs, ...preferences };
            localStorage.setItem(storageKey, JSON.stringify(updatedPrefs));

            console.log('✅ Saved to localStorage:', updatedPrefs);
            return updatedPrefs;
          }

          console.log('✅ Direct upsert successful:', data);
          return data;
        }

        console.log('✅ Existing preferences:', existingPrefs);

        // Update the preferences
        const updatePayload = {
          ...preferences,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('user_preferences')
          .update(updatePayload)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.warn('⚠️ Update failed, using localStorage fallback:', error);

          // Fallback to localStorage
          const storageKey = `user_preferences_${user.id}`;
          const existing = localStorage.getItem(storageKey);
          const currentPrefs = existing ? JSON.parse(existing) : {};
          const updatedPrefs = { ...currentPrefs, ...preferences };
          localStorage.setItem(storageKey, JSON.stringify(updatedPrefs));

          console.log('✅ Saved to localStorage:', updatedPrefs);
          return updatedPrefs;
        }

        console.log('✅ Database update successful:', data);
        return data;

      } catch (error) {
        console.warn('⚠️ All database attempts failed, using localStorage:', error);

        // Final fallback to localStorage
        const storageKey = `user_preferences_${user.id}`;
        const existing = localStorage.getItem(storageKey);
        const currentPrefs = existing ? JSON.parse(existing) : {};
        const updatedPrefs = { ...currentPrefs, ...preferences };
        localStorage.setItem(storageKey, JSON.stringify(updatedPrefs));

        console.log('✅ Saved to localStorage as fallback:', updatedPrefs);
        return updatedPrefs;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-preferences'] });
      toast({
        title: "Preferences updated",
        description: "Your app preferences have been saved.",
      });
    },
    onError: (error) => {
      console.error('Preferences update error:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Notification Settings
export function useNotificationSettings() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['notification-settings', user?.id],
    queryFn: async (): Promise<NotificationSettings> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Use the helper function to get or create notification settings
      const { data, error } = await supabase
        .rpc('get_notification_settings', { p_user_id: user.id });

      if (error) throw error;

      return data || {
        email_enabled: true,
        in_app_enabled: true,
        lease_renewals: true,
        rent_overdue: true,
        maintenance_updates: true,
        inspection_reminders: true,
        payment_confirmations: true,
        system_updates: true,
        marketing_emails: false,
      };
    },
    enabled: !!user?.id,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (settings: Partial<NotificationSettings>) => {
      if (!user?.id) throw new Error('User not authenticated');

      // First ensure notification settings exist by calling the helper function
      await supabase.rpc('get_notification_settings', { p_user_id: user.id });

      // Then update the settings
      const { data, error } = await supabase
        .from('notification_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: (error) => {
      console.error('Notification settings update error:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Team Members (placeholder for future implementation)
export function useTeamMembers() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['team-members', user?.id],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      try {
        // Try to query team_members table
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('owner_id', user.id);

        if (error) {
          // If table doesn't exist, return empty array
          console.log('Team members table not available yet:', error.message);
          return [];
        }

        return data || [];
      } catch (error) {
        // Fallback to empty array if any error
        console.log('Team members not available:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });
}

// Integrations (placeholder for future implementation)
export function useIntegrations() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['integrations', user?.id],
    queryFn: async (): Promise<Integration[]> => {
      // Placeholder - return mock data for UI
      return [
        {
          id: '1',
          name: 'Google Calendar',
          type: 'calendar',
          enabled: false,
          last_sync: undefined,
        },
        {
          id: '2',
          name: 'Dropbox',
          type: 'storage',
          enabled: false,
          last_sync: undefined,
        },
        {
          id: '3',
          name: 'SMTP Email',
          type: 'email',
          enabled: false,
          last_sync: undefined,
        },
      ];
    },
    enabled: !!user?.id,
  });
}

// Subscription & Billing
export function useUserSubscription() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async (): Promise<UserSubscription | null> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Use the helper function to get or create subscription
      const { data, error } = await supabase
        .rpc('get_user_subscription', { p_user_id: user.id });

      if (error) throw error;

      if (!data) return null;

      // Transform the database data to match our interface
      return {
        id: data.id,
        plan: {
          id: data.plan_id,
          name: data.plan_name,
          price: data.plan_price,
          currency: data.plan_currency,
          interval: data.plan_interval,
          features: data.plan_features,
        },
        status: data.status,
        current_period_start: data.current_period_start,
        current_period_end: data.current_period_end,
        trial_end: data.trial_end,
        cancel_at_period_end: data.cancel_at_period_end,
      };
    },
    enabled: !!user?.id,
  });
}
