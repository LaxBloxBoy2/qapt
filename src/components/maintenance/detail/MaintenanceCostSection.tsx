"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { TransactionForm } from "@/components/finances/TransactionForm";
import { MaintenanceRequest } from "@/types/maintenance";
import { useMaintenanceTransactions } from "@/hooks/useFinances";

interface MaintenanceCostSectionProps {
  request: MaintenanceRequest;
}

export function MaintenanceCostSection({ request }: MaintenanceCostSectionProps) {
  const { toast } = useToast();
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");
  const [transactionSubtype, setTransactionSubtype] = useState<string>("invoice");

  // Fetch transactions related to this maintenance request
  const { data: transactions = [], isLoading: transactionsLoading } = useMaintenanceTransactions(request.id);

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleAddCost = (type: "income" | "expense", subtype: string) => {
    setTransactionType(type);
    setTransactionSubtype(subtype);
    setIsTransactionFormOpen(true);
  };

  const getCostStatus = () => {
    const estimated = request.estimated_cost || 0;
    const actual = request.actual_cost || 0;

    if (actual === 0) return "pending";
    if (actual <= estimated) return "on_budget";
    return "over_budget";
  };

  const getCostStatusBadge = () => {
    const status = getCostStatus();
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Pending</Badge>;
      case "on_budget":
        return <Badge className="bg-green-100 text-green-800 border-green-200">On Budget</Badge>;
      case "over_budget":
        return <Badge variant="destructive">Over Budget</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getVariance = () => {
    const estimated = request.estimated_cost || 0;
    const actual = request.actual_cost || 0;

    if (actual === 0) return 0;
    return actual - estimated;
  };

  const getVariancePercentage = () => {
    const estimated = request.estimated_cost || 0;
    const variance = getVariance();

    if (estimated === 0) return 0;
    return (variance / estimated) * 100;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Cost Tracking</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <i className="ri-add-line mr-2 h-4 w-4" />
                  Add Cost
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAddCost("expense", "invoice")}>
                  <i className="ri-file-text-line mr-2 h-4 w-4" />
                  Expense Invoice
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddCost("expense", "payment")}>
                  <i className="ri-money-dollar-circle-line mr-2 h-4 w-4" />
                  Expense Payment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddCost("income", "credit_note")}>
                  <i className="ri-refund-line mr-2 h-4 w-4" />
                  Credit/Refund
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cost Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <i className="ri-calculator-line h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Estimated Cost</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(request.estimated_cost)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <i className="ri-money-dollar-circle-line h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Actual Cost</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(request.actual_cost)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <i className="ri-line-chart-line h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Variance</span>
              </div>
              <div className={`text-2xl font-bold ${getVariance() > 0 ? 'text-red-600' : getVariance() < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                {getVariance() > 0 ? '+' : ''}{formatCurrency(Math.abs(getVariance()))}
              </div>
              {getVariance() !== 0 && (
                <div className={`text-xs ${getVariance() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {getVariance() > 0 ? '+' : ''}{getVariancePercentage().toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Budget Status:</span>
              {getCostStatusBadge()}
            </div>
            {getVariance() > 0 && (
              <div className="text-sm text-muted-foreground">
                Over budget by {formatCurrency(getVariance())}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddCost("expense", "invoice")}
            >
              <i className="ri-file-text-line mr-2 h-4 w-4" />
              Add Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddCost("expense", "payment")}
            >
              <i className="ri-money-dollar-circle-line mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </div>

          {/* Related Transactions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Related Transactions</h4>
            {transactionsLoading ? (
              <div className="text-sm text-muted-foreground">Loading transactions...</div>
            ) : transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        <i className={`h-4 w-4 ${
                          transaction.subtype === 'invoice' ? 'ri-file-text-line' :
                          transaction.subtype === 'payment' ? 'ri-money-dollar-circle-line' :
                          'ri-money-dollar-line'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {transaction.description || `${transaction.type} ${transaction.subtype}`.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <Badge variant={
                        transaction.status === 'paid' ? 'default' :
                        transaction.status === 'pending' ? 'secondary' :
                        'destructive'
                      } className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No transactions found for this maintenance request.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Form Modal */}
      <TransactionForm
        open={isTransactionFormOpen}
        onOpenChange={setIsTransactionFormOpen}
        defaultType={transactionType}
        defaultSubtype={transactionSubtype}
        maintenanceRequestId={request.id}
      />
    </>
  );
}
