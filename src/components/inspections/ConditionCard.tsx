"use client";

import { useState } from "react";
import { useGetConditionMedia } from "@/hooks/useInspections";
import { InspectionCondition } from "@/types/inspection";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { UploadMediaDialog } from "./UploadMediaDialog";

interface ConditionCardProps {
  condition: InspectionCondition;
}

export function ConditionCard({ condition }: ConditionCardProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { data: media, isLoading } = useGetConditionMedia(condition.id);

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{condition.title}</CardTitle>
        {condition.cost_estimate !== null && condition.cost_estimate !== undefined && (
          <CardDescription>
            Estimated Cost: ${condition.cost_estimate.toFixed(2)}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-2">
        {condition.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {condition.description}
          </p>
        )}

        {/* Media Gallery */}
        {isLoading ? (
          <div className="flex justify-center items-center h-12 mt-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : media && media.length > 0 ? (
          <div className="mt-3">
            <h4 className="text-xs font-medium mb-2">Media ({media.length})</h4>
            <div className="grid grid-cols-3 gap-2">
              {media.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {item.media_type === "image" ? (
                    <Image
                      src={item.url}
                      alt="Condition media"
                      className="w-full h-16 rounded-md"
                      onLoadingError={(error) => {
                        console.error('Error loading condition media:', error.message);
                      }}
                    />
                  ) : (
                    <div className="w-full h-16 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                      <i className="ri-video-line text-lg text-gray-500 dark:text-gray-400"></i>
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => setShowUploadDialog(true)}
        >
          <i className="ri-image-add-line mr-1"></i>
          {media && media.length > 0 ? "Add More Media" : "Add Media"}
        </Button>
      </CardFooter>

      <UploadMediaDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        conditionId={condition.id}
      />
    </Card>
  );
}
