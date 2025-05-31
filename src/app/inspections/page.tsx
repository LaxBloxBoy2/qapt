"use client";

import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { InspectionsList } from "@/components/inspections/InspectionsList";

function InspectionsPage() {
  return (
    <MainLayout>
      <InspectionsList />
    </MainLayout>
  );
}

export default withAuth(InspectionsPage);
