"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useUpdateExternalContact } from "@/hooks/useExternalContacts";
import { ExternalContact, ContactType, CONTACT_CATEGORIES, US_STATES } from "@/types/external-contacts";

const editContactSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  contact_person: z.string().optional(),
  type: z.enum(["contractor", "vendor", "service_provider", "supplier", "other"]),
  category: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  fax: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  license_number: z.string().optional(),
  insurance_info: z.string().optional(),
  tax_id: z.string().optional(),
  business_hours: z.string().optional(),
  hourly_rate: z.string().optional(),
  emergency_rate: z.string().optional(),
  minimum_charge: z.string().optional(),
  status: z.enum(["active", "inactive", "blacklisted"]),
  rating: z.string().optional(),
  notes: z.string().optional(),
  emergency_contact: z.boolean().default(false),
  emergency_phone: z.string().optional(),
  preferred_contact_method: z.enum(["email", "phone", "mobile", "text"]).optional(),
});

type EditContactForm = z.infer<typeof editContactSchema>;

interface EditContactDialogProps {
  contact: ExternalContact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditContactDialog({ contact, open, onOpenChange }: EditContactDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<string[]>(contact.services_offered || []);
  const [newService, setNewService] = useState("");

  const updateContact = useUpdateExternalContact();

  const form = useForm<EditContactForm>({
    resolver: zodResolver(editContactSchema),
    defaultValues: {
      company_name: contact.company_name,
      contact_person: contact.contact_person || "",
      type: contact.type,
      category: contact.category || "",
      email: contact.email || "",
      phone: contact.phone || "",
      mobile: contact.mobile || "",
      fax: contact.fax || "",
      website: contact.website || "",
      address_line1: contact.address_line1 || "",
      address_line2: contact.address_line2 || "",
      city: contact.city || "",
      state: contact.state || "",
      zip_code: contact.zip_code || "",
      license_number: contact.license_number || "",
      insurance_info: contact.insurance_info || "",
      tax_id: contact.tax_id || "",
      business_hours: contact.business_hours || "",
      hourly_rate: contact.hourly_rate?.toString() || "",
      emergency_rate: contact.emergency_rate?.toString() || "",
      minimum_charge: contact.minimum_charge?.toString() || "",
      status: contact.status,
      rating: contact.rating?.toString() || "",
      notes: contact.notes || "",
      emergency_contact: contact.emergency_contact,
      emergency_phone: contact.emergency_phone || "",
      preferred_contact_method: contact.preferred_contact_method,
    },
  });

  const watchedType = form.watch("type");
  const watchedEmergencyContact = form.watch("emergency_contact");

  // Reset form when contact changes
  useEffect(() => {
    if (contact) {
      form.reset({
        company_name: contact.company_name,
        contact_person: contact.contact_person || "",
        type: contact.type,
        category: contact.category || "",
        email: contact.email || "",
        phone: contact.phone || "",
        mobile: contact.mobile || "",
        fax: contact.fax || "",
        website: contact.website || "",
        address_line1: contact.address_line1 || "",
        address_line2: contact.address_line2 || "",
        city: contact.city || "",
        state: contact.state || "",
        zip_code: contact.zip_code || "",
        license_number: contact.license_number || "",
        insurance_info: contact.insurance_info || "",
        tax_id: contact.tax_id || "",
        business_hours: contact.business_hours || "",
        hourly_rate: contact.hourly_rate?.toString() || "",
        emergency_rate: contact.emergency_rate?.toString() || "",
        minimum_charge: contact.minimum_charge?.toString() || "",
        status: contact.status,
        rating: contact.rating?.toString() || "",
        notes: contact.notes || "",
        emergency_contact: contact.emergency_contact,
        emergency_phone: contact.emergency_phone || "",
        preferred_contact_method: contact.preferred_contact_method,
      });
      setServices(contact.services_offered || []);
    }
  }, [contact, form]);

  const onSubmit = async (data: EditContactForm) => {
    setIsLoading(true);
    try {
      const updateData = {
        id: contact.id,
        ...data,
        services_offered: services.length > 0 ? services : undefined,
        hourly_rate: data.hourly_rate ? parseFloat(data.hourly_rate) : undefined,
        emergency_rate: data.emergency_rate ? parseFloat(data.emergency_rate) : undefined,
        minimum_charge: data.minimum_charge ? parseFloat(data.minimum_charge) : undefined,
        rating: data.rating ? parseInt(data.rating) : undefined,
      };

      await updateContact.mutateAsync(updateData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating contact:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService("");
    }
  };

  const removeService = (service: string) => {
    setServices(services.filter(s => s !== service));
  };

  const availableCategories = CONTACT_CATEGORIES[watchedType as ContactType] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update contact information for {contact.company_name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ABC Plumbing Services" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Smith" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type*</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="contractor">Contractor</SelectItem>
                          <SelectItem value="vendor">Vendor</SelectItem>
                          <SelectItem value="service_provider">Service Provider</SelectItem>
                          <SelectItem value="supplier">Supplier</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="blacklisted">Blacklisted</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating (1-5)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 Star</SelectItem>
                          <SelectItem value="2">2 Stars</SelectItem>
                          <SelectItem value="3">3 Stars</SelectItem>
                          <SelectItem value="4">4 Stars</SelectItem>
                          <SelectItem value="5">5 Stars</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Services Offered */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Services Offered</h3>
              <div className="flex gap-2">
                <Input
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder="Add a service..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                />
                <Button type="button" onClick={addService}>Add</Button>
              </div>
              {services.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {services.map((service) => (
                    <Badge key={service} variant="secondary" className="cursor-pointer" onClick={() => removeService(service)}>
                      {service}
                      <i className="ri-close-line ml-1"></i>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Additional notes about this contact..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <i className="ri-loader-line mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line mr-2 h-4 w-4" />
                    Update Contact
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
