"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { useLease, useDeleteLease, useUploadLeaseAttachment, useDeleteLeaseAttachment } from "@/hooks/useLeases";
import { addToRecentlyViewed } from "@/components/dashboard/RecentlyViewed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaseForm } from "./LeaseForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrencyFormatter } from "@/lib/currency";

interface LeaseDetailProps {
  leaseId: string;
}

export function LeaseDetail({ leaseId }: LeaseDetailProps) {
  const router = useRouter();
  const { data: lease, isLoading, isError } = useLease(leaseId);
  const deleteLease = useDeleteLease();
  const uploadAttachment = useUploadLeaseAttachment();
  const deleteAttachment = useDeleteLeaseAttachment();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { formatCurrency } = useCurrencyFormatter();

  // Track recently viewed
  useEffect(() => {
    if (lease) {
      const primaryTenant = lease.tenants?.[0];
      const tenantName = primaryTenant
        ? (primaryTenant.is_company && primaryTenant.company_name
            ? primaryTenant.company_name
            : `${primaryTenant.first_name} ${primaryTenant.last_name}`)
        : 'Unknown Tenant';

      const unitInfo = lease.unit?.name
        ? `${lease.unit.name}${lease.unit.properties?.name ? ` at ${lease.unit.properties.name}` : ''}`
        : 'Unknown Unit';

      addToRecentlyViewed({
        id: lease.id,
        type: 'lease',
        title: `Lease - ${tenantName}`,
        subtitle: unitInfo,
        url: `/leases/${lease.id}`,
        icon: 'ri-file-text-line'
      });
    }
  }, [lease]);

  // Format dates
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Not specified";
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error, "Date string:", dateString);
      return "Invalid date";
    }
  };

  // Helper function to get deposit amount regardless of column name
  const getDepositAmount = (lease: any) => {
    if (lease.deposit_amount !== undefined && lease.deposit_amount !== null) {
      return formatCurrency(lease.deposit_amount);
    } else if (lease.security_deposit !== undefined && lease.security_deposit !== null) {
      return formatCurrency(lease.security_deposit);
    } else if (lease.deposit !== undefined && lease.deposit !== null) {
      return formatCurrency(lease.deposit);
    } else {
      return "None";
    }
  };

  // Calculate status if missing
  const getLeaseStatus = (leaseData: any) => {
    if (!leaseData) return 'unknown';

    // Check if it's a draft first
    if (leaseData.is_draft) {
      return 'draft';
    }

    if (leaseData.status && leaseData.status !== 'unknown') {
      return leaseData.status;
    }

    if (!leaseData.start_date || !leaseData.end_date) {
      return 'unknown';
    }

    const today = new Date();
    const start = parseISO(leaseData.start_date);
    const end = parseISO(leaseData.end_date);

    if (start > today) return 'upcoming';
    if (end < today) return 'expired';
    return 'active';
  };

  // Get status badge color
  const getStatusColor = (status: string | null | undefined) => {
    if (!status) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }

    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'draft':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    try {
      await deleteLease.mutateAsync(leaseId);
      router.push("/leases");
    } catch (error) {
      console.error("Error deleting lease:", error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !lease) return;

    const file = files[0];
    setIsUploading(true);

    try {
      await uploadAttachment.mutateAsync({
        leaseId: lease.id,
        file,
        fileName: file.name,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
      // Reset the input
      e.target.value = "";
    }
  };

  // Handle attachment deletion
  const handleDeleteAttachment = async (attachmentId: string, fileUrl: string) => {
    if (!lease) return;

    try {
      // Extract the file path from the URL
      const urlParts = fileUrl.split("/");
      const filePath = urlParts.slice(urlParts.indexOf("lease-files") + 1).join("/");

      await deleteAttachment.mutateAsync({
        id: attachmentId,
        leaseId: lease.id,
        filePath,
      });
    } catch (error) {
      console.error("Error deleting attachment:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-2">Loading lease details...</p>
      </div>
    );
  }

  if (isError || !lease) {
    console.log("Lease not found or error occurred. isError:", isError, "lease:", lease);
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="inline-block rounded-full p-3 bg-red-100 dark:bg-red-900">
          <i className="ri-error-warning-line text-3xl text-red-600 dark:text-red-300"></i>
        </div>
        <h3 className="mt-4 text-lg font-medium">Lease not found</h3>
        <p className="mt-1 text-muted-foreground">
          The lease you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push("/leases")}
        >
          Back to Leases
        </Button>
      </div>
    );
  }

  // Calculate current status now that we know lease exists
  const currentStatus = getLeaseStatus(lease);

  // Add additional safety checks
  if (!lease.unit) {
    console.warn("Lease has no unit information");
  }

  if (!lease.tenants || lease.tenants.length === 0) {
    console.warn("Lease has no tenants - tenants array:", lease.tenants);
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">
              Lease Details
              <Badge className={`ml-3 ${getStatusColor(currentStatus)}`}>
                {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
              </Badge>
            </h2>
            <p className="text-muted-foreground">
              {lease.unit?.name || 'Unknown Unit'}
              {lease.unit?.properties?.name ? ` at ${lease.unit.properties.name}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <i className="ri-edit-line mr-2"></i>
              Edit
            </Button>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <i className="ri-delete-bin-line mr-2"></i>
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the lease and remove all associated records.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Tenant Summary Bar */}
        {lease.tenants && lease.tenants.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {lease.tenants.slice(0, 3).map((tenant, index) => {
                    if (!tenant) return null;
                    return (
                      <button
                        key={tenant.id || `avatar-${index}`}
                        onClick={() => tenant.id && router.push(`/tenants/${tenant.id}`)}
                        className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white font-semibold text-sm hover:bg-blue-600 transition-colors cursor-pointer"
                        title={`View ${tenant.first_name} ${tenant.last_name}`}
                      >
                        {tenant.is_company && tenant.company_name
                          ? tenant.company_name.charAt(0).toUpperCase()
                          : tenant.first_name && tenant.last_name
                            ? `${tenant.first_name.charAt(0)}${tenant.last_name.charAt(0)}`.toUpperCase()
                            : "T"}
                      </button>
                    );
                  })}
                  {lease.tenants.length > 3 && (
                    <div className="w-10 h-10 rounded-full bg-gray-400 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white font-semibold text-xs">
                      +{lease.tenants.length - 3}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {lease.tenants.length === 1 ? "Tenant" : `${lease.tenants.length} Tenants`}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {lease.tenants.slice(0, 2).map((tenant, index) => {
                      if (!tenant) return null;
                      const name = tenant.is_company && tenant.company_name
                        ? tenant.company_name
                        : tenant.first_name && tenant.last_name
                          ? `${tenant.first_name} ${tenant.last_name}`
                          : "Unknown Tenant";
                      return index === 0 ? name : `, ${name}`;
                    }).join("")}
                    {lease.tenants.length > 2 && ` and ${lease.tenants.length - 2} more`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-blue-700 dark:text-blue-300 font-medium">Lease Period</p>
                  <p className="text-blue-900 dark:text-blue-100 font-semibold">
                    {formatDate(lease.start_date)} → {formatDate(lease.end_date)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-green-700 dark:text-green-300 font-medium">Monthly Rent</p>
                  <p className="text-green-900 dark:text-green-100 font-bold text-lg">
                    {formatCurrency(lease.rent_amount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lease Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Lease Terms</CardTitle>
                <CardDescription>Financial and timing details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Start Date</h4>
                    <p className="font-medium">{lease.start_date ? formatDate(lease.start_date) : "Not specified"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">End Date</h4>
                    <p className="font-medium">{lease.end_date ? formatDate(lease.end_date) : "Not specified"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Monthly Rent</h4>
                    <p className="font-medium text-lg text-green-600">
                      {lease.rent_amount !== undefined && lease.rent_amount !== null
                        ? formatCurrency(lease.rent_amount)
                        : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Security Deposit</h4>
                    <p className="font-medium">{getDepositAmount(lease)}</p>
                  </div>
                </div>

                {lease.notes !== undefined && lease.notes !== null && lease.notes !== '' && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                    <p className="text-sm whitespace-pre-line bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md">{lease.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tenant Information */}
            <Card>
              <CardHeader>
                <CardTitle>Tenant Information</CardTitle>
                <CardDescription>People on this lease</CardDescription>
              </CardHeader>
              <CardContent>
                {lease.tenants && lease.tenants.length > 0 ? (
                  <div className="space-y-3">
                    {lease.tenants.map((tenant, index) => {
                      if (!tenant) return null;

                      const isPrimary = index === 0; // Assuming first tenant is primary

                      return (
                        <div key={tenant.id || `tenant-${index}`} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                              {tenant.is_company && tenant.company_name
                                ? tenant.company_name.charAt(0).toUpperCase()
                                : tenant.first_name && tenant.last_name
                                  ? `${tenant.first_name.charAt(0)}${tenant.last_name.charAt(0)}`.toUpperCase()
                                  : "T"}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {tenant.is_company && tenant.company_name
                                    ? tenant.company_name
                                    : tenant.first_name && tenant.last_name
                                      ? `${tenant.first_name} ${tenant.last_name}`
                                      : "Unknown Tenant"}
                                </p>
                                {isPrimary && (
                                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                    Primary
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{tenant.email || "No email"}</p>
                            </div>
                          </div>

                          {tenant.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/tenants/${tenant.id}`)}
                            >
                              <i className="ri-user-line mr-1"></i>
                              View Profile
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="ri-user-line text-4xl text-muted-foreground mb-2"></i>
                    <p className="text-muted-foreground">No tenants associated with this lease</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
              <CardDescription>Details about the leased property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Unit</h4>
                  <p>{lease.unit?.name || "Unknown"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Property</h4>
                  <p>{lease.unit?.properties?.name || "Unknown"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Address</h4>
                  <p>{lease.unit?.properties?.address || "Unknown"}</p>
                </div>
              </div>

              {lease.unit && lease.unit_id && lease.unit.property_id && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/properties/${lease.unit?.property_id}/units/${lease.unit_id}`)}
                  >
                    <i className="ri-home-line mr-2"></i>
                    View Unit Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tenants Tab */}
        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tenants on Lease</CardTitle>
              <CardDescription>People associated with this lease</CardDescription>
            </CardHeader>
            <CardContent>
              {lease.tenants && lease.tenants.length > 0 ? (
                <div className="space-y-4">
                  {lease.tenants.map((tenant, index) => {
                    if (!tenant) {
                      console.warn("Null tenant found at index", index);
                      return null;
                    }

                    return (
                      <div key={tenant.id || `tenant-${index}`} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <p className="font-medium">
                            {tenant.is_company && tenant.company_name
                              ? tenant.company_name
                              : tenant.first_name && tenant.last_name
                                ? `${tenant.first_name} ${tenant.last_name}`
                                : "Unknown Tenant"}
                            {index === 0 && (
                              <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                Primary
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{tenant.email || "No email"}</p>
                        </div>
                        {tenant.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/tenants/${tenant.id}`)}
                          >
                            <i className="ri-user-line mr-1"></i> View
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No tenants associated with this lease.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lease Documents</CardTitle>
              <CardDescription>Upload and manage lease-related documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload Document</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {isUploading && (
                    <div className="animate-spin">⟳</div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Accepted file types: PDF, Word, Images
                </p>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Uploaded Documents</h4>
                {lease.attachments && lease.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {lease.attachments.map((attachment, index) => {
                      if (!attachment) {
                        console.warn("Null attachment found at index", index);
                        return null;
                      }

                      return (
                        <div key={attachment.id || `attachment-${index}`} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center">
                            <i className="ri-file-line text-xl mr-2"></i>
                            <div>
                              <p className="font-medium">{attachment.name || "Unnamed file"}</p>
                              <p className="text-xs text-muted-foreground">
                                {attachment.created_at
                                  ? `Uploaded ${format(parseISO(attachment.created_at), "MMM d, yyyy")}`
                                  : "Upload date unknown"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {attachment.file_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(attachment.file_url, '_blank')}
                              >
                                <i className="ri-download-line mr-1"></i> View
                              </Button>
                            )}
                            {attachment.id && attachment.file_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAttachment(attachment.id, attachment.file_url)}
                              >
                                <i className="ri-delete-bin-line text-destructive"></i>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No documents uploaded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Lease Dialog */}
      <LeaseForm
        lease={lease}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
}
