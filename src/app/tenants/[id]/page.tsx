"use client";

import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { TenantProfile } from "@/components/tenants/TenantProfile";
import { useRouter } from "next/navigation";

interface TenantDetailPageProps {
  params: {
    id: string;
  };
}

function TenantDetailPage({ params }: TenantDetailPageProps) {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Tenant Profile</h2>
          <Button variant="outline" onClick={() => router.push("/tenants")}>
            <i className="ri-arrow-left-line mr-1" />
            Back to Tenants
          </Button>
        </div>

        <TenantProfile tenantId={params.id} />
      </div>
    </MainLayout>
  );
}

export default withAuth(TenantDetailPage);
