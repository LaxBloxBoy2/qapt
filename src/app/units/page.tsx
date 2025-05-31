"use client";

import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { UnitsList } from "@/components/units/UnitsList";

function UnitsPage() {
  return (
    <MainLayout>
      <UnitsList />
    </MainLayout>
  );
}

export default withAuth(UnitsPage);
