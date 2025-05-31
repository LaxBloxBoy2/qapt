import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { transactionSchema, TransactionFormValues, TransactionType } from "@/types/finance";
import {
  useCreateTransaction,
  useTransactionCategories,
  useVendors
} from "@/hooks/useFinances";
import { useGetProperties } from "@/hooks/useProperties";
import { useTenants } from "@/hooks/useTenants";
import { useGetUnits } from "@/hooks/useUnits";
import { useLeases } from "@/hooks/useLeases";
import { format } from "date-fns";

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: TransactionType;
  defaultSubtype?: string;
  transaction?: any; // For editing
  maintenanceRequestId?: string; // For linking to maintenance requests
}

export function TransactionForm({
  open,
  onOpenChange,
  defaultType = "income",
  defaultSubtype = "invoice",
  transaction,
  maintenanceRequestId,
}: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>("");

  const createTransaction = useCreateTransaction();

  // Data hooks
  const { data: properties } = useGetProperties();
  const { data: tenants } = useTenants();
  const { data: vendors } = useVendors();
  const { data: leases } = useLeases();
  const { data: units } = useGetUnits();
  const { data: categories } = useTransactionCategories();

  // Form setup
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: defaultType,
      subtype: defaultSubtype as any,
      amount: 0,
      is_recurring: false,
      description: "",
      notes: "",
    },
  });

  // Watch form values for dynamic behavior
  const watchedType = form.watch("type");
  const watchedSubtype = form.watch("subtype");
  const watchedPropertyId = form.watch("property_id");
  const watchedIsRecurring = form.watch("is_recurring");

  // Filter categories by type
  const filteredCategories = categories?.filter(cat => cat.type === watchedType) || [];

  // Filter units by selected property
  const filteredUnits = units?.filter(unit => unit.property_id === watchedPropertyId) || [];

  // Filter tenants by selected property (through leases)
  const filteredTenants = tenants?.filter(tenant => {
    if (!watchedPropertyId) return true;
    return leases?.some(lease =>
      lease.unit?.property_id === watchedPropertyId &&
      lease.tenants?.some(t => t.id === tenant.id)
    );
  }) || [];

  // Update form when defaults change
  useEffect(() => {
    if (open) {
      form.reset({
        type: defaultType,
        subtype: defaultSubtype as any,
        amount: 0,
        is_recurring: false,
        description: "",
        notes: "",
        due_date: format(new Date(), "yyyy-MM-dd"),
      });
    }
  }, [open, defaultType, defaultSubtype, form]);

  // Handle property selection
  useEffect(() => {
    if (watchedPropertyId !== selectedProperty) {
      setSelectedProperty(watchedPropertyId || "");
      // Clear dependent fields when property changes
      form.setValue("unit_id", "");
      form.setValue("tenant_id", "");
    }
  }, [watchedPropertyId, selectedProperty, form]);

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      setIsSubmitting(true);

      // Add maintenance request ID if provided
      const transactionData = {
        ...values,
        ...(maintenanceRequestId && { maintenance_request_id: maintenanceRequestId })
      };

      await createTransaction.mutateAsync(transactionData);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error creating transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormTitle = () => {
    const typeLabel = watchedType === "income" ? "Money In" : "Money Out";
    const subtypeLabel = watchedSubtype?.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()) || "";
    return `${typeLabel} - ${subtypeLabel}`;
  };

  const getFormDescription = () => {
    const descriptions = {
      income: {
        invoice: "Create an income invoice for rent or other charges",
        payment: "Record an income payment received",
        deposit: "Record a security deposit received",
        credit_note: "Issue a credit note to a tenant",
      },
      expense: {
        invoice: "Create an expense invoice from a vendor",
        payment: "Record an expense payment made",
        return_deposit: "Return a security deposit to a tenant",
        apply_deposit: "Apply a deposit to cover charges",
      },
    };

    const typeDescriptions = descriptions[watchedType];
    return typeDescriptions?.[watchedSubtype as keyof typeof typeDescriptions] ||
           "Fill out the form below to create a new transaction.";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getFormTitle()}</DialogTitle>
          <DialogDescription>{getFormDescription()}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Transaction Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Transaction Subtype */}
              <FormField
                control={form.control}
                name="subtype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtype*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {watchedType === "income" ? (
                          <>
                            <SelectItem value="invoice">Invoice</SelectItem>
                            <SelectItem value="payment">Payment</SelectItem>
                            <SelectItem value="deposit">Deposit</SelectItem>
                            <SelectItem value="credit_note">Credit Note</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="invoice">Invoice</SelectItem>
                            <SelectItem value="payment">Payment</SelectItem>
                            <SelectItem value="return_deposit">Return Deposit</SelectItem>
                            <SelectItem value="apply_deposit">Apply Deposit</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.map((category) => (
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

              {/* Property */}
              <FormField
                control={form.control}
                name="property_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
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

              {/* Unit */}
              {watchedPropertyId && (
                <FormField
                  control={form.control}
                  name="unit_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredUnits.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Contact (Tenant or Vendor) */}
              {watchedType === "income" ? (
                <FormField
                  control={form.control}
                  name="tenant_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tenant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredTenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.is_company && tenant.company_name
                                ? tenant.company_name
                                : `${tenant.first_name} ${tenant.last_name}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="vendor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vendor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vendors?.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Due Date */}
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method */}
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="online">Online Payment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the transaction" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes or details"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurring Options */}
            <FormField
              control={form.control}
              name="is_recurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Make this a recurring transaction</FormLabel>
                    <FormDescription>
                      This transaction will be automatically created at regular intervals
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {watchedIsRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="recurring_frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recurring_end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave empty for indefinite recurring
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Creating...
                  </>
                ) : (
                  "Create Transaction"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
