-- Minimal Settings Migration for QAPT
-- Run this first to get the core settings working

-- =====================================================
-- 1. CREATE CORE SETTINGS TABLES
-- =====================================================

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Regional Settings
    currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP')),
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY' CHECK (date_format IN ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')),
    timezone VARCHAR(100) DEFAULT 'America/New_York',
    language VARCHAR(5) DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'de')),
    
    -- Appearance
    theme VARCHAR(10) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    
    -- Default Values
    default_country V   ARCHAR(2) DEFAULT 'US',
    default_rent_status VARCHAR(20) DEFAULT 'active' CHECK (default_rent_status IN ('active', 'inactive')),
    default_lease_term INTEGER DEFAULT 12 CHECK (default_lease_term BETWEEN 1 AND 60),
    default_currency_symbol VARCHAR(5) DEFAULT '$',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one preference record per user
    UNIQUE(user_id)
);

-- Notification Settings Table
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Master Controls
    email_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    
    -- Notification Categories
    lease_renewals BOOLEAN DEFAULT true,
    rent_overdue BOOLEAN DEFAULT true,
    maintenance_updates BOOLEAN DEFAULT true,
    inspection_reminders BOOLEAN DEFAULT true,
    payment_confirmations BOOLEAN DEFAULT true,
    system_updates BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one notification setting record per user
    UNIQUE(user_id)
);

-- User Subscription Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Plan Information
    plan_id VARCHAR(50) NOT NULL DEFAULT 'free',
    plan_name VARCHAR(100) NOT NULL DEFAULT 'Free Plan',
    plan_price DECIMAL(10,2) DEFAULT 0.00,
    plan_currency VARCHAR(3) DEFAULT 'USD',
    plan_interval VARCHAR(20) DEFAULT 'month' CHECK (plan_interval IN ('month', 'year')),
    
    -- Plan Features
    plan_features JSONB DEFAULT '{
        "max_properties": 5,
        "max_units": 25,
        "max_tenants": 50,
        "storage_gb": 1,
        "team_members": 1,
        "advanced_reports": false,
        "api_access": false,
        "priority_support": false
    }'::jsonb,
    
    -- Subscription Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
    
    -- Billing Periods
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
    trial_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    
    -- External IDs
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one subscription per user
    UNIQUE(user_id)
);

-- =====================================================
-- 2. UPDATE USER_PROFILES TABLE
-- =====================================================

-- Add new columns to user_profiles if they don't exist
DO $$ 
BEGIN
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'phone') THEN
        ALTER TABLE user_profiles ADD COLUMN phone VARCHAR(20);
    END IF;
    
    -- Add company column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'company') THEN
        ALTER TABLE user_profiles ADD COLUMN company VARCHAR(255);
    END IF;
    
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
    END IF;
    
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'role') THEN
        ALTER TABLE user_profiles ADD COLUMN role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'member'));
    END IF;
END $$;

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- =====================================================
-- 4. CREATE UPDATED_AT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- User Preferences Policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own preferences" ON user_preferences;
CREATE POLICY "Users can delete their own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Notification Settings Policies
DROP POLICY IF EXISTS "Users can view their own notification settings" ON notification_settings;
CREATE POLICY "Users can view their own notification settings" ON notification_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notification settings" ON notification_settings;
CREATE POLICY "Users can insert their own notification settings" ON notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notification settings" ON notification_settings;
CREATE POLICY "Users can update their own notification settings" ON notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notification settings" ON notification_settings;
CREATE POLICY "Users can delete their own notification settings" ON notification_settings
    FOR DELETE USING (auth.uid() = user_id);

-- User Subscriptions Policies
DROP POLICY IF EXISTS "Users can view their own subscription" ON user_subscriptions;
CREATE POLICY "Users can view their own subscription" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscription" ON user_subscriptions;
CREATE POLICY "Users can insert their own subscription" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON user_subscriptions;
CREATE POLICY "Users can update their own subscription" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own subscription" ON user_subscriptions;
CREATE POLICY "Users can delete their own subscription" ON user_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 7. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get or create user preferences with defaults
CREATE OR REPLACE FUNCTION get_user_preferences(p_user_id UUID)
RETURNS user_preferences AS $$
DECLARE
    preferences user_preferences;
BEGIN
    -- Try to get existing preferences
    SELECT * INTO preferences
    FROM user_preferences
    WHERE user_id = p_user_id;
    
    -- If no preferences exist, create default ones
    IF NOT FOUND THEN
        INSERT INTO user_preferences (
            user_id, currency, date_format, timezone, language, theme,
            default_country, default_rent_status, default_lease_term, default_currency_symbol
        ) VALUES (
            p_user_id, 'USD', 'MM/DD/YYYY', 'America/New_York', 'en', 'system',
            'US', 'active', 12, '$'
        ) RETURNING * INTO preferences;
    END IF;
    
    RETURN preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create notification settings with defaults
CREATE OR REPLACE FUNCTION get_notification_settings(p_user_id UUID)
RETURNS notification_settings AS $$
DECLARE
    settings notification_settings;
BEGIN
    -- Try to get existing settings
    SELECT * INTO settings
    FROM notification_settings
    WHERE user_id = p_user_id;
    
    -- If no settings exist, create default ones
    IF NOT FOUND THEN
        INSERT INTO notification_settings (
            user_id, email_enabled, in_app_enabled, lease_renewals, rent_overdue,
            maintenance_updates, inspection_reminders, payment_confirmations, system_updates, marketing_emails
        ) VALUES (
            p_user_id, true, true, true, true, true, true, true, true, false
        ) RETURNING * INTO settings;
    END IF;
    
    RETURN settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create user subscription with free plan defaults
CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS user_subscriptions AS $$
DECLARE
    subscription user_subscriptions;
BEGIN
    -- Try to get existing subscription
    SELECT * INTO subscription
    FROM user_subscriptions
    WHERE user_id = p_user_id;
    
    -- If no subscription exists, create free plan
    IF NOT FOUND THEN
        INSERT INTO user_subscriptions (
            user_id, plan_id, plan_name, plan_price, plan_currency, plan_interval,
            plan_features, status, current_period_start, current_period_end
        ) VALUES (
            p_user_id, 'free', 'Free Plan', 0.00, 'USD', 'month',
            '{"max_properties": 5, "max_units": 25, "max_tenants": 50, "storage_gb": 1, "team_members": 1, "advanced_reports": false, "api_access": false, "priority_support": false}'::jsonb,
            'active', NOW(), NOW() + INTERVAL '1 month'
        ) RETURNING * INTO subscription;
    END IF;
    
    RETURN subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
