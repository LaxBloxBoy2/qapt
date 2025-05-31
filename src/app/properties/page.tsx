"use client";

import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { PropertyList } from "@/components/properties/PropertyList";

function PropertiesPage() {
  return (
    <MainLayout>
      <PropertyList />
    </MainLayout>
  );
}

export default withAuth(PropertiesPage);
