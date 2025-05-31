"use client";

import { Property } from "@/types/property";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhotoGalleryUpload } from "./PhotoGalleryUpload";
import { useGetPropertyPhotos } from "@/hooks/usePropertyPhotos";
import { useGetPropertyUnits } from "@/hooks/useUnits";

interface PropertyOverviewProps {
  property: Property;
}

export function PropertyOverview({ property }: PropertyOverviewProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const { data: photos } = useGetPropertyPhotos(property.id);
  const { data: units } = useGetPropertyUnits(property.id);
  const mainPhoto = photos && photos.length > 0 ? photos[0].url : null;



  // Calculate Quick Stats
  const quickStats = useMemo(() => {
    if (!units) {
      return {
        totalUnits: 0,
        occupied: 0,
        vacant: 0,
        monthlyRevenue: 0
      };
    }

    const totalUnits = units.length;
    const occupied = units.filter(unit => unit.status === 'occupied').length;
    const vacant = units.filter(unit => unit.status === 'vacant').length;
    const monthlyRevenue = units
      .filter(unit => unit.status === 'occupied' && unit.market_rent)
      .reduce((sum, unit) => sum + (unit.market_rent || 0), 0);

    return {
      totalUnits,
      occupied,
      vacant,
      monthlyRevenue
    };
  }, [units]);

  const getStatusBadge = (status: string) => {
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return status === "active" ? (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        {label}
      </Badge>
    ) : (
      <Badge variant="secondary">
        {label}
      </Badge>
    );
  };

  const getPropertyTypeLabel = (type: string) => {
    return type === "single_unit" ? "Single Unit" : "Multi Unit";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Side - Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Property Photo */}
        <div className="bg-muted rounded-lg overflow-hidden h-80 relative">
          {mainPhoto && photos && photos.length > 0 ? (
            <div
              className="w-full h-full bg-center bg-no-repeat bg-cover"
              style={{
                backgroundImage: `url('${photos[0].url}')`,
                backgroundSize: 'cover'
              }}
            ></div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <i className="ri-image-line text-4xl text-muted-foreground"></i>
                <p className="text-muted-foreground mt-2">No photos available</p>
              </div>
            </div>
          )}
          <Button
            size="sm"
            className="absolute bottom-4 right-4"
            onClick={() => setIsGalleryOpen(true)}
          >
            <i className="ri-image-add-line mr-1 h-4 w-4" />
            {photos && photos.length > 0 ? "Manage Photos" : "Add Photos"}
          </Button>
        </div>

        {/* Property Details Cards - Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Address Card */}
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
              <i className="ri-map-pin-line text-sm" />
            </div>
            <h4 className="font-medium">Address</h4>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>{property.address}</div>
            <div>{property.city}, {property.state} {property.zip}</div>
            <div>{property.country}</div>
          </div>
        </div>

        {/* Property Type Card */}
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
              <i className="ri-home-line text-sm" />
            </div>
            <h4 className="font-medium">Property Type</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">{getPropertyTypeLabel(property.type)}</span>
            {getStatusBadge(property.status)}
          </div>
        </div>

        {/* Year Built Card */}
        {property.year_built && property.year_built > 0 && (
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
                <i className="ri-calendar-line text-sm" />
              </div>
              <h4 className="font-medium">Year Built</h4>
            </div>
            <div className="text-lg font-semibold">{property.year_built}</div>
          </div>
        )}

        {/* Beds Card */}
        {property.beds !== undefined && property.beds !== null && property.beds > 0 && (
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
                <i className="ri-hotel-bed-line text-sm" />
              </div>
              <h4 className="font-medium">Beds</h4>
            </div>
            <div className="text-lg font-semibold">{property.beds}</div>
          </div>
        )}

        {/* Baths Card */}
        {property.baths !== undefined && property.baths !== null && property.baths > 0 && (
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
                <i className="ri-drop-line text-sm" />
              </div>
              <h4 className="font-medium">Baths</h4>
            </div>
            <div className="text-lg font-semibold">{property.baths}</div>
          </div>
        )}

        {/* Size Card */}
        {property.size !== undefined && property.size !== null && property.size > 0 && (
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
                <i className="ri-ruler-line text-sm" />
              </div>
              <h4 className="font-medium">Size</h4>
            </div>
            <div className="text-lg font-semibold">{property.size}</div>
            <div className="text-sm text-muted-foreground">sq ft</div>
          </div>
        )}

        {/* Market Rent Card */}
        {property.market_rent !== undefined && property.market_rent !== null && property.market_rent > 0 && (
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-sm" />
              </div>
              <h4 className="font-medium">Market Rent</h4>
            </div>
            <div className="text-lg font-semibold">${property.market_rent.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">per month</div>
          </div>
        )}

        {/* Deposit Card */}
        {property.deposit !== undefined && property.deposit !== null && property.deposit > 0 && (
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
                <i className="ri-safe-line text-sm" />
              </div>
              <h4 className="font-medium">Deposit</h4>
            </div>
            <div className="text-lg font-semibold">${property.deposit.toLocaleString()}</div>
          </div>
        )}

        {/* MLS Number Card */}
        {property.mls_number && property.mls_number.trim() !== '' && (
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
                <i className="ri-hashtag text-sm" />
              </div>
              <h4 className="font-medium">MLS Number</h4>
            </div>
            <div className="text-lg font-semibold">{property.mls_number}</div>
          </div>
        )}
        </div>

        {/* Description Card */}
        {property.description && property.description.trim() !== '' && (
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
                <i className="ri-file-text-line text-sm" />
              </div>
              <h4 className="font-medium">Description</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p>
          </div>
        )}
      </div>

      {/* Right Side - Quick Stats */}
      <div className="lg:col-span-1">
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-6">Quick Stats</h3>

          <div className="space-y-4">
            {/* Total Units */}
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Total Units</span>
              <span className="font-medium">{quickStats.totalUnits}</span>
            </div>

            {/* Occupied */}
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Occupied</span>
              <span className="font-medium text-green-600">{quickStats.occupied}</span>
            </div>

            {/* Vacant */}
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Vacant</span>
              <span className="font-medium text-orange-600">{quickStats.vacant}</span>
            </div>

            {/* Monthly Revenue */}
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Monthly Revenue</span>
              <span className="font-medium text-blue-600">
                ${quickStats.monthlyRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Photo Gallery Dialog */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Property Photos</DialogTitle>
          </DialogHeader>
          <PhotoGalleryUpload propertyId={property.id} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
