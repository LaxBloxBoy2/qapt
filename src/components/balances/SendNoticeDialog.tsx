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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSendNotice, useOutstandingInvoices } from "@/hooks/useBalances";
import { useTenants } from "@/hooks/useTenants";
import { useCurrencyFormatter } from "@/lib/currency";

const sendNoticeSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  include_invoice_summary: z.boolean(),
  send_copy_to_self: z.boolean(),
});

type SendNoticeForm = z.infer<typeof sendNoticeSchema>;

interface SendNoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string | null;
}

export function SendNoticeDialog({ open, onOpenChange, tenantId }: SendNoticeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const sendNotice = useSendNotice();
  const { data: tenants } = useTenants();
  const { data: outstandingInvoices } = useOutstandingInvoices(tenantId);
  const { formatCurrency } = useCurrencyFormatter();

  const tenant = tenants?.find(t => t.id === tenantId);

  const form = useForm<SendNoticeForm>({
    resolver: zodResolver(sendNoticeSchema),
    defaultValues: {
      subject: "",
      message: "",
      include_invoice_summary: true,
      send_copy_to_self: false,
    },
  });

  // Set default subject and message when tenant changes
  useEffect(() => {
    if (tenant && open) {
      const tenantName = tenant.is_company && tenant.company_name
        ? tenant.company_name
        : `${tenant.first_name} ${tenant.last_name}`;

      const totalOutstanding = outstandingInvoices?.reduce((sum, invoice) => sum + invoice.outstanding_amount, 0) || 0;

      form.setValue("subject", `Outstanding Balance Notice - ${tenantName}`);
      form.setValue("message", `Dear ${tenantName},

We hope this message finds you well. We are writing to inform you that your account currently has an outstanding balance of ${formatCurrency(totalOutstanding)}.

Please review the attached invoice summary and arrange for payment at your earliest convenience. If you have any questions or concerns regarding this balance, please don't hesitate to contact us.

We appreciate your prompt attention to this matter.

Best regards,
Property Management Team`);
    }
  }, [tenant, outstandingInvoices, open, form, formatCurrency]);

  const onSubmit = async (data: SendNoticeForm) => {
    if (!tenantId) return;

    setIsLoading(true);
    try {
      await sendNotice.mutateAsync({
        tenant_id: tenantId,
        subject: data.subject,
        message: data.message,
        include_invoice_summary: data.include_invoice_summary,
        send_copy_to_self: data.send_copy_to_self,
      });

      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error sending notice:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  if (!tenant) return null;

  const totalOutstanding = outstandingInvoices?.reduce((sum, invoice) => sum + invoice.outstanding_amount, 0) || 0;
  const tenantName = tenant.is_company && tenant.company_name
    ? tenant.company_name
    : `${tenant.first_name} ${tenant.last_name}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Notice to Tenant</DialogTitle>
          <DialogDescription>
            Send an overdue notice to {tenantName} ({tenant.email})
          </DialogDescription>
        </DialogHeader>

        {/* Invoice Summary */}
        {outstandingInvoices && outstandingInvoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Outstanding Invoices Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {outstandingInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{invoice.description}</span>
                      {invoice.days_overdue > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {invoice.days_overdue} days overdue
                        </Badge>
                      )}
                    </div>
                    <span className="font-medium">
                      {formatCurrency(invoice.outstanding_amount)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 flex items-center justify-between font-semibold">
                  <span>Total Outstanding:</span>
                  <span className="text-red-600">
                    {formatCurrency(totalOutstanding)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter email subject" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter your message"
                      rows={8}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Options */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="include_invoice_summary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Include invoice summary in email
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="send_copy_to_self"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Send a copy to myself
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <i className="ri-loader-line mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="ri-mail-send-line mr-2 h-4 w-4" />
                    Send Notice
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
