"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export type UserRole = 'admin' | 'team_member';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: any | null, message?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('UserContext: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log('UserContext: Initial session result:', {
          hasSession: !!session,
          userId: session?.user?.id,
          error: error?.message
        });

        if (error) {
          console.error('UserContext: Session error:', error);
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('UserContext: Fetching user profile for:', session.user.id);
          await fetchUserProfile(session.user.id);
        } else {
          console.log('UserContext: No session found, setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('UserContext: Error getting initial session:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('UserContext: Auth state change:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id
        });

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('UserContext: Auth change - fetching profile for:', session.user.id);
          await fetchUserProfile(session.user.id);
        } else {
          console.log('UserContext: Auth change - no session, clearing profile');
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('UserContext: Attempting to fetch user profile for:', userId);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('UserContext: Profile fetch error:', error);
        console.log('UserContext: Creating default profile and continuing...');
        // Always create a default profile if fetch fails
        const defaultProfile: UserProfile = {
          id: userId,
          full_name: 'User',
          role: 'admin',
          created_at: new Date().toISOString(),
        };
        setProfile(defaultProfile);
      } else {
        console.log('UserContext: Profile fetched successfully:', data);
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('UserContext: Error fetching user profile:', error);
      // Create a default profile if there's any error
      const defaultProfile: UserProfile = {
        id: userId,
        full_name: 'User',
        role: 'admin',
        created_at: new Date().toISOString(),
      };
      setProfile(defaultProfile);
    } finally {
      console.log('UserContext: Profile fetch completed, setting loading to false');
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        await fetchUserProfile(data.user.id);
      }

      return { error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    try {
      console.log('Starting signup process for:', email);

      // 1. Create the user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Auth signup error:', error);
        return { error };
      }

      if (!data.user) {
        console.error('User creation failed - no user returned');
        return { error: new Error('User creation failed') };
      }

      console.log('User created successfully:', data.user.id);

      // 2. Create the user profile
      try {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([
            {
              id: data.user.id,
              full_name: fullName,
              role,
            },
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          return { error: profileError };
        }

        console.log('Profile created successfully');
      } catch (profileError) {
        console.error('Error creating profile:', profileError);
        return { error: profileError };
      }

      // 3. Return success without waiting for profile fetch
      // This prevents infinite loading if there are issues with profile fetching
      console.log('Signup completed successfully');
      return { error: null, message: 'Account created! Please check your email for confirmation.' };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      // Use direct navigation instead of router.push
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
