"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarEvent, EVENT_TYPE_CONFIG } from "@/types/calendar";
import { useCompleteEvent, useDeleteCustomEvent } from "@/hooks/useCalendar";

interface EventDetailsDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailsDialog({ event, open, onOpenChange }: EventDetailsDialogProps) {
  const router = useRouter();
  const completeEvent = useCompleteEvent();
  const deleteEvent = useDeleteCustomEvent();

  if (!event) return null;

  const config = EVENT_TYPE_CONFIG[event.type];

  const handleAction = async (action: any) => {
    switch (action.type) {
      case 'navigate':
        if (action.href) {
          router.push(action.href);
          onOpenChange(false);
        }
        break;
      case 'complete':
        await completeEvent.mutateAsync({
          eventId: event.relatedId || event.id,
          eventType: event.relatedType || event.type
        });
        onOpenChange(false);
        break;
      case 'edit':
        // TODO: Open edit dialog
        console.log('Edit event:', event.id);
        break;
      case 'reschedule':
        // TODO: Open reschedule dialog
        console.log('Reschedule event:', event.id);
        break;
    }
  };

  const handleCompleteEvent = async () => {
    if (event.type === 'custom') {
      // Extract the actual database ID from the calendar event ID
      const actualEventId = event.relatedId || event.id.replace('custom_', '');
      console.log('Completing custom event:', {
        calendarEventId: event.id,
        actualEventId,
        relatedId: event.relatedId
      });

      await completeEvent.mutateAsync({
        eventId: actualEventId,
        eventType: 'custom_event'
      });
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    if (event.type === 'custom') {
      await deleteEvent.mutateAsync(event.relatedId);
      onOpenChange(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      upcoming: "default",
      overdue: "destructive",
      completed: "secondary",
      cancelled: "outline",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "default"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.backgroundColor}`}>
              <span className="text-lg">{config.icon}</span>
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{event.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span>{config.label}</span>
                <span>•</span>
                {getStatusBadge(event.status)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          {event.description && (
            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </div>
          )}

          {/* Date & Time */}
          <div>
            <h4 className="text-sm font-medium mb-2">Date & Time</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <i className="ri-calendar-line h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {formatDate(event.date)}
                  {event.endDate && event.endDate !== event.date && (
                    <span> - {formatDate(event.endDate)}</span>
                  )}
                </span>
              </div>
              {!event.allDay && event.time && (
                <div className="flex items-center gap-2">
                  <i className="ri-time-line h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatTime(event.time)}</span>
                </div>
              )}
              {event.allDay && (
                <div className="flex items-center gap-2">
                  <i className="ri-sun-line h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">All day</span>
                </div>
              )}
            </div>
          </div>

          {/* Property & Unit */}
          {(event.property || event.unit) && (
            <div>
              <h4 className="text-sm font-medium mb-2">Location</h4>
              <div className="space-y-1">
                {event.property && (
                  <div className="flex items-center gap-2">
                    <i className="ri-building-line h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{event.property.name}</span>
                  </div>
                )}
                {event.unit && (
                  <div className="flex items-center gap-2">
                    <i className="ri-door-line h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{event.unit.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assignee */}
          {event.assignee && (
            <div>
              <h4 className="text-sm font-medium mb-2">Assignee</h4>
              <div className="flex items-center gap-2">
                <i className="ri-user-line h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{event.assignee.name}</span>
                <Badge variant="outline" className="text-xs">
                  {event.assignee.type}
                </Badge>
              </div>
            </div>
          )}

          {/* Recurring Info */}
          {event.isRecurring && (
            <div>
              <h4 className="text-sm font-medium mb-2">Recurring</h4>
              <div className="flex items-center gap-2">
                <i className="ri-repeat-line h-4 w-4 text-muted-foreground" />
                <span className="text-sm capitalize">{event.recurringPattern}</span>
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div>
            <h4 className="text-sm font-medium mb-3">Actions</h4>
            <div className="flex flex-wrap gap-2">
              {/* Reschedule Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log('Reschedule event:', event.id)}
                className="flex items-center gap-2"
              >
                <i className="ri-calendar-line h-4 w-4" />
                Reschedule
              </Button>

              {/* Edit Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log('Edit event:', event.id)}
                className="flex items-center gap-2"
              >
                <i className="ri-edit-line h-4 w-4" />
                Edit Event
              </Button>

              {/* Complete Event Button - only show if not completed */}
              {event.status !== 'completed' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCompleteEvent}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <i className="ri-check-line h-4 w-4" />
                  Complete Event
                </Button>
              )}

              {/* Additional actions from event.actions if they exist */}
              {event.actions && event.actions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={() => handleAction(action)}
                  className="flex items-center gap-2"
                >
                  <i className={`${action.icon} h-4 w-4`} />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {event.type === 'custom' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                <i className="ri-delete-bin-line mr-2 h-4 w-4" />
                Delete Event
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
