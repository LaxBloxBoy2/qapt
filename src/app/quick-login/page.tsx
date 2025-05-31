"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function QuickLoginPage() {
  const [status, setStatus] = useState("Checking authentication...");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const quickLogin = async () => {
      try {
        // First check if already logged in
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setError(`Session error: ${sessionError.message}`);
          return;
        }
        
        if (session) {
          setStatus("Already logged in! Redirecting...");
          setTimeout(() => {
            window.location.href = '/leases';
          }, 1000);
          return;
        }

        // Try to log in with your credentials
        setStatus("Attempting to log in...");
        
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: 'anwarlaxiro@gmail.com',
          password: 'TESTTEST',
        });

        if (loginError) {
          setError(`Login error: ${loginError.message}`);
          return;
        }

        if (data.session) {
          setStatus("Login successful! Redirecting...");
          setTimeout(() => {
            window.location.href = '/leases';
          }, 1000);
        } else {
          setError("Login failed - no session returned");
        }
      } catch (err: any) {
        setError(`Unexpected error: ${err.message}`);
      }
    };

    quickLogin();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Quick Login</h2>
          <p className="mt-4 text-lg">{status}</p>
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
