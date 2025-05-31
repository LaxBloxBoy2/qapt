"use client";

import { InspectionDetail } from "@/components/inspections/InspectionDetail";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { useRouter } from "next/navigation";

interface InspectionDetailPageProps {
  params: {
    id: string;
  };
}

function InspectionDetailPage({ params }: InspectionDetailPageProps) {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Inspection Report</h2>
          <Button variant="outline" onClick={() => router.push("/inspections")}>
            <i className="ri-arrow-left-line mr-1" />
            Back to Inspections
          </Button>
        </div>

        <InspectionDetail inspectionId={params.id} />
      </div>
    </MainLayout>
  );
}

export default withAuth(InspectionDetailPage);
