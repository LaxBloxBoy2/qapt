-- Notifications System Schema for QAPT Property Management

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('maintenance', 'finance', 'inspection', 'lease', 'application', 'tenant', 'property', 'system')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE,
  related_entity_type TEXT, -- e.g., 'property', 'unit', 'maintenance_request', 'lease', etc.
  related_entity_id uuid, -- ID of the related entity
  action_url TEXT, -- URL to navigate to when notification is clicked
  metadata JSONB DEFAULT '{}', -- Additional data for the notification
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE -- Optional expiration date
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  maintenance_enabled BOOLEAN DEFAULT TRUE,
  finance_enabled BOOLEAN DEFAULT TRUE,
  inspection_enabled BOOLEAN DEFAULT TRUE,
  lease_enabled BOOLEAN DEFAULT TRUE,
  application_enabled BOOLEAN DEFAULT TRUE,
  tenant_enabled BOOLEAN DEFAULT TRUE,
  property_enabled BOOLEAN DEFAULT TRUE,
  system_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System can insert notifications for any user (for triggers)
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- RLS Policies for notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own preferences
CREATE POLICY "Users can manage own preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text,
  p_priority text DEFAULT 'medium',
  p_related_entity_type text DEFAULT NULL,
  p_related_entity_id uuid DEFAULT NULL,
  p_action_url text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id, title, message, type, priority,
    related_entity_type, related_entity_id, action_url, metadata
  ) VALUES (
    p_user_id, p_title, p_message, p_type, p_priority,
    p_related_entity_type, p_related_entity_id, p_action_url, p_metadata
  ) RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE, read_at = now()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE, read_at = now()
  WHERE user_id = auth.uid() AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.notifications
    WHERE user_id = auth.uid() AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE expires_at IS NOT NULL AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for maintenance requests
CREATE OR REPLACE FUNCTION notify_maintenance_created()
RETURNS trigger AS $$
DECLARE
  property_name text;
  unit_name text;
BEGIN
  -- Get property and unit names for context
  SELECT p.name INTO property_name
  FROM public.properties p
  WHERE p.id = NEW.property_id;

  SELECT u.name INTO unit_name
  FROM public.units u
  WHERE u.id = NEW.unit_id;

  -- Create notification for all team members
  INSERT INTO public.notifications (
    user_id, title, message, type, priority,
    related_entity_type, related_entity_id, action_url, metadata
  )
  SELECT
    up.id,
    'New Maintenance Request',
    'New maintenance request: ' || NEW.title ||
    CASE
      WHEN unit_name IS NOT NULL THEN ' at ' || COALESCE(property_name, 'Unknown Property') || ' - ' || unit_name
      WHEN property_name IS NOT NULL THEN ' at ' || property_name
      ELSE ''
    END,
    'maintenance',
    CASE NEW.priority
      WHEN 'urgent' THEN 'urgent'
      WHEN 'high' THEN 'high'
      ELSE 'medium'
    END,
    'maintenance_request',
    NEW.id,
    '/maintenance/' || NEW.id,
    jsonb_build_object(
      'property_name', property_name,
      'unit_name', unit_name,
      'request_type', NEW.type,
      'priority', NEW.priority
    )
  FROM auth.users au
  JOIN public.user_profiles up ON au.id = up.id
  WHERE up.role IN ('admin', 'team_member');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for lease status changes
CREATE OR REPLACE FUNCTION notify_lease_status_change()
RETURNS trigger AS $$
DECLARE
  property_name text;
  unit_name text;
  tenant_name text;
BEGIN
  -- Only notify on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get related information
  SELECT p.name INTO property_name
  FROM public.properties p
  WHERE p.id = NEW.property_id;

  SELECT u.name INTO unit_name
  FROM public.units u
  WHERE u.id = NEW.unit_id;

  SELECT t.first_name || ' ' || t.last_name INTO tenant_name
  FROM public.tenants t
  WHERE t.id = NEW.tenant_id;

  -- Create notification for all team members
  INSERT INTO public.notifications (
    user_id, title, message, type, priority,
    related_entity_type, related_entity_id, action_url, metadata
  )
  SELECT
    up.id,
    'Lease Status Updated',
    'Lease for ' || COALESCE(tenant_name, 'Unknown Tenant') ||
    ' changed from ' || OLD.status || ' to ' || NEW.status ||
    CASE
      WHEN unit_name IS NOT NULL THEN ' at ' || COALESCE(property_name, 'Unknown Property') || ' - ' || unit_name
      WHEN property_name IS NOT NULL THEN ' at ' || property_name
      ELSE ''
    END,
    'lease',
    CASE NEW.status
      WHEN 'expired' THEN 'high'
      WHEN 'terminated' THEN 'high'
      ELSE 'medium'
    END,
    'lease',
    NEW.id,
    '/leases/' || NEW.id,
    jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'property_name', property_name,
      'unit_name', unit_name,
      'tenant_name', tenant_name
    )
  FROM auth.users au
  JOIN public.user_profiles up ON au.id = up.id
  WHERE up.role IN ('admin', 'team_member');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for financial transactions
CREATE OR REPLACE FUNCTION notify_transaction_created()
RETURNS trigger AS $$
DECLARE
  property_name text;
  tenant_name text;
BEGIN
  -- Get related information
  SELECT p.name INTO property_name
  FROM public.properties p
  WHERE p.id = NEW.property_id;

  SELECT t.first_name || ' ' || t.last_name INTO tenant_name
  FROM public.tenants t
  WHERE t.id = NEW.tenant_id;

  -- Create notification for all team members
  INSERT INTO public.notifications (
    user_id, title, message, type, priority,
    related_entity_type, related_entity_id, action_url, metadata
  )
  SELECT
    up.id,
    CASE NEW.type
      WHEN 'income' THEN 'New Income Transaction'
      WHEN 'expense' THEN 'New Expense Transaction'
      ELSE 'New Financial Transaction'
    END,
    CASE NEW.type
      WHEN 'income' THEN 'Income of $' || NEW.amount::text
      WHEN 'expense' THEN 'Expense of $' || NEW.amount::text
      ELSE 'Transaction of $' || NEW.amount::text
    END ||
    CASE
      WHEN tenant_name IS NOT NULL THEN ' from ' || tenant_name
      WHEN property_name IS NOT NULL THEN ' for ' || property_name
      ELSE ''
    END,
    'finance',
    CASE
      WHEN NEW.amount > 5000 THEN 'high'
      WHEN NEW.amount > 1000 THEN 'medium'
      ELSE 'low'
    END,
    'transaction',
    NEW.id,
    '/transactions',
    jsonb_build_object(
      'amount', NEW.amount,
      'transaction_type', NEW.type,
      'property_name', property_name,
      'tenant_name', tenant_name
    )
  FROM auth.users au
  JOIN public.user_profiles up ON au.id = up.id
  WHERE up.role IN ('admin', 'team_member');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for inspection completion
CREATE OR REPLACE FUNCTION notify_inspection_completed()
RETURNS trigger AS $$
DECLARE
  property_name text;
  unit_name text;
BEGIN
  -- Only notify when status changes to completed
  IF OLD.status = 'completed' OR NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get related information
  SELECT p.name INTO property_name
  FROM public.properties p
  WHERE p.id = NEW.property_id;

  SELECT u.name INTO unit_name
  FROM public.units u
  WHERE u.id = NEW.unit_id;

  -- Create notification for all team members
  INSERT INTO public.notifications (
    user_id, title, message, type, priority,
    related_entity_type, related_entity_id, action_url, metadata
  )
  SELECT
    up.id,
    'Inspection Completed',
    NEW.type || ' inspection completed' ||
    CASE
      WHEN unit_name IS NOT NULL THEN ' for ' || COALESCE(property_name, 'Unknown Property') || ' - ' || unit_name
      WHEN property_name IS NOT NULL THEN ' for ' || property_name
      ELSE ''
    END,
    'inspection',
    'medium',
    'inspection',
    NEW.id,
    '/inspections/' || NEW.id,
    jsonb_build_object(
      'inspection_type', NEW.type,
      'property_name', property_name,
      'unit_name', unit_name,
      'completed_at', NEW.updated_at
    )
  FROM auth.users au
  JOIN public.user_profiles up ON au.id = up.id
  WHERE up.role IN ('admin', 'team_member');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the actual triggers
DROP TRIGGER IF EXISTS trigger_notify_maintenance_created ON public.maintenance_requests;
CREATE TRIGGER trigger_notify_maintenance_created
  AFTER INSERT ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION notify_maintenance_created();

DROP TRIGGER IF EXISTS trigger_notify_lease_status_change ON public.leases;
CREATE TRIGGER trigger_notify_lease_status_change
  AFTER UPDATE ON public.leases
  FOR EACH ROW EXECUTE FUNCTION notify_lease_status_change();

DROP TRIGGER IF EXISTS trigger_notify_transaction_created ON public.transactions;
CREATE TRIGGER trigger_notify_transaction_created
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION notify_transaction_created();

DROP TRIGGER IF EXISTS trigger_notify_inspection_completed ON public.inspections;
CREATE TRIGGER trigger_notify_inspection_completed
  AFTER UPDATE ON public.inspections
  FOR EACH ROW EXECUTE FUNCTION notify_inspection_completed();