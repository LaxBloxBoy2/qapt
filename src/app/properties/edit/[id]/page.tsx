"use client";

import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useGetProperty } from "@/hooks/useProperties";

interface EditPropertyPageProps {
  params: {
    id: string;
  };
}

function EditPropertyPage({ params }: EditPropertyPageProps) {
  const router = useRouter();
  const { data: property, isLoading, isError, error } = useGetProperty(params.id);

  const handleSuccess = () => {
    router.push("/properties");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Error loading property</h3>
          <p>{error.message}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Edit Property</h2>
          <Button variant="outline" onClick={() => router.push("/properties")}>
            <i className="ri-arrow-left-line mr-1" />
            Back to Properties
          </Button>
        </div>

        <div className="card">
          {property && <PropertyForm property={property} onSuccess={handleSuccess} />}
        </div>
      </div>
    </MainLayout>
  );
}

export default withAuth(EditPropertyPage);
