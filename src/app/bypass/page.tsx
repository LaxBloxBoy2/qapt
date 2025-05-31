"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function BypassPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        // Check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setMessage('Already logged in, redirecting to dashboard...');
          // Use direct navigation
          window.location.replace('/dashboard');
          return;
        }
        
        // If not logged in, try to log in
        setMessage('Attempting to log in...');
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'anwarlaxiro@gmail.com',
          password: 'TESTTEST',
        });
        
        if (error) {
          console.error('Login error:', error);
          setError(error.message);
          setLoading(false);
          return;
        }
        
        setMessage('Login successful, redirecting to dashboard...');
        
        // Set a cookie to help with auth state
        document.cookie = `auth-logged-in=true; path=/; max-age=3600; SameSite=Strict`;
        
        // Use direct navigation
        window.location.replace('/dashboard');
      } catch (err: any) {
        console.error('Unexpected error:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    checkAndRedirect();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Dashboard Bypass</h1>
        
        {loading && (
          <div className="mb-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            {message && <p className="text-center mt-4 text-gray-600">{message}</p>}
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}
        
        <div className="flex flex-col space-y-4 mt-6">
          <button 
            onClick={() => window.location.href = '/login-direct'}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Login Page
          </button>
          
          <button 
            onClick={() => window.location.href = '/simple-dashboard'}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Simple Dashboard
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
