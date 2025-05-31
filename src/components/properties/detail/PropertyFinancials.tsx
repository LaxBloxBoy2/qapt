"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGetPropertyLoan, useUpdatePropertyLoan } from "@/hooks/usePropertyLoan";
import { useGetPropertyPurchase, useUpdatePropertyPurchase } from "@/hooks/usePropertyPurchase";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface PropertyFinancialsProps {
  propertyId: string;
}

// Schema for loan form
const loanSchema = z.object({
  start_date: z.string().min(1, "Start date is required"),
  loan_amount: z.coerce.number().positive("Loan amount must be positive"),
  interest_rate: z.coerce.number().min(0, "Interest rate must be positive"),
  loan_type: z.string().min(1, "Loan type is required"),
  period_years: z.coerce.number().positive("Period must be positive"),
  current_balance: z.coerce.number().min(0, "Current balance must be positive"),
  contact_name: z.string().optional(),
  contact_email: z.string().email("Invalid email").optional().or(z.literal('')),
  contact_phone: z.string().optional(),
});

// Schema for purchase form
const purchaseSchema = z.object({
  purchase_date: z.string().min(1, "Purchase date is required"),
  purchase_price: z.coerce.number().positive("Purchase price must be positive"),
  down_payment: z.coerce.number().min(0, "Down payment must be positive"),
  depreciation_years: z.coerce.number().positive("Depreciation years must be positive"),
  land_value: z.coerce.number().min(0, "Land value must be positive"),
  notes: z.string().optional(),
});

type LoanFormValues = z.infer<typeof loanSchema>;
type PurchaseFormValues = z.infer<typeof purchaseSchema>;

export function PropertyFinancials({ propertyId }: PropertyFinancialsProps) {
  const [isLoanDialogOpen, setIsLoanDialogOpen] = useState(false);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  
  const { data: loan, isLoading: isLoanLoading } = useGetPropertyLoan(propertyId);
  const { data: purchase, isLoading: isPurchaseLoading } = useGetPropertyPurchase(propertyId);
  
  const updateLoan = useUpdatePropertyLoan();
  const updatePurchase = useUpdatePropertyPurchase();
  
  const { toast } = useToast();

  const loanForm = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      start_date: "",
      loan_amount: 0,
      interest_rate: 0,
      loan_type: "",
      period_years: 30,
      current_balance: 0,
      contact_name: "",
      contact_email: "",
      contact_phone: "",
    }
  });

  const purchaseForm = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      purchase_date: "",
      purchase_price: 0,
      down_payment: 0,
      depreciation_years: 27.5, // Default for residential real estate
      land_value: 0,
      notes: "",
    }
  });

  const openLoanDialog = () => {
    if (loan) {
      loanForm.reset({
        start_date: loan.start_date ? format(new Date(loan.start_date), "yyyy-MM-dd") : "",
        loan_amount: loan.loan_amount || 0,
        interest_rate: loan.interest_rate || 0,
        loan_type: loan.loan_type || "",
        period_years: loan.period_years || 30,
        current_balance: loan.current_balance || 0,
        contact_name: loan.contact_name || "",
        contact_email: loan.contact_email || "",
        contact_phone: loan.contact_phone || "",
      });
    } else {
      loanForm.reset({
        start_date: "",
        loan_amount: 0,
        interest_rate: 0,
        loan_type: "",
        period_years: 30,
        current_balance: 0,
        contact_name: "",
        contact_email: "",
        contact_phone: "",
      });
    }
    
    setIsLoanDialogOpen(true);
  };

  const openPurchaseDialog = () => {
    if (purchase) {
      purchaseForm.reset({
        purchase_date: purchase.purchase_date ? format(new Date(purchase.purchase_date), "yyyy-MM-dd") : "",
        purchase_price: purchase.purchase_price || 0,
        down_payment: purchase.down_payment || 0,
        depreciation_years: purchase.depreciation_years || 27.5,
        land_value: purchase.land_value || 0,
        notes: purchase.notes || "",
      });
    } else {
      purchaseForm.reset({
        purchase_date: "",
        purchase_price: 0,
        down_payment: 0,
        depreciation_years: 27.5,
        land_value: 0,
        notes: "",
      });
    }
    
    setIsPurchaseDialogOpen(true);
  };

  const onLoanSubmit = async (data: LoanFormValues) => {
    try {
      await updateLoan.mutateAsync({
        propertyId,
        loan: data
      });
      
      setIsLoanDialogOpen(false);
      toast({
        title: "Loan information updated",
        description: "Loan information has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error updating loan information",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const onPurchaseSubmit = async (data: PurchaseFormValues) => {
    try {
      await updatePurchase.mutateAsync({
        propertyId,
        purchase: data
      });
      
      setIsPurchaseDialogOpen(false);
      toast({
        title: "Purchase information updated",
        description: "Purchase information has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error updating purchase information",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Manage financial information for this property, including loan and purchase details.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Loan Information */}
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Loan Information</h3>
            <Button variant="outline" size="sm" onClick={openLoanDialog}>
              {loan ? (
                <>
                  <i className="ri-edit-line mr-1" />
                  Edit
                </>
              ) : (
                <>
                  <i className="ri-add-line mr-1" />
                  Add
                </>
              )}
            </Button>
          </div>
          
          {isLoanLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : loan ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                  <p className="font-medium">
                    {loan.start_date ? format(new Date(loan.start_date), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loan Type</p>
                  <p className="font-medium">{loan.loan_type || "N/A"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loan Amount</p>
                  <p className="font-medium">${loan.loan_amount?.toLocaleString() || "0"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                  <p className="font-medium">${loan.current_balance?.toLocaleString() || "0"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Interest Rate</p>
                  <p className="font-medium">{loan.interest_rate}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Period</p>
                  <p className="font-medium">{loan.period_years} years</p>
                </div>
              </div>
              
              {(loan.contact_name || loan.contact_email || loan.contact_phone) && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Contact Information</p>
                  
                  {loan.contact_name && (
                    <p className="text-sm">
                      <span className="font-medium">Name:</span> {loan.contact_name}
                    </p>
                  )}
                  
                  {loan.contact_email && (
                    <p className="text-sm">
                      <span className="font-medium">Email:</span> {loan.contact_email}
                    </p>
                  )}
                  
                  {loan.contact_phone && (
                    <p className="text-sm">
                      <span className="font-medium">Phone:</span> {loan.contact_phone}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No loan information added</p>
              <Button variant="outline" size="sm" onClick={openLoanDialog}>
                <i className="ri-add-line mr-1" />
                Add Loan Information
              </Button>
            </div>
          )}
        </div>
        
        {/* Purchase Information */}
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Purchase Information</h3>
            <Button variant="outline" size="sm" onClick={openPurchaseDialog}>
              {purchase ? (
                <>
                  <i className="ri-edit-line mr-1" />
                  Edit
                </>
              ) : (
                <>
                  <i className="ri-add-line mr-1" />
                  Add
                </>
              )}
            </Button>
          </div>
          
          {isPurchaseLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : purchase ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Purchase Date</p>
                <p className="font-medium">
                  {purchase.purchase_date ? format(new Date(purchase.purchase_date), "MMM d, yyyy") : "N/A"}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Purchase Price</p>
                  <p className="font-medium">${purchase.purchase_price?.toLocaleString() || "0"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Down Payment</p>
                  <p className="font-medium">${purchase.down_payment?.toLocaleString() || "0"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Depreciation</p>
                  <p className="font-medium">{purchase.depreciation_years} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Land Value</p>
                  <p className="font-medium">${purchase.land_value?.toLocaleString() || "0"}</p>
                </div>
              </div>
              
              {purchase.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Notes</p>
                  <p className="text-sm">{purchase.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No purchase information added</p>
              <Button variant="outline" size="sm" onClick={openPurchaseDialog}>
                <i className="ri-add-line mr-1" />
                Add Purchase Information
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Loan Dialog */}
      <Dialog open={isLoanDialogOpen} onOpenChange={setIsLoanDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {loan ? "Edit Loan Information" : "Add Loan Information"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...loanForm}>
            <form onSubmit={loanForm.handleSubmit(onLoanSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={loanForm.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loanForm.control}
                  name="loan_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Fixed, ARM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={loanForm.control}
                  name="loan_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Amount ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loanForm.control}
                  name="current_balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Balance ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={loanForm.control}
                  name="interest_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interest Rate (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loanForm.control}
                  name="period_years"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period (years)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium mb-2">Contact Information (Optional)</h4>
                
                <FormField
                  control={loanForm.control}
                  name="contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={loanForm.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loanForm.control}
                    name="contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setIsLoanDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateLoan.isPending}
                >
                  {updateLoan.isPending ? "Saving..." : "Save Loan Information"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {purchase ? "Edit Purchase Information" : "Add Purchase Information"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...purchaseForm}>
            <form onSubmit={purchaseForm.handleSubmit(onPurchaseSubmit)} className="space-y-4">
              <FormField
                control={purchaseForm.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={purchaseForm.control}
                  name="purchase_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={purchaseForm.control}
                  name="down_payment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Down Payment ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={purchaseForm.control}
                  name="depreciation_years"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Depreciation (years)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={purchaseForm.control}
                  name="land_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Land Value ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={purchaseForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter additional notes" 
                        className="resize-none h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4 pt-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setIsPurchaseDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updatePurchase.isPending}
                >
                  {updatePurchase.isPending ? "Saving..." : "Save Purchase Information"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
