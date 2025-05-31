import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarFilters, CalendarEventType, CalendarEventStatus, EVENT_TYPE_CONFIG } from "@/types/calendar";

interface CalendarFiltersPanelProps {
  filters: CalendarFilters;
  onFilterChange: (key: keyof CalendarFilters, value: any) => void;
  properties?: any[];
  tenants?: any[];
}

export function CalendarFiltersPanel({
  filters,
  onFilterChange,
  properties,
  tenants,
}: CalendarFiltersPanelProps) {
  const clearFilters = () => {
    Object.keys(filters).forEach(key => {
      onFilterChange(key as keyof CalendarFilters, undefined);
    });
  };

  const activeFilterCount = Object.values(filters).filter(value => 
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  ).length;

  const eventTypes: CalendarEventType[] = [
    'lease_start',
    'lease_end', 
    'lease_renewal',
    'rent_due',
    'expense_due',
    'inspection',
    'maintenance',
    'appliance_check',
    'appliance_warranty',
    'insurance_expiration',
    'custom'
  ];

  const eventStatuses: CalendarEventStatus[] = ['upcoming', 'overdue', 'completed', 'cancelled'];

  const handleEventTypeChange = (type: CalendarEventType, checked: boolean) => {
    const currentTypes = filters.eventTypes || [];
    if (checked) {
      onFilterChange('eventTypes', [...currentTypes, type]);
    } else {
      onFilterChange('eventTypes', currentTypes.filter(t => t !== type));
    }
  };

  const handleStatusChange = (status: CalendarEventStatus, checked: boolean) => {
    const currentStatuses = filters.statuses || [];
    if (checked) {
      onFilterChange('statuses', [...currentStatuses, status]);
    } else {
      onFilterChange('statuses', currentStatuses.filter(s => s !== status));
    }
  };

  const handlePropertyChange = (propertyId: string, checked: boolean) => {
    const currentProperties = filters.propertyIds || [];
    if (checked) {
      onFilterChange('propertyIds', [...currentProperties, propertyId]);
    } else {
      onFilterChange('propertyIds', currentProperties.filter(p => p !== propertyId));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filters</h3>
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Search</label>
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search events..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Event Types */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Event Types</label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {eventTypes.map((type) => {
            const config = EVENT_TYPE_CONFIG[type];
            const isChecked = filters.eventTypes?.includes(type) || false;
            
            return (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleEventTypeChange(type, checked as boolean)}
                />
                <label
                  htmlFor={`type-${type}`}
                  className="text-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>{config.icon}</span>
                  <span>{config.label}</span>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <div className="space-y-2">
          {eventStatuses.map((status) => {
            const isChecked = filters.statuses?.includes(status) || false;
            
            return (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleStatusChange(status, checked as boolean)}
                />
                <label
                  htmlFor={`status-${status}`}
                  className="text-sm capitalize cursor-pointer"
                >
                  {status}
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Properties */}
      {properties && properties.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Properties</label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {properties.map((property) => {
              const isChecked = filters.propertyIds?.includes(property.id) || false;
              
              return (
                <div key={property.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`property-${property.id}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => handlePropertyChange(property.id, checked as boolean)}
                  />
                  <label
                    htmlFor={`property-${property.id}`}
                    className="text-sm cursor-pointer truncate"
                  >
                    {property.name}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Date Range */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Date Range</label>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground">From</label>
            <Input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) => onFilterChange("dateFrom", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">To</label>
            <Input
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) => onFilterChange("dateTo", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Quick Date Filters */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Quick Filters</label>
        <div className="grid grid-cols-1 gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              onFilterChange("dateFrom", today);
              onFilterChange("dateTo", today);
            }}
            className="justify-start text-xs"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
              onFilterChange("dateFrom", today.toISOString().split('T')[0]);
              onFilterChange("dateTo", nextWeek.toISOString().split('T')[0]);
            }}
            className="justify-start text-xs"
          >
            Next 7 Days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
              const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              onFilterChange("dateFrom", firstDay.toISOString().split('T')[0]);
              onFilterChange("dateTo", lastDay.toISOString().split('T')[0]);
            }}
            className="justify-start text-xs"
          >
            This Month
          </Button>
        </div>
      </div>
    </div>
  );
}
