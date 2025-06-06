import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarEvent,
  CalendarEventType,
  CalendarEventStatus,
  CalendarFilters,
  CalendarSummary,
  CreateCustomEvent,
  EVENT_TYPE_CONFIG,
  getEventActions,
  getEventStatus
} from "@/types/calendar";

// Import other hooks to get data from different modules
import { useMaintenanceRequests } from "@/hooks/useMaintenance";
// Note: Other module hooks will be imported as they become available
// import { useLeases } from "@/hooks/useLeases";
// import { useTransactions } from "@/hooks/useTransactions";
// import { useGetAppliances } from "@/hooks/useAppliances";

// Fetch all calendar events from multiple sources
export function useCalendarEvents(filters?: CalendarFilters) {
  // Get data from available modules
  const { data: maintenanceRequests } = useMaintenanceRequests();
  // TODO: Add other module hooks as they become available
  // const { data: leases } = useLeases();
  // const { data: transactions } = useTransactions();
  // const { data: appliances } = useGetAppliances();

  return useQuery({
    queryKey: ["calendar-events", filters],
    queryFn: async (): Promise<CalendarEvent[]> => {
      try {
        const events: CalendarEvent[] = [];

        // Get custom events from database
        const { data: customEvents, error: customError } = await supabase
          .from("custom_events")
          .select(`
            *,
            property:properties(id, name),
            unit:units(id, name)
          `);

        if (customError) {
          console.error("Error fetching custom events:", customError);
        }

        // TODO: Process lease events when useLeases hook is available
        // if (leases) { ... }

        // TODO: Process transaction events when useTransactions hook is available
        // if (transactions) { ... }

        // Process maintenance events
        console.log("Processing maintenance requests for calendar:", maintenanceRequests?.length || 0);
        if (maintenanceRequests) {
          maintenanceRequests.forEach(request => {
            console.log("Checking maintenance request:", {
              id: request.id,
              title: request.title,
              due_date: request.due_date,
              status: request.status
            });

            if (request.due_date) {
              const config = EVENT_TYPE_CONFIG.maintenance;

              const maintenanceEvent = {
                id: `maintenance_${request.id}`,
                type: 'maintenance' as CalendarEventType,
                title: `Maintenance: ${request.title}`,
                description: request.description || request.title,
                date: request.due_date,
                allDay: true,
                color: config.color,
                backgroundColor: config.backgroundColor,
                borderColor: config.borderColor,
                icon: config.icon,
                status: (request.status === 'resolved' ? 'completed' :
                       request.status === 'cancelled' ? 'cancelled' :
                       new Date(request.due_date) < new Date() ? 'overdue' : 'upcoming') as CalendarEventStatus,
                relatedId: request.id,
                relatedType: 'maintenance_request',
                propertyId: request.property_id,
                unitId: request.unit_id,
                property: request.property,
                unit: request.unit,
                assignee: request.assigned_to ? {
                  id: request.assigned_to.id,
                  name: request.assigned_to.name,
                  type: request.assigned_to.type as 'team' | 'vendor'
                } : undefined,
                actions: [],
                createdAt: request.created_at,
                updatedAt: request.updated_at
              };

              console.log("Adding maintenance event to calendar:", maintenanceEvent);
              events.push(maintenanceEvent);
            } else {
              console.log("Maintenance request has no due_date:", request.id);
            }
          });
        } else {
          console.log("No maintenance requests available for calendar");
        }

        // TODO: Process appliance events when useGetAppliances hook is available
        // if (appliances) { ... }

        // Process custom events
        if (customEvents) {
          customEvents.forEach(event => {
            const config = EVENT_TYPE_CONFIG.custom;

            events.push({
              id: `custom_${event.id}`,
              type: 'custom',
              title: event.title,
              description: event.description,
              date: event.date,
              endDate: event.end_date,
              time: event.time,
              allDay: event.all_day || false,
              color: config.color,
              backgroundColor: config.backgroundColor,
              borderColor: config.borderColor,
              icon: config.icon,
              status: (event.status || 'upcoming') as CalendarEventStatus,
              relatedId: event.id,
              relatedType: 'custom_event',
              propertyId: event.property_id,
              unitId: event.unit_id,
              property: event.property,
              unit: event.unit,
              isRecurring: event.is_recurring,
              recurringPattern: event.recurring_pattern,
              actions: [],
              createdAt: event.created_at,
              updatedAt: event.updated_at
            });
          });
        }

        // Add actions to all events
        events.forEach(event => {
          event.actions = getEventActions(event);
        });

        // Apply filters
        let filteredEvents = events;

        if (filters?.propertyIds?.length) {
          filteredEvents = filteredEvents.filter(event =>
            event.propertyId && filters.propertyIds!.includes(event.propertyId)
          );
        }

        if (filters?.unitIds?.length) {
          filteredEvents = filteredEvents.filter(event =>
            event.unitId && filters.unitIds!.includes(event.unitId)
          );
        }

        if (filters?.eventTypes?.length) {
          filteredEvents = filteredEvents.filter(event =>
            filters.eventTypes!.includes(event.type)
          );
        }

        if (filters?.statuses?.length) {
          filteredEvents = filteredEvents.filter(event =>
            filters.statuses!.includes(event.status)
          );
        }

        if (filters?.search) {
          const search = filters.search.toLowerCase();
          filteredEvents = filteredEvents.filter(event =>
            event.title.toLowerCase().includes(search) ||
            event.description?.toLowerCase().includes(search) ||
            event.property?.name.toLowerCase().includes(search) ||
            event.unit?.name.toLowerCase().includes(search)
          );
        }

        if (filters?.dateFrom) {
          filteredEvents = filteredEvents.filter(event =>
            event.date >= filters.dateFrom!
          );
        }

        if (filters?.dateTo) {
          filteredEvents = filteredEvents.filter(event =>
            event.date <= filters.dateTo!
          );
        }

        console.log("Final calendar events:", {
          total: filteredEvents.length,
          maintenance: filteredEvents.filter(e => e.type === 'maintenance').length,
          custom: filteredEvents.filter(e => e.type === 'custom').length,
          events: filteredEvents.map(e => ({
            id: e.id,
            type: e.type,
            title: e.title,
            date: e.date,
            status: e.status
          }))
        });

        return filteredEvents;

      } catch (error) {
        console.error("Error fetching calendar events:", error);
        throw error;
      }
    },
  });
}

// Fetch calendar summary
export function useCalendarSummary(filters?: CalendarFilters) {
  const { data: events } = useCalendarEvents(filters);

  return useQuery({
    queryKey: ["calendar-summary", events],
    queryFn: async (): Promise<CalendarSummary> => {
      if (!events) {
        return {
          totalEvents: 0,
          upcomingEvents: 0,
          overdueEvents: 0,
          completedEvents: 0,
          eventsByType: {} as Record<CalendarEventType, number>,
          eventsByStatus: {} as Record<any, number>
        };
      }

      const summary: CalendarSummary = {
        totalEvents: events.length,
        upcomingEvents: events.filter(e => e.status === 'upcoming').length,
        overdueEvents: events.filter(e => e.status === 'overdue').length,
        completedEvents: events.filter(e => e.status === 'completed').length,
        eventsByType: {} as Record<CalendarEventType, number>,
        eventsByStatus: {} as Record<any, number>
      };

      // Count by type
      events.forEach(event => {
        summary.eventsByType[event.type] = (summary.eventsByType[event.type] || 0) + 1;
        summary.eventsByStatus[event.status] = (summary.eventsByStatus[event.status] || 0) + 1;
      });

      return summary;
    },
    enabled: !!events,
  });
}

// Create custom event
export function useCreateCustomEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (event: CreateCustomEvent) => {
      // Ensure dates are properly formatted
      const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return null;
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr;
        }
        // Otherwise, try to parse and format
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date format: ${dateStr}`);
        }
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      };

      const { data, error } = await supabase
        .from("custom_events")
        .insert([{
          title: event.title,
          description: event.description,
          date: formatDate(event.date),
          end_date: formatDate(event.endDate),
          time: event.time,
          all_day: event.allDay || false,
          property_id: event.propertyId || null,
          unit_id: event.unitId || null,
          tags: event.tags,
          is_recurring: event.isRecurring || false,
          recurring_pattern: event.recurringPattern || null,
          reminder_minutes: event.reminderMinutes || null,
          status: 'upcoming'
        }])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast({
        title: "Event Created",
        description: "Custom event has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create event: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Update custom event
export function useUpdateCustomEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateCustomEvent> }) => {
      const { data, error } = await supabase
        .from("custom_events")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast({
        title: "Event Updated",
        description: "Event has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update event: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Delete custom event
export function useDeleteCustomEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_events")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast({
        title: "Event Deleted",
        description: "Event has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete event: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Mark event as complete
export function useCompleteEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ eventId, eventType }: { eventId: string; eventType: string }) => {
      console.log('Completing event:', { eventId, eventType });

      // Handle completion based on event type
      switch (eventType) {
        case 'maintenance_request':
          const { error: maintenanceError } = await supabase
            .from("maintenance_requests")
            .update({
              status: 'resolved',
              resolved_at: new Date().toISOString()
            })
            .eq("id", eventId);

          if (maintenanceError) {
            console.error('Error completing maintenance request:', maintenanceError);
            throw new Error(maintenanceError.message);
          }
          break;

        case 'custom_event':
          const { error: customError } = await supabase
            .from("custom_events")
            .update({ status: 'completed' })
            .eq("id", eventId);

          if (customError) {
            console.error('Error completing custom event:', customError);
            throw new Error(customError.message);
          }
          console.log('Custom event completed successfully');
          break;

        // Add other event types as needed
        default:
          throw new Error(`Unsupported event type: ${eventType}`);
      }

      return { eventId, eventType };
    },
    onSuccess: async () => {
      console.log('Event completion successful, invalidating queries...');

      // Invalidate and refetch calendar events
      await queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      await queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });

      // Force a refetch to ensure UI updates
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["calendar-events"] });
      }, 100);

      toast({
        title: "Event Completed",
        description: "Event has been marked as completed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to complete event: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}
