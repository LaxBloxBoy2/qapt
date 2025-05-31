"use client";

import { ApplianceDetail } from "@/components/appliances/ApplianceDetail";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { useRouter } from "next/navigation";

interface ApplianceDetailPageProps {
  params: {
    id: string;
  };
}

function ApplianceDetailPage({ params }: ApplianceDetailPageProps) {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Appliance Details</h2>
          <Button variant="outline" onClick={() => router.push("/appliances")}>
            <i className="ri-arrow-left-line mr-1" />
            Back to Appliances
          </Button>
        </div>

        <ApplianceDetail applianceId={params.id} />
      </div>
    </MainLayout>
  );
}

export default withAuth(ApplianceDetailPage);
