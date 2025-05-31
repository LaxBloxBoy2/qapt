"use client";

import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";

function HelpPage() {
  return (
    <MainLayout>
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Help & Support</h2>
        <p className="text-gray-500 dark:text-gray-400">
          This page will provide help and support resources for using the QAPT property management software.
        </p>
      </div>
    </MainLayout>
  );
}

export default withAuth(HelpPage);
