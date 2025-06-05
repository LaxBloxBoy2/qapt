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
import { useGetUnits } from "@/hooks/useUnits";

interface MeterReadingEntry {
  id: string;
  property_name: string;
  unit_name: string;
  meter_type: 'electric' | 'gas' | 'water' | 'other';
  meter_number: string;
  previous_reading: number;
  current_reading: number;
  usage: number;
  reading_date: string;
  next_reading_due: string;
  days_until_due: number;
  estimated_cost: number;
  status: 'current' | 'overdue' | 'estimated';
}

function MeterReadingsReportPage() {
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
  const { data: units } = useGetUnits();

  const [meterReadings, setMeterReadings] = useState<MeterReadingEntry[]>([]);

  // Generate mock meter readings data
  useEffect(() => {
    if (!properties || !units) return;

    const currentDate = new Date();
    const mockReadings: MeterReadingEntry[] = [];

    // Generate meter readings for each unit
    units.forEach(unit => {
      const property = properties.find(p => p.id === unit.property_id);
      
      // Generate readings for different meter types
      const meterTypes: Array<'electric' | 'gas' | 'water'> = ['electric', 'gas', 'water'];
      
      meterTypes.forEach((meterType, index) => {
        // Mock previous and current readings
        const previousReading = Math.floor(Math.random() * 10000) + 5000;
        const currentReading = previousReading + Math.floor(Math.random() * 500) + 100;
        const usage = currentReading - previousReading;
        
        // Calculate reading date (random within last 30 days)
        const readingDate = new Date();
        readingDate.setDate(currentDate.getDate() - Math.floor(Math.random() * 30));
        
        // Next reading due (30 days from reading date)
        const nextReadingDue = new Date(readingDate);
        nextReadingDue.setDate(readingDate.getDate() + 30);
        
        const timeDiff = nextReadingDue.getTime() - currentDate.getTime();
        const daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        // Determine status
        let status: 'current' | 'overdue' | 'estimated' = 'current';
        if (daysUntilDue < 0) {
          status = 'overdue';
        } else if (Math.random() > 0.8) {
          status = 'estimated';
        }
        
        // Calculate estimated cost based on usage and meter type
        let ratePerUnit = 0.12; // Default electric rate
        if (meterType === 'gas') ratePerUnit = 0.08;
        if (meterType === 'water') ratePerUnit = 0.05;
        
        const estimatedCost = usage * ratePerUnit;
        
        mockReadings.push({
          id: `${unit.id}-${meterType}`,
          property_name: property?.name || 'Unknown Property',
          unit_name: unit.name,
          meter_type: meterType,
          meter_number: `${meterType.toUpperCase()}-${unit.name}-${String(index + 1).padStart(3, '0')}`,
          previous_reading: previousReading,
          current_reading: currentReading,
          usage,
          reading_date: readingDate.toISOString().split('T')[0],
          next_reading_due: nextReadingDue.toISOString().split('T')[0],
          days_until_due: daysUntilDue,
          estimated_cost: estimatedCost,
          status,
        });
      });
    });

    // Apply filters
    let filteredReadings = mockReadings;

    // Property filter
    if (filters.properties.length > 0) {
      const selectedPropertyNames = filters.properties.map(id => 
        properties.find(p => p.id === id)?.name
      ).filter(Boolean);
      filteredReadings = filteredReadings.filter(reading => 
        selectedPropertyNames.includes(reading.property_name)
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredReadings = filteredReadings.filter(reading => 
        new Date(reading.reading_date) >= fromDate
      );
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filteredReadings = filteredReadings.filter(reading => 
        new Date(reading.reading_date) <= toDate
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'overdue') {
        filteredReadings = filteredReadings.filter(reading => reading.status === 'overdue');
      } else if (filters.status === 'active') {
        filteredReadings = filteredReadings.filter(reading => reading.status === 'current');
      } else if (filters.status === 'pending') {
        filteredReadings = filteredReadings.filter(reading => reading.status === 'estimated');
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredReadings = filteredReadings.filter(reading => 
        reading.property_name.toLowerCase().includes(searchLower) ||
        reading.unit_name.toLowerCase().includes(searchLower) ||
        reading.meter_number.toLowerCase().includes(searchLower) ||
        reading.meter_type.toLowerCase().includes(searchLower)
      );
    }

    // Sort by next reading due date (most urgent first)
    filteredReadings.sort((a, b) => a.days_until_due - b.days_until_due);

    setMeterReadings(filteredReadings);
  }, [properties, units, filters]);

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
    console.log(`Exporting meter readings as ${format}`);
  };

  const formatCurrency = (amount: number) => {
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

  const getMeterTypeBadge = (type: string) => {
    switch (type) {
      case 'electric':
        return <Badge className="bg-yellow-500">Electric</Badge>;
      case 'gas':
        return <Badge className="bg-blue-500">Gas</Badge>;
      case 'water':
        return <Badge className="bg-cyan-500">Water</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return <Badge className="bg-green-500">Current</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      case 'estimated':
        return <Badge className="bg-orange-500">Estimated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (days: number) => {
    if (days < 0) {
      return <Badge className="bg-red-500">Overdue</Badge>;
    } else if (days <= 7) {
      return <Badge className="bg-yellow-500">Due Soon</Badge>;
    } else {
      return <Badge className="bg-green-500">Current</Badge>;
    }
  };

  // Calculate statistics
  const stats = {
    total: meterReadings.length,
    overdue: meterReadings.filter(r => r.status === 'overdue').length,
    dueSoon: meterReadings.filter(r => r.days_until_due >= 0 && r.days_until_due <= 7).length,
    estimated: meterReadings.filter(r => r.status === 'estimated').length,
    totalUsage: meterReadings.reduce((sum, r) => sum + r.usage, 0),
    totalCost: meterReadings.reduce((sum, r) => sum + r.estimated_cost, 0),
    avgUsage: meterReadings.length > 0 ? 
      Math.round(meterReadings.reduce((sum, r) => sum + r.usage, 0) / meterReadings.length) : 0,
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
              <span className="text-gray-600">Meter Readings</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meter Readings Report</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Utility meter readings and usage by property and unit ({getDateRangeText()})
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Meters</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <i className="ri-dashboard-line text-2xl text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                    </div>
                    <i className="ri-alarm-warning-line text-2xl text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Avg Usage</p>
                      <p className="text-2xl font-bold text-green-600">{stats.avgUsage}</p>
                      <p className="text-xs text-gray-500">units</p>
                    </div>
                    <i className="ri-bar-chart-line text-2xl text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalCost)}</p>
                      <p className="text-xs text-gray-500">Estimated</p>
                    </div>
                    <i className="ri-money-dollar-circle-line text-2xl text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Meter Readings Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Meter Readings</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <i className="ri-loader-4-line animate-spin text-2xl text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading meter readings...</span>
                  </div>
                ) : meterReadings.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="ri-dashboard-line text-4xl text-gray-400 mb-2 block" />
                    <p className="text-gray-600">No meter readings found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 text-sm font-medium">Property</th>
                          <th className="text-left p-2 text-sm font-medium">Unit</th>
                          <th className="text-center p-2 text-sm font-medium">Type</th>
                          <th className="text-left p-2 text-sm font-medium">Meter #</th>
                          <th className="text-right p-2 text-sm font-medium">Previous</th>
                          <th className="text-right p-2 text-sm font-medium">Current</th>
                          <th className="text-right p-2 text-sm font-medium">Usage</th>
                          <th className="text-left p-2 text-sm font-medium">Reading Date</th>
                          <th className="text-left p-2 text-sm font-medium">Next Due</th>
                          <th className="text-center p-2 text-sm font-medium">Urgency</th>
                          <th className="text-right p-2 text-sm font-medium">Est. Cost</th>
                          <th className="text-center p-2 text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meterReadings.map((reading) => (
                          <tr key={reading.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-2 font-medium text-sm">{reading.property_name}</td>
                            <td className="p-2 text-sm">{reading.unit_name}</td>
                            <td className="p-2 text-center">{getMeterTypeBadge(reading.meter_type)}</td>
                            <td className="p-2 text-sm font-mono">{reading.meter_number}</td>
                            <td className="p-2 text-right text-sm">{reading.previous_reading.toLocaleString()}</td>
                            <td className="p-2 text-right text-sm font-medium">{reading.current_reading.toLocaleString()}</td>
                            <td className="p-2 text-right text-sm font-medium">{reading.usage.toLocaleString()}</td>
                            <td className="p-2 text-sm">{formatDate(reading.reading_date)}</td>
                            <td className="p-2 text-sm">
                              <div>
                                <div>{formatDate(reading.next_reading_due)}</div>
                                <div className={`text-xs ${
                                  reading.days_until_due < 0 ? 'text-red-600' : 
                                  reading.days_until_due <= 7 ? 'text-yellow-600' : 'text-gray-500'
                                }`}>
                                  {reading.days_until_due < 0 ? 
                                    `${Math.abs(reading.days_until_due)} days overdue` :
                                    `${reading.days_until_due} days left`
                                  }
                                </div>
                              </div>
                            </td>
                            <td className="p-2 text-center">{getUrgencyBadge(reading.days_until_due)}</td>
                            <td className="p-2 text-right font-medium text-sm">{formatCurrency(reading.estimated_cost)}</td>
                            <td className="p-2 text-center">{getStatusBadge(reading.status)}</td>
                          </tr>
                        ))}
                        {/* Totals Row */}
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold bg-gray-50 dark:bg-gray-800">
                          <td className="p-2 text-sm" colSpan={6}>TOTALS ({stats.total} meters)</td>
                          <td className="p-2 text-right text-sm">{stats.totalUsage.toLocaleString()}</td>
                          <td className="p-2" colSpan={3}></td>
                          <td className="p-2 text-right text-sm">{formatCurrency(stats.totalCost)}</td>
                          <td className="p-2"></td>
                        </tr>
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

export default withAuth(MeterReadingsReportPage);
