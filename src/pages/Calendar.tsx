"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarFilters, CalendarViewMode } from "@/types/calendar";
import { useCalendarEvents, useCalendarSummary } from "@/hooks/useCalendar";
// TODO: Import these hooks when they become available
// import { useGetProperties } from "@/hooks/useProperties";
// import { useTenants } from "@/hooks/useTenants";
import { CalendarSummaryCards } from "@/components/calendar/CalendarSummaryCards";
import { CalendarView } from "@/components/calendar/CalendarView";
import { CalendarFiltersPanel } from "@/components/calendar/CalendarFiltersPanel";
import { CreateEventDialog } from "@/components/calendar/CreateEventDialog";
import { EventDetailsDialog } from "@/components/calendar/EventDetailsDialog";

export default function Calendar() {
  const [filters, setFilters] = useState<CalendarFilters>({});
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  // Data hooks
  const { data: events, isLoading: eventsLoading } = useCalendarEvents(filters);
  const { data: summary, isLoading: summaryLoading } = useCalendarSummary(filters);
  // TODO: Add these when hooks become available
  // const { data: properties } = useGetProperties();
  // const { data: tenants } = useTenants();

  // Handle filter changes
  const handleFilterChange = (key: keyof CalendarFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? undefined : value
    }));
  };

  // Handle event click
  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  // Handle date click - open create event dialog with selected date
  const handleDateClick = (date: string) => {
    console.log("Date clicked:", date);
    setSelectedDate(date);
    setShowCreateDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Calendar</h1>
          <p className="text-muted-foreground">
            Central hub for all time-sensitive activities across your properties
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Buttons */}
          <div className="flex items-center border rounded-lg p-1 bg-muted/50">
            {(['month', 'week', 'day', 'agenda'] as CalendarViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className={`capitalize min-w-[60px] ${
                  viewMode === mode
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === 'agenda' ? 'list' : mode}
              </Button>
            ))}
          </div>
          <Button onClick={() => {
            setSelectedDate(undefined);
            setShowCreateDialog(true);
          }}>
            <i className="ri-add-line mr-2"></i>
            Add Event
          </Button>
        </div>
      </div>

      {/* Main Content with Sidebar Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <CalendarFiltersPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              properties={undefined}
              tenants={undefined}
            />
          </div>
        </div>

        {/* Main Calendar Area */}
        <div className="md:col-span-3">
          <CalendarView
            events={events || []}
            isLoading={eventsLoading}
            viewMode={viewMode}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        </div>
      </div>

      {/* Summary Cards - Moved Below Calendar */}
      <CalendarSummaryCards
        summary={summary}
        isLoading={summaryLoading}
      />

      {/* Create Event Dialog */}
      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setSelectedDate(undefined);
        }}
        initialDate={selectedDate}
      />

      {/* Event Details Dialog */}
      <EventDetailsDialog
        event={selectedEvent}
        open={showEventDetails}
        onOpenChange={setShowEventDetails}
      />
    </div>
  );
}
