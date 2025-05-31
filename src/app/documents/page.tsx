"use client";

import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { DocumentsList } from "@/components/documents/DocumentsList";

function DocumentsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <DocumentsList />
      </div>
    </MainLayout>
  );
}

export default withAuth(DocumentsPage);
