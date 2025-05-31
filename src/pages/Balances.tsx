"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useBalances, useBalancesSummary } from "@/hooks/useBalances";
import { useGetProperties } from "@/hooks/useProperties";
import { useTenants } from "@/hooks/useTenants";
import { BalanceFilters, AgingPeriod } from "@/types/balance";
import { BalancesTable } from "@/components/balances/BalancesTable";
import { BalancesSummaryCards } from "@/components/balances/BalancesSummaryCards";
import { SendNoticeDialog } from "@/components/balances/SendNoticeDialog";
import { ApplyDepositsDialog } from "@/components/balances/ApplyDepositsDialog";
import { ApplyCreditsDialog } from "@/components/balances/ApplyCreditsDialog";

export default function Balances() {
  const [filters, setFilters] = useState<BalanceFilters>({});
  const [activeTab, setActiveTab] = useState<AgingPeriod>("all");
  const [compactView, setCompactView] = useState(false);
  const [showSendNotice, setShowSendNotice] = useState(false);
  const [showApplyDeposits, setShowApplyDeposits] = useState(false);
  const [showApplyCredits, setShowApplyCredits] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Data hooks
  const { data: balances, isLoading: balancesLoading } = useBalances({ ...filters, aging_period: activeTab });
  const { data: summary, isLoading: summaryLoading } = useBalancesSummary(filters);
  const { data: properties } = useGetProperties();
  const { data: tenants } = useTenants();

  // Handle filter changes
  const handleFilterChange = (key: keyof BalanceFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? undefined : value
    }));
  };

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value as AgingPeriod);
  };

  // Handle actions
  const handleSendNotice = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setShowSendNotice(true);
  };

  const handleApplyDeposits = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setShowApplyDeposits(true);
  };

  const handleApplyCredits = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setShowApplyCredits(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Balances</h1>
          <p className="text-muted-foreground">
            Track tenant outstanding balances and aging
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Compact view</span>
          <Switch
            checked={compactView}
            onCheckedChange={setCompactView}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <BalancesSummaryCards
        summary={summary}
        isLoading={summaryLoading}
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Property Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Property</label>
              <Select
                value={filters.property_id || "all"}
                onValueChange={(value) => handleFilterChange("property_id", value)}
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
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tenant Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tenant</label>
              <Select
                value={filters.tenant_id || "all"}
                onValueChange={(value) => handleFilterChange("tenant_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Tenants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenants</SelectItem>
                  {tenants?.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.is_company && tenant.company_name
                        ? tenant.company_name
                        : `${tenant.first_name} ${tenant.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lease Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Lease Status</label>
              <Select
                value={filters.lease_status || "all"}
                onValueChange={(value) => handleFilterChange("lease_status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Lease Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <Input
              placeholder="Search tenants..."
              value={filters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Aging Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="0-30">0–30 days</TabsTrigger>
          <TabsTrigger value="30-60">30–60 days</TabsTrigger>
          <TabsTrigger value="60-90">60–90 days</TabsTrigger>
          <TabsTrigger value="90+">90+ days</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <BalancesTable
            balances={balances || []}
            isLoading={balancesLoading}
            compactView={compactView}
            onSendNotice={handleSendNotice}
            onApplyDeposits={handleApplyDeposits}
            onApplyCredits={handleApplyCredits}
          />
        </TabsContent>
      </Tabs>

      {/* Action Dialogs */}
      <SendNoticeDialog
        open={showSendNotice}
        onOpenChange={setShowSendNotice}
        tenantId={selectedTenantId}
      />

      <ApplyDepositsDialog
        open={showApplyDeposits}
        onOpenChange={setShowApplyDeposits}
        tenantId={selectedTenantId}
      />

      <ApplyCreditsDialog
        open={showApplyCredits}
        onOpenChange={setShowApplyCredits}
        tenantId={selectedTenantId}
      />
    </div>
  );
}
