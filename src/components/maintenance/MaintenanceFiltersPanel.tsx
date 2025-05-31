import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MaintenanceFilters } from "@/types/maintenance";
import { useAssignees } from "@/hooks/useMaintenance";

interface MaintenanceFiltersPanelProps {
  filters: MaintenanceFilters;
  onFilterChange: (key: keyof MaintenanceFilters, value: any) => void;
  properties?: any[];
  tenants?: any[];
}

export function MaintenanceFiltersPanel({
  filters,
  onFilterChange,
  properties,
  tenants,
}: MaintenanceFiltersPanelProps) {
  const { data: assignees } = useAssignees();

  const clearFilters = () => {
    Object.keys(filters).forEach(key => {
      onFilterChange(key as keyof MaintenanceFilters, undefined);
    });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

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
            placeholder="Search requests..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => onFilterChange("status", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Priority Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Priority</label>
        <Select
          value={filters.priority || "all"}
          onValueChange={(value) => onFilterChange("priority", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Type Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Type</label>
        <Select
          value={filters.type || "all"}
          onValueChange={(value) => onFilterChange("type", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="plumbing">Plumbing</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="hvac">HVAC</SelectItem>
            <SelectItem value="appliance">Appliance</SelectItem>
            <SelectItem value="cleaning">Cleaning</SelectItem>
            <SelectItem value="landscaping">Landscaping</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Property Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Property</label>
        <Select
          value={filters.property_id || "all"}
          onValueChange={(value) => onFilterChange("property_id", value)}
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

      {/* Assignee Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Assignee</label>
        <Select
          value={filters.assigned_to_id || "all"}
          onValueChange={(value) => onFilterChange("assigned_to_id", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Assignees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {assignees?.map((assignee) => (
              <SelectItem key={assignee.id} value={assignee.id}>
                {assignee.name} ({assignee.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Requested By Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Requested By</label>
        <Select
          value={filters.requested_by_id || "all"}
          onValueChange={(value) => onFilterChange("requested_by_id", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Requesters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requesters</SelectItem>
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

      {/* Date From */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Date From</label>
        <Input
          type="date"
          value={filters.date_from || ""}
          onChange={(e) => onFilterChange("date_from", e.target.value)}
        />
      </div>

      {/* Date To */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Date To</label>
        <Input
          type="date"
          value={filters.date_to || ""}
          onChange={(e) => onFilterChange("date_to", e.target.value)}
        />
      </div>
    </div>
  );
}
