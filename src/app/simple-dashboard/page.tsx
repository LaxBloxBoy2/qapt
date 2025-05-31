"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function SimpleDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setError(error.message);
        } else if (data.session) {
          console.log('User authenticated:', data.session.user);
          setUser(data.session.user);
        } else {
          console.log('No session found');
          setError('Not authenticated');
        }
      } catch (err: any) {
        console.error('Unexpected error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Simple Dashboard</h1>
        
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p><strong>Error:</strong> {error}</p>
            <p className="mt-2">
              <button 
                onClick={() => window.location.href = '/login-direct'}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Go to Login
              </button>
            </p>
          </div>
        ) : (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p><strong>Authenticated!</strong></p>
            <p>Email: {user?.email}</p>
            <p>User ID: {user?.id}</p>
          </div>
        )}
        
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Debug Information</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            <pre className="text-xs">{JSON.stringify({ user, error }, null, 2)}</pre>
          </div>
        </div>
        
        <div className="mt-6 flex space-x-4">
          <button 
            onClick={() => window.location.reload()}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Refresh Page
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go Home
          </button>
          
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/login-direct';
            }}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
