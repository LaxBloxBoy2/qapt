"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useDeleteExternalContact, useUpdateLastContacted } from "@/hooks/useExternalContacts";
import { ExternalContactFilters, ContactType, ContactStatus } from "@/types/external-contacts";
import { CreateContactDialog } from "@/components/external-contacts/CreateContactDialog";
import { EditContactDialog } from "@/components/external-contacts/EditContactDialog";
import { ContactDetailsDialog } from "@/components/external-contacts/ContactDetailsDialog";
import { ExternalContact } from "@/types/external-contacts";
import { supabase } from "@/lib/supabase";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";

function ExternalContactsPage() {
  const [filters, setFilters] = useState<ExternalContactFilters>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<ExternalContact | null>(null);
  const [viewingContact, setViewingContact] = useState<ExternalContact | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Data hooks - use service providers directly
  const { data: serviceProviders, isLoading } = useQuery({
    queryKey: ["service-providers", filters, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("service_providers")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Map to external contact format
      return (data || []).map(sp => ({
        id: sp.id,
        company_name: sp.name,
        contact_person: '',
        type: 'service_provider' as const,
        category: sp.specialties?.[0] || '',
        email: sp.email,
        phone: sp.phone,
        services_offered: sp.specialties || [],
        status: (sp.is_active ? 'active' : 'inactive') as ContactStatus,
        rating: sp.rating || 0,
        emergency_contact: false,
        created_at: sp.created_at,
        updated_at: sp.updated_at,
        hourly_rate: sp.hourly_rate
      }));
    },
  });

  const contacts = serviceProviders || [];
  const deleteContact = useDeleteExternalContact();
  const updateLastContacted = useUpdateLastContacted();

  // Handle filter changes
  const handleFilterChange = (key: keyof ExternalContactFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? undefined : value
    }));
  };

  // Handle contact actions
  const handleEdit = (contact: ExternalContact) => {
    setEditingContact(contact);
  };

  const handleView = (contact: ExternalContact) => {
    setViewingContact(contact);
  };

  const handleDelete = async (contact: ExternalContact) => {
    if (window.confirm(`Are you sure you want to delete ${contact.company_name}?`)) {
      try {
        await deleteContact.mutateAsync(contact.id);
      } catch (error) {
        console.error("Error deleting contact:", error);
      }
    }
  };

  const handleContact = async (contact: ExternalContact, method: 'email' | 'phone' | 'mobile') => {
    // Update last contacted date
    await updateLastContacted.mutateAsync(contact.id);

    // Open appropriate contact method
    if (method === 'email' && contact.email) {
      window.open(`mailto:${contact.email}`);
    } else if (method === 'phone' && contact.phone) {
      window.open(`tel:${contact.phone}`);
    } else if (method === 'mobile' && contact.mobile) {
      window.open(`tel:${contact.mobile}`);
    }
  };

  const getStatusColor = (status: ContactStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'blacklisted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: ContactType) => {
    switch (type) {
      case 'contractor': return 'bg-blue-100 text-blue-800';
      case 'vendor': return 'bg-purple-100 text-purple-800';
      case 'service_provider': return 'bg-orange-100 text-orange-800';
      case 'supplier': return 'bg-teal-100 text-teal-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">No rating</span>;

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`ri-star-${star <= rating ? 'fill' : 'line'} text-yellow-400`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">External Contacts</h1>
            <p className="text-muted-foreground">
              Manage contractors, vendors, and service providers
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <i className="ri-add-line mr-2"></i>
            Add Contact
          </Button>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{contacts?.filter(c => c.status === 'active').length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Service Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{contacts?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {contacts?.length ? (contacts.reduce((sum, c) => sum + (c.rating || 0), 0) / contacts.length).toFixed(1) : '0.0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={filters.type || "all"} onValueChange={(value) => handleFilterChange("type", value)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="contractor">Contractor</SelectItem>
            <SelectItem value="vendor">Vendor</SelectItem>
            <SelectItem value="service_provider">Service Provider</SelectItem>
            <SelectItem value="supplier">Supplier</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status || "all"} onValueChange={(value) => handleFilterChange("status", value)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="blacklisted">Blacklisted</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.emergency_contact === true ? "emergency" : filters.emergency_contact === false ? "regular" : "all"}
          onValueChange={(value) => handleFilterChange("emergency_contact", value === "emergency" ? true : value === "regular" ? false : undefined)}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All Contacts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Contacts</SelectItem>
            <SelectItem value="emergency">Emergency Only</SelectItem>
            <SelectItem value="regular">Regular Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contacts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <i className="ri-loader-line animate-spin text-2xl mb-2"></i>
            <p>Loading contacts...</p>
          </div>
        </div>
      ) : contacts && contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{contact.company_name}</CardTitle>
                    {contact.contact_person && (
                      <p className="text-sm text-muted-foreground mt-1">{contact.contact_person}</p>
                    )}
                  </div>
                  {contact.emergency_contact && (
                    <Badge variant="destructive" className="ml-2">
                      <i className="ri-alarm-warning-line mr-1"></i>
                      Emergency
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge className={getTypeColor(contact.type)}>
                    {contact.type.replace('_', ' ')}
                  </Badge>
                  <Badge className={getStatusColor(contact.status)}>
                    {contact.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Contact Info */}
                <div className="space-y-2">
                  {contact.email && (
                    <div className="flex items-center text-sm">
                      <i className="ri-mail-line mr-2 text-muted-foreground"></i>
                      <span className="truncate">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center text-sm">
                      <i className="ri-phone-line mr-2 text-muted-foreground"></i>
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.category && (
                    <div className="flex items-center text-sm">
                      <i className="ri-service-line mr-2 text-muted-foreground"></i>
                      <span className="capitalize">{contact.category.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>

                {/* Rating */}
                {renderStars(contact.rating)}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleView(contact)}>
                    <i className="ri-eye-line"></i>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(contact)}>
                    <i className="ri-edit-line"></i>
                  </Button>
                  {contact.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContact(contact, 'email')}
                      title="Send Email"
                    >
                      <i className="ri-mail-line"></i>
                    </Button>
                  )}
                  {contact.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContact(contact, 'phone')}
                      title="Call Phone"
                    >
                      <i className="ri-phone-line"></i>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(contact)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <i className="ri-contacts-line text-4xl text-muted-foreground mb-4"></i>
          <h3 className="text-lg font-medium mb-2">No contacts found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || Object.keys(filters).length > 0
              ? "Try adjusting your search or filters"
              : "Get started by adding your first external contact"
            }
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <i className="ri-add-line mr-2"></i>
            Add Contact
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <CreateContactDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {editingContact && (
        <EditContactDialog
          contact={editingContact}
          open={!!editingContact}
          onOpenChange={(open) => !open && setEditingContact(null)}
        />
      )}

      {viewingContact && (
        <ContactDetailsDialog
          contact={viewingContact}
          open={!!viewingContact}
          onOpenChange={(open) => !open && setViewingContact(null)}
        />
      )}
      </div>
    </MainLayout>
  );
}

export default withAuth(ExternalContactsPage);
