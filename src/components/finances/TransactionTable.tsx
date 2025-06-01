import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TransactionWithRelations } from "@/types/finance";
import { useDeleteTransaction, useUpdateTransaction } from "@/hooks/useFinances";
import { format } from "date-fns";
import { useCurrencyFormatter } from "@/lib/currency";

interface TransactionTableProps {
  transactions: TransactionWithRelations[];
  isLoading: boolean;
}

export function TransactionTable({ transactions, isLoading }: TransactionTableProps) {
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithRelations | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const deleteTransaction = useDeleteTransaction();
  const updateTransaction = useUpdateTransaction();
  const { formatCurrency } = useCurrencyFormatter();

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === "income" ? "default" : "secondary"}>
        <i className={`mr-1 ${type === "income" ? "ri-arrow-up-line" : "ri-arrow-down-line"}`} />
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let aValue: any = a[sortField as keyof TransactionWithRelations];
    let bValue: any = b[sortField as keyof TransactionWithRelations];

    // Handle nested properties
    if (sortField === "property_name") {
      aValue = a.property?.name || "";
      bValue = b.property?.name || "";
    } else if (sortField === "contact_name") {
      aValue = a.tenant
        ? `${a.tenant.first_name} ${a.tenant.last_name}`
        : a.vendor?.name || "";
      bValue = b.tenant
        ? `${b.tenant.first_name} ${b.tenant.last_name}`
        : b.vendor?.name || "";
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleViewDetails = (transaction: TransactionWithRelations) => {
    setSelectedTransaction(transaction);
    setShowDetailsDialog(true);
  };

  const handleEdit = (transaction: TransactionWithRelations) => {
    setSelectedTransaction(transaction);
    setShowEditDialog(true);
  };

  const handleDelete = (transaction: TransactionWithRelations) => {
    setSelectedTransaction(transaction);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (selectedTransaction) {
      await deleteTransaction.mutateAsync(selectedTransaction.id);
      setShowDeleteDialog(false);
      setSelectedTransaction(null);
    }
  };

  const handleMarkAsPaid = async (transaction: TransactionWithRelations) => {
    await updateTransaction.mutateAsync({
      id: transaction.id,
      values: {
        status: "paid",
        paid_date: new Date().toISOString().split('T')[0]
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Transactions</span>
          <span className="text-sm font-normal text-muted-foreground">
            {transactions.length} total
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("due_date")}
                >
                  <div className="flex items-center">
                    Due Date
                    <i className="ri-arrow-up-down-line ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("type")}
                >
                  <div className="flex items-center">
                    Type
                    <i className="ri-arrow-up-down-line ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("property_name")}
                >
                  <div className="flex items-center">
                    Property
                    <i className="ri-arrow-up-down-line ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("contact_name")}
                >
                  <div className="flex items-center">
                    Contact
                    <i className="ri-arrow-up-down-line ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center justify-end">
                    Amount
                    <i className="ri-arrow-up-down-line ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    <i className="ri-arrow-up-down-line ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <i className="ri-file-list-line text-4xl text-muted-foreground" />
                      <p className="text-muted-foreground">No transactions found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-muted/50">
                    <TableCell>
                      {formatDate(transaction.due_date || transaction.created_at)}
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(transaction.type)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {transaction.category?.name || "-"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {transaction.subtype.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.property ? (
                        <Badge variant="outline" className="font-normal">
                          {transaction.property.name}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {transaction.tenant ? (
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {transaction.tenant.is_company && transaction.tenant.company_name
                              ? transaction.tenant.company_name
                              : `${transaction.tenant.first_name} ${transaction.tenant.last_name}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Tenant
                          </span>
                        </div>
                      ) : transaction.vendor ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{transaction.vendor.name}</span>
                          <span className="text-xs text-muted-foreground">
                            Vendor
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={transaction.type === "income" ? "text-green-600" : "text-red-600"}>
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <i className="ri-more-line h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(transaction)}>
                            <i className="ri-eye-line mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {transaction.status === "pending" && (
                            <DropdownMenuItem
                              onClick={() => handleMarkAsPaid(transaction)}
                              disabled={updateTransaction.isPending}
                            >
                              <i className="ri-check-line mr-2 h-4 w-4" />
                              {updateTransaction.isPending ? "Updating..." : "Mark as Paid"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                            <i className="ri-edit-line mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(transaction)}
                          >
                            <i className="ri-delete-bin-line mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
              {selectedTransaction && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <strong>{selectedTransaction.description}</strong> - {formatCurrency(selectedTransaction.amount)}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transaction Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <div className="flex items-center gap-2">
                    {getTypeBadge(selectedTransaction.type)}
                    <span className="text-sm">{selectedTransaction.subtype.replace("_", " ").toUpperCase()}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div>{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <div className="text-lg font-semibold">
                    <span className={selectedTransaction.type === "income" ? "text-green-600" : "text-red-600"}>
                      {selectedTransaction.type === "income" ? "+" : "-"}
                      {formatCurrency(selectedTransaction.amount)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                  <div>{formatDate(selectedTransaction.due_date || selectedTransaction.created_at)}</div>
                </div>
              </div>

              {selectedTransaction.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <div>{selectedTransaction.description}</div>
                </div>
              )}

              {selectedTransaction.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <div className="p-2 bg-muted rounded">{selectedTransaction.notes}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedTransaction.property && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Property</label>
                    <div>{selectedTransaction.property.name}</div>
                  </div>
                )}

                {selectedTransaction.category && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <div>{selectedTransaction.category.name}</div>
                  </div>
                )}

                {selectedTransaction.tenant && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tenant</label>
                    <div>
                      {selectedTransaction.tenant.is_company && selectedTransaction.tenant.company_name
                        ? selectedTransaction.tenant.company_name
                        : `${selectedTransaction.tenant.first_name} ${selectedTransaction.tenant.last_name}`}
                    </div>
                  </div>
                )}

                {selectedTransaction.vendor && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Vendor</label>
                    <div>{selectedTransaction.vendor.name}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog Placeholder */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Transaction editing functionality will be implemented here.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
