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
import { useCreateCustomEvent } from "@/hooks/useCalendar";
import { useGetProperties } from "@/hooks/useProperties";
import { useGetUnits } from "@/hooks/useUnits";

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  endDate: z.string().optional(),
  time: z.string().optional(),
  allDay: z.boolean(),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  isRecurring: z.boolean(),
  recurringPattern: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  reminderMinutes: z.string().optional(),
});

type CreateEventForm = z.infer<typeof createEventSchema>;

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: string; // YYYY-MM-DD format
}

export function CreateEventDialog({ open, onOpenChange, initialDate }: CreateEventDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const createEvent = useCreateCustomEvent();
  const { data: properties = [], isLoading: propertiesLoading } = useGetProperties();
  const { data: units = [], isLoading: unitsLoading } = useGetUnits();

  const form = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: initialDate || "",
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

  const watchedPropertyId = form.watch("propertyId");
  const watchedAllDay = form.watch("allDay");
  const watchedIsRecurring = form.watch("isRecurring");

  // Filter units by selected property
  const filteredUnits = units?.filter(unit => unit.property_id === watchedPropertyId) || [];

  // Update form when initialDate changes
  useEffect(() => {
    if (initialDate && open) {
      form.setValue("date", initialDate);
    }
  }, [initialDate, open, form]);

  const onSubmit = async (data: CreateEventForm) => {
    setIsLoading(true);
    try {
      await createEvent.mutateAsync({
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
      });

      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Event</DialogTitle>
          <DialogDescription>
            Add a custom event to your calendar
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>All Day Event</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Event lasts the entire day
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

            {/* Time (only if not all day) */}
            {!watchedAllDay && (
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Property */}
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {propertiesLoading ? (
                          <SelectItem value="loading" disabled>Loading properties...</SelectItem>
                        ) : properties && properties.length > 0 ? (
                          properties.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No properties found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unit */}
              {watchedPropertyId && (
                <FormField
                  control={form.control}
                  name="unitId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unitsLoading ? (
                            <SelectItem value="loading" disabled>Loading units...</SelectItem>
                          ) : filteredUnits && filteredUnits.length > 0 ? (
                            filteredUnits.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No units found for this property</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Recurring Toggle */}
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Recurring Event</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Repeat this event
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

            {/* Recurring Pattern (only if recurring) */}
            {watchedIsRecurring && (
              <FormField
                control={form.control}
                name="recurringPattern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repeat Pattern</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pattern" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Reminder */}
            <FormField
              control={form.control}
              name="reminderMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reminder (minutes before)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="15" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <i className="ri-loader-line mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="ri-add-line mr-2 h-4 w-4" />
                    Create Event
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
