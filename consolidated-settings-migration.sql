-- Consolidated Settings Migration for QAPT
-- Run this in the Supabase SQL Editor

-- =====================================================
-- 1. CREATE SETTINGS TABLES
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
    default_country VARCHAR(2) DEFAULT 'US',
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

-- Team Members Table (with error handling)
DO $$
BEGIN
    -- Only create if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
        CREATE TABLE team_members (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

            -- Member Information
            email VARCHAR(255) NOT NULL,
            full_name VARCHAR(255),
            role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),

            -- Permissions
            permissions JSONB DEFAULT '{
                "properties": true,
                "tenants": true,
                "leases": true,
                "finances": false,
                "maintenance": true,
                "reports": false
            }'::jsonb,

            -- Status
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),

            -- Invitation
            invitation_token UUID DEFAULT gen_random_uuid(),
            invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            accepted_at TIMESTAMP WITH TIME ZONE,
            last_active TIMESTAMP WITH TIME ZONE,

            -- Metadata
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

            -- Ensure unique email per owner
            UNIQUE(owner_id, email)
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but continue
        RAISE NOTICE 'Could not create team_members table: %', SQLERRM;
END $$;

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
-- 2. CREATE INDEXES
-- =====================================================

-- Create indexes safely
DO $$
BEGIN
    -- User preferences indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
        CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
    END IF;

    -- Notification settings indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_settings') THEN
        CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
    END IF;

    -- Team members indexes (only if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
        CREATE INDEX IF NOT EXISTS idx_team_members_owner_id ON team_members(owner_id);
        CREATE INDEX IF NOT EXISTS idx_team_members_member_id ON team_members(member_id);
        CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
    END IF;

    -- User subscriptions indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions') THEN
        CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
    END IF;
END $$;

-- =====================================================
-- 3. CREATE UPDATED_AT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers safely
DO $$
BEGIN
    -- User preferences trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
        DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
        CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Notification settings trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_settings') THEN
        DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;
        CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Team members trigger (only if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
        DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
        CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- User subscriptions trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions') THEN
        DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
        CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS safely
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
        ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_settings') THEN
        ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
        ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions') THEN
        ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =====================================================
-- 5. CREATE RLS POLICIES
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

-- Team Members Policies (only if table exists and has the right columns)
DO $$
BEGIN
    -- Check if team_members table exists and has owner_id column
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'team_members'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'team_members' AND column_name = 'owner_id'
    ) THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view team members they own" ON team_members;
        DROP POLICY IF EXISTS "Team members can view their own record" ON team_members;
        DROP POLICY IF EXISTS "Users can insert team members they own" ON team_members;
        DROP POLICY IF EXISTS "Users can update team members they own" ON team_members;
        DROP POLICY IF EXISTS "Team members can update their own record" ON team_members;
        DROP POLICY IF EXISTS "Users can delete team members they own" ON team_members;

        -- Create new policies
        CREATE POLICY "Users can view team members they own" ON team_members
            FOR SELECT USING (auth.uid() = owner_id);

        CREATE POLICY "Team members can view their own record" ON team_members
            FOR SELECT USING (auth.uid() = member_id);

        CREATE POLICY "Users can insert team members they own" ON team_members
            FOR INSERT WITH CHECK (auth.uid() = owner_id);

        CREATE POLICY "Users can update team members they own" ON team_members
            FOR UPDATE USING (auth.uid() = owner_id);

        CREATE POLICY "Team members can update their own record" ON team_members
            FOR UPDATE USING (auth.uid() = member_id);

        CREATE POLICY "Users can delete team members they own" ON team_members
            FOR DELETE USING (auth.uid() = owner_id);
    END IF;
END $$;

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
-- 6. UPDATE USER_PROFILES TABLE
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
-- 8. CREATE USER SIGNUP TRIGGER
-- =====================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user profile
    INSERT INTO user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'admin'
    ) ON CONFLICT (id) DO NOTHING;

    -- Create default preferences
    PERFORM get_user_preferences(NEW.id);

    -- Create default notification settings
    PERFORM get_notification_settings(NEW.id);

    -- Create default subscription
    PERFORM get_user_subscription(NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
