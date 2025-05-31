-- Helper Functions for Settings Management

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
            user_id,
            currency,
            date_format,
            timezone,
            language,
            theme,
            default_country,
            default_rent_status,
            default_lease_term,
            default_currency_symbol
        ) VALUES (
            p_user_id,
            'USD',
            'MM/DD/YYYY',
            'America/New_York',
            'en',
            'system',
            'US',
            'active',
            12,
            '$'
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
            user_id,
            email_enabled,
            in_app_enabled,
            lease_renewals,
            rent_overdue,
            maintenance_updates,
            inspection_reminders,
            payment_confirmations,
            system_updates,
            marketing_emails
        ) VALUES (
            p_user_id,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            false
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
            user_id,
            plan_id,
            plan_name,
            plan_price,
            plan_currency,
            plan_interval,
            plan_features,
            status,
            current_period_start,
            current_period_end
        ) VALUES (
            p_user_id,
            'free',
            'Free Plan',
            0.00,
            'USD',
            'month',
            '{
                "max_properties": 5,
                "max_units": 25,
                "max_tenants": 50,
                "storage_gb": 1,
                "team_members": 1,
                "advanced_reports": false,
                "api_access": false,
                "priority_support": false
            }'::jsonb,
            'active',
            NOW(),
            NOW() + INTERVAL '1 month'
        ) RETURNING * INTO subscription;
    END IF;
    
    RETURN subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user preferences
CREATE OR REPLACE FUNCTION update_user_preferences(
    p_user_id UUID,
    p_preferences JSONB
)
RETURNS user_preferences AS $$
DECLARE
    updated_preferences user_preferences;
BEGIN
    -- Ensure preferences record exists
    PERFORM get_user_preferences(p_user_id);
    
    -- Update preferences
    UPDATE user_preferences SET
        currency = COALESCE((p_preferences->>'currency')::VARCHAR(3), currency),
        date_format = COALESCE((p_preferences->>'date_format')::VARCHAR(20), date_format),
        timezone = COALESCE(p_preferences->>'timezone', timezone),
        language = COALESCE((p_preferences->>'language')::VARCHAR(5), language),
        theme = COALESCE((p_preferences->>'theme')::VARCHAR(10), theme),
        default_country = COALESCE(p_preferences->>'default_country', default_country),
        default_rent_status = COALESCE((p_preferences->>'default_rent_status')::VARCHAR(20), default_rent_status),
        default_lease_term = COALESCE((p_preferences->>'default_lease_term')::INTEGER, default_lease_term),
        default_currency_symbol = COALESCE(p_preferences->>'default_currency_symbol', default_currency_symbol),
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO updated_preferences;
    
    RETURN updated_preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update notification settings
CREATE OR REPLACE FUNCTION update_notification_settings(
    p_user_id UUID,
    p_settings JSONB
)
RETURNS notification_settings AS $$
DECLARE
    updated_settings notification_settings;
BEGIN
    -- Ensure settings record exists
    PERFORM get_notification_settings(p_user_id);
    
    -- Update settings
    UPDATE notification_settings SET
        email_enabled = COALESCE((p_settings->>'email_enabled')::BOOLEAN, email_enabled),
        in_app_enabled = COALESCE((p_settings->>'in_app_enabled')::BOOLEAN, in_app_enabled),
        lease_renewals = COALESCE((p_settings->>'lease_renewals')::BOOLEAN, lease_renewals),
        rent_overdue = COALESCE((p_settings->>'rent_overdue')::BOOLEAN, rent_overdue),
        maintenance_updates = COALESCE((p_settings->>'maintenance_updates')::BOOLEAN, maintenance_updates),
        inspection_reminders = COALESCE((p_settings->>'inspection_reminders')::BOOLEAN, inspection_reminders),
        payment_confirmations = COALESCE((p_settings->>'payment_confirmations')::BOOLEAN, payment_confirmations),
        system_updates = COALESCE((p_settings->>'system_updates')::BOOLEAN, system_updates),
        marketing_emails = COALESCE((p_settings->>'marketing_emails')::BOOLEAN, marketing_emails),
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO updated_settings;
    
    RETURN updated_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to invite team member
CREATE OR REPLACE FUNCTION invite_team_member(
    p_owner_id UUID,
    p_email VARCHAR(255),
    p_full_name VARCHAR(255),
    p_role VARCHAR(20),
    p_permissions JSONB
)
RETURNS team_members AS $$
DECLARE
    new_member team_members;
BEGIN
    -- Insert new team member invitation
    INSERT INTO team_members (
        owner_id,
        email,
        full_name,
        role,
        permissions,
        status,
        invitation_token,
        invited_at
    ) VALUES (
        p_owner_id,
        p_email,
        p_full_name,
        p_role,
        p_permissions,
        'pending',
        gen_random_uuid(),
        NOW()
    ) RETURNING * INTO new_member;
    
    RETURN new_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept team invitation
CREATE OR REPLACE FUNCTION accept_team_invitation(
    p_invitation_token UUID,
    p_member_id UUID
)
RETURNS team_members AS $$
DECLARE
    updated_member team_members;
BEGIN
    -- Update team member record
    UPDATE team_members SET
        member_id = p_member_id,
        status = 'active',
        accepted_at = NOW(),
        last_active = NOW(),
        updated_at = NOW()
    WHERE invitation_token = p_invitation_token
    AND status = 'pending'
    RETURNING * INTO updated_member;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invitation token';
    END IF;
    
    RETURN updated_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get team members for a user
CREATE OR REPLACE FUNCTION get_team_members(p_owner_id UUID)
RETURNS SETOF team_members AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM team_members
    WHERE owner_id = p_owner_id
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
