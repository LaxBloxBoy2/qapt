"use client";

import { useGetApplianceCategories } from "@/hooks/useAppliances";
import { applianceStatuses } from "@/types/appliance";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { supabase } from "@/lib/supabase";

export function ApplianceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories } = useGetApplianceCategories();
  
  // Get properties for filter
  const { data: properties } = useQuery({
    queryKey: ["properties-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
  });

  // Parse current filters from URL
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showWarrantyExpiring, setShowWarrantyExpiring] = useState(false);

  // Initialize filters from URL params
  useEffect(() => {
    if (!searchParams) return;

    const propertyParam = searchParams.get("property");
    const statusParam = searchParams.get("status");
    const categoryParam = searchParams.get("category");
    const warrantyParam = searchParams.get("warranty");

    setSelectedProperties(propertyParam ? propertyParam.split(",") : []);
    setSelectedStatuses(statusParam ? statusParam.split(",") : []);
    setSelectedCategories(categoryParam ? categoryParam.split(",") : []);
    setShowWarrantyExpiring(warrantyParam === "expiring");
  }, [searchParams]);

  // Update URL with filters
  const updateFilters = useCallback(() => {
    const params = new URLSearchParams();
    
    if (selectedProperties.length > 0) {
      params.set("property", selectedProperties.join(","));
    }
    
    if (selectedStatuses.length > 0) {
      params.set("status", selectedStatuses.join(","));
    }
    
    if (selectedCategories.length > 0) {
      params.set("category", selectedCategories.join(","));
    }
    
    if (showWarrantyExpiring) {
      params.set("warranty", "expiring");
    }
    
    router.push(`/appliances?${params.toString()}`);
  }, [selectedProperties, selectedStatuses, selectedCategories, showWarrantyExpiring, router]);

  // Handle property filter change
  const handlePropertyChange = (propertyId: string) => {
    setSelectedProperties(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };

  // Handle status filter change
  const handleStatusChange = (status: string) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  // Handle category filter change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedProperties([]);
    setSelectedStatuses([]);
    setSelectedCategories([]);
    setShowWarrantyExpiring(false);
    router.push("/appliances");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear All
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Properties</h4>
          <div className="space-y-2">
            {properties?.map((property) => (
              <div key={property.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`property-${property.id}`} 
                  checked={selectedProperties.includes(property.id)}
                  onCheckedChange={() => handlePropertyChange(property.id)}
                />
                <Label 
                  htmlFor={`property-${property.id}`}
                  className="text-sm cursor-pointer"
                >
                  {property.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-2">Status</h4>
          <div className="space-y-2">
            {applianceStatuses.map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox 
                  id={`status-${status}`} 
                  checked={selectedStatuses.includes(status)}
                  onCheckedChange={() => handleStatusChange(status)}
                />
                <Label 
                  htmlFor={`status-${status}`}
                  className="text-sm cursor-pointer"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-2">Categories</h4>
          <div className="space-y-2">
            {categories?.filter(c => !c.parent_id).map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`category-${category.id}`} 
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => handleCategoryChange(category.id)}
                />
                <Label 
                  htmlFor={`category-${category.id}`}
                  className="text-sm cursor-pointer"
                >
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-2">Warranty</h4>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="warranty-expiring" 
              checked={showWarrantyExpiring}
              onCheckedChange={(checked) => setShowWarrantyExpiring(!!checked)}
            />
            <Label 
              htmlFor="warranty-expiring"
              className="text-sm cursor-pointer"
            >
              Expiring Soon
            </Label>
          </div>
        </div>

        <Button className="w-full" onClick={updateFilters}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
