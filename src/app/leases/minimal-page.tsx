"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function MinimalLeasesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leases, setLeases] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<any>({});
  const supabase = createClientComponentClient();

  // Check database status
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        setIsLoading(true);
        
        // Check if leases table exists
        const { data: leasesExists, error: leasesError } = await supabase
          .from('leases')
          .select('id')
          .limit(1);
          
        // Check if lease_tenants table exists
        const { data: tenantsExists, error: tenantsError } = await supabase
          .from('lease_tenants')
          .select('id')
          .limit(1);
          
        // Check if lease_attachments table exists
        const { data: attachmentsExists, error: attachmentsError } = await supabase
          .from('lease_attachments')
          .select('id')
          .limit(1);
          
        setDbStatus({
          leases: {
            exists: !leasesError,
            error: leasesError?.message || null
          },
          lease_tenants: {
            exists: !tenantsError,
            error: tenantsError?.message || null
          },
          lease_attachments: {
            exists: !attachmentsError,
            error: attachmentsError?.message || null
          }
        });
        
        // If leases table exists, fetch leases
        if (!leasesError) {
          const { data, error } = await supabase
            .from('leases')
            .select(`
              id,
              unit_id,
              start_date,
              end_date,
              rent_amount,
              deposit_amount,
              status
            `)
            .order('created_at', { ascending: false });
            
          if (error) {
            console.error("Error fetching leases:", error);
            setError(error.message);
          } else {
            setLeases(data || []);
          }
        }
      } catch (err: any) {
        console.error("Unexpected error:", err);
        setError(err.message || "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkDatabase();
  }, [supabase]);

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Leases (Minimal View)</h1>
          <Button onClick={() => window.location.href = "/leases"}>
            Go to Full View
          </Button>
        </div>
        
        {/* Database Status */}
        <Card>
          <CardHeader>
            <CardTitle>Database Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="font-medium mr-2">Leases Table:</span>
                {dbStatus.leases?.exists ? (
                  <span className="text-green-600">Available</span>
                ) : (
                  <span className="text-red-600">Not Available - {dbStatus.leases?.error}</span>
                )}
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-2">Lease Tenants Table:</span>
                {dbStatus.lease_tenants?.exists ? (
                  <span className="text-green-600">Available</span>
                ) : (
                  <span className="text-red-600">Not Available - {dbStatus.lease_tenants?.error}</span>
                )}
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-2">Lease Attachments Table:</span>
                {dbStatus.lease_attachments?.exists ? (
                  <span className="text-green-600">Available</span>
                ) : (
                  <span className="text-red-600">Not Available - {dbStatus.lease_attachments?.error}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Leases List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading leases...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="inline-block rounded-full p-3 bg-red-100 dark:bg-red-900">
              <i className="ri-error-warning-line text-3xl text-red-600 dark:text-red-300"></i>
            </div>
            <h3 className="mt-4 text-lg font-medium">Error loading leases</h3>
            <p className="mt-1 text-muted-foreground">{error}</p>
            <Button
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              <i className="ri-refresh-line mr-2"></i>
              Refresh Page
            </Button>
          </div>
        ) : leases.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {leases.map((lease) => (
              <Card key={lease.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Lease ID: {lease.id}</h3>
                      <p className="text-sm text-muted-foreground">Unit ID: {lease.unit_id || "N/A"}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Start Date</p>
                          <p>{formatDate(lease.start_date)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">End Date</p>
                          <p>{formatDate(lease.end_date)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Rent</p>
                          <p>{formatCurrency(lease.rent_amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p>{lease.status || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="inline-block rounded-full p-3 bg-gray-100 dark:bg-gray-700">
              <i className="ri-file-list-3-line text-3xl text-muted-foreground"></i>
            </div>
            <h3 className="mt-4 text-lg font-medium">No leases found</h3>
            <p className="mt-1 text-muted-foreground">
              Get started by adding your first lease
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default withAuth(MinimalLeasesPage);
