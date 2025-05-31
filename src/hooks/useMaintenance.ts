import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  MaintenanceRequest,
  MaintenanceSummary,
  MaintenanceFilters,
  CreateMaintenanceRequest,
  UpdateMaintenanceRequest,
  MaintenanceComment,
  Assignee,
} from "@/types/maintenance";

// Fetch maintenance requests with filters
export function useMaintenanceRequests(filters?: MaintenanceFilters) {
  return useQuery({
    queryKey: ["maintenance-requests", filters],
    queryFn: async (): Promise<MaintenanceRequest[]> => {
      try {
        // Ensure sample data exists
        await ensureSampleData();

        // Use basic query for now (joins will be added when relationships are set up)
        let query = supabase
          .from("maintenance_requests")
          .select("*");

        // Apply filters
        if (filters?.status) {
          query = query.eq("status", filters.status);
        }

        if (filters?.priority) {
          query = query.eq("priority", filters.priority);
        }

        if (filters?.type) {
          query = query.eq("type", filters.type);
        }

        if (filters?.property_id) {
          query = query.eq("property_id", filters.property_id);
        }

        if (filters?.unit_id) {
          query = query.eq("unit_id", filters.unit_id);
        }

        if (filters?.assigned_to_id) {
          query = query.eq("assigned_to_id", filters.assigned_to_id);
        }

        if (filters?.requested_by_id) {
          query = query.eq("requested_by_id", filters.requested_by_id);
        }

        if (filters?.date_from) {
          query = query.gte("created_at", filters.date_from);
        }

        if (filters?.date_to) {
          query = query.lte("created_at", filters.date_to);
        }

        // Order by created_at descending
        query = query.order("created_at", { ascending: false });

        const { data, error } = await query;

        if (error) {
          throw new Error(error.message);
        }

        // Transform the data to match our interface
        const requests: MaintenanceRequest[] = (data || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          status: item.status,
          priority: item.priority,
          type: item.type,
          property_id: item.property_id,
          unit_id: item.unit_id,
          requested_by_id: item.requested_by_id,
          assigned_to_id: item.assigned_to_id,
          created_at: item.created_at,
          updated_at: item.updated_at,
          due_date: item.due_date,
          resolved_at: item.resolved_at,
          estimated_cost: item.estimated_cost,
          actual_cost: item.actual_cost,
          tags: item.tags,
          resolution_notes: item.resolution_notes,
          // Add placeholder data for related entities
          property: item.property_id ? {
            id: item.property_id,
            name: 'Property',
            address: 'Address not loaded'
          } : undefined,
          unit: item.unit_id ? {
            id: item.unit_id,
            name: 'Unit'
          } : undefined,
          requested_by: item.requested_by_id ? {
            id: item.requested_by_id,
            first_name: 'Tenant',
            last_name: '',
            email: '',
            phone: ''
          } : undefined,
          assigned_to: item.assigned_to_id ? {
            id: item.assigned_to_id,
            name: 'Assignee',
            type: item.assigned_to_type || 'internal',
            email: '',
            phone: ''
          } : undefined
        }));

        // Apply search filter (client-side for complex search)
        let filteredRequests = requests;
        if (filters?.search) {
          const search = filters.search.toLowerCase();
          filteredRequests = requests.filter(req =>
            req.title.toLowerCase().includes(search) ||
            req.description.toLowerCase().includes(search) ||
            req.id.toLowerCase().includes(search) ||
            req.status.toLowerCase().includes(search) ||
            req.priority.toLowerCase().includes(search) ||
            req.type.toLowerCase().includes(search)
          );
        }

        return filteredRequests;

      } catch (error) {
        console.error("Error fetching maintenance requests:", error);
        throw error;
      }
    },
  });
}

// Fetch maintenance summary
export function useMaintenanceSummary() {
  return useQuery({
    queryKey: ["maintenance-summary"],
    queryFn: async (): Promise<MaintenanceSummary> => {
      try {
        // Get all maintenance requests
        const { data: allRequests, error } = await supabase
          .from("maintenance_requests")
          .select("status, created_at, resolved_at, due_date");

        if (error) {
          throw new Error(error.message);
        }

        const requests = allRequests || [];
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Calculate summary statistics
        const total_requests = requests.length;
        const open_requests = requests.filter(r => r.status === 'open').length;
        const in_progress_requests = requests.filter(r => r.status === 'in_progress').length;

        // Resolved this month
        const resolved_this_month = requests.filter(r =>
          r.status === 'resolved' &&
          r.resolved_at &&
          new Date(r.resolved_at) >= startOfMonth
        ).length;

        // Overdue requests (past due date and not resolved)
        const overdue_requests = requests.filter(r =>
          r.due_date &&
          new Date(r.due_date) < now &&
          r.status !== 'resolved'
        ).length;

        // Calculate average resolution time
        const resolvedRequests = requests.filter(r => r.status === 'resolved' && r.resolved_at);
        let avg_resolution_time = 0;

        if (resolvedRequests.length > 0) {
          const totalDays = resolvedRequests.reduce((sum, r) => {
            const created = new Date(r.created_at);
            const resolved = new Date(r.resolved_at!);
            const days = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0);
          avg_resolution_time = totalDays / resolvedRequests.length;
        }

        return {
          total_requests,
          open_requests,
          in_progress_requests,
          resolved_this_month,
          overdue_requests,
          avg_resolution_time
        };

      } catch (error) {
        console.error("Error fetching maintenance summary:", error);
        throw error;
      }
    },
  });
}

// Fetch single maintenance request
export function useMaintenanceRequest(id: string) {
  return useQuery({
    queryKey: ["maintenance-request", id],
    queryFn: async (): Promise<MaintenanceRequest | null> => {
      try {
        // Use basic query without joins for now
        const { data, error } = await supabase
          .from("maintenance_requests")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          throw new Error(error.message);
        }

        // Fetch related data separately since joins aren't working
        let property, unit, tenant, assignee;

        // Fetch property data
        if (data.property_id) {
          const { data: propertyData } = await supabase
            .from("properties")
            .select("id, name, address")
            .eq("id", data.property_id)
            .single();
          property = propertyData;
        }

        // Fetch unit data
        if (data.unit_id) {
          const { data: unitData } = await supabase
            .from("units")
            .select("id, name")
            .eq("id", data.unit_id)
            .single();
          unit = unitData;
        }

        // Fetch tenant data
        if (data.requested_by_id) {
          const { data: tenantData } = await supabase
            .from("tenants")
            .select("id, first_name, last_name, email, phone")
            .eq("id", data.requested_by_id)
            .single();
          tenant = tenantData;
        }

        // Fetch assignee data
        if (data.assigned_to_id && data.assigned_to_type) {
          if (data.assigned_to_type === 'internal') {
            const { data: teamData } = await supabase
              .from("team_members")
              .select("id, name, email, phone, role")
              .eq("id", data.assigned_to_id)
              .single();
            if (teamData) {
              assignee = {
                ...teamData,
                type: 'internal' as const
              };
            }
          } else {
            const { data: vendorData } = await supabase
              .from("service_providers")
              .select("id, name, email, phone, specialties")
              .eq("id", data.assigned_to_id)
              .single();
            if (vendorData) {
              assignee = {
                ...vendorData,
                type: 'external' as const
              };
            }
          }
        }

        // Transform the data to match our MaintenanceRequest type
        const request: MaintenanceRequest = {
          ...data,
          property,
          unit,
          requested_by: tenant,
          assigned_to: assignee,
          comments: [],
          attachments: [],
          status_history: []
        };

        return request;
      } catch (error) {
        console.error("Error fetching maintenance request:", error);
        throw error;
      }
    },
    enabled: !!id,
  });
}

// Create maintenance request
export function useCreateMaintenanceRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: CreateMaintenanceRequest) => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .insert([{
          title: request.title,
          description: request.description,
          property_id: request.property_id,
          unit_id: request.unit_id,
          type: request.type,
          priority: request.priority,
          requested_by_id: request.requested_by_id,
          assigned_to_id: request.assigned_to_id,
          assigned_to_type: request.assigned_to_id ?
            (request.assigned_to_id.startsWith('team_') ? 'internal' : 'external') : null,
          due_date: request.due_date,
          estimated_cost: request.estimated_cost,
          tags: request.tags,
          status: 'open'
        }])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Create status history entry
      await supabase
        .from("maintenance_status_history")
        .insert([{
          request_id: data.id,
          to_status: 'open',
          changed_by_id: request.requested_by_id,
          changed_by_type: 'tenant',
          notes: 'Request created'
        }]);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-summary"] });
      toast({
        title: "Request Created",
        description: "Maintenance request has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create request: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Update maintenance request
export function useUpdateMaintenanceRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateMaintenanceRequest }) => {
      // Get current request for status history
      const { data: currentRequest } = await supabase
        .from("maintenance_requests")
        .select("status")
        .eq("id", id)
        .single();

      // Update the request
      const { data, error } = await supabase
        .from("maintenance_requests")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          // Set resolved_at if status is being changed to resolved
          ...(updates.status === 'resolved' && { resolved_at: new Date().toISOString() })
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Create status history entry if status changed
      if (updates.status && currentRequest && updates.status !== currentRequest.status) {
        await supabase
          .from("maintenance_status_history")
          .insert([{
            request_id: id,
            from_status: currentRequest.status,
            to_status: updates.status,
            changed_by_id: 'system', // In real app, get from auth context
            changed_by_type: 'team',
            notes: `Status changed from ${currentRequest.status} to ${updates.status}`
          }]);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all maintenance-related queries
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-summary"] });
      // Invalidate the specific request query to update the UI immediately
      queryClient.invalidateQueries({ queryKey: ["maintenance-request", variables.id] });
      // Invalidate status history if status was changed
      if (variables.updates.status) {
        queryClient.invalidateQueries({ queryKey: ["maintenance-status-history", variables.id] });
      }
      toast({
        title: "Request Updated",
        description: "Maintenance request has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update request: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Delete maintenance request
export function useDeleteMaintenanceRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("maintenance_requests")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-summary"] });
      toast({
        title: "Request Deleted",
        description: "Maintenance request has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete request: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Get available assignees
export function useAssignees() {
  return useQuery({
    queryKey: ["assignees"],
    queryFn: async (): Promise<Assignee[]> => {
      try {
        // Fetch team members
        const { data: teamMembers, error: teamError } = await supabase
          .from("team_members")
          .select("*")
          .eq("is_active", true);

        if (teamError) {
          console.error("Error fetching team members:", teamError);
        }

        // Try to fetch external contacts first, fall back to service providers if table doesn't exist
        let externalContacts = null;
        let serviceProviders = null;

        const { data: externalContactsData, error: contactsError } = await supabase
          .from("external_contacts")
          .select("*")
          .eq("status", "active")
          .in("type", ["contractor", "service_provider"]);

        if (contactsError) {
          console.error("Error fetching external contacts (table may not exist):", contactsError);
          // Fall back to legacy service providers
          const { data: serviceProvidersData, error: providerError } = await supabase
            .from("service_providers")
            .select("*")
            .eq("is_active", true);

          if (providerError) {
            console.error("Error fetching service providers:", providerError);
          } else {
            serviceProviders = serviceProvidersData;
          }
        } else {
          externalContacts = externalContactsData;
        }

        const assignees: Assignee[] = [];

        // Add team members
        if (teamMembers) {
          assignees.push(...teamMembers.map(member => ({
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            type: 'internal' as const
          })));
        }

        // Add external contacts or service providers
        if (externalContacts) {
          console.log('External contacts found:', externalContacts.length, externalContacts);
          assignees.push(...externalContacts.map(contact => ({
            id: contact.id,
            name: contact.company_name,
            email: contact.email,
            phone: contact.phone,
            specialties: contact.services_offered || [],
            type: 'external' as const
          })));
        } else if (serviceProviders) {
          console.log('Service providers found:', serviceProviders.length, serviceProviders);
          assignees.push(...serviceProviders.map(provider => ({
            id: provider.id,
            name: provider.name,
            email: provider.email,
            phone: provider.phone,
            specialties: provider.specialties || [],
            type: 'external' as const
          })));
        } else {
          console.log('No external contacts or service providers found');
        }

        return assignees;

      } catch (error) {
        console.error("Error fetching assignees:", error);
        throw error;
      }
    },
  });
}

// Fetch maintenance comments
export function useMaintenanceComments(requestId: string) {
  return useQuery({
    queryKey: ["maintenance-comments", requestId],
    queryFn: async (): Promise<MaintenanceComment[]> => {
      try {
        console.log('Fetching comments for request:', requestId);

        const { data, error } = await supabase
          .from("maintenance_comments")
          .select("*")
          .eq("request_id", requestId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error('Comments fetch error:', error);
          throw new Error(error.message);
        }

        console.log('Comments fetched:', data?.length || 0, 'items');
        return data || [];
      } catch (error) {
        console.error("Error fetching maintenance comments:", error);
        throw error;
      }
    },
    enabled: !!requestId,
  });
}

// Create maintenance comment
export function useCreateMaintenanceComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ requestId, content, isInternal }: { requestId: string; content: string; isInternal: boolean }) => {
      console.log('Creating comment:', { requestId, content, isInternal });

      const { data, error } = await supabase
        .from("maintenance_comments")
        .insert([{
          request_id: requestId,
          user_id: '00000000-0000-0000-0000-000000000000', // Use a valid UUID
          user_type: 'team',
          content,
          is_internal: isInternal
        }])
        .select()
        .single();

      if (error) {
        console.error('Comment creation error:', error);
        throw new Error(error.message);
      }

      console.log('Comment created successfully:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-comments", variables.requestId] });
      toast({
        title: "Comment Added",
        description: "Your comment has been posted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to post comment: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteMaintenanceAttachment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ attachmentId, filePath }: { attachmentId: string; filePath: string }) => {
      console.log('Deleting attachment:', { attachmentId, filePath });

      // 1. Delete from database first
      const { error: dbError } = await supabase
        .from("maintenance_attachments")
        .delete()
        .eq("id", attachmentId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        throw new Error(dbError.message);
      }

      // 2. Delete from storage
      // Extract the file path from the URL
      const urlParts = filePath.split('/');
      const bucketPath = urlParts.slice(-2).join('/'); // Get the last 2 parts: requestId/filename.ext

      const { error: storageError } = await supabase.storage
        .from('image_url')
        .remove([bucketPath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Don't throw here as the database record is already deleted
      }

      console.log('Attachment deleted successfully');
      return { success: true };
    },
    onSuccess: (_, variables) => {
      // Get the request ID from the file path
      const requestId = variables.filePath.split('/')[variables.filePath.split('/').length - 2];
      queryClient.invalidateQueries({ queryKey: ["maintenance-attachments", requestId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-media", requestId] });
      toast({
        title: "Attachment Deleted",
        description: "Attachment has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: `Failed to delete attachment: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Fetch maintenance attachments
export function useMaintenanceAttachments(requestId: string) {
  return useQuery({
    queryKey: ["maintenance-attachments", requestId],
    queryFn: async (): Promise<MaintenanceAttachment[]> => {
      try {
        console.log('Fetching attachments for request:', requestId);

        const { data, error } = await supabase
          .from("maintenance_attachments")
          .select("*")
          .eq("request_id", requestId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error('Attachments fetch error:', error);
          throw new Error(error.message);
        }

        console.log('Attachments fetched:', data?.length || 0, 'items');
        return data || [];
      } catch (error) {
        console.error("Error fetching maintenance attachments:", error);
        throw error;
      }
    },
    enabled: !!requestId,
  });
}

// Upload maintenance attachment
export function useUploadMaintenanceAttachment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ requestId, file, name }: { requestId: string; file: File; name?: string }) => {
      console.log('Uploading file:', { requestId, fileName: file.name, fileSize: file.size });

      // 1. Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${requestId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('image_url')
        .upload(fileName, file);

      if (uploadError) {
        console.error('File upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('image_url')
        .getPublicUrl(fileName);

      console.log('File uploaded, inserting database record...');

      // 3. Insert record in database
      const { data, error } = await supabase
        .from("maintenance_attachments")
        .insert([{
          request_id: requestId,
          name: name || file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by_id: '00000000-0000-0000-0000-000000000000', // Use valid UUID
          uploaded_by_type: 'team'
        }])
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('image_url')
          .remove([fileName]);

        throw new Error(error.message);
      }

      console.log('Attachment created successfully:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-attachments", variables.requestId] });
      toast({
        title: "File Uploaded",
        description: "Attachment has been uploaded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: `Failed to upload file: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Fetch maintenance status history
export function useMaintenanceStatusHistory(requestId: string) {
  return useQuery({
    queryKey: ["maintenance-status-history", requestId],
    queryFn: async (): Promise<MaintenanceStatusHistory[]> => {
      try {
        console.log('Fetching status history for request:', requestId);

        const { data, error } = await supabase
          .from("maintenance_status_history")
          .select("*")
          .eq("request_id", requestId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error('Status history fetch error:', error);
          throw new Error(error.message);
        }

        console.log('Status history fetched:', data?.length || 0, 'items');
        return data || [];
      } catch (error) {
        console.error("Error fetching maintenance status history:", error);
        throw error;
      }
    },
    enabled: !!requestId,
  });
}

// Maintenance Media hooks
export function useMaintenanceMedia(requestId: string) {
  return useQuery({
    queryKey: ["maintenance-media", requestId],
    queryFn: async () => {
      console.log('Fetching media for request:', requestId);

      const { data, error } = await supabase
        .from("maintenance_attachments")
        .select("*")
        .eq("request_id", requestId)
        .in("file_type", ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm", "audio/mp3", "audio/wav"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Media fetch error:', error);
        throw new Error(error.message);
      }

      console.log('Media fetched:', data?.length || 0, 'items');
      return data || [];
    },
    enabled: !!requestId,
  });
}

export function useUploadMaintenanceMedia() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ requestId, file, name }: { requestId: string; file: File; name?: string }) => {
      console.log('Uploading media:', { requestId, fileName: file.name, fileType: file.type });

      const fileExt = file.name.split('.').pop();
      const fileName = `${requestId}/media/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('image_url')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Media upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('image_url')
        .getPublicUrl(fileName);

      const { data, error } = await supabase
        .from("maintenance_attachments")
        .insert([{
          request_id: requestId,
          name: name || file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by_id: '00000000-0000-0000-0000-000000000000',
          uploaded_by_type: 'team'
        }])
        .select()
        .single();

      if (error) {
        console.error('Media database insert error:', error);
        await supabase.storage.from('image_url').remove([fileName]);
        throw new Error(error.message);
      }

      console.log('Media uploaded successfully:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-media", variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-attachments", variables.requestId] });
      toast({
        title: "Media Uploaded",
        description: "Media file has been uploaded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: `Failed to upload media: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteMaintenanceMedia() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ attachmentId, filePath }: { attachmentId: string; filePath: string }) => {
      console.log('Deleting media:', { attachmentId, filePath });

      // 1. Delete from database first
      const { error: dbError } = await supabase
        .from("maintenance_attachments")
        .delete()
        .eq("id", attachmentId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        throw new Error(dbError.message);
      }

      // 2. Delete from storage
      // Extract the file path from the URL
      const urlParts = filePath.split('/');
      const bucketPath = urlParts.slice(-3).join('/'); // Get the last 3 parts: requestId/media/filename.ext

      const { error: storageError } = await supabase.storage
        .from('image_url')
        .remove([bucketPath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Don't throw here as the database record is already deleted
      }

      console.log('Media deleted successfully');
      return { success: true };
    },
    onSuccess: (_, variables) => {
      // Get the request ID from the file path or pass it separately
      const requestId = variables.filePath.split('/')[variables.filePath.split('/').length - 3];
      queryClient.invalidateQueries({ queryKey: ["maintenance-media", requestId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-attachments", requestId] });
      toast({
        title: "Media Deleted",
        description: "Media file has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: `Failed to delete media: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Maintenance Materials hooks
export function useMaintenanceMaterials(requestId: string) {
  return useQuery({
    queryKey: ["maintenance-materials", requestId],
    queryFn: async () => {
      console.log('Fetching materials for request:', requestId);

      // For now, use a simple JSON field in maintenance_requests
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("materials")
        .eq("id", requestId)
        .single();

      if (error) {
        console.error('Materials fetch error:', error);
        throw new Error(error.message);
      }

      console.log('Materials fetched:', data?.materials?.length || 0, 'items');
      return data?.materials || [];
    },
    enabled: !!requestId,
  });
}

export function useUpdateMaintenanceMaterials() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ requestId, materials }: { requestId: string; materials: any[] }) => {
      console.log('Updating materials for request:', requestId, materials);

      const { data, error } = await supabase
        .from("maintenance_requests")
        .update({ materials })
        .eq("id", requestId)
        .select()
        .single();

      if (error) {
        console.error('Materials update error:', error);
        throw new Error(error.message);
      }

      console.log('Materials updated successfully');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-materials", variables.requestId] });
      toast({
        title: "Materials Updated",
        description: "Materials list has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: `Failed to update materials: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Maintenance Equipment hooks
export function useMaintenanceEquipment(requestId: string) {
  return useQuery({
    queryKey: ["maintenance-equipment", requestId],
    queryFn: async () => {
      console.log('Fetching equipment for request:', requestId);

      // For now, use a simple JSON field in maintenance_requests
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("equipment")
        .eq("id", requestId)
        .single();

      if (error) {
        console.error('Equipment fetch error:', error);
        throw new Error(error.message);
      }

      console.log('Equipment fetched:', data?.equipment?.length || 0, 'items');
      return data?.equipment || [];
    },
    enabled: !!requestId,
  });
}

export function useUpdateMaintenanceEquipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ requestId, equipment }: { requestId: string; equipment: any[] }) => {
      console.log('Updating equipment for request:', requestId, equipment);

      const { data, error } = await supabase
        .from("maintenance_requests")
        .update({ equipment })
        .eq("id", requestId)
        .select()
        .single();

      if (error) {
        console.error('Equipment update error:', error);
        throw new Error(error.message);
      }

      console.log('Equipment updated successfully');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-equipment", variables.requestId] });
      toast({
        title: "Equipment Updated",
        description: "Equipment list has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: `Failed to update equipment: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Helper function to ensure sample data exists
async function ensureSampleData() {
  try {
    // Check if we have any maintenance requests
    const { data: existingRequests } = await supabase
      .from("maintenance_requests")
      .select("id")
      .limit(1);

    if (!existingRequests || existingRequests.length === 0) {
      console.log("Creating sample maintenance requests...");

      // Create sample requests
      const { error } = await supabase
        .from("maintenance_requests")
        .insert([
          {
            title: "Leaking faucet in kitchen",
            description: "The kitchen faucet has been dripping constantly for the past week. Water is pooling under the sink.",
            status: "open",
            priority: "medium",
            type: "plumbing",
            requested_by_id: "00000000-0000-0000-0000-000000000000",
            estimated_cost: 150.00,
            materials: [],
            equipment: []
          },
          {
            title: "Broken air conditioning unit",
            description: "AC unit in bedroom stopped working yesterday. It is getting very hot and uncomfortable.",
            status: "in_progress",
            priority: "high",
            type: "hvac",
            requested_by_id: "00000000-0000-0000-0000-000000000000",
            estimated_cost: 300.00,
            materials: [],
            equipment: []
          },
          {
            title: "Electrical outlet not working",
            description: "The outlet in the living room stopped working. No power to any devices plugged in.",
            status: "assigned",
            priority: "medium",
            type: "electrical",
            requested_by_id: "00000000-0000-0000-0000-000000000000",
            estimated_cost: 100.00,
            materials: [],
            equipment: []
          }
        ]);

      if (error) {
        console.error("Error creating sample data:", error);
      } else {
        console.log("Sample maintenance requests created successfully");
      }
    }
  } catch (error) {
    console.error("Error in ensureSampleData:", error);
  }
}