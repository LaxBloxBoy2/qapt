"use client";

import { useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarEvent, CalendarViewMode, formatEventTitle } from "@/types/calendar";

interface CalendarViewProps {
  events: CalendarEvent[];
  isLoading: boolean;
  viewMode: CalendarViewMode;
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: string) => void;
}

export function CalendarView({
  events,
  isLoading,
  viewMode,
  onEventClick,
  onDateClick,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // Convert our events to FullCalendar format
  const fullCalendarEvents = events.map(event => {
    const isCompleted = event.status === 'completed';
    return {
      id: event.id,
      title: formatEventTitle(event),
      start: event.date,
      end: event.endDate,
      allDay: event.allDay,
      backgroundColor: isCompleted ? '#e5e7eb' : event.backgroundColor,
      borderColor: isCompleted ? '#9ca3af' : event.borderColor,
      textColor: isCompleted ? '#6b7280' : event.color,
      extendedProps: {
        originalEvent: event,
        icon: event.icon,
        status: event.status,
        type: event.type,
        description: event.description,
        property: event.property,
        unit: event.unit,
        assignee: event.assignee,
      },
      classNames: [
        'calendar-event',
        `event-${event.type}`,
        `status-${event.status}`,
        isCompleted ? 'completed-event' : '',
      ].filter(Boolean),
    };
  });

  // Get the correct view for FullCalendar
  const getCalendarView = (mode: CalendarViewMode) => {
    switch (mode) {
      case 'month':
        return 'dayGridMonth';
      case 'week':
        return 'timeGridWeek';
      case 'day':
        return 'timeGridDay';
      case 'agenda':
        return 'listWeek';
      default:
        return 'dayGridMonth';
    }
  };

  // Update calendar view when viewMode changes
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi && calendarApi.view.type !== getCalendarView(viewMode)) {
      calendarApi.changeView(getCalendarView(viewMode));
    }
  }, [viewMode]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <div className="grid grid-cols-7 gap-2">
              {[...Array(35)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="calendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView={getCalendarView(viewMode)}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '' // Remove default view buttons since we have custom ones
            }}
            events={fullCalendarEvents}
            eventClick={(info) => {
              info.jsEvent.preventDefault();
              const originalEvent = info.event.extendedProps.originalEvent as CalendarEvent;
              onEventClick(originalEvent);
            }}
            dateClick={(info) => {
              onDateClick(info.dateStr);
            }}
            height="auto"
            aspectRatio={1.8}
            eventDisplay="block"
            dayMaxEvents={3}
            moreLinkClick="popover"
            eventContent={(eventInfo) => {
              const event = eventInfo.event.extendedProps.originalEvent as CalendarEvent;
              const isCompleted = event.status === 'completed';
              return (
                <div className={`flex items-center gap-1 p-1 text-xs ${isCompleted ? 'opacity-70' : ''}`}>
                  <span className="text-sm">{event.icon}</span>
                  <span className={`truncate font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                    {eventInfo.event.title}
                  </span>
                  {event.status === 'overdue' && (
                    <i className="ri-alarm-warning-line text-red-500 ml-auto" />
                  )}
                  {event.status === 'completed' && (
                    <i className="ri-check-line text-green-500 ml-auto" />
                  )}
                </div>
              );
            }}
            eventClassNames={(eventInfo) => {
              const event = eventInfo.event.extendedProps.originalEvent as CalendarEvent;
              return [
                'cursor-pointer',
                'hover:opacity-80',
                'transition-opacity',
                'rounded-md',
                'border',
                'text-xs',
                event.status === 'overdue' ? 'ring-2 ring-red-500' : '',
                event.status === 'completed' ? 'opacity-70 bg-gray-300 border-gray-400 text-gray-600' : '',
              ].filter(Boolean);
            }}
            dayCellClassNames="hover:bg-muted/50 cursor-pointer"
          />
        </div>

        {/* Custom CSS for calendar styling to match app theme */}
        <style jsx global>{`
          .fc {
            font-family: inherit;
          }

          .fc-toolbar {
            margin-bottom: 1.5rem;
            padding: 0;
          }

          .fc-toolbar-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: hsl(var(--foreground));
            margin: 0;
          }

          .fc-button {
            background: #16a34a;
            border: 1px solid #16a34a;
            color: white;
            font-size: 0.875rem;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-weight: 500;
            transition: all 0.2s ease;
          }

          .fc-button:hover:not(:disabled) {
            background: #15803d;
            border-color: #15803d;
            color: white;
          }

          .fc-button:focus {
            box-shadow: 0 0 0 2px #16a34a40;
            outline: none;
          }

          .fc-button-primary:not(:disabled).fc-button-active {
            background: #15803d;
            color: white;
            border-color: #15803d;
          }

          .fc-button-group > .fc-button {
            margin-left: 0;
            border-radius: 0;
            border-right: 1px solid #15803d;
          }

          .fc-button-group > .fc-button:first-child {
            border-top-left-radius: 0.5rem;
            border-bottom-left-radius: 0.5rem;
          }

          .fc-button-group > .fc-button:last-child {
            border-top-right-radius: 0.5rem;
            border-bottom-right-radius: 0.5rem;
            border-right: 1px solid #16a34a;
          }

          /* Today button specific styling */
          .fc-today-button {
            background: #059669 !important;
            border-color: #059669 !important;
          }

          .fc-today-button:hover {
            background: #047857 !important;
            border-color: #047857 !important;
          }

          .fc-day {
            border: 1px solid hsl(var(--border));
            background: hsl(var(--background));
          }

          .fc-day-today {
            background: rgba(22, 163, 74, 0.1) !important;
          }

          .fc-daygrid-day-number {
            color: hsl(var(--foreground));
            font-weight: 500;
            padding: 0.5rem;
          }

          .fc-day-today .fc-daygrid-day-number {
            color: #16a34a;
            font-weight: 600;
          }

          .fc-event {
            border-radius: 0.375rem;
            font-size: 0.75rem;
            margin: 2px;
            border: none;
            font-weight: 500;
          }

          .fc-list-event:hover {
            background: hsl(var(--muted));
          }

          .fc-list-day-cushion {
            background: hsl(var(--muted));
            color: hsl(var(--foreground));
            font-weight: 600;
            padding: 0.75rem;
          }

          .fc-list-day-text {
            font-weight: 600;
          }

          .fc-list-event-title {
            font-weight: 500;
          }

          .fc-scrollgrid {
            border: 1px solid hsl(var(--border));
            border-radius: 0.75rem;
            overflow: hidden;
          }

          /* Completed event styling */
          .completed-event {
            opacity: 0.7;
          }

          .completed-event .fc-event-title {
            text-decoration: line-through;
            color: #6b7280 !important;
          }

          .fc-col-header-cell {
            background: hsl(var(--muted) / 0.5);
            border-color: hsl(var(--border));
            font-weight: 600;
            color: hsl(var(--foreground));
            padding: 0.75rem 0.5rem;
          }

          .fc-col-header-cell-cushion {
            padding: 0;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.025em;
          }

          .fc-daygrid-event-harness {
            margin: 1px 2px;
          }

          .fc-more-link {
            color: #16a34a;
            font-weight: 500;
            font-size: 0.75rem;
          }

          .fc-more-link:hover {
            color: #15803d;
          }

          .fc-popover {
            background: hsl(var(--background));
            border: 1px solid hsl(var(--border));
            border-radius: 0.75rem;
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04);
          }

          .fc-popover-header {
            background: hsl(var(--muted));
            border-bottom: 1px solid hsl(var(--border));
            font-weight: 600;
            padding: 0.75rem 1rem;
            border-top-left-radius: 0.75rem;
            border-top-right-radius: 0.75rem;
          }

          .fc-popover-body {
            padding: 0.5rem;
          }

          /* Time grid styles */
          .fc-timegrid-slot {
            border-color: hsl(var(--border));
          }

          .fc-timegrid-axis {
            border-color: hsl(var(--border));
          }

          .fc-timegrid-slot-label {
            color: hsl(var(--muted-foreground));
            font-size: 0.75rem;
          }

          /* List view styles */
          .fc-list-table {
            border: none;
          }

          .fc-list-day {
            background: hsl(var(--muted) / 0.3);
          }

          .fc-list-event {
            border-bottom: 1px solid hsl(var(--border));
          }

          .fc-list-event:last-child {
            border-bottom: none;
          }

          .fc-list-event-time {
            color: hsl(var(--muted-foreground));
            font-weight: 500;
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .fc-toolbar {
              flex-direction: column;
              gap: 1rem;
            }

            .fc-toolbar-title {
              font-size: 1.25rem;
            }

            .fc-button {
              padding: 0.375rem 0.75rem;
              font-size: 0.8125rem;
            }
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
