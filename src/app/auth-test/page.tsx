"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthTestPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Check current session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          setDebugInfo(prev => prev + `\nSession error: ${JSON.stringify(error)}`);
        } else {
          setSessionInfo(data.session);
          setDebugInfo(prev => prev + `\nCurrent session: ${data.session ? 'Active' : 'None'}`);
        }
      } catch (err) {
        setDebugInfo(prev => prev + `\nException checking session: ${err}`);
      }
    };
    
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setDebugInfo('Attempting login...');

    try {
      // Log the Supabase URL and key being used (without showing the full key)
      const supabaseUrl = 'https://auaytfzunufzzkurjlol.supabase.co';
      const keyPreview = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Just show the beginning
      
      setDebugInfo(prev => prev + `\nSupabase URL: ${supabaseUrl}`);
      setDebugInfo(prev => prev + `\nSupabase Key (preview): ${keyPreview}`);

      // Direct Supabase login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setDebugInfo(prev => prev + `\nLogin error: ${JSON.stringify(error)}`);
        return;
      }

      setSuccess(true);
      setSessionInfo(data.session);
      setDebugInfo(prev => prev + `\nLogin successful! User ID: ${data.user?.id}`);
      
      // Check if user profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user?.id)
        .single();
        
      if (profileError) {
        setDebugInfo(prev => prev + `\nProfile error: ${JSON.stringify(profileError)}`);
      } else {
        setDebugInfo(prev => prev + `\nProfile found: ${JSON.stringify(profileData)}`);
      }
    } catch (err: any) {
      setError('An unexpected error occurred');
      setDebugInfo(prev => prev + `\nException: ${err.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setDebugInfo(prev => prev + '\nAttempting to sign out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setDebugInfo(prev => prev + `\nSign out error: ${JSON.stringify(error)}`);
      } else {
        setSessionInfo(null);
        setDebugInfo(prev => prev + '\nSigned out successfully');
      }
    } catch (err: any) {
      setDebugInfo(prev => prev + `\nSign out exception: ${err.message || JSON.stringify(err)}`);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Login Test</h2>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">
                Login successful!
              </div>
            )}
            
            {sessionInfo ? (
              <div className="mb-4">
                <p className="text-green-600 font-medium">Currently logged in</p>
                <p className="text-sm text-gray-500">User ID: {sessionInfo.user?.id}</p>
                <button
                  onClick={handleSignOut}
                  className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Sign Out
                </button>
              </div>
            ) : (
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
                  {loading ? 'Logging in...' : 'Log In'}
                </button>
              </form>
            )}
          </div>
          
          <div className="bg-gray-100 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            <pre className="whitespace-pre-wrap bg-gray-800 text-green-400 p-4 rounded-lg text-sm h-96 overflow-auto">
              {debugInfo || 'No debug information available yet.'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
