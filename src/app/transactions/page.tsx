"use client";

import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import Transactions from "@/pages/Transactions";

function TransactionsPage() {
  return (
    <MainLayout>
      <Transactions />
    </MainLayout>
  );
}

export default withAuth(TransactionsPage);
