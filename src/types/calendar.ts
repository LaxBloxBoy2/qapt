export type CalendarEventType = 
  | 'lease_start' 
  | 'lease_end' 
  | 'lease_renewal'
  | 'rent_due' 
  | 'expense_due'
  | 'inspection' 
  | 'maintenance' 
  | 'appliance_check'
  | 'appliance_warranty'
  | 'insurance_expiration'
  | 'custom';

export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

export type CalendarEventStatus = 'upcoming' | 'overdue' | 'completed' | 'cancelled';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  time?: string;
  allDay?: boolean;
  color: string;
  backgroundColor: string;
  borderColor: string;
  icon: string;
  status: CalendarEventStatus;
  
  // Related data
  relatedId: string;
  relatedType: string; // 'lease', 'transaction', 'maintenance_request', etc.
  propertyId?: string;
  unitId?: string;
  assigneeId?: string;
  
  // Property/Unit info for display
  property?: {
    id: string;
    name: string;
  };
  unit?: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
    type: 'tenant' | 'team' | 'vendor';
  };
  
  // Actions available
  actions: CalendarEventAction[];
  
  // Metadata
  isRecurring?: boolean;
  recurringPattern?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventAction {
  id: string;
  label: string;
  icon: string;
  type: 'view' | 'edit' | 'complete' | 'reschedule' | 'cancel' | 'navigate';
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

export interface CreateCustomEvent {
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  time?: string;
  allDay?: boolean;
  propertyId?: string;
  unitId?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  reminderMinutes?: number;
}

export interface CalendarFilters {
  propertyIds?: string[];
  unitIds?: string[];
  assigneeIds?: string[];
  eventTypes?: CalendarEventType[];
  statuses?: CalendarEventStatus[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface CalendarSummary {
  totalEvents: number;
  upcomingEvents: number;
  overdueEvents: number;
  completedEvents: number;
  eventsByType: Record<CalendarEventType, number>;
  eventsByStatus: Record<CalendarEventStatus, number>;
}

// Event type configurations
export const EVENT_TYPE_CONFIG: Record<CalendarEventType, {
  label: string;
  icon: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
}> = {
  lease_start: {
    label: 'Lease Start',
    icon: '🏠',
    color: 'text-green-700',
    backgroundColor: 'bg-green-100',
    borderColor: 'border-green-500'
  },
  lease_end: {
    label: 'Lease End',
    icon: '📤',
    color: 'text-red-700',
    backgroundColor: 'bg-red-100',
    borderColor: 'border-red-500'
  },
  lease_renewal: {
    label: 'Lease Renewal',
    icon: '🔄',
    color: 'text-blue-700',
    backgroundColor: 'bg-blue-100',
    borderColor: 'border-blue-500'
  },
  rent_due: {
    label: 'Rent Due',
    icon: '💸',
    color: 'text-indigo-700',
    backgroundColor: 'bg-indigo-100',
    borderColor: 'border-indigo-500'
  },
  expense_due: {
    label: 'Expense Due',
    icon: '💳',
    color: 'text-purple-700',
    backgroundColor: 'bg-purple-100',
    borderColor: 'border-purple-500'
  },
  inspection: {
    label: 'Inspection',
    icon: '📋',
    color: 'text-blue-700',
    backgroundColor: 'bg-blue-100',
    borderColor: 'border-blue-500'
  },
  maintenance: {
    label: 'Maintenance',
    icon: '🛠️',
    color: 'text-orange-700',
    backgroundColor: 'bg-orange-100',
    borderColor: 'border-orange-500'
  },
  appliance_check: {
    label: 'Equipment Check',
    icon: '🧰',
    color: 'text-teal-700',
    backgroundColor: 'bg-teal-100',
    borderColor: 'border-teal-500'
  },
  appliance_warranty: {
    label: 'Warranty Expiration',
    icon: '⚠️',
    color: 'text-amber-700',
    backgroundColor: 'bg-amber-100',
    borderColor: 'border-amber-500'
  },
  insurance_expiration: {
    label: 'Insurance Expiration',
    icon: '📑',
    color: 'text-rose-700',
    backgroundColor: 'bg-rose-100',
    borderColor: 'border-rose-500'
  },
  custom: {
    label: 'Custom Event',
    icon: '🔔',
    color: 'text-gray-700',
    backgroundColor: 'bg-gray-100',
    borderColor: 'border-gray-500'
  }
};

// Helper functions
export function getEventTypeConfig(type: CalendarEventType) {
  return EVENT_TYPE_CONFIG[type];
}

export function getEventStatus(event: CalendarEvent): CalendarEventStatus {
  const now = new Date();
  const eventDate = new Date(event.date);
  
  if (event.status === 'completed' || event.status === 'cancelled') {
    return event.status;
  }
  
  if (eventDate < now) {
    return 'overdue';
  }
  
  return 'upcoming';
}

export function formatEventTitle(event: CalendarEvent): string {
  let title = event.title;
  
  if (event.property) {
    title += ` - ${event.property.name}`;
  }
  
  if (event.unit) {
    title += `, ${event.unit.name}`;
  }
  
  return title;
}

export function getEventActions(event: CalendarEvent): CalendarEventAction[] {
  const actions: CalendarEventAction[] = [];
  
  // View action based on event type
  switch (event.type) {
    case 'lease_start':
    case 'lease_end':
    case 'lease_renewal':
      actions.push({
        id: 'view_lease',
        label: 'View Lease',
        icon: 'ri-file-text-line',
        type: 'navigate',
        href: `/leases/${event.relatedId}`
      });
      break;
    case 'rent_due':
    case 'expense_due':
      actions.push({
        id: 'view_transaction',
        label: 'View Transaction',
        icon: 'ri-money-dollar-circle-line',
        type: 'navigate',
        href: `/finances?transaction=${event.relatedId}`
      });
      break;
    case 'maintenance':
      actions.push({
        id: 'view_request',
        label: 'View Request',
        icon: 'ri-tools-line',
        type: 'navigate',
        href: `/maintenance/${event.relatedId}`
      });
      break;
    case 'inspection':
      actions.push({
        id: 'view_inspection',
        label: 'View Inspection',
        icon: 'ri-search-eye-line',
        type: 'navigate',
        href: `/inspections/${event.relatedId}`
      });
      break;
    case 'appliance_check':
    case 'appliance_warranty':
      actions.push({
        id: 'view_appliance',
        label: 'View Appliance',
        icon: 'ri-device-line',
        type: 'navigate',
        href: `/appliances/${event.relatedId}`
      });
      break;
  }
  
  // Mark as complete action (for applicable events)
  if (event.status === 'upcoming' || event.status === 'overdue') {
    if (['maintenance', 'inspection', 'appliance_check'].includes(event.type)) {
      actions.push({
        id: 'mark_complete',
        label: 'Mark Complete',
        icon: 'ri-check-line',
        type: 'complete'
      });
    }
  }
  
  // Reschedule action
  if (event.status !== 'completed' && event.status !== 'cancelled') {
    actions.push({
      id: 'reschedule',
      label: 'Reschedule',
      icon: 'ri-calendar-line',
      type: 'reschedule'
    });
  }
  
  // Edit action for custom events
  if (event.type === 'custom') {
    actions.push({
      id: 'edit_event',
      label: 'Edit Event',
      icon: 'ri-edit-line',
      type: 'edit'
    });
  }
  
  return actions;
}
