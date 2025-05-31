"use client";

import { supabase } from "@/lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

export interface PropertyPhoto {
  id: string;
  property_id: string;
  url: string;
  created_at: string;
}

// Get all photos for a property
export function useGetPropertyPhotos(propertyId: string) {
  return useQuery({
    queryKey: ["property-photos", propertyId],
    queryFn: async (): Promise<PropertyPhoto[]> => {
      const { data, error } = await supabase
        .from("property_photos")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!propertyId,
  });
}

// Upload a photo for a property
export function useUploadPropertyPhoto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      propertyId,
      file
    }: {
      propertyId: string;
      file: File
    }) => {
      try {
        // 1. Upload the file to storage
        const timestamp = Date.now();
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `${timestamp}-${cleanFileName}`;
        
        // Store files with a simpler path structure
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from("image_url")
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Error uploading file: ${uploadError.message}`);
        }

        // 2. Get the public URL using Supabase's getPublicUrl
        const { data: { publicUrl } } = supabase.storage
          .from("image_url")
          .getPublicUrl(filePath);

        if (!publicUrl) {
          throw new Error('Failed to get public URL for uploaded file');
        }

        // 3. Insert the record in the database
        const { data, error } = await supabase
          .from("property_photos")
          .insert([
            {
              property_id: propertyId,
              url: publicUrl,
              storage_path: filePath
            }
          ])
          .select()
          .single();

        if (error) {
          // If there was an error inserting the record, try to delete the uploaded file
          await supabase.storage
            .from("image_url")
            .remove([filePath]);

          throw new Error(`Error saving photo record: ${error.message}`);
        }

        return data;
      } catch (error) {
        // Make sure to clean up the file if anything goes wrong
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('An unexpected error occurred');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["property-photos", variables.propertyId]
      });
    },
    onError: (error) => {
      toast({
        title: "Error uploading photo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Delete a property photo
export function useDeletePropertyPhoto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (photoId: string) => {
      // 1. Get the photo record to get the storage path
      const { data: photo, error: getError } = await supabase
        .from("property_photos")
        .select("*")
        .eq("id", photoId)
        .single();

      if (getError) {
        throw new Error(`Error getting photo: ${getError.message}`);
      }

      // 2. Delete the file from storage if storage_path exists
      if (photo.storage_path) {
        const { error: storageError } = await supabase.storage
          .from("image_url")
          .remove([photo.storage_path]);

        if (storageError) {
          console.error(`Error deleting file from storage: ${storageError.message}`);
          // Continue anyway to delete the database record
        }
      }

      // 3. Delete the record from the database
      const { error } = await supabase
        .from("property_photos")
        .delete()
        .eq("id", photoId);

      if (error) {
        throw new Error(`Error deleting photo: ${error.message}`);
      }

      return photoId;
    },
    onSuccess: (_, variables) => {
      // Get the property_id from the cache to invalidate the query
      const propertyPhotos = queryClient.getQueryData<PropertyPhoto[]>(["property-photos"]);
      const photo = propertyPhotos?.find(p => p.id === variables);

      if (photo) {
        queryClient.invalidateQueries({
          queryKey: ["property-photos", photo.property_id]
        });
      } else {
        // If we can't find the property_id, invalidate all property-photos queries
        queryClient.invalidateQueries({
          queryKey: ["property-photos"]
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error deleting photo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
