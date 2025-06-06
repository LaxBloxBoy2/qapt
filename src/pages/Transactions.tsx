import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTransactions, useFinancialSummary, useVendors } from "@/hooks/useFinances";
import { useGetProperties } from "@/hooks/useProperties";
import { useTenants } from "@/hooks/useTenants";
import { TransactionFilters, TransactionType } from "@/types/finance";
import { TransactionForm } from "@/components/finances/TransactionForm";
import { TransactionTable } from "@/components/finances/TransactionTable";
import { FinanceSummaryCards } from "@/components/finances/FinanceSummaryCards";
import { format } from "date-fns";

export default function Transactions() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>("income");
  const [transactionSubtype, setTransactionSubtype] = useState<string>("invoice");

  // Data hooks
  const { data: transactions, isLoading: transactionsLoading } = useTransactions(filters);
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary(filters);
  const { data: properties } = useGetProperties();
  const { data: tenants } = useTenants();
  const { data: vendors } = useVendors();

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "all") {
      setFilters(prev => ({ ...prev, type: undefined }));
    } else {
      setFilters(prev => ({ ...prev, type: value as TransactionType }));
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle money in/out actions
  const handleMoneyAction = (type: TransactionType, subtype: string) => {
    setTransactionType(type);
    setTransactionSubtype(subtype);
    setShowTransactionForm(true);
  };

  // Export functionality
  const handleExport = () => {
    if (!transactions) return;

    const csvContent = [
      ["Date", "Type", "Category", "Property", "Contact", "Amount", "Status", "Notes"].join(","),
      ...transactions.map(t => [
        t.due_date || t.created_at.split('T')[0],
        t.type,
        t.category?.name || "",
        t.property?.name || "",
        t.tenant ? `${t.tenant.first_name} ${t.tenant.last_name}` : t.vendor?.name || "",
        t.amount,
        t.status,
        t.notes || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <i className="ri-download-line mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <FinanceSummaryCards summary={summary} isLoading={summaryLoading} />

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Transaction Type Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full lg:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="expense">Expense</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {/* Money In Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <i className="ri-add-line mr-2 h-4 w-4" />
                    Money In
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleMoneyAction("income", "invoice")}>
                    <i className="ri-file-text-line mr-2 h-4 w-4" />
                    Income Invoice
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMoneyAction("income", "payment")}>
                    <i className="ri-money-dollar-circle-line mr-2 h-4 w-4" />
                    Income Payment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMoneyAction("income", "deposit")}>
                    <i className="ri-safe-line mr-2 h-4 w-4" />
                    Deposit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMoneyAction("income", "credit_note")}>
                    <i className="ri-refund-line mr-2 h-4 w-4" />
                    Credit Note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Money Out Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                    <i className="ri-subtract-line mr-2 h-4 w-4" />
                    Money Out
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleMoneyAction("expense", "invoice")}>
                    <i className="ri-file-text-line mr-2 h-4 w-4" />
                    Expense Invoice
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMoneyAction("expense", "payment")}>
                    <i className="ri-money-dollar-circle-line mr-2 h-4 w-4" />
                    Expense Payment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMoneyAction("expense", "return_deposit")}>
                    <i className="ri-refund-2-line mr-2 h-4 w-4" />
                    Return Deposit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMoneyAction("expense", "apply_deposit")}>
                    <i className="ri-exchange-line mr-2 h-4 w-4" />
                    Apply Deposit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={filters.date_from || ""}
                onChange={(e) => handleFilterChange("date_from", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={filters.date_to || ""}
                onChange={(e) => handleFilterChange("date_to", e.target.value)}
              />
            </div>

            {/* Property Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Property</label>
              <Select
                value={filters.property_id || "all"}
                onValueChange={(value) => handleFilterChange("property_id", value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties?.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) => handleFilterChange("status", value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search transactions..."
                value={filters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <TransactionTable
        transactions={transactions || []}
        isLoading={transactionsLoading}
      />

      {/* Transaction Form Modal */}
      <TransactionForm
        open={showTransactionForm}
        onOpenChange={setShowTransactionForm}
        defaultType={transactionType}
        defaultSubtype={transactionSubtype}
      />
    </div>
  );
}

// Force server-side rendering to avoid static generation issues
export async function getServerSideProps() {
  return {
    props: {},
  };
}
