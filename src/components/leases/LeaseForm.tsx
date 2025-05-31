"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { CalendarIcon, Upload } from "lucide-react";
import { Lease, LeaseFormValues, leaseSchema } from "@/types/lease";
import { useCreateLease, useUpdateLease } from "@/hooks/useLeases";
import { useGetUnits } from "@/hooks/useUnits";
import { useTenants } from "@/hooks/useTenants";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface LeaseFormProps {
  lease?: Lease;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId?: string; // Optional unitId for pre-selecting a unit
}

export function LeaseForm({ lease, open, onOpenChange, unitId }: LeaseFormProps) {
  const createLease = useCreateLease();
  const updateLease = useUpdateLease();
  const { data: units, isLoading: unitsLoading } = useGetUnits();
  const { data: tenants, isLoading: tenantsLoading } = useTenants();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const { toast } = useToast();

  // Initialize the form with react-hook-form
  const form = useForm<LeaseFormValues>({
    resolver: zodResolver(leaseSchema),
    defaultValues: lease ? {
      unit_id: lease.unit_id || "",
      tenant_ids: lease.tenants?.map(t => t.id) || [],
      start_date: lease.start_date || format(new Date(), "yyyy-MM-dd"),
      end_date: lease.end_date || format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), "yyyy-MM-dd"),
      rent_amount: lease.rent_amount || 0,
      deposit_amount: lease.deposit_amount || lease.security_deposit || lease.deposit || 0,
      notes: lease.notes || "",
      is_draft: lease.is_draft || false,
    } : {
      unit_id: unitId || "",
      tenant_ids: [],
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), "yyyy-MM-dd"),
      rent_amount: 0,
      deposit_amount: 0,
      notes: "",
      is_draft: false,
    },
  });

  // Update form values when lease prop changes
  useEffect(() => {
    if (lease) {
      // Get tenant IDs from lease
      const tenantIds = lease.tenants?.map(tenant => tenant.id) || [];
      setSelectedTenants(tenantIds);

      form.reset({
        unit_id: lease.unit_id,
        tenant_ids: tenantIds,
        start_date: lease.start_date,
        end_date: lease.end_date,
        rent_amount: lease.rent_amount,
        deposit_amount: lease.deposit_amount || 0,
        notes: lease.notes || "",
      });
    } else if (unitId) {
      form.reset({
        ...form.getValues(),
        unit_id: unitId,
      });
    }
  }, [lease, unitId, form]);

  // Handle tenant selection
  const handleTenantChange = (tenantId: string, checked: boolean) => {
    if (checked) {
      setSelectedTenants(prev => [...prev, tenantId]);
      form.setValue('tenant_ids', [...selectedTenants, tenantId]);
    } else {
      setSelectedTenants(prev => prev.filter(id => id !== tenantId));
      form.setValue('tenant_ids', selectedTenants.filter(id => id !== tenantId));
    }
    form.trigger('tenant_ids');
  };

  // Handle form submission
  const onSubmit = async (values: LeaseFormValues, isDraft: boolean = false) => {
    setIsSubmitting(true);
    try {
      console.log("Form values before submission:", values);
      console.log("Selected tenants:", selectedTenants);
      console.log("Is draft:", isDraft);

      // Ensure tenant_ids is set correctly
      values.tenant_ids = selectedTenants;
      values.is_draft = isDraft;

      // Only require tenants for non-draft leases
      if (!isDraft && selectedTenants.length === 0) {
        throw new Error("Please select at least one tenant for a finalized lease");
      }

      if (lease) {
        console.log("Updating lease:", lease.id);
        await updateLease.mutateAsync({
          id: lease.id,
          values: {
            unit_id: values.unit_id,
            start_date: values.start_date,
            end_date: values.end_date,
            rent_amount: values.rent_amount,
            deposit_amount: values.deposit_amount,
            notes: values.notes,
            is_draft: values.is_draft,
          },
        });
      } else {
        console.log("Creating new lease with values:", {
          unit_id: values.unit_id,
          tenant_ids: values.tenant_ids,
          start_date: values.start_date,
          end_date: values.end_date,
          rent_amount: values.rent_amount,
          deposit_amount: values.deposit_amount,
          notes: values.notes,
        });

        const result = await createLease.mutateAsync(values);
        console.log("Lease created successfully:", result);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      // Show error in UI
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save lease",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lease ? "Edit Lease" : "Add New Lease"}</DialogTitle>
          <DialogDescription>
            {lease
              ? "Update lease information in the form below."
              : "Fill out the form below to add a new lease."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Unit Selection */}
              <FormField
                control={form.control}
                name="unit_id"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Unit*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={!!unitId || !!lease}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unitsLoading ? (
                          <SelectItem value="loading" disabled>Loading units...</SelectItem>
                        ) : units && units.length > 0 ? (
                          units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.name} ({unit.properties?.name})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No units found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {unitId && <p className="text-xs text-muted-foreground mt-1">Unit is pre-selected</p>}
                  </FormItem>
                )}
              />

              {/* Tenant Selection */}
              <FormField
                control={form.control}
                name="tenant_ids"
                render={() => (
                  <FormItem className="md:col-span-2">
                    <div className="mb-4">
                      <FormLabel>Tenants</FormLabel>
                      <FormDescription>
                        Select one or more tenants for this lease. The first tenant selected will be considered the primary tenant.
                        You can save as a draft without selecting tenants.
                      </FormDescription>
                    </div>
                    <div className="border rounded-md p-4 space-y-2 max-h-40 overflow-y-auto">
                      {tenantsLoading ? (
                        <p>Loading tenants...</p>
                      ) : tenants && tenants.length > 0 ? (
                        tenants.map((tenant) => (
                          <div key={tenant.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`tenant-${tenant.id}`}
                              checked={selectedTenants.includes(tenant.id)}
                              onCheckedChange={(checked) =>
                                handleTenantChange(tenant.id, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`tenant-${tenant.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {tenant.is_company && tenant.company_name
                                ? tenant.company_name
                                : `${tenant.first_name} ${tenant.last_name}`}
                              {" "}
                              <span className="text-muted-foreground">({tenant.email})</span>
                            </label>
                          </div>
                        ))
                      ) : (
                        <p>No tenants found</p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start Date */}
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date*</FormLabel>
                    <div className="flex items-center">
                      <Input
                        type="date"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date*</FormLabel>
                    <div className="flex items-center">
                      <Input
                        type="date"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rent Amount */}
              <FormField
                control={form.control}
                name="rent_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Rent*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Deposit Amount */}
              <FormField
                control={form.control}
                name="deposit_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Deposit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes about this lease"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Draft Status - Only show when editing */}
              {lease && (
                <FormField
                  control={form.control}
                  name="is_draft"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <div className="flex items-center space-x-3 p-4 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                          />
                        </FormControl>
                        <div className="flex-1">
                          <FormLabel className="text-sm font-medium text-orange-800 dark:text-orange-200">
                            Keep as Draft
                          </FormLabel>
                          <FormDescription className="text-orange-700 dark:text-orange-300">
                            {field.value
                              ? "This lease is saved as a draft and won't be active until you uncheck this option."
                              : "Uncheck to finalize this lease and make it active."
                            }
                          </FormDescription>
                        </div>
                        {field.value && (
                          <i className="ri-draft-line text-orange-600 text-xl"></i>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter className="mt-6">
              <div className="flex gap-2 w-full">
                {!lease && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={async () => {
                      const values = form.getValues();
                      await onSubmit(values, true);
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">⟳</span> Saving...
                      </>
                    ) : (
                      <>
                        <i className="ri-draft-line mr-2"></i>
                        Save as Draft
                      </>
                    )}
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span> Saving...
                    </>
                  ) : lease ? (
                    form.watch("is_draft") ? (
                      <>
                        <i className="ri-draft-line mr-2"></i>
                        Save Draft
                      </>
                    ) : (
                      <>
                        <i className="ri-check-line mr-2"></i>
                        Finalize Lease
                      </>
                    )
                  ) : (
                    <>
                      <i className="ri-file-check-line mr-2"></i>
                      Create Lease
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
