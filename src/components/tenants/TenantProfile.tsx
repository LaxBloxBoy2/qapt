"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useTenant } from "@/hooks/useTenants";
import { addToRecentlyViewed } from "@/components/dashboard/RecentlyViewed";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantForm } from "./TenantForm";
import { TenantLeases } from "./TenantLeases";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteTenant } from "@/hooks/useTenants";

interface TenantProfileProps {
  tenantId: string;
}

export function TenantProfile({ tenantId }: TenantProfileProps) {
  const router = useRouter();
  const { data: tenant, isLoading } = useTenant(tenantId);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteTenant = useDeleteTenant();

  // Track recently viewed
  useEffect(() => {
    if (tenant) {
      const displayName = tenant.is_company && tenant.company_name
        ? tenant.company_name
        : `${tenant.first_name} ${tenant.last_name}`;

      addToRecentlyViewed({
        id: tenant.id,
        type: 'tenant',
        title: displayName,
        subtitle: `${tenant.email}${tenant.phone ? ` • ${tenant.phone}` : ''}`,
        url: `/tenants/${tenant.id}`,
        icon: 'ri-user-line'
      });
    }
  }, [tenant]);

  // Get initials for avatar
  const getInitials = () => {
    if (!tenant) return "";

    if (tenant.is_company && tenant.company_name) {
      return tenant.company_name.charAt(0).toUpperCase();
    }

    const firstInitial = tenant.first_name ? tenant.first_name.charAt(0) : "";
    const lastInitial = tenant.last_name ? tenant.last_name.charAt(0) : "";
    return (firstInitial + lastInitial).toUpperCase();
  };

  // Get full name or company name
  const getDisplayName = () => {
    if (!tenant) return "";

    if (tenant.is_company && tenant.company_name) {
      return tenant.company_name;
    }

    const middleInitial = tenant.middle_name
      ? ` ${tenant.middle_name.charAt(0)}.`
      : "";

    return `${tenant.first_name}${middleInitial} ${tenant.last_name}`;
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    try {
      await deleteTenant.mutateAsync(tenantId);
      router.push("/tenants");
    } catch (error) {
      console.error("Error deleting tenant:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Loading tenant profile...</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="inline-block rounded-full p-3 bg-gray-100 dark:bg-gray-700">
          <i className="ri-error-warning-line text-3xl text-red-500"></i>
        </div>
        <h3 className="mt-4 text-lg font-medium">Tenant not found</h3>
        <p className="mt-1 text-muted-foreground">
          The tenant you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push("/tenants")}
        >
          <i className="ri-arrow-left-line mr-2"></i>
          Back to Tenants
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {/* Avatar with initials */}
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-2xl">
                {getInitials()}
              </div>

              <div>
                <CardTitle className="text-xl">{getDisplayName()}</CardTitle>
                <CardDescription>
                  {tenant.email}
                  {tenant.phone && ` • ${tenant.phone}`}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                <i className="ri-edit-line mr-2"></i>
                Edit
              </Button>

              <Button
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <i className="ri-delete-bin-line mr-2"></i>
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="leases">Leases</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {tenant.is_company ? (
                    <>
                      <div className="text-sm font-medium">Company Name</div>
                      <div className="text-sm">{tenant.company_name}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-medium">Full Name</div>
                      <div className="text-sm">
                        {tenant.first_name} {tenant.middle_name && `${tenant.middle_name} `}
                        {tenant.last_name}
                      </div>

                      {tenant.date_of_birth && (
                        <>
                          <div className="text-sm font-medium">Date of Birth</div>
                          <div className="text-sm">
                            {format(new Date(tenant.date_of_birth), "MMMM d, yyyy")}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <div className="text-sm font-medium">Email</div>
                  <div className="text-sm">{tenant.email}</div>

                  {tenant.secondary_email && (
                    <>
                      <div className="text-sm font-medium">Secondary Email</div>
                      <div className="text-sm">{tenant.secondary_email}</div>
                    </>
                  )}

                  {tenant.phone && (
                    <>
                      <div className="text-sm font-medium">Phone</div>
                      <div className="text-sm">{tenant.phone}</div>
                    </>
                  )}

                  {tenant.secondary_phone && (
                    <>
                      <div className="text-sm font-medium">Secondary Phone</div>
                      <div className="text-sm">{tenant.secondary_phone}</div>
                    </>
                  )}

                  <div className="text-sm font-medium">Created</div>
                  <div className="text-sm">
                    {format(new Date(tenant.created_at), "MMMM d, yyyy")}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Address Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tenant.units ? (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Current Unit</h3>
                    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Unit</span>
                          <span className="text-sm">{tenant.units.name}</span>
                        </div>

                        {tenant.units.properties && (
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Property</span>
                            <span className="text-sm">{tenant.units.properties.name}</span>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => router.push(`/units/${tenant.units?.id}`)}
                        >
                          <i className="ri-home-line mr-2"></i>
                          View Unit
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                    <i className="ri-home-line text-2xl text-muted-foreground"></i>
                    <p className="mt-2 text-sm text-muted-foreground">No unit assigned</p>
                  </div>
                )}

                {tenant.forwarding_address && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Forwarding Address</h3>
                    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-line">{tenant.forwarding_address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leases Tab */}
        <TabsContent value="leases">
          <TenantLeases tenantId={tenantId} />
        </TabsContent>

        {/* Placeholder Tabs */}
        <TabsContent value="insurance">
          <Card>
            <CardHeader>
              <CardTitle>Insurance</CardTitle>
              <CardDescription>
                Tenant insurance information will be displayed here.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-48 flex items-center justify-center">
              <div className="text-center">
                <i className="ri-shield-line text-4xl text-muted-foreground"></i>
                <p className="mt-2 text-muted-foreground">Insurance feature coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                Tenant transaction history will be displayed here.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-48 flex items-center justify-center">
              <div className="text-center">
                <i className="ri-exchange-dollar-line text-4xl text-muted-foreground"></i>
                <p className="mt-2 text-muted-foreground">Transactions feature coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
              <CardDescription>
                Tenant applications will be displayed here.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-48 flex items-center justify-center">
              <div className="text-center">
                <i className="ri-file-list-line text-4xl text-muted-foreground"></i>
                <p className="mt-2 text-muted-foreground">Applications feature coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Requests</CardTitle>
              <CardDescription>
                Tenant maintenance requests will be displayed here.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-48 flex items-center justify-center">
              <div className="text-center">
                <i className="ri-tools-line text-4xl text-muted-foreground"></i>
                <p className="mt-2 text-muted-foreground">Requests feature coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Tenant Dialog */}
      <TenantForm
        tenant={tenant}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tenant {getDisplayName()}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
