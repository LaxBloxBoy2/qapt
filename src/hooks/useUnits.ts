"use client";

import { supabase } from "@/lib/supabase";
import { Unit, UnitCreateInput, UnitUpdateInput } from "@/types/unit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

// Get all units for the current user
export function useGetUnits() {
  return useQuery({
    queryKey: ["units"],
    queryFn: async (): Promise<Unit[]> => {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
  });
}

// Get all units for a specific property
export function useGetPropertyUnits(propertyId: string) {
  return useQuery({
    queryKey: ["property-units", propertyId],
    queryFn: async (): Promise<Unit[]> => {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("property_id", propertyId)
        .order("name", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!propertyId,
  });
}

// Get a single unit by ID
export function useGetUnit(id: string) {
  return useQuery({
    queryKey: ["units", id],
    queryFn: async (): Promise<Unit> => {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!id,
  });
}

// Create a new unit
export function useCreateUnit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (unit: UnitCreateInput) => {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to create a unit");
      }

      // Create a new object with only the fields we need
      // This ensures we don't send any extra fields that might cause issues
      // Always use 'vacant' for new units
      const unitWithUserId = {
        name: unit.name,
        property_id: unit.property_id,
        unit_type: unit.unit_type,
        status: "vacant", // Hardcoded to vacant for new units
        description: unit.description,
        beds: unit.beds,
        baths: unit.baths,
        size: unit.size,
        market_rent: unit.market_rent,
        deposit: unit.deposit,
        image_url: unit.image_url,
        user_id: user.id
      };

      console.log("Inserting unit with data:", unitWithUserId); // Log the data being sent

      const { data, error } = await supabase
        .from("units")
        .insert([unitWithUserId])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["property-units", data.property_id] });
      toast({
        title: "Unit created",
        description: "Your unit has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating unit",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Update an existing unit
export function useUpdateUnit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      unit,
    }: {
      id: string;
      unit: UnitUpdateInput;
    }) => {
      const { data, error } = await supabase
        .from("units")
        .update(unit)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["units", data.id] });
      queryClient.invalidateQueries({ queryKey: ["property-units", data.property_id] });
      toast({
        title: "Unit updated",
        description: "Your unit has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating unit",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Delete a unit
export function useDeleteUnit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get the unit first to get the property_id
      const { data: unit, error: getError } = await supabase
        .from("units")
        .select("property_id")
        .eq("id", id)
        .single();

      if (getError) {
        throw new Error(getError.message);
      }

      const propertyId = unit.property_id;

      // Delete the unit
      const { error } = await supabase.from("units").delete().eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      return { id, propertyId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["property-units", result.propertyId] });
      toast({
        title: "Unit deleted",
        description: "Your unit has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting unit",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Get units grouped by property
export function useGetUnitsGroupedByProperty() {
  const { data: units, isLoading, isError, error } = useGetUnits();
  const { data: properties, isLoading: isPropertiesLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
  });

  // Group units by property
  const groupedUnits = units && properties ? properties.map(property => ({
    property,
    units: units.filter(unit => unit.property_id === property.id)
  })).filter(group => group.units.length > 0) : [];

  return {
    groupedUnits,
    isLoading: isLoading || isPropertiesLoading,
    isError,
    error
  };
}
