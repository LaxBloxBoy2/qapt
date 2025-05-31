"use client";

import { ApplianceForm } from "@/components/appliances/ApplianceForm";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { useRouter } from "next/navigation";

function NewAppliancePage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/appliances");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Add New Appliance</h2>
          <Button variant="outline" onClick={() => router.push("/appliances")}>
            <i className="ri-arrow-left-line mr-1" />
            Back to Appliances
          </Button>
        </div>

        <div className="card">
          <ApplianceForm onSuccess={handleSuccess} />
        </div>
      </div>
    </MainLayout>
  );
}

export default withAuth(NewAppliancePage);
