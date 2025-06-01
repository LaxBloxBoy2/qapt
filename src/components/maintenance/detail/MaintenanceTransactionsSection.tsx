"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrencyFormatter } from "@/lib/currency";

interface Transaction {
  id: string;
  type: 'expense_invoice' | 'expense_payment' | 'refund' | 'deposit';
  description: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid' | 'cancelled';
}

interface MaintenanceTransactionsSectionProps {
  requestId: string;
}

export function MaintenanceTransactionsSection({ requestId }: MaintenanceTransactionsSectionProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { formatCurrency } = useCurrencyFormatter();

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'expense_invoice': return 'ri-file-text-line';
      case 'expense_payment': return 'ri-money-dollar-circle-line';
      case 'refund': return 'ri-refund-line';
      case 'deposit': return 'ri-bank-line';
      default: return 'ri-money-dollar-line';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Transactions</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <i className="ri-money-dollar-circle-line mr-1 h-3 w-3" />
              Money In
            </Button>
            <Button variant="outline" size="sm">
              <i className="ri-money-dollar-circle-line mr-1 h-3 w-3" />
              Money Out
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <i className={`${getTransactionIcon(transaction.type)} h-4 w-4`} />
                          <span className="capitalize">
                            {transaction.type.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <i className="ri-more-line h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <i className="ri-money-dollar-line text-4xl mb-2 block" />
            <p className="text-sm">No transactions recorded</p>
            <p className="text-xs">Use Money In/Out buttons to create transactions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
