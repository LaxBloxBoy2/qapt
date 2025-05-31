"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

export default function AuthCheckPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('User is authenticated:', session.user);
          setUser(session.user);
          
          // Try to get profile
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            console.error('Profile error:', profileError);
            setError(`Profile error: ${profileError.message}`);
          } else if (profileData) {
            console.log('Profile found:', profileData);
            setProfile(profileData);
          }
        } else {
          console.log('User is not authenticated');
          setError('Not authenticated');
        }
      } catch (error: any) {
        console.error('Unexpected error:', error);
        setError(`Unexpected error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const goToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const goToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="qapt-theme">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 max-w-md w-full">
          <h2 className="text-2xl font-semibold mb-6 text-center">Authentication Check</h2>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
              
              <button
                onClick={goToLogin}
                className="w-full mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-600"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <div>
              <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg mb-4">
                <p className="font-semibold">Authenticated</p>
                <p className="text-sm">You are logged in as {user?.email}</p>
              </div>
              
              {profile ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-3 rounded-lg mb-4">
                  <p className="font-semibold">Profile</p>
                  <p className="text-sm">Role: {profile.role}</p>
                  <p className="text-sm">Full Name: {profile.full_name || 'Not set'}</p>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 p-3 rounded-lg mb-4">
                  <p className="font-semibold">No Profile</p>
                  <p className="text-sm">You don't have a profile yet.</p>
                </div>
              )}
              
              <button
                onClick={goToDashboard}
                className="w-full mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-600"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}
