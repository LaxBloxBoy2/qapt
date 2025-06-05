"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { ReportFilters, type ReportFilters as ReportFiltersType } from "@/components/reports/ReportFilters";
import { useGetProperties } from "@/hooks/useProperties";
import { useMaintenanceRequests } from "@/hooks/useMaintenance";
import { useLeases } from "@/hooks/useLeases";
import { useTransactions } from "@/hooks/useFinances";

interface EventHistoryEntry {
  id: string;
  date: string;
  property_name: string;
  unit_name: string;
  event_type: 'maintenance' | 'lease' | 'payment' | 'inspection' | 'other';
  event_category: string;
  description: string;
  amount?: number;
  status: string;
  priority?: string;
  assigned_to?: string;
}

function EventHistoryReportPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<ReportFiltersType>({
    properties: [],
    categories: [],
    assignees: [],
    dateFrom: '',
    dateTo: '',
    status: 'all',
    search: '',
  });

  // Fetch data
  const { data: properties } = useGetProperties();
  const { data: maintenanceRequests } = useMaintenanceRequests();
  const { data: leases } = useLeases();
  const { data: transactions } = useTransactions({
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
  });

  const [eventHistory, setEventHistory] = useState<EventHistoryEntry[]>([]);

  // Process data into event history format
  useEffect(() => {
    if (!properties) return;

    const events: EventHistoryEntry[] = [];

    // Add maintenance events
    if (maintenanceRequests) {
      maintenanceRequests.forEach(request => {
        const property = properties.find(p => p.id === request.property_id);
        events.push({
          id: `maintenance-${request.id}`,
          date: request.created_at,
          property_name: property?.name || 'Unknown Property',
          unit_name: request.unit?.name || 'Common Area',
          event_type: 'maintenance',
          event_category: request.type || 'General',
          description: request.description || 'Maintenance request',
          status: request.status,
          priority: request.priority,
          assigned_to: request.assigned_to?.first_name && request.assigned_to?.last_name 
            ? `${request.assigned_to.first_name} ${request.assigned_to.last_name}`
            : undefined,
        });
      });
    }

    // Add lease events
    if (leases) {
      leases.forEach(lease => {
        const property = properties.find(p => p.id === lease.property?.id);
        const tenant = lease.primary_tenant;
        
        // Lease start event
        events.push({
          id: `lease-start-${lease.id}`,
          date: lease.start_date,
          property_name: property?.name || 'Unknown Property',
          unit_name: lease.unit?.name || 'Unknown Unit',
          event_type: 'lease',
          event_category: 'Lease Start',
          description: `Lease started for ${tenant ? `${tenant.first_name} ${tenant.last_name}` : 'tenant'}`,
          amount: lease.rent_amount,
          status: 'completed',
        });

        // Lease end event (if ended)
        const leaseEndDate = new Date(lease.end_date);
        const currentDate = new Date();
        if (leaseEndDate < currentDate) {
          events.push({
            id: `lease-end-${lease.id}`,
            date: lease.end_date,
            property_name: property?.name || 'Unknown Property',
            unit_name: lease.unit?.name || 'Unknown Unit',
            event_type: 'lease',
            event_category: 'Lease End',
            description: `Lease ended for ${tenant ? `${tenant.first_name} ${tenant.last_name}` : 'tenant'}`,
            amount: lease.rent_amount,
            status: 'completed',
          });
        }
      });
    }

    // Add transaction events
    if (transactions) {
      transactions.forEach(transaction => {
        const property = properties.find(p => p.id === transaction.property_id);
        events.push({
          id: `transaction-${transaction.id}`,
          date: transaction.due_date || transaction.created_at,
          property_name: property?.name || 'Unknown Property',
          unit_name: transaction.unit?.name || 'N/A',
          event_type: 'payment',
          event_category: transaction.type === 'income' ? 'Income' : 'Expense',
          description: transaction.description || 'Transaction',
          amount: transaction.amount,
          status: transaction.status,
        });
      });
    }

    // Apply filters
    let filteredEvents = events;

    // Property filter
    if (filters.properties.length > 0) {
      const selectedPropertyNames = filters.properties.map(id => 
        properties.find(p => p.id === id)?.name
      ).filter(Boolean);
      filteredEvents = filteredEvents.filter(event => 
        selectedPropertyNames.includes(event.property_name)
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.date) >= fromDate
      );
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.date) <= toDate
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.status === filters.status);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        event.property_name.toLowerCase().includes(searchLower) ||
        event.unit_name.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.event_category.toLowerCase().includes(searchLower) ||
        event.assigned_to?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date (most recent first)
    filteredEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setEventHistory(filteredEvents);
  }, [properties, maintenanceRequests, leases, transactions, filters]);

  const availableProperties = properties?.map(p => ({ id: p.id, name: p.name })) || [];

  const handleFilterChange = (newFilters: ReportFiltersType) => {
    setFilters(newFilters);
  };

  const handleRunReport = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting event history as ${format}`);
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'maintenance':
        return <Badge className="bg-orange-500">Maintenance</Badge>;
      case 'lease':
        return <Badge className="bg-blue-500">Lease</Badge>;
      case 'payment':
        return <Badge className="bg-green-500">Payment</Badge>;
      case 'inspection':
        return <Badge className="bg-purple-500">Inspection</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-500">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Calculate statistics
  const stats = {
    total: eventHistory.length,
    maintenance: eventHistory.filter(e => e.event_type === 'maintenance').length,
    lease: eventHistory.filter(e => e.event_type === 'lease').length,
    payment: eventHistory.filter(e => e.event_type === 'payment').length,
    completed: eventHistory.filter(e => e.status === 'completed' || e.status === 'paid').length,
    pending: eventHistory.filter(e => e.status === 'pending').length,
  };

  const getDateRangeText = () => {
    if (filters.dateFrom && filters.dateTo) {
      return `${formatDate(filters.dateFrom)} - ${formatDate(filters.dateTo)}`;
    } else if (filters.dateFrom) {
      return `From ${formatDate(filters.dateFrom)}`;
    } else if (filters.dateTo) {
      return `Until ${formatDate(filters.dateTo)}`;
    }
    return 'All Time';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/reports")}
                className="text-gray-600 hover:text-gray-900"
              >
                <i className="ri-arrow-left-line mr-1" />
                Reports
              </Button>
              <span className="text-gray-400">/</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/reports/property")}
                className="text-gray-600 hover:text-gray-900"
              >
                Property
              </Button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Event History</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Property Event History</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Chronological history of all property events ({getDateRangeText()})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ReportFilters
              onFilterChange={handleFilterChange}
              onExport={handleExport}
              onRunReport={handleRunReport}
              isLoading={isLoading}
              availableProperties={availableProperties}
              availableCategories={[]}
              availableAssignees={[]}
              showPropertyFilter={true}
              showCategoryFilter={false}
              showAssigneeFilter={false}
              showDateRange={true}
              showStatusFilter={true}
            />
          </div>

          {/* Report Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <i className="ri-history-line text-2xl text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Maintenance</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.maintenance}</p>
                    </div>
                    <i className="ri-tools-line text-2xl text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                      <p className="text-xs text-gray-500">
                        {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                      </p>
                    </div>
                    <i className="ri-check-line text-2xl text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                      <p className="text-xs text-gray-500">Action needed</p>
                    </div>
                    <i className="ri-time-line text-2xl text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Event History Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Event History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line animate-spin text-2xl text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading event history...</span>
                  </div>
                ) : eventHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="ri-history-line text-4xl text-gray-400 mb-2 block" />
                    <p className="text-gray-600">No events found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 text-sm font-medium">Date</th>
                          <th className="text-left p-2 text-sm font-medium">Property</th>
                          <th className="text-left p-2 text-sm font-medium">Unit</th>
                          <th className="text-center p-2 text-sm font-medium">Type</th>
                          <th className="text-left p-2 text-sm font-medium">Category</th>
                          <th className="text-left p-2 text-sm font-medium">Description</th>
                          <th className="text-right p-2 text-sm font-medium">Amount</th>
                          <th className="text-center p-2 text-sm font-medium">Priority</th>
                          <th className="text-left p-2 text-sm font-medium">Assigned To</th>
                          <th className="text-center p-2 text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventHistory.map((event) => (
                          <tr key={event.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-2 text-sm">{formatDateTime(event.date)}</td>
                            <td className="p-2 font-medium text-sm">{event.property_name}</td>
                            <td className="p-2 text-sm">{event.unit_name}</td>
                            <td className="p-2 text-center">{getEventTypeBadge(event.event_type)}</td>
                            <td className="p-2 text-sm">{event.event_category}</td>
                            <td className="p-2 text-sm">{event.description}</td>
                            <td className="p-2 text-right text-sm">{formatCurrency(event.amount)}</td>
                            <td className="p-2 text-center">{getPriorityBadge(event.priority)}</td>
                            <td className="p-2 text-sm">{event.assigned_to || '-'}</td>
                            <td className="p-2 text-center">{getStatusBadge(event.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default withAuth(EventHistoryReportPage);
