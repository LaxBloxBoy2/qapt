"use client";

import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import Maintenance from "@/pages/Maintenance";

function MaintenancePage() {
  return (
    <MainLayout>
      <Maintenance />
    </MainLayout>
  );
}

export default withAuth(MaintenancePage);
