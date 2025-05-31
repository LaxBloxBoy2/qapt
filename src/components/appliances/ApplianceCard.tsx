"use client";

import { Appliance } from "@/types/appliance";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "../ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface ApplianceCardProps {
  appliance: Appliance;
}

export function ApplianceCard({ appliance }: ApplianceCardProps) {
  const router = useRouter();

  // Get the property name
  const { data: property } = useQuery({
    queryKey: ["property", appliance.property_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("name")
        .eq("id", appliance.property_id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });

  // Get the category name
  const { data: category } = useQuery({
    queryKey: ["appliance-category", appliance.category_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appliance_categories")
        .select("name")
        .eq("id", appliance.category_id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!appliance.category_id,
  });

  // Get the icon based on the category
  const getCategoryIcon = () => {
    if (!category) return "ri-device-line";

    switch (category.name.toLowerCase()) {
      case "kitchen":
        return "ri-fridge-line";
      case "laundry":
        return "ri-t-shirt-line";
      case "hvac":
        return "ri-temp-hot-line";
      case "bathroom":
        return "ri-water-flash-line";
      case "electronics":
        return "ri-tv-line";
      default:
        return "ri-device-line";
    }
  };

  // Get the status badge color
  const getStatusColor = () => {
    switch (appliance.status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "retired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Check if warranty is expiring soon (within 30 days)
  const isWarrantyExpiringSoon = () => {
    if (!appliance.warranty_expiration) return false;
    
    const warrantyDate = new Date(appliance.warranty_expiration);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    return warrantyDate <= thirtyDaysFromNow && warrantyDate >= today;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <i className={`${getCategoryIcon()} text-xl text-primary`}></i>
            </div>
            <div>
              <h3 className="font-medium text-lg line-clamp-1">{appliance.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {category?.name} {appliance.sub_category ? `- ${appliance.sub_category}` : ""}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor()}>
            {appliance.status.charAt(0).toUpperCase() + appliance.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <i className="ri-building-line mr-2 text-muted-foreground"></i>
            <span className="line-clamp-1">{property?.name || "Loading..."}</span>
          </div>
          
          {appliance.brand && (
            <div className="flex items-center text-sm">
              <i className="ri-price-tag-3-line mr-2 text-muted-foreground"></i>
              <span className="line-clamp-1">{appliance.brand}</span>
            </div>
          )}
          
          {appliance.model && (
            <div className="flex items-center text-sm">
              <i className="ri-barcode-line mr-2 text-muted-foreground"></i>
              <span className="line-clamp-1">Model: {appliance.model}</span>
            </div>
          )}
          
          {isWarrantyExpiringSoon() && (
            <div className="flex items-center text-sm text-amber-600 dark:text-amber-400">
              <i className="ri-alarm-warning-line mr-2"></i>
              <span>Warranty expires {format(new Date(appliance.warranty_expiration!), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => router.push(`/appliances/${appliance.id}`)}
        >
          View Appliance
        </Button>
      </CardFooter>
    </Card>
  );
}
