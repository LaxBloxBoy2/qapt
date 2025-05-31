"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function TestPreferencesPage() {
  const { user } = useUser();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test: string, status: 'success' | 'error' | 'info', message: string, data?: any) => {
    setTestResults(prev => [...prev, { test, status, message, data, timestamp: new Date().toISOString() }]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Check user authentication
    addResult('Authentication', user ? 'success' : 'error', 
      user ? `User authenticated: ${user.email}` : 'User not authenticated');

    if (!user) {
      setIsRunning(false);
      return;
    }

    // Test 2: Check if user_preferences table exists
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('count(*)')
        .limit(1);
      
      if (error) {
        addResult('Table Check', 'error', `user_preferences table error: ${error.message}`);
      } else {
        addResult('Table Check', 'success', 'user_preferences table exists and is accessible');
      }
    } catch (err) {
      addResult('Table Check', 'error', `Exception checking table: ${err}`);
    }

    // Test 3: Check current user preferences
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        addResult('Current Preferences', 'error', `Error fetching preferences: ${error.message}`);
      } else {
        addResult('Current Preferences', data.length > 0 ? 'success' : 'info', 
          data.length > 0 ? 'User preferences found' : 'No user preferences found', data);
      }
    } catch (err) {
      addResult('Current Preferences', 'error', `Exception: ${err}`);
    }

    // Test 4: Test RPC function
    try {
      const { data, error } = await supabase
        .rpc('get_user_preferences', { p_user_id: user.id });
      
      if (error) {
        addResult('RPC Function', 'error', `get_user_preferences RPC error: ${error.message}`);
      } else {
        addResult('RPC Function', 'success', 'get_user_preferences RPC works', data);
      }
    } catch (err) {
      addResult('RPC Function', 'error', `RPC Exception: ${err}`);
    }

    // Test 5: Try to create default preferences
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          currency: 'USD',
          date_format: 'MM/DD/YYYY',
          timezone: 'America/New_York',
          language: 'en',
          theme: 'system',
          default_country: 'US',
          default_rent_status: 'active',
          default_lease_term: 12,
          default_currency_symbol: '$'
        })
        .select();
      
      if (error) {
        addResult('Create Preferences', 'error', `Error creating preferences: ${error.message}`);
      } else {
        addResult('Create Preferences', 'success', 'Successfully created/updated preferences', data);
      }
    } catch (err) {
      addResult('Create Preferences', 'error', `Exception creating preferences: ${err}`);
    }

    // Test 6: Test update
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          currency: 'GBP',
          default_currency_symbol: '£',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select();
      
      if (error) {
        addResult('Update Test', 'error', `Error updating preferences: ${error.message}`);
      } else {
        addResult('Update Test', 'success', 'Successfully updated preferences', data);
      }
    } catch (err) {
      addResult('Update Test', 'error', `Exception updating preferences: ${err}`);
    }

    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Preferences Diagnostic Tool</CardTitle>
          <p className="text-sm text-gray-600">
            This tool will help diagnose why preferences aren't saving properly.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <i className="ri-loader-line animate-spin mr-2" />
                Running Diagnostics...
              </>
            ) : (
              <>
                <i className="ri-play-line mr-2" />
                Run Diagnostics
              </>
            )}
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Test Results:</h3>
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(result.status)}>
                      {result.status.toUpperCase()}
                    </Badge>
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                  {result.data && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600">Show Data</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
