"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useApplyDeposits,
  useTenantDeposits,
  useOutstandingInvoices,
} from "@/hooks/useBalances";
import { useTenants } from "@/hooks/useTenants";
import { DepositApplication } from "@/types/balance";

interface ApplyDepositsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string | null;
}

export function ApplyDepositsDialog({ open, onOpenChange, tenantId }: ApplyDepositsDialogProps) {
  const [applications, setApplications] = useState<DepositApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const applyDeposits = useApplyDeposits();
  const { data: tenants } = useTenants();
  const { data: deposits } = useTenantDeposits(tenantId);
  const { data: outstandingInvoices } = useOutstandingInvoices(tenantId);

  const tenant = tenants?.find(t => t.id === tenantId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleApplicationChange = (depositId: string, invoiceId: string, amount: number) => {
    setApplications(prev => {
      const existing = prev.find(app => app.deposit_id === depositId && app.invoice_id === invoiceId);

      if (existing) {
        if (amount === 0) {
          return prev.filter(app => !(app.deposit_id === depositId && app.invoice_id === invoiceId));
        } else {
          return prev.map(app =>
            app.deposit_id === depositId && app.invoice_id === invoiceId
              ? { ...app, amount }
              : app
          );
        }
      } else if (amount > 0) {
        return [...prev, { deposit_id: depositId, invoice_id: invoiceId, amount }];
      }

      return prev;
    });
  };

  const getApplicationAmount = (depositId: string, invoiceId: string) => {
    const app = applications.find(app => app.deposit_id === depositId && app.invoice_id === invoiceId);
    return app?.amount || 0;
  };

  const getTotalApplicationsForDeposit = (depositId: string) => {
    return applications
      .filter(app => app.deposit_id === depositId)
      .reduce((sum, app) => sum + app.amount, 0);
  };

  const getTotalApplicationsForInvoice = (invoiceId: string) => {
    return applications
      .filter(app => app.invoice_id === invoiceId)
      .reduce((sum, app) => sum + app.amount, 0);
  };

  const onSubmit = async () => {
    if (!tenantId || applications.length === 0) return;

    setIsLoading(true);
    try {
      await applyDeposits.mutateAsync({
        tenant_id: tenantId,
        applications,
      });

      onOpenChange(false);
      setApplications([]);
    } catch (error) {
      console.error("Error applying deposits:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setApplications([]);
  };

  if (!tenant) return null;

  const tenantName = tenant.is_company && tenant.company_name
    ? tenant.company_name
    : `${tenant.first_name} ${tenant.last_name}`;

  const totalApplications = applications.reduce((sum, app) => sum + app.amount, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply Deposits</DialogTitle>
          <DialogDescription>
            Apply available deposits to outstanding invoices for {tenantName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Deposits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Available Deposits</CardTitle>
            </CardHeader>
            <CardContent>
              {!deposits || deposits.length === 0 ? (
                <p className="text-muted-foreground text-sm">No deposits available</p>
              ) : (
                <div className="space-y-3">
                  {deposits.map((deposit) => {
                    const totalApplied = getTotalApplicationsForDeposit(deposit.id);
                    const remaining = deposit.available_amount - totalApplied;

                    return (
                      <div key={deposit.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-medium">{deposit.description}</div>
                            <Badge variant="outline" className="text-xs">
                              {deposit.type.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatCurrency(deposit.available_amount)}
                            </div>
                            {totalApplied > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(remaining)} remaining
                              </div>
                            )}
                          </div>
                        </div>

                        {totalApplied > 0 && (
                          <div className="text-xs text-blue-600">
                            {formatCurrency(totalApplied)} applied to invoices
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outstanding Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Outstanding Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {!outstandingInvoices || outstandingInvoices.length === 0 ? (
                <p className="text-muted-foreground text-sm">No outstanding invoices</p>
              ) : (
                <div className="space-y-3">
                  {outstandingInvoices.map((invoice) => {
                    const totalApplied = getTotalApplicationsForInvoice(invoice.id);
                    const remaining = invoice.outstanding_amount - totalApplied;

                    return (
                      <div key={invoice.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-medium">{invoice.description}</div>
                            {invoice.days_overdue > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {invoice.days_overdue} days overdue
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-red-600">
                              {formatCurrency(invoice.outstanding_amount)}
                            </div>
                            {totalApplied > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(remaining)} remaining
                              </div>
                            )}
                          </div>
                        </div>

                        {totalApplied > 0 && (
                          <div className="text-xs text-green-600">
                            {formatCurrency(totalApplied)} from deposits
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Application Matrix */}
        {deposits && deposits.length > 0 && outstandingInvoices && outstandingInvoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Apply Deposits to Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Deposit</th>
                      {outstandingInvoices.map((invoice) => (
                        <th key={invoice.id} className="text-center p-2 min-w-[120px]">
                          <div className="truncate">{invoice.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(invoice.outstanding_amount)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((deposit) => (
                      <tr key={deposit.id} className="border-b">
                        <td className="p-2">
                          <div className="font-medium">{deposit.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(deposit.available_amount)} available
                          </div>
                        </td>
                        {outstandingInvoices.map((invoice) => (
                          <td key={invoice.id} className="p-2 text-center">
                            <Input
                              type="number"
                              min="0"
                              max={Math.min(
                                deposit.available_amount - getTotalApplicationsForDeposit(deposit.id) + getApplicationAmount(deposit.id, invoice.id),
                                invoice.outstanding_amount - getTotalApplicationsForInvoice(invoice.id) + getApplicationAmount(deposit.id, invoice.id)
                              )}
                              step="0.01"
                              value={getApplicationAmount(deposit.id, invoice.id) || ""}
                              onChange={(e) => {
                                const amount = parseFloat(e.target.value) || 0;
                                handleApplicationChange(deposit.id, invoice.id, amount);
                              }}
                              className="w-full text-center"
                              placeholder="0.00"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalApplications > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="font-medium">
                    Total to Apply: {formatCurrency(totalApplications)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {applications.length} application(s) configured
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isLoading || applications.length === 0}
          >
            {isLoading ? (
              <>
                <i className="ri-loader-line mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <i className="ri-bank-line mr-2 h-4 w-4" />
                Apply Deposits ({applications.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
