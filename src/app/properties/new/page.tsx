"use client";

import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

function NewPropertyPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/properties");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Add New Property</h2>
          <Button variant="outline" onClick={() => router.push("/properties")}>
            <i className="ri-arrow-left-line mr-1" />
            Back to Properties
          </Button>
        </div>

        <div className="card">
          <PropertyForm onSuccess={handleSuccess} />
        </div>
      </div>
    </MainLayout>
  );
}

export default withAuth(NewPropertyPage);
