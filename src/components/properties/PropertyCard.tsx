"use client";

import { Property } from "@/types/property";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useDeleteProperty } from "@/hooks/useProperties";
import { useGetPropertyPhotos } from "@/hooks/usePropertyPhotos";
import { StorageImage } from "@/components/ui/storage-image";
import { useCurrencyFormatter } from "@/lib/currency";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

interface PropertyCardProps {
  property: Property;
  viewMode?: "grid" | "list";
}

export function PropertyCard({ property, viewMode = "grid" }: PropertyCardProps) {
  const deleteProperty = useDeleteProperty();
  const { data: photos } = useGetPropertyPhotos(property.id);
  const { formatCurrency } = useCurrencyFormatter();

  const handleDelete = () => {
    deleteProperty.mutate(property.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-primary/10 text-primary border-primary/20";
      case "inactive":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
      case "archived":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    return type === "single_unit" ? "Single Unit" : "Multi Unit";
  };

  const getPropertyTypeIcon = (type: string) => {
    return type === "single_unit" ? "ri-home-line" : "ri-building-line";
  };

  const getPropertyImage = () => {
    // First check if property has an image_url field
    if (property.image_url) {
      return property.image_url;
    }

    // Then check if there are photos from the property_photos table
    if (photos && photos.length > 0) {
      return photos[0].url;
    }

    // Return null if no images available - we'll show fallback icon
    return null;
  };

  if (viewMode === "list") {
    return (
      <Card className="group hover:shadow-md transition-all duration-200 border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Link href={`/properties/${property.id}`} className="flex-grow">
              <div className="flex items-center gap-6">
                {/* Property Image */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                  {getPropertyImage() ? (
                    <StorageImage
                      src={getPropertyImage()!}
                      alt={property.name}
                      className="w-full h-full object-cover"
                      onLoadingError={() => {
                        // Fallback handled by StorageImage component
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <i className={`${getPropertyTypeIcon(property.type)} text-2xl text-gray-400`} />
                    </div>
                  )}
                </div>

                {/* Property Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
                      {property.name}
                    </h3>
                    <Badge className={`${getStatusColor(property.status)} border flex-shrink-0`}>
                      {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
                    <i className="ri-map-pin-line text-sm flex-shrink-0" />
                    <span className="text-sm truncate">
                      {property.address}, {property.city}, {property.state} {property.zip}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <i className={`${getPropertyTypeIcon(property.type)} text-gray-400`} />
                      <span>{getPropertyTypeLabel(property.type)}</span>
                    </div>
                    {property.beds && (
                      <div className="flex items-center gap-1">
                        <i className="ri-hotel-bed-line text-gray-400" />
                        <span>{property.beds} beds</span>
                      </div>
                    )}
                    {property.baths && (
                      <div className="flex items-center gap-1">
                        <i className="ri-drop-line text-gray-400" />
                        <span>{property.baths} baths</span>
                      </div>
                    )}
                    {property.size && (
                      <div className="flex items-center gap-1">
                        <i className="ri-ruler-line text-gray-400" />
                        <span>{property.size} sq ft</span>
                      </div>
                    )}
                    {property.year_built && (
                      <div className="flex items-center gap-1">
                        <i className="ri-calendar-line text-gray-400" />
                        <span>{property.year_built}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rent */}
                {property.market_rent && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Market Rent</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(property.market_rent)}
                    </p>
                  </div>
                )}
              </div>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href={`/properties/edit/${property.id}`}>
                <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity border-gray-200 dark:border-gray-700">
                  <i className="ri-edit-line mr-1" />
                  Edit
                </Button>
              </Link>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="ri-delete-bin-line mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the property "{property.name}". This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                      {deleteProperty.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view (default)
  return (
    <Card className="h-full flex flex-col group cursor-pointer hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-white dark:bg-gray-800 overflow-hidden">
      <Link href={`/properties/${property.id}`} className="flex-grow">
        {/* Property Image */}
        <div className="relative h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
          {getPropertyImage() ? (
            <StorageImage
              src={getPropertyImage()!}
              alt={property.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onLoadingError={() => {
                // Fallback handled by StorageImage component
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              <i className={`${getPropertyTypeIcon(property.type)} text-4xl text-gray-400`} />
            </div>
          )}

          {/* Status Badge Overlay */}
          <div className="absolute top-3 right-3">
            <Badge className={`${getStatusColor(property.status)} border shadow-sm`}>
              {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
            </Badge>
          </div>

          {/* Property Type Icon */}
          <div className="absolute top-3 left-3">
            <div className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg">
              <i className={`${getPropertyTypeIcon(property.type)} text-lg text-gray-700 dark:text-gray-300`} />
            </div>
          </div>
        </div>

        <CardContent className="flex-grow p-6">
          {/* Property Name and Location */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors mb-1 line-clamp-1">
              {property.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <i className="ri-map-pin-line text-xs" />
              {property.address}, {property.city}, {property.state} {property.zip}
            </p>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <i className={`${getPropertyTypeIcon(property.type)} text-gray-400`} />
              <span className="text-gray-600 dark:text-gray-300">{getPropertyTypeLabel(property.type)}</span>
            </div>
            {property.year_built && (
              <div className="flex items-center gap-2">
                <i className="ri-calendar-line text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">{property.year_built}</span>
              </div>
            )}
            {property.beds && (
              <div className="flex items-center gap-2">
                <i className="ri-hotel-bed-line text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">{property.beds} beds</span>
              </div>
            )}
            {property.baths && (
              <div className="flex items-center gap-2">
                <i className="ri-drop-line text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">{property.baths} baths</span>
              </div>
            )}
            {property.size && (
              <div className="flex items-center gap-2 col-span-2">
                <i className="ri-ruler-line text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">{property.size} sq ft</span>
              </div>
            )}
          </div>

          {/* Market Rent */}
          {property.market_rent && (
            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Market Rent</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(property.market_rent)}
                </span>
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {property.description}
            </p>
          )}
        </CardContent>
      </Link>

      {/* Footer Actions */}
      <CardFooter className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 flex justify-between">
        <Link href={`/properties/edit/${property.id}`}>
          <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-700 hover:bg-primary/5 hover:text-primary hover:border-primary/20">
            <i className="ri-edit-line mr-1" />
            Edit
          </Button>
        </Link>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/20">
              <i className="ri-delete-bin-line mr-1" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the property "{property.name}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                {deleteProperty.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
