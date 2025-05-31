"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UnitSpec, unitSpecSchema, unitSpecTypes } from "@/types/unit";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface UnitSpecsProps {
  unitId: string;
}

type UnitSpecFormValues = z.infer<typeof unitSpecSchema>;

export function UnitSpecs({ unitId }: UnitSpecsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<(typeof unitSpecTypes)[number] | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch unit specs
  const { data: specs, isLoading } = useQuery({
    queryKey: ["unit-specs", unitId],
    queryFn: async (): Promise<UnitSpec[]> => {
      const { data, error } = await supabase
        .from("unit_specs")
        .select("*")
        .eq("unit_id", unitId)
        .order("type", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!unitId,
  });

  // Add spec mutation
  const addSpec = useMutation({
    mutationFn: async (spec: UnitSpecFormValues) => {
      const { data, error } = await supabase
        .from("unit_specs")
        .insert([spec])
        .select()
        .single();

      if (error) {
        throw new Error(`Error adding specification: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unit-specs", unitId] });
      toast({
        title: "Specification added",
        description: "Specification has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding specification",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete spec mutation
  const deleteSpec = useMutation({
    mutationFn: async (specId: string) => {
      const { error } = await supabase
        .from("unit_specs")
        .delete()
        .eq("id", specId);

      if (error) {
        throw new Error(`Error deleting specification: ${error.message}`);
      }

      return specId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unit-specs", unitId] });
      toast({
        title: "Specification deleted",
        description: "The specification has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting specification",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<UnitSpecFormValues>({
    resolver: zodResolver(unitSpecSchema),
    defaultValues: {
      unit_id: unitId,
      type: "keys",
      name: "",
      details: "",
      location: "",
    }
  });

  const openDialog = (type: (typeof unitSpecTypes)[number]) => {
    setSelectedType(type);
    form.reset({
      unit_id: unitId,
      type,
      name: "",
      details: "",
      location: "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: UnitSpecFormValues) => {
    try {
      await addSpec.mutateAsync(data);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleDelete = async (specId: string) => {
    try {
      await deleteSpec.mutateAsync(specId);
    } catch (error) {
      console.error("Error deleting spec:", error);
    }
  };

  const renderSpecList = (type: (typeof unitSpecTypes)[number]) => {
    const typeSpecs = specs?.filter(spec => spec.type === type) || [];
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium capitalize">{type}</h3>
          <Button variant="outline" size="sm" onClick={() => openDialog(type)}>
            <i className="ri-add-line mr-1" />
            Add {type}
          </Button>
        </div>
        
        {typeSpecs.length > 0 ? (
          <div className="space-y-3">
            {typeSpecs.map((spec) => (
              <div 
                key={spec.id} 
                className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{spec.name}</h4>
                    {spec.location && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Location: {spec.location}
                      </p>
                    )}
                    {spec.details && (
                      <p className="text-sm mt-2">{spec.details}</p>
                    )}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <i className="ri-delete-bin-line" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this specification. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(spec.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          {deleteSpec.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
            <p className="text-gray-500 dark:text-gray-400">No {type} added yet</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Manage specifications for keys, doors, flooring, and paints for this unit.
      </p>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {unitSpecTypes.map((type) => (
            <div key={type}>
              {renderSpecList(type)}
            </div>
          ))}
        </div>
      )}

      {/* Add Spec Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedType ? `Add ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}` : "Add Specification"}
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
                        {unitSpecTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
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
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder={`Enter ${form.watch("type")} name`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Front door, Master bedroom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter additional details" 
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
                  disabled={addSpec.isPending}
                >
                  {addSpec.isPending ? "Adding..." : "Add Specification"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
