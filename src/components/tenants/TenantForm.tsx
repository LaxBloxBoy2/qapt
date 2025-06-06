"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Tenant, TenantFormValues } from "@/types/tenant";
import { useCreateTenant, useUpdateTenant } from "@/hooks/useTenants";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useGetUnits } from "@/hooks/useUnits";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// Define the form schema with Zod
const tenantFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  middle_name: z.string().optional(),
  email: z.string().email("Invalid email address"),
  secondary_email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  secondary_phone: z.string().optional(),
  is_company: z.boolean(),
  company_name: z.string().optional(),
  date_of_birth: z.date().optional(),
  forwarding_address: z.string().optional(),
  unit_id: z.string().optional(),
  avatar_url: z.string().optional(),
});

interface TenantFormProps {
  tenant?: Tenant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenantForm({ tenant, open, onOpenChange }: TenantFormProps) {
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const { data: units, isLoading: unitsLoading } = useGetUnits();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize the form with react-hook-form
  const form = useForm<z.infer<typeof tenantFormSchema>>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      middle_name: "",
      email: "",
      secondary_email: "",
      phone: "",
      secondary_phone: "",
      is_company: false,
      company_name: "",
      forwarding_address: "",
      unit_id: "none",
      avatar_url: "",
    },
  });

  // Update form values when tenant prop changes
  useEffect(() => {
    if (tenant) {
      form.reset({
        first_name: tenant.first_name,
        last_name: tenant.last_name,
        middle_name: tenant.middle_name || "",
        email: tenant.email,
        secondary_email: tenant.secondary_email || "",
        phone: tenant.phone || "",
        secondary_phone: tenant.secondary_phone || "",
        is_company: tenant.is_company,
        company_name: tenant.company_name || "",
        date_of_birth: tenant.date_of_birth ? new Date(tenant.date_of_birth) : undefined,
        forwarding_address: tenant.forwarding_address || "",
        unit_id: tenant.unit_id || "none",
        avatar_url: tenant.avatar_url || "",
      });
      setAvatarPreview(tenant.avatar_url || null);
    } else {
      form.reset({
        first_name: "",
        last_name: "",
        middle_name: "",
        email: "",
        secondary_email: "",
        phone: "",
        secondary_phone: "",
        is_company: false,
        company_name: "",
        forwarding_address: "",
        unit_id: "none", // Use "none" instead of empty string
        avatar_url: "",
      });
      setAvatarPreview(null);
    }
  }, [tenant, form]);

  // Handle avatar upload
  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `tenant-avatar-${Date.now()}.${fileExt}`;
      const filePath = `tenant-avatars/${fileName}`;

      // Upload to image_url bucket
      const { error: uploadError } = await supabase.storage
        .from('image_url')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('image_url')
        .getPublicUrl(filePath);

      // Update form and preview
      form.setValue('avatar_url', publicUrl);
      setAvatarPreview(publicUrl);

      toast({
        title: "Avatar uploaded",
        description: "Profile photo has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: error?.message || "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle avatar file selection
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      handleAvatarUpload(file);
    }
  };

  // Remove avatar
  const handleRemoveAvatar = () => {
    form.setValue('avatar_url', '');
    setAvatarPreview(null);
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    const firstName = form.watch('first_name') || '';
    const lastName = form.watch('last_name') || '';
    const companyName = form.watch('company_name') || '';
    const isCompany = form.watch('is_company');

    if (isCompany && companyName) {
      return companyName.charAt(0).toUpperCase();
    }

    const firstInitial = firstName.charAt(0);
    const lastInitial = lastName.charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof tenantFormSchema>) => {
    setIsSubmitting(true);
    try {
      // Create a copy of values to avoid modifying the original
      const formData = { ...values };

      // Handle unit_id - convert "none" to null
      if (formData.unit_id === "none" || formData.unit_id === "") {
        formData.unit_id = undefined; // Using undefined will make it null in the database
      }

      const formattedValues: TenantFormValues = {
        ...formData,
        date_of_birth: formData.date_of_birth ? format(formData.date_of_birth, "yyyy-MM-dd") : undefined,
      };

      if (tenant) {
        await updateTenant.mutateAsync({
          id: tenant.id,
          values: formattedValues,
        });
      } else {
        await createTenant.mutateAsync(formattedValues);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tenant ? "Edit Tenant" : "Add New Tenant"}</DialogTitle>
          <DialogDescription>
            {tenant
              ? "Update tenant information in the form below."
              : "Fill out the form below to add a new tenant."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Is Company Switch */}
                <FormField
                  control={form.control}
                  name="is_company"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Company</FormLabel>
                        <FormDescription>
                          Is this tenant a company rather than an individual?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Company Name (shown only if is_company is true) */}
                {form.watch("is_company") && (
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Avatar Upload */}
                <div className="md:col-span-2">
                  <FormLabel>Profile Photo (Optional)</FormLabel>
                  <div className="flex items-center gap-6 mt-2">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={avatarPreview || form.watch('avatar_url')} />
                      <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploadingAvatar}
                          onClick={() => document.getElementById('tenant-avatar-upload')?.click()}
                        >
                          {isUploadingAvatar ? (
                            <>
                              <i className="ri-loader-line animate-spin mr-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <i className="ri-upload-line mr-2" />
                              Upload Photo
                            </>
                          )}
                        </Button>
                        {(avatarPreview || form.watch('avatar_url')) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveAvatar}
                            className="text-red-600 hover:text-red-700"
                          >
                            <i className="ri-delete-bin-line mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG or GIF. Max size 5MB.
                      </p>
                      <input
                        id="tenant-avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </div>
                  </div>
                </div>

                {/* First Name */}
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Middle Name */}
                <FormField
                  control={form.control}
                  name="middle_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter middle name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date of Birth */}
                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth (Optional)</FormLabel>
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
                                format(field.value, "PPP")
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
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Secondary Email */}
                <FormField
                  control={form.control}
                  name="secondary_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Email (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter secondary email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Secondary Phone */}
                <FormField
                  control={form.control}
                  name="secondary_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter secondary phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Forwarding Address */}
                <FormField
                  control={form.control}
                  name="forwarding_address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Forwarding Address (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter forwarding address"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unit Selection */}
                <FormField
                  control={form.control}
                  name="unit_id"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Linked Unit (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {units?.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.name} ({unit.properties?.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span> Saving...
                    </>
                  ) : tenant ? (
                    "Update Tenant"
                  ) : (
                    "Add Tenant"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
      </DialogContent>
    </Dialog>
  );
}
