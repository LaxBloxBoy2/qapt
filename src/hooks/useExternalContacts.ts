import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  ExternalContact,
  CreateExternalContactData,
  UpdateExternalContactData,
  ExternalContactFilters,
  ContactStatus
} from "@/types/external-contacts";

// Fetch all external contacts with optional filters
export const useExternalContacts = (filters?: ExternalContactFilters) => {
  return useQuery({
    queryKey: ["external-contacts", filters],
    queryFn: async (): Promise<ExternalContact[]> => {
      try {
        let query = supabase
          .from("external_contacts")
          .select("*")
          .order("company_name", { ascending: true });

        // Apply filters
        if (filters?.type) {
          query = query.eq("type", filters.type);
        }
        if (filters?.category) {
          query = query.eq("category", filters.category);
        }
        if (filters?.status) {
          query = query.eq("status", filters.status);
        }
        if (filters?.emergency_contact !== undefined) {
          query = query.eq("emergency_contact", filters.emergency_contact);
        }
        if (filters?.rating) {
          query = query.eq("rating", filters.rating);
        }
        if (filters?.search) {
          query = query.or(`company_name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        return data || [];
      } catch (error) {
        // Fallback to service_providers if external_contacts doesn't exist
        console.log("external_contacts table doesn't exist, falling back to service_providers");

        const { data: serviceProviders, error: spError } = await supabase
          .from("service_providers")
          .select("*")
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (spError) {
          console.error("Error fetching service providers:", spError);
          throw spError;
        }

        // Map service providers to external contact format
        return (serviceProviders || []).map(sp => ({
          id: sp.id,
          company_name: sp.name,
          contact_person: sp.contact_person || '',
          type: 'service_provider' as const,
          category: sp.category || '',
          email: sp.email,
          phone: sp.phone,
          services_offered: sp.specialties || [],
          status: (sp.is_active ? 'active' : 'inactive') as ContactStatus,
          rating: sp.rating,
          emergency_contact: sp.emergency_contact || false,
          created_at: sp.created_at,
          updated_at: sp.updated_at
        }));
      }
    },
  });
};

// Fetch single external contact by ID
export const useExternalContact = (id: string) => {
  return useQuery({
    queryKey: ["external-contact", id],
    queryFn: async (): Promise<ExternalContact | null> => {
      const { data, error } = await supabase
        .from("external_contacts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching external contact:", error);
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });
};

// Create new external contact
export const useCreateExternalContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExternalContactData): Promise<ExternalContact> => {
      const { data: { user } } = await supabase.auth.getUser();

      const contactData = {
        ...data,
        created_by: user?.id,
        status: data.status || 'active',
        emergency_contact: data.emergency_contact || false,
        country: data.country || 'United States'
      };

      const { data: newContact, error } = await supabase
        .from("external_contacts")
        .insert([contactData])
        .select()
        .single();

      if (error) {
        console.error("Error creating external contact:", error);
        throw error;
      }

      return newContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-contacts"] });
    },
  });
};

// Update external contact
export const useUpdateExternalContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateExternalContactData): Promise<ExternalContact> => {
      const { id, ...updateData } = data;

      // Update service_providers table directly
      const result = await supabase
        .from("service_providers")
        .update({
          name: updateData.company_name,
          email: updateData.email,
          phone: updateData.phone,
          specialties: updateData.services_offered,
          is_active: updateData.status === 'active',
          hourly_rate: updateData.hourly_rate
        })
        .eq("id", id)
        .select()
        .single();

      if (result.error) {
        console.error("Error updating service provider:", result.error);
        throw result.error;
      }

      // Map back to external contact format
      const updatedContact = {
        id: result.data.id,
        company_name: result.data.name,
        contact_person: '',
        type: 'service_provider' as const,
        category: result.data.specialties?.[0] || '',
        email: result.data.email,
        phone: result.data.phone,
        services_offered: result.data.specialties || [],
        status: (result.data.is_active ? 'active' : 'inactive') as ContactStatus,
        rating: result.data.rating || 0,
        emergency_contact: false,
        created_at: result.data.created_at,
        updated_at: result.data.updated_at,
        hourly_rate: result.data.hourly_rate
      };

      return updatedContact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["service-providers"] });
      queryClient.invalidateQueries({ queryKey: ["external-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["assignees"] });
    },
  });
};

// Delete external contact
export const useDeleteExternalContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from("external_contacts")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting external contact:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-contacts"] });
    },
  });
};

// Get emergency contacts only
export const useEmergencyContacts = () => {
  return useQuery({
    queryKey: ["emergency-contacts"],
    queryFn: async (): Promise<ExternalContact[]> => {
      const { data, error } = await supabase
        .from("external_contacts")
        .select("*")
        .eq("emergency_contact", true)
        .eq("status", "active")
        .order("company_name", { ascending: true });

      if (error) {
        console.error("Error fetching emergency contacts:", error);
        throw error;
      }

      return data || [];
    },
  });
};

// Get contacts by category
export const useContactsByCategory = (category: string) => {
  return useQuery({
    queryKey: ["contacts-by-category", category],
    queryFn: async (): Promise<ExternalContact[]> => {
      const { data, error } = await supabase
        .from("external_contacts")
        .select("*")
        .eq("category", category)
        .eq("status", "active")
        .order("rating", { ascending: false })
        .order("company_name", { ascending: true });

      if (error) {
        console.error("Error fetching contacts by category:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!category,
  });
};

// Get contact statistics
export const useContactStats = () => {
  return useQuery({
    queryKey: ["contact-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_contacts")
        .select("type, status, emergency_contact, rating");

      if (error) {
        console.error("Error fetching contact stats:", error);
        throw error;
      }

      const stats = {
        total: data?.length || 0,
        active: data?.filter(c => c.status === 'active').length || 0,
        emergency: data?.filter(c => c.emergency_contact).length || 0,
        byType: {} as Record<string, number>,
        avgRating: 0
      };

      // Calculate stats
      data?.forEach(contact => {
        stats.byType[contact.type] = (stats.byType[contact.type] || 0) + 1;
      });

      const ratingsSum = data?.reduce((sum, contact) => sum + (contact.rating || 0), 0) || 0;
      const ratingsCount = data?.filter(contact => contact.rating).length || 0;
      stats.avgRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

      return stats;
    },
  });
};

// Update last contacted date
export const useUpdateLastContacted = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from("external_contacts")
        .update({ last_contacted: new Date().toISOString().split('T')[0] })
        .eq("id", id);

      if (error) {
        console.error("Error updating last contacted:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-contacts"] });
    },
  });
};
