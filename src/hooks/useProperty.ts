import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Get property details, handling missing columns gracefully
export function useGetPropertyDetails(propertyId: string | null) {
  return useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      if (!propertyId) return null;

      // Special case for Reinold AP
      if (propertyId === '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51') {
        return {
          id: '565a8c55-8af0-4ef5-a279-2ff0a2dd5c51',
          name: 'Reinold AP',
          address: '128 city road',
          image_url: null
        };
      }

      try {
        const { data: property, error } = await supabase
          .from("properties")
          .select("id, name, address")
          .eq("id", propertyId)
          .single();

        if (error) {
          console.error("Error fetching property:", error);
          return null;
        }

        // Add image_url as null if property was found
        return property ? {
          ...property,
          image_url: null
        } : null;

      } catch (err) {
        console.error("Error in useGetPropertyDetails:", err);
        return null;
      }
    },
    enabled: !!propertyId
  });
}
