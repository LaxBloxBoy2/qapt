"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TenantWithUnit } from "@/types/tenant";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDeleteTenant } from "@/hooks/useTenants";
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
import { TenantForm } from "./TenantForm";

interface TenantCardProps {
  tenant: TenantWithUnit;
}

export function TenantCard({ tenant }: TenantCardProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const deleteTenant = useDeleteTenant();

  // Get initials for avatar
  const getInitials = () => {
    if (tenant.is_company && tenant.company_name) {
      return tenant.company_name.charAt(0).toUpperCase();
    }
    
    const firstInitial = tenant.first_name ? tenant.first_name.charAt(0) : "";
    const lastInitial = tenant.last_name ? tenant.last_name.charAt(0) : "";
    return (firstInitial + lastInitial).toUpperCase();
  };

  // Get full name or company name
  const getDisplayName = () => {
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
      await deleteTenant.mutateAsync(tenant.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting tenant:", error);
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex-grow">
          <div className="flex items-center space-x-4">
            {/* Avatar with image or initials */}
            <Avatar className="w-12 h-12">
              <AvatarImage src={tenant.avatar_url} alt={getDisplayName()} />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-grow">
              <h3 className="font-medium">{getDisplayName()}</h3>
              <p className="text-sm text-muted-foreground">
                {tenant.email}
              </p>
              {tenant.units && (
                <p className="text-sm mt-1">
                  <span className="text-muted-foreground">Unit: </span>
                  {tenant.units.name} 
                  {tenant.units.properties && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({tenant.units.properties.name})
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/tenants/${tenant.id}`)}
          >
            View Profile
          </Button>
          
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditDialogOpen(true)}
              className="h-8 w-8"
            >
              <i className="ri-edit-line text-lg"></i>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <i className="ri-delete-bin-line text-lg"></i>
            </Button>
          </div>
        </CardFooter>
      </Card>

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
    </>
  );
}
