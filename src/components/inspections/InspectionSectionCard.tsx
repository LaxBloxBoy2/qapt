"use client";

import { useState } from "react";
import { useGetSectionConditions } from "@/hooks/useInspections";
import { InspectionSection } from "@/types/inspection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddConditionDialog } from "./AddConditionDialog";
import { ConditionCard } from "./ConditionCard";

interface InspectionSectionCardProps {
  section: InspectionSection;
}

export function InspectionSectionCard({ section }: InspectionSectionCardProps) {
  const [showAddConditionDialog, setShowAddConditionDialog] = useState(false);
  const { data: conditions, isLoading } = useGetSectionConditions(section.id);

  // Function to get the icon based on section type
  const getSectionIcon = (type: string) => {
    switch (type) {
      case "bedroom":
        return "ri-hotel-bed-line";
      case "bathroom":
        return "ri-shower-room-line";
      case "kitchen":
        return "ri-refrigerator-line";
      case "living_room":
        return "ri-sofa-line";
      case "dining_room":
        return "ri-restaurant-line";
      case "hallway":
        return "ri-door-line";
      case "laundry":
        return "ri-t-shirt-line";
      case "garage":
        return "ri-car-line";
      case "exterior":
        return "ri-home-line";
      case "other":
        return "ri-more-line";
      default:
        return "ri-home-line";
    }
  };

  // Format section type for display
  const formatSectionType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <i className={`${getSectionIcon(section.section_type)} text-lg text-primary`}></i>
            </div>
            <div>
              <CardTitle className="text-lg">{section.name}</CardTitle>
              <CardDescription>{formatSectionType(section.section_type)}</CardDescription>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowAddConditionDialog(true)}
          >
            <i className="ri-add-line mr-1"></i>
            Add Condition
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : conditions && conditions.length > 0 ? (
          <div className="space-y-4">
            {conditions.map((condition) => (
              <ConditionCard key={condition.id} condition={condition} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
            <div className="inline-block rounded-full p-2 bg-gray-100 dark:bg-gray-700">
              <i className="ri-file-list-line text-xl text-muted-foreground"></i>
            </div>
            <h3 className="mt-2 text-sm font-medium">No conditions</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Add conditions to document the state of this section.
            </p>
            <Button
              className="mt-2"
              size="sm"
              variant="outline"
              onClick={() => setShowAddConditionDialog(true)}
            >
              <i className="ri-add-line mr-1"></i>
              Add Condition
            </Button>
          </div>
        )}
      </CardContent>

      <AddConditionDialog 
        open={showAddConditionDialog} 
        onOpenChange={setShowAddConditionDialog}
        sectionId={section.id}
      />
    </Card>
  );
}
