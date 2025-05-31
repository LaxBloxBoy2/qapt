"use client";

import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import Balances from "@/pages/Balances";

function BalancesPage() {
  return (
    <MainLayout>
      <Balances />
    </MainLayout>
  );
}

export default withAuth(BalancesPage);
