"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGetPropertyInsurances, useAddPropertyInsurance, useDeletePropertyInsurance, useUpdatePropertyInsurance } from "@/hooks/usePropertyInsurance";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { PropertyInsurance } from "@/hooks/usePropertyInsurance";

interface PropertyInsuranceProps {
  propertyId: string;
}

// Schema for insurance form
const insuranceSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  company_website: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  agent_name: z.string().optional(),
  agent_email: z.string().email("Invalid email").optional().or(z.literal('')),
  agent_phone: z.string().optional(),
  policy_number: z.string().min(1, "Policy number is required"),
  effective_date: z.string().min(1, "Effective date is required"),
  expiration_date: z.string().min(1, "Expiration date is required"),
  premium: z.coerce.number().positive("Premium must be positive"),
  notify_before_expiration: z.boolean(),
  details: z.string().optional(),
});

type InsuranceFormValues = z.infer<typeof insuranceSchema>;

export function PropertyInsurance({ propertyId }: PropertyInsuranceProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<PropertyInsurance | null>(null);
  const { data: insurances, isLoading } = useGetPropertyInsurances(propertyId);
  const addInsurance = useAddPropertyInsurance();
  const updateInsurance = useUpdatePropertyInsurance();
  const deleteInsurance = useDeletePropertyInsurance();
  const { toast } = useToast();

  const form = useForm<InsuranceFormValues>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: {
      company_name: "",
      company_website: "",
      agent_name: "",
      agent_email: "",
      agent_phone: "",
      policy_number: "",
      effective_date: "",
      expiration_date: "",
      premium: 0,
      notify_before_expiration: false,
      details: "",
    }
  });

  const openAddDialog = () => {
    setEditingInsurance(null);
    form.reset({
      company_name: "",
      company_website: "",
      agent_name: "",
      agent_email: "",
      agent_phone: "",
      policy_number: "",
      effective_date: "",
      expiration_date: "",
      premium: 0,
      notify_before_expiration: false,
      details: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (insurance: PropertyInsurance) => {
    setEditingInsurance(insurance);
    form.reset({
      company_name: insurance.company_name,
      company_website: insurance.company_website || "",
      agent_name: insurance.agent_name || "",
      agent_email: insurance.agent_email || "",
      agent_phone: insurance.agent_phone || "",
      policy_number: insurance.policy_number,
      effective_date: insurance.effective_date ? format(new Date(insurance.effective_date), "yyyy-MM-dd") : "",
      expiration_date: insurance.expiration_date ? format(new Date(insurance.expiration_date), "yyyy-MM-dd") : "",
      premium: insurance.premium,
      notify_before_expiration: insurance.notify_before_expiration || false,
      details: insurance.details || "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: InsuranceFormValues) => {
    try {
      if (editingInsurance) {
        await updateInsurance.mutateAsync({
          insuranceId: editingInsurance.id,
          insurance: data
        });
        
        toast({
          title: "Insurance updated",
          description: "Insurance policy has been updated successfully",
        });
      } else {
        await addInsurance.mutateAsync({
          propertyId,
          insurance: data
        });
        
        toast({
          title: "Insurance added",
          description: "Insurance policy has been added successfully",
        });
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: editingInsurance ? "Error updating insurance" : "Error adding insurance",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (insuranceId: string) => {
    try {
      await deleteInsurance.mutateAsync(insuranceId);
      toast({
        title: "Insurance deleted",
        description: "The insurance policy has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error deleting insurance",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage insurance policies for this property.
        </p>
        <Button onClick={openAddDialog}>
          <i className="ri-add-line mr-1" />
          Add Insurance
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : insurances && insurances.length > 0 ? (
        <div className="space-y-4">
          {insurances.map((insurance) => (
            <div 
              key={insurance.id} 
              className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{insurance.company_name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Policy #{insurance.policy_number}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={() => openEditDialog(insurance)}
                  >
                    <i className="ri-edit-line" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <i className="ri-delete-bin-line" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this insurance policy. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(insurance.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          {deleteInsurance.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Effective Date</p>
                  <p className="text-sm">
                    {insurance.effective_date ? format(new Date(insurance.effective_date), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Expiration Date</p>
                  <p className="text-sm">
                    {insurance.expiration_date ? format(new Date(insurance.expiration_date), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Premium</p>
                  <p className="text-sm">${insurance.premium.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Notifications</p>
                  <p className="text-sm">
                    {insurance.notify_before_expiration ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
              
              {(insurance.agent_name || insurance.agent_email || insurance.agent_phone) && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Agent Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {insurance.agent_name && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                        <p className="text-sm">{insurance.agent_name}</p>
                      </div>
                    )}
                    {insurance.agent_email && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                        <p className="text-sm">{insurance.agent_email}</p>
                      </div>
                    )}
                    {insurance.agent_phone && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="text-sm">{insurance.agent_phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {insurance.details && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Details</p>
                  <p className="text-sm">{insurance.details}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium mb-2">No insurance policies</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Add insurance policies to keep track of coverage for this property.
          </p>
          <Button onClick={openAddDialog}>
            <i className="ri-add-line mr-1" />
            Add Insurance
          </Button>
        </div>
      )}

      {/* Insurance Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingInsurance ? "Edit Insurance Policy" : "Add Insurance Policy"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Insurance company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="company_website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="agent_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Agent name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="agent_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent Email</FormLabel>
                      <FormControl>
                        <Input placeholder="agent@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="agent_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="policy_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy Number*</FormLabel>
                      <FormControl>
                        <Input placeholder="Policy #" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="premium"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Premium ($)*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notify_before_expiration"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Notify Before Expiration</FormLabel>
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
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="effective_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective Date*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="expiration_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiration Date*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter additional details about the policy" 
                        className="resize-none h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4 pt-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addInsurance.isPending || updateInsurance.isPending}
                >
                  {(addInsurance.isPending || updateInsurance.isPending) ? "Saving..." : (editingInsurance ? "Update Insurance" : "Add Insurance")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
