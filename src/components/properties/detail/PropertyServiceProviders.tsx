"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGetPropertyServiceProviders, useAddPropertyServiceProvider, useDeletePropertyServiceProvider, useUpdatePropertyServiceProvider } from "@/hooks/usePropertyServiceProviders";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PropertyServiceProvider } from "@/hooks/usePropertyServiceProviders";

interface PropertyServiceProvidersProps {
  propertyId: string;
}

// Service provider types
const providerTypes = ["responsibility", "utility"] as const;

// Responsibility options
const responsibilityOptions = [
  "Property Manager",
  "Maintenance",
  "Landscaping",
  "Snow Removal",
  "Pest Control",
  "Cleaning",
  "Pool Service",
  "HVAC Service",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Other"
];

// Utility options
const utilityOptions = [
  "Electric",
  "Gas",
  "Water",
  "Sewer",
  "Trash",
  "Internet",
  "Cable/TV",
  "Phone",
  "Other"
];

// Schema for service provider form
const serviceProviderSchema = z.object({
  type: z.enum(providerTypes),
  category: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Name is required"),
  contact_name: z.string().optional(),
  contact_email: z.string().email("Invalid email").optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  notes: z.string().optional(),
});

type ServiceProviderFormValues = z.infer<typeof serviceProviderSchema>;

export function PropertyServiceProviders({ propertyId }: PropertyServiceProvidersProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<PropertyServiceProvider | null>(null);
  const { data: providers, isLoading } = useGetPropertyServiceProviders(propertyId);
  const addProvider = useAddPropertyServiceProvider();
  const updateProvider = useUpdatePropertyServiceProvider();
  const deleteProvider = useDeletePropertyServiceProvider();
  const { toast } = useToast();

  const form = useForm<ServiceProviderFormValues>({
    resolver: zodResolver(serviceProviderSchema),
    defaultValues: {
      type: "responsibility",
      category: "",
      name: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      website: "",
      notes: "",
    }
  });

  const watchType = form.watch("type");

  const openAddDialog = (type: (typeof providerTypes)[number]) => {
    setEditingProvider(null);
    form.reset({
      type,
      category: "",
      name: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      website: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (provider: PropertyServiceProvider) => {
    setEditingProvider(provider);
    form.reset({
      type: provider.type as (typeof providerTypes)[number],
      category: provider.category,
      name: provider.name,
      contact_name: provider.contact_name || "",
      contact_email: provider.contact_email || "",
      contact_phone: provider.contact_phone || "",
      website: provider.website || "",
      notes: provider.notes || "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: ServiceProviderFormValues) => {
    try {
      if (editingProvider) {
        await updateProvider.mutateAsync({
          providerId: editingProvider.id,
          provider: data
        });
        
        toast({
          title: "Service provider updated",
          description: "Service provider has been updated successfully",
        });
      } else {
        await addProvider.mutateAsync({
          propertyId,
          provider: data
        });
        
        toast({
          title: "Service provider added",
          description: "Service provider has been added successfully",
        });
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: editingProvider ? "Error updating service provider" : "Error adding service provider",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (providerId: string) => {
    try {
      await deleteProvider.mutateAsync(providerId);
      toast({
        title: "Service provider deleted",
        description: "The service provider has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error deleting service provider",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const renderProvidersByType = (type: (typeof providerTypes)[number]) => {
    const typeProviders = providers?.filter(provider => provider.type === type) || [];
    const typeLabel = type === "responsibility" ? "Responsibilities" : "Utilities";
    const emptyMessage = type === "responsibility" ? "No responsibilities assigned" : "No utilities added";
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">{typeLabel}</h3>
          <Button variant="outline" size="sm" onClick={() => openAddDialog(type)}>
            <i className="ri-add-line mr-1" />
            Add {type === "responsibility" ? "Responsibility" : "Utility"}
          </Button>
        </div>
        
        {typeProviders.length > 0 ? (
          <div className="space-y-3">
            {typeProviders.map((provider) => (
              <div 
                key={provider.id} 
                className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-medium">{provider.name}</h4>
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {provider.category}
                      </span>
                    </div>
                    {(provider.contact_name || provider.contact_email || provider.contact_phone) && (
                      <div className="mt-2 text-sm">
                        {provider.contact_name && <p>{provider.contact_name}</p>}
                        <div className="flex space-x-4">
                          {provider.contact_email && (
                            <p className="text-gray-500 dark:text-gray-400">
                              <i className="ri-mail-line mr-1" />
                              {provider.contact_email}
                            </p>
                          )}
                          {provider.contact_phone && (
                            <p className="text-gray-500 dark:text-gray-400">
                              <i className="ri-phone-line mr-1" />
                              {provider.contact_phone}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {provider.website && (
                      <p className="text-sm text-blue-500 mt-1">
                        <a href={provider.website} target="_blank" rel="noopener noreferrer">
                          <i className="ri-global-line mr-1" />
                          Website
                        </a>
                      </p>
                    )}
                    {provider.notes && (
                      <p className="text-sm mt-2">{provider.notes}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => openEditDialog(provider)}
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
                            This will permanently delete this service provider. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(provider.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            {deleteProvider.isPending ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {emptyMessage}
            </p>
            <Button variant="outline" onClick={() => openAddDialog(type)}>
              <i className="ri-add-line mr-1" />
              Add {type === "responsibility" ? "Responsibility" : "Utility"}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Manage service providers and utilities for this property.
      </p>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Responsibilities */}
          <div>
            {renderProvidersByType("responsibility")}
          </div>
          
          {/* Utilities */}
          <div>
            {renderProvidersByType("utility")}
          </div>
        </div>
      )}

      {/* Service Provider Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProvider 
                ? `Edit ${editingProvider.type === "responsibility" ? "Responsibility" : "Utility"}` 
                : `Add ${watchType === "responsibility" ? "Responsibility" : "Utility"}`}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="responsibility">Responsibility</SelectItem>
                        <SelectItem value="utility">Utility</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {watchType === "responsibility" 
                          ? responsibilityOptions.map(option => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))
                          : utilityOptions.map(option => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Provider name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact person" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes" 
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
                  disabled={addProvider.isPending || updateProvider.isPending}
                >
                  {(addProvider.isPending || updateProvider.isPending) 
                    ? "Saving..." 
                    : (editingProvider ? "Update" : "Add")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
