"use client";

import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { TenantsList } from "@/components/tenants/TenantsList";

function TenantsPage() {
  return (
    <MainLayout>
      <TenantsList />
    </MainLayout>
  );
}

export default withAuth(TenantsPage);
