"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { TenantBalance } from "@/types/balance";
import { format } from "date-fns";
import { useCurrencyFormatter } from "@/lib/currency";

interface BalancesTableProps {
  balances: TenantBalance[];
  isLoading: boolean;
  compactView: boolean;
  onSendNotice: (tenantId: string) => void;
  onApplyDeposits: (tenantId: string) => void;
  onApplyCredits: (tenantId: string) => void;
}

export function BalancesTable({
  balances,
  isLoading,
  compactView,
  onSendNotice,
  onApplyDeposits,
  onApplyCredits,
}: BalancesTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<string>("outstanding_balance");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { formatCurrency } = useCurrencyFormatter();

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const getStatusBadge = (balance: TenantBalance) => {
    if (balance.overdue_balance > 0) {
      return (
        <Badge variant="destructive">
          Overdue
        </Badge>
      );
    }
    if (balance.outstanding_balance > 0) {
      return (
        <Badge variant="secondary">
          Outstanding
        </Badge>
      );
    }
    return (
      <Badge variant="default">
        Current
      </Badge>
    );
  };

  const getAgingBadge = (daysOverdue: number) => {
    if (daysOverdue === 0) return null;

    let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
    let text = `${daysOverdue} days`;

    if (daysOverdue > 90) {
      variant = "destructive";
      text = `${daysOverdue} days (Critical)`;
    } else if (daysOverdue > 60) {
      variant = "destructive";
    } else if (daysOverdue > 30) {
      variant = "secondary";
    }

    return (
      <Badge variant={variant} className="text-xs">
        {text}
      </Badge>
    );
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedBalances = [...balances].sort((a, b) => {
    let aValue: any = a[sortField as keyof TenantBalance];
    let bValue: any = b[sortField as keyof TenantBalance];

    // Handle nested properties
    if (sortField === "tenant_name") {
      aValue = a.tenant.is_company && a.tenant.company_name
        ? a.tenant.company_name
        : `${a.tenant.first_name} ${a.tenant.last_name}`;
      bValue = b.tenant.is_company && b.tenant.company_name
        ? b.tenant.company_name
        : `${b.tenant.first_name} ${b.tenant.last_name}`;
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleTenantClick = (tenantId: string) => {
    router.push(`/tenants/${tenantId}?tab=transactions`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tenant Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
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
          <span>Tenant Balances</span>
          <span className="text-sm font-normal text-muted-foreground">
            {balances.length} tenants with outstanding balances
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
                  onClick={() => handleSort("outstanding_balance")}
                >
                  <div className="flex items-center">
                    Outstanding Balance
                    <i className="ri-arrow-up-down-line ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("tenant_name")}
                >
                  <div className="flex items-center">
                    Contact (Tenant)
                    <i className="ri-arrow-up-down-line ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                {!compactView && (
                  <>
                    <TableHead>Unit/Property</TableHead>
                    <TableHead>Lease Status</TableHead>
                    <TableHead>Aging</TableHead>
                    <TableHead>Last Payment</TableHead>
                  </>
                )}
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBalances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={compactView ? 4 : 8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <i className="ri-money-dollar-circle-line text-4xl text-muted-foreground" />
                      <p className="text-muted-foreground">No outstanding balances found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedBalances.map((balance) => (
                  <TableRow key={balance.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-lg font-semibold text-red-600">
                          {formatCurrency(balance.outstanding_balance)}
                        </span>
                        {balance.overdue_balance > 0 && (
                          <span className="text-xs text-red-500">
                            {formatCurrency(balance.overdue_balance)} overdue
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className="cursor-pointer hover:text-primary"
                        onClick={() => handleTenantClick(balance.tenant_id)}
                      >
                        <div className="font-medium">
                          {balance.tenant.is_company && balance.tenant.company_name
                            ? balance.tenant.company_name
                            : `${balance.tenant.first_name} ${balance.tenant.last_name}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {balance.tenant.email}
                        </div>
                      </div>
                    </TableCell>
                    {!compactView && (
                      <>
                        <TableCell>
                          {balance.tenant.unit ? (
                            <div className="flex flex-col">
                              <Badge variant="outline" className="w-fit">
                                {balance.tenant.unit.name}
                              </Badge>
                              <span className="text-xs text-muted-foreground mt-1">
                                {balance.tenant.unit.property.name}
                              </span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={balance.lease_status === "active" ? "default" : "secondary"}
                          >
                            {balance.lease_status || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getAgingBadge(balance.days_overdue)}
                        </TableCell>
                        <TableCell>
                          {formatDate(balance.last_payment_date)}
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      {getStatusBadge(balance)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <i className="ri-more-line h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {balance.tenant.email && balance.lease_status === "active" && (
                            <DropdownMenuItem onClick={() => onSendNotice(balance.tenant_id)}>
                              <i className="ri-mail-send-line mr-2 h-4 w-4" />
                              Send Notice
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onApplyDeposits(balance.tenant_id)}>
                            <i className="ri-bank-line mr-2 h-4 w-4" />
                            Apply Deposits
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onApplyCredits(balance.tenant_id)}>
                            <i className="ri-gift-line mr-2 h-4 w-4" />
                            Apply Credits
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
    </Card>
  );
}
