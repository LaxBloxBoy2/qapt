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
import { Appliance, ApplianceFormValues, applianceSchema } from "@/types/appliance";
import { useCreateAppliance, useGetApplianceCategories, useUpdateAppliance } from "@/hooks/useAppliances";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "../ui/checkbox";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { uploadApplianceImage } from "@/lib/uploadApplianceImage";
import { Switch } from "../ui/switch";

interface ApplianceFormProps {
  appliance?: Appliance;
  propertyId?: string;
  onSuccess?: () => void;
}

export function ApplianceForm({ appliance, propertyId, onSuccess }: ApplianceFormProps) {
  const isEditing = !!appliance;
  const createAppliance = useCreateAppliance();
  const updateAppliance = useUpdateAppliance();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showWarranty, setShowWarranty] = useState(false);
  const [formHeight, setFormHeight] = useState<number>(0);
  const { data: categories } = useGetApplianceCategories();
  const isLoading = createAppliance.isPending || updateAppliance.isPending;

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

  const form = useForm<ApplianceFormValues>({
    resolver: zodResolver(applianceSchema),
    defaultValues: {
      name: "",
      property_id: propertyId || "",
      category_id: "",
      sub_category: "",
      brand: "",
      model: "",
      serial_number: "",
      status: "active",
      installation_date: "",
      warranty_expiration: "",
      price: undefined,
      notes: "",
      image_url: "",
    },
  });

  // Fetch properties for the dropdown
  const { data: properties } = useQuery({
    queryKey: ["properties-for-select"],
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

  // Populate form when editing
  useEffect(() => {
    if (appliance) {
      form.reset({
        name: appliance.name,
        property_id: appliance.property_id,
        category_id: appliance.category_id,
        sub_category: appliance.sub_category || "",
        brand: appliance.brand || "",
        model: appliance.model || "",
        serial_number: appliance.serial_number || "",
        status: appliance.status,
        installation_date: appliance.installation_date || "",
        warranty_expiration: appliance.warranty_expiration || "",
        price: appliance.price,
        notes: appliance.notes || "",
        image_url: appliance.image_url || "",
      });

      if (appliance.image_url) {
        setImagePreview(appliance.image_url);
      }

      if (appliance.warranty_expiration) {
        setShowWarranty(true);
      }
    } else if (propertyId) {
      form.setValue("property_id", propertyId);
    }
  }, [appliance, propertyId, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    form.setValue("image_url", "");
  };

  const onSubmit = async (data: ApplianceFormValues) => {
    try {
      // Clean up date fields - remove empty strings to avoid SQL errors
      const cleanedData = {
        ...data,
        // If installation_date is an empty string, set it to undefined
        installation_date: data.installation_date && data.installation_date.trim() !== ""
          ? data.installation_date
          : undefined,
        // If warranty_expiration is an empty string, set it to undefined
        warranty_expiration: data.warranty_expiration && data.warranty_expiration.trim() !== ""
          ? data.warranty_expiration
          : undefined
      };

      console.log("Submitting appliance with data:", cleanedData);

      if (isEditing && appliance) {
        // If there's a new image, upload it first
        let imageUrl = data.image_url;
        if (imageFile) {
          imageUrl = await uploadApplianceImage(imageFile, appliance.id);
        }

        updateAppliance.mutate(
          {
            id: appliance.id,
            appliance: {
              ...cleanedData,
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
        // Create the appliance first
        const newAppliance = await createAppliance.mutateAsync({
          ...cleanedData,
          user_id: "", // This will be set in the hook
          image_url: "" // We'll update this after upload
        });

        // If there's an image, upload it and update the appliance
        if (imageFile) {
          const imageUrl = await uploadApplianceImage(imageFile, newAppliance.id);
          updateAppliance.mutate(
            {
              id: newAppliance.id,
              appliance: { image_url: imageUrl }
            },
            {
              onSuccess: () => {
                onSuccess?.();
              },
            }
          );
        } else {
          onSuccess?.();
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        style={{ maxHeight: formHeight > 0 ? `${formHeight}px` : 'auto', overflowY: 'auto' }}
      >
        {/* Compact layout with responsive columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left column - Appliance Information */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Appliance Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="property_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        disabled={!!propertyId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {properties?.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.name}
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appliance Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Kitchen Refrigerator" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.filter(c => !c.parent_id).map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
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
                  name="sub_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Refrigerator" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Appliance Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Samsung" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model #</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. RF28R7351SG" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serial_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial #</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 12345ABCDE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="installation_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Installation Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : undefined)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
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

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showWarranty}
                    onCheckedChange={setShowWarranty}
                    id="warranty-switch"
                  />
                  <label
                    htmlFor="warranty-switch"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Has Warranty
                  </label>
                </div>

                {showWarranty && (
                  <FormField
                    control={form.control}
                    name="warranty_expiration"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Warranty Expiration</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : undefined)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter notes about this appliance"
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

          {/* Right column - Appliance Image */}
          <div className="lg:col-span-4">
            <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg space-y-4 sticky top-4">
              <h3 className="text-lg font-medium border-b pb-2">Appliance Image</h3>

              <div className="space-y-4">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden h-48 flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Appliance preview"
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

                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("appliance-image-upload")?.click()}
                    className="w-full"
                  >
                    <i className="ri-upload-line mr-2"></i>
                    Upload Image
                  </Button>
                  <input
                    id="appliance-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
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
              <>{isEditing ? "Update Appliance" : "Create Appliance"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
