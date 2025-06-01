"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Unit, UnitFormValues, unitSchema, unitStatuses, unitTypes } from "@/types/unit";
import { useCreateUnit, useUpdateUnit } from "@/hooks/useUnits";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface UnitFormProps {
  unit?: Unit;
  propertyId?: string;
  onSuccess?: () => void;
}

export function UnitForm({ unit, propertyId, onSuccess }: UnitFormProps) {
  const isEditing = !!unit;
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formHeight, setFormHeight] = useState<number>(0);

  // Track form height for responsive layout
  useEffect(() => {
    const updateHeight = () => {
      setFormHeight(window.innerHeight - 200); // Adjust for header/footer
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Always use 'vacant' for new units
  const defaultStatus = "vacant" as const;

  // Initialize form with default values
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: "",
      property_id: propertyId || "", // Use propertyId if provided
      unit_type: "Apartment",
      status: defaultStatus, // Always use 'vacant' for new units
      description: "",
      beds: undefined,
      baths: undefined,
      size: undefined,
      market_rent: undefined,
      deposit: undefined,
      image_url: "",
    },
    mode: "onChange", // Validate on change for better user experience
  });

  // Log the form state for debugging
  console.log("Form values:", form.getValues());
  console.log("Property ID from props:", propertyId);

  // Fetch properties for the dropdown
  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ["properties-for-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      console.log("Properties fetched:", data); // Debug log
      return data || [];
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (unit) {
      form.reset({
        name: unit.name,
        property_id: unit.property_id,
        unit_type: unit.unit_type,
        status: unit.status,
        description: unit.description || "",
        beds: unit.beds,
        baths: unit.baths,
        size: unit.size,
        market_rent: unit.market_rent,
        deposit: unit.deposit,
        image_url: unit.image_url || "",
      });

      if (unit.image_url) {
        setImagePreview(unit.image_url);
      }
    } else if (propertyId) {
      // Set the property_id and clear any validation errors
      form.setValue("property_id", propertyId);
      form.clearErrors("property_id");
      console.log("Property ID set from prop:", propertyId);
    }
  }, [unit, propertyId, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file type
      if (!file.type.startsWith('image/')) {
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    form.setValue("image_url", "");
  };

  const uploadImage = async (file: File, unitId: string): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `unit-images/${unitId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("property-photos") // Reusing the same bucket
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Error uploading file: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from("property-photos")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async (data: UnitFormValues) => {
    try {
      console.log("Form data on submit:", data);
      console.log("Form errors:", form.formState.errors);

      if (isEditing && unit) {
        // If there's a new image, upload it first
        let imageUrl = data.image_url;
        if (imageFile) {
          imageUrl = await uploadImage(imageFile, unit.id);
        }

        updateUnit.mutate(
          {
            id: unit.id,
            unit: {
              ...data,
              image_url: imageUrl
            }
          },
          {
            onSuccess: () => {
              onSuccess?.();
            },
          }
        );
      } else {
        // Create the unit first with explicit fields
        // Always use 'vacant' for new units regardless of what's in the form
        const unitData = {
          name: data.name,
          property_id: data.property_id,
          unit_type: data.unit_type,
          status: defaultStatus, // Always use the defaultStatus (vacant)
          description: data.description,
          beds: data.beds,
          baths: data.baths,
          size: data.size,
          market_rent: data.market_rent,
          deposit: data.deposit,
          user_id: "", // This will be set in the hook
          image_url: "" // We'll update this after upload
        };

        console.log("Creating unit with data:", unitData); // Log the data being sent

        // Check if property_id is valid before submitting
        if (!unitData.property_id) {
          console.error("Property ID is missing");
          form.setError("property_id", {
            type: "manual",
            message: "Property ID is required"
          });
          return;
        }

        const newUnit = await createUnit.mutateAsync(unitData);

        // If there's an image, upload it and update the unit
        if (imageFile && newUnit) {
          const imageUrl = await uploadImage(imageFile, newUnit.id);

          // Update the unit with the image URL
          await supabase
            .from("units")
            .update({ image_url: imageUrl })
            .eq("id", newUnit.id);
        }

        form.reset();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const isLoading = createUnit.isPending || updateUnit.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        style={{ maxHeight: formHeight > 0 ? `${formHeight}px` : 'auto', overflowY: 'auto' }}
      >
        {/* Compact layout with responsive columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left column - Unit Information */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Unit Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="property_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property*</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Clear the error message when a value is selected
                          form.clearErrors("property_id");
                        }}
                        value={field.value || ""}
                        disabled={!!propertyId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {propertiesLoading ? (
                            <SelectItem value="loading" disabled>Loading properties...</SelectItem>
                          ) : properties && properties.length > 0 ? (
                            properties.map((property) => (
                              <SelectItem key={property.id} value={property.id}>
                                {property.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No properties found</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      {propertyId && <p className="text-xs text-muted-foreground mt-1">Property is pre-selected from the property page</p>}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Name/Label*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Unit 1, Room A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unit_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Type*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unitTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue="vacant"
                        value="vacant"
                        disabled={true} // Disable the select to prevent changes
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unitStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-1">New units are always created with 'Vacant' status</p>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Unit Details</h3>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="beds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beds</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Baths</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size (sq ft)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="market_rent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market Rent ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter unit description"
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Right column - Unit Image */}
          <div className="lg:col-span-4">
            <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg space-y-4 sticky top-4">
              <h3 className="text-lg font-medium border-b pb-2">Unit Image</h3>

              <div className="space-y-4">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden h-48 flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Unit preview"
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center">
                      <i className="ri-image-line text-4xl text-gray-400"></i>
                      <p className="text-gray-500 dark:text-gray-400 mt-2">No image selected</p>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="unit-image"
                  />
                  <label htmlFor="unit-image">
                    <Button type="button" variant="outline" className="w-full" asChild>
                      <span>
                        <i className="ri-image-add-line mr-1" />
                        {imagePreview ? "Change Image" : "Upload Image"}
                      </span>
                    </Button>
                  </label>
                </div>

                {imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveImage}
                    className="w-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <i className="ri-delete-bin-line mr-2"></i>
                    Remove Image
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons - fixed at bottom */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-2 pb-2 border-t mt-4 flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="mr-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{isEditing ? "Update Unit" : "Create Unit"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
