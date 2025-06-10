"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUpdateCustomEvent } from "@/hooks/useCalendar";
import { useGetProperties } from "@/hooks/useProperties";
import { useGetUnits } from "@/hooks/useUnits";
import { CalendarEvent } from "@/types/calendar";

const editEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z.string().optional().refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), "End date must be in YYYY-MM-DD format"),
  time: z.string().optional(),
  allDay: z.boolean(),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  isRecurring: z.boolean(),
  recurringPattern: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  reminderMinutes: z.string().optional(),
});

type EditEventForm = z.infer<typeof editEventSchema>;

interface EditEventDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEventDialog({ event, open, onOpenChange }: EditEventDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const updateEvent = useUpdateCustomEvent();
  const { data: properties = [], isLoading: propertiesLoading } = useGetProperties();
  const { data: units = [], isLoading: unitsLoading } = useGetUnits();

  const form = useForm<EditEventForm>({
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      endDate: "",
      time: "",
      allDay: true,
      propertyId: undefined,
      unitId: undefined,
      isRecurring: false,
      recurringPattern: undefined,
      reminderMinutes: "",
    },
  });

  // Reset form when event changes
  useEffect(() => {
    if (event && open) {
      const actualEventId = event.relatedId || event.id.replace('custom_', '');
      
      form.reset({
        title: event.title || "",
        description: event.description || "",
        date: event.date || "",
        endDate: event.endDate || "",
        time: event.time || "",
        allDay: event.allDay || true,
        propertyId: event.propertyId || undefined,
        unitId: event.unitId || undefined,
        isRecurring: event.isRecurring || false,
        recurringPattern: (event.recurringPattern && ["daily", "weekly", "monthly", "yearly"].includes(event.recurringPattern)
          ? event.recurringPattern as "daily" | "weekly" | "monthly" | "yearly"
          : undefined),
        reminderMinutes: "",
      });
    }
  }, [event, open, form]);

  const onSubmit = async (data: EditEventForm) => {
    if (!event) return;
    
    setIsLoading(true);
    try {
      const actualEventId = event.relatedId || event.id.replace('custom_', '');
      
      await updateEvent.mutateAsync({
        id: actualEventId,
        updates: {
          title: data.title,
          description: data.description,
          date: data.date,
          endDate: data.endDate,
          time: data.allDay ? undefined : data.time,
          allDay: data.allDay,
          propertyId: data.propertyId,
          unitId: data.unitId,
          isRecurring: data.isRecurring,
          recurringPattern: data.isRecurring ? data.recurringPattern : undefined,
          reminderMinutes: data.reminderMinutes ? parseInt(data.reminderMinutes) : undefined,
        }
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  // Filter units based on selected property
  const filteredUnits = units.filter(unit => 
    !form.watch("propertyId") || unit.property_id === form.watch("propertyId")
  );

  if (!event || event.type !== 'custom') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Make changes to your custom event
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title*</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Event title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Event description"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date and Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date*</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* All Day Toggle */}
            <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">All Day Event</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      This event lasts the entire day
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Time - only show if not all day */}
            {!form.watch("allDay") && (
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input {...field} type="time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Property and Unit Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Property */}
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No property</SelectItem>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unit */}
              <FormField
                control={form.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No unit</SelectItem>
                        {filteredUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <i className="ri-loader-line animate-spin mr-2 h-4 w-4" />
                    Updating...
                  </>
                ) : (
                  "Update Event"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
