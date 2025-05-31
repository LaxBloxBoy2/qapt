"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ForceLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSessionInfo(data.session);
        setSuccess(true);
      }
    };
    
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Direct Supabase login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        console.error('Login error:', error);
        return;
      }

      setSessionInfo(data.session);
      setSuccess(true);
      console.log('Login successful:', data.user);

      // Create profile if needed
      if (data.user) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          if (profileError) {
            console.log('Profile not found, creating one');
            
            // Create a profile
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert([
                {
                  id: data.user.id,
                  full_name: '',
                  role: 'admin',
                },
              ]);
              
            if (insertError) {
              console.error('Error creating profile:', insertError);
            } else {
              console.log('Profile created successfully');
            }
          } else {
            console.log('Profile found:', profileData);
          }
        } catch (profileError) {
          console.error('Error with profile:', profileError);
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    // Use multiple methods to ensure redirection works
    try {
      // Method 1: Direct navigation
      window.location.href = '/dashboard';
    } catch (e) {
      console.error('Error redirecting:', e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2 text-blue-600">QAPT</h1>
          <p className="text-gray-600">Force Login</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">Emergency Login</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4">
              <p className="font-semibold">Login successful!</p>
              <p className="text-sm mt-2">You are now logged in.</p>
              
              <div className="mt-4 bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-40">
                <pre>{JSON.stringify(sessionInfo, null, 2)}</pre>
              </div>
              
              <button
                onClick={goToDashboard}
                className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Go to Dashboard
              </button>
            </div>
          )}
          
          {!success && (
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {loading ? 'Logging in...' : 'Force Login'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
