"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGetPropertyFeatures, useUpdatePropertyFeatures } from "@/hooks/usePropertyFeatures";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface PropertyFeaturesProps {
  propertyId: string;
}

// Predefined feature categories and options
const featureOptions = {
  amenities: [
    "Parking", "Laundry", "AC", "Heating", "Dishwasher", "Microwave", 
    "Refrigerator", "Stove", "Oven", "Garbage Disposal"
  ],
  features: [
    "Fireplace", "Carpet", "Hardwood Floors", "Walk-in Closet", "Patio", 
    "Balcony", "Yard", "Garden", "High Ceilings", "Ceiling Fan"
  ],
  community: [
    "Pool", "Gym", "BBQ", "Elevator", "Security", "Gated", "Playground", 
    "Tennis Court", "Basketball Court", "Dog Park"
  ]
};

interface FeatureFormValues {
  amenities: string[];
  features: string[];
  community: string[];
  customFeatures: string;
}

export function PropertyFeatures({ propertyId }: PropertyFeaturesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: features, isLoading } = useGetPropertyFeatures(propertyId);
  const updateFeatures = useUpdatePropertyFeatures();
  const { toast } = useToast();

  const form = useForm<FeatureFormValues>({
    defaultValues: {
      amenities: [],
      features: [],
      community: [],
      customFeatures: ""
    }
  });

  // Populate form when editing
  const openDialog = () => {
    if (features) {
      // Extract features by category
      const amenities = features.filter(f => f.category === "amenities").map(f => f.name);
      const propertyFeatures = features.filter(f => f.category === "features").map(f => f.name);
      const community = features.filter(f => f.category === "community").map(f => f.name);
      
      // Get custom features (those not in predefined lists)
      const customFeatures = features
        .filter(f => 
          (f.category === "amenities" && !featureOptions.amenities.includes(f.name)) ||
          (f.category === "features" && !featureOptions.features.includes(f.name)) ||
          (f.category === "community" && !featureOptions.community.includes(f.name)) ||
          !["amenities", "features", "community"].includes(f.category)
        )
        .map(f => f.name)
        .join(", ");
      
      form.reset({
        amenities,
        features: propertyFeatures,
        community,
        customFeatures
      });
    }
    
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: FeatureFormValues) => {
    try {
      // Process all selected features
      const allFeatures = [
        ...data.amenities.map(name => ({ category: "amenities", name })),
        ...data.features.map(name => ({ category: "features", name })),
        ...data.community.map(name => ({ category: "community", name }))
      ];
      
      // Process custom features
      if (data.customFeatures) {
        const customFeaturesList = data.customFeatures
          .split(",")
          .map(f => f.trim())
          .filter(f => f.length > 0);
          
        customFeaturesList.forEach(name => {
          allFeatures.push({ category: "custom", name });
        });
      }
      
      await updateFeatures.mutateAsync({
        propertyId,
        features: allFeatures
      });
      
      setIsDialogOpen(false);
      toast({
        title: "Features updated",
        description: "Property features have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error updating features",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const renderFeatureList = (category: string, items: string[]) => {
    if (items.length === 0) return <p className="text-gray-500 dark:text-gray-400 text-sm">None</p>;
    
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="outline" className="bg-gray-100 dark:bg-gray-800">
            {item}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage the features and amenities available at this property.
        </p>
        <Button onClick={openDialog}>
          <i className="ri-edit-line mr-1" />
          Edit Features
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : features && features.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Basic Amenities</h3>
            {renderFeatureList("amenities", features.filter(f => f.category === "amenities").map(f => f.name))}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Property Features</h3>
            {renderFeatureList("features", features.filter(f => f.category === "features").map(f => f.name))}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Community Amenities</h3>
            {renderFeatureList("community", features.filter(f => f.category === "community").map(f => f.name))}
          </div>
          
          {features.some(f => f.category === "custom" || 
            (f.category === "amenities" && !featureOptions.amenities.includes(f.name)) ||
            (f.category === "features" && !featureOptions.features.includes(f.name)) ||
            (f.category === "community" && !featureOptions.community.includes(f.name))
          ) && (
            <div className="col-span-1 md:col-span-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Custom Features</h3>
              {renderFeatureList("custom", features
                .filter(f => 
                  f.category === "custom" || 
                  (f.category === "amenities" && !featureOptions.amenities.includes(f.name)) ||
                  (f.category === "features" && !featureOptions.features.includes(f.name)) ||
                  (f.category === "community" && !featureOptions.community.includes(f.name))
                )
                .map(f => f.name)
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium mb-2">No features added</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Add features and amenities to highlight what this property offers.
          </p>
          <Button onClick={openDialog}>
            <i className="ri-add-line mr-1" />
            Add Features
          </Button>
        </div>
      )}

      {/* Features Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Property Features</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Amenities */}
                <div className="space-y-4">
                  <h3 className="font-medium">Basic Amenities</h3>
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="amenities"
                      render={() => (
                        <div className="space-y-2">
                          {featureOptions.amenities.map((amenity) => (
                            <FormField
                              key={amenity}
                              control={form.control}
                              name="amenities"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={amenity}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(amenity)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, amenity])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== amenity
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {amenity}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                      )}
                    />
                  </div>
                </div>
                
                {/* Property Features */}
                <div className="space-y-4">
                  <h3 className="font-medium">Property Features</h3>
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="features"
                      render={() => (
                        <div className="space-y-2">
                          {featureOptions.features.map((feature) => (
                            <FormField
                              key={feature}
                              control={form.control}
                              name="features"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={feature}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(feature)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, feature])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== feature
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {feature}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                      )}
                    />
                  </div>
                </div>
                
                {/* Community Amenities */}
                <div className="space-y-4">
                  <h3 className="font-medium">Community Amenities</h3>
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="community"
                      render={() => (
                        <div className="space-y-2">
                          {featureOptions.community.map((item) => (
                            <FormField
                              key={item}
                              control={form.control}
                              name="community"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, item])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== item
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {item}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
              
              {/* Custom Features */}
              <div className="space-y-4">
                <h3 className="font-medium">Custom Features</h3>
                <FormField
                  control={form.control}
                  name="customFeatures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Add your own features (comma-separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Smart Home, Wine Cellar, Home Office" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateFeatures.isPending}
                >
                  {updateFeatures.isPending ? "Saving..." : "Save Features"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
