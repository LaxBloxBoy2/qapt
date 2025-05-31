"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateCondition } from "@/hooks/useInspections";
import { InspectionConditionFormValues, inspectionConditionSchema } from "@/types/inspection";
import { Button } from "@/components/ui/button";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AddConditionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
}

export function AddConditionDialog({ open, onOpenChange, sectionId }: AddConditionDialogProps) {
  const createCondition = useCreateCondition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InspectionConditionFormValues>({
    resolver: zodResolver(inspectionConditionSchema),
    defaultValues: {
      section_id: sectionId,
      title: "",
      description: "",
      cost_estimate: undefined,
    },
  });

  const onSubmit = async (data: InspectionConditionFormValues) => {
    setIsSubmitting(true);
    try {
      await createCondition.mutateAsync(data);
      form.reset({
        section_id: sectionId,
        title: "",
        description: "",
        cost_estimate: undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating condition:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Condition</DialogTitle>
          <DialogDescription>
            Document a condition or issue found in this section.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Hidden section_id field */}
            <input type="hidden" {...form.register("section_id")} value={sectionId} />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Damaged Wall, Broken Light Fixture" {...field} />
                  </FormControl>
                  <FormDescription>
                    A short title describing the condition.
                  </FormDescription>
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
                      placeholder="Provide details about the condition..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed description of the condition or issue.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cost Estimate */}
            <FormField
              control={form.control}
              name="cost_estimate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Estimate (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? undefined : parseFloat(value));
                      }}
                      value={field.value === undefined ? "" : field.value}
                    />
                  </FormControl>
                  <FormDescription>
                    Estimated cost to repair or replace.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                    Saving...
                  </>
                ) : (
                  "Save Condition"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
