"use client";

import { cn } from "@/lib/utils";

interface PropertyStatus {
  id: string;
  name: string;
  total: number;
  occupied: number;
  vacant: number;
  maintenance: number;
}

interface PropertyStatusCardProps {
  properties: PropertyStatus[];
  className?: string;
}

export default function PropertyStatusCard({ properties, className }: PropertyStatusCardProps) {
  return (
    <div className={cn("card", className)}>
      <h3 className="text-lg font-semibold mb-4">Property Status</h3>
      
      <div className="space-y-4">
        {properties.map((property) => {
          const occupiedPercentage = (property.occupied / property.total) * 100;
          const vacantPercentage = (property.vacant / property.total) * 100;
          const maintenancePercentage = (property.maintenance / property.total) * 100;
          
          return (
            <div key={property.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium">{property.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {property.occupied} / {property.total} units
                </p>
              </div>
              
              <div className="flex h-2 rounded-full overflow-hidden">
                <div
                  className="bg-green-500"
                  style={{ width: `${occupiedPercentage}%` }}
                />
                <div
                  className="bg-red-500"
                  style={{ width: `${vacantPercentage}%` }}
                />
                <div
                  className="bg-yellow-500"
                  style={{ width: `${maintenancePercentage}%` }}
                />
              </div>
              
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span>Occupied ({property.occupied})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span>Vacant ({property.vacant})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span>Maintenance ({property.maintenance})</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
