"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMaintenanceRequests } from "@/hooks/useMaintenance";
import { useCalendarEvents } from "@/hooks/useCalendar";

export default function TestCalendarPage() {
  const [result, setResult] = useState<string>("");

  // Get maintenance requests and calendar events
  const { data: maintenanceRequests, isLoading: maintenanceLoading } = useMaintenanceRequests();
  const { data: calendarEvents, isLoading: calendarLoading } = useCalendarEvents();

  const testMaintenanceData = () => {
    if (!maintenanceRequests) {
      setResult("No maintenance requests found");
      return;
    }

    const withDueDates = maintenanceRequests.filter(r => r.due_date);
    const withoutDueDates = maintenanceRequests.filter(r => !r.due_date);

    const details = maintenanceRequests.map(r => ({
      id: r.id,
      title: r.title,
      due_date: r.due_date,
      status: r.status,
      created_at: r.created_at
    }));

    setResult(`Maintenance Requests Analysis:
Total: ${maintenanceRequests.length}
With due dates: ${withDueDates.length}
Without due dates: ${withoutDueDates.length}

Details:
${JSON.stringify(details, null, 2)}`);
  };

  const testCalendarEvents = () => {
    if (!calendarEvents) {
      setResult("No calendar events found");
      return;
    }

    const maintenanceEvents = calendarEvents.filter(e => e.type === 'maintenance');
    const customEvents = calendarEvents.filter(e => e.type === 'custom');

    const eventDetails = calendarEvents.map(e => ({
      id: e.id,
      type: e.type,
      title: e.title,
      date: e.date,
      status: e.status
    }));

    setResult(`Calendar Events Analysis:
Total: ${calendarEvents.length}
Maintenance events: ${maintenanceEvents.length}
Custom events: ${customEvents.length}

Event Details:
${JSON.stringify(eventDetails, null, 2)}`);
  };

  const addTestMaintenanceWithDueDate = async () => {
    try {
      const { supabase } = await import("@/lib/supabase");
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data, error } = await supabase
        .from("maintenance_requests")
        .insert([{
          title: "Test Calendar Maintenance",
          description: "This is a test maintenance request for calendar testing",
          type: "general",
          priority: "medium",
          status: "open",
          due_date: tomorrow.toISOString().split('T')[0], // YYYY-MM-DD format
          property_id: null,
          unit_id: null
        }])
        .select()
        .single();

      if (error) {
        setResult(`Error creating test maintenance: ${error.message}`);
      } else {
        setResult(`Test maintenance created successfully:
ID: ${data.id}
Title: ${data.title}
Due Date: ${data.due_date}
Status: ${data.status}

Now check the calendar page to see if it appears!`);
      }
    } catch (err) {
      setResult(`Exception: ${err}`);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Calendar & Maintenance Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold">Maintenance Requests</h3>
              <p className="text-sm text-gray-600">
                {maintenanceLoading ? "Loading..." : `${maintenanceRequests?.length || 0} found`}
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold">Calendar Events</h3>
              <p className="text-sm text-gray-600">
                {calendarLoading ? "Loading..." : `${calendarEvents?.length || 0} found`}
              </p>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={testMaintenanceData} 
              variant="outline"
              disabled={maintenanceLoading}
            >
              Analyze Maintenance Data
            </Button>
            
            <Button 
              onClick={testCalendarEvents} 
              variant="outline"
              disabled={calendarLoading}
            >
              Analyze Calendar Events
            </Button>
            
            <Button 
              onClick={addTestMaintenanceWithDueDate} 
              variant="default"
            >
              Add Test Maintenance
            </Button>
          </div>

          {/* Results */}
          <div>
            <label className="block text-sm font-medium mb-2">Test Results:</label>
            <div className="bg-gray-100 p-4 rounded-lg min-h-[300px] font-mono text-sm whitespace-pre-wrap">
              {result || "Click a test button to see results..."}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Debugging Steps:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Analyze Maintenance Data" to see if maintenance requests have due_date</li>
              <li>Click "Analyze Calendar Events" to see what events are being generated</li>
              <li>If no maintenance events, click "Add Test Maintenance" to create one</li>
              <li>Check browser console for detailed logs</li>
              <li>Go to Calendar page to see if events appear</li>
            </ol>
          </div>

          {/* Quick Links */}
          <div className="flex gap-4">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/calendar'}
            >
              Go to Calendar
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/maintenance'}
            >
              Go to Maintenance
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
