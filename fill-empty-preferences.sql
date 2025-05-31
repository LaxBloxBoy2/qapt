-- Fill Empty Preferences and Profiles
-- Simple script to create basic default preferences for users who don't have them

-- 1. Create basic user profiles for users who don't have one
INSERT INTO public.user_profiles (id, full_name, role, status, created_at, updated_at)
SELECT
    u.id,
    u.email as full_name,  -- Just use email as name for now
    'user' as role,
    'active' as status,
    u.created_at,
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create basic user preferences for users who don't have them
INSERT INTO public.user_preferences (
    user_id, currency, date_format, timezone, language, theme,
    default_country, default_rent_status, default_lease_term, default_currency_symbol,
    created_at, updated_at
)
SELECT
    u.id,
    'USD' as currency,
    'MM/DD/YYYY' as date_format,
    'America/New_York' as timezone,
    'en' as language,
    'system' as theme,
    'US' as default_country,
    'active' as default_rent_status,
    12 as default_lease_term,
    '$' as default_currency_symbol,
    u.created_at,
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_preferences p WHERE p.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Create basic notification settings for users who don't have them
INSERT INTO public.notification_settings (
    user_id, email_enabled, in_app_enabled, lease_renewals, rent_overdue,
    maintenance_updates, inspection_reminders, payment_confirmations,
    system_updates, marketing_emails, created_at, updated_at
)
SELECT
    u.id,
    true as email_enabled,
    true as in_app_enabled,
    true as lease_renewals,
    true as rent_overdue,
    true as maintenance_updates,
    true as inspection_reminders,
    true as payment_confirmations,
    true as system_updates,
    false as marketing_emails,
    u.created_at,
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_settings n WHERE n.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 4. Create basic subscription for users who don't have one
INSERT INTO public.user_subscriptions (
    user_id, plan_id, plan_name, plan_price, plan_currency, plan_interval,
    plan_features, status, current_period_start, current_period_end,
    created_at, updated_at
)
SELECT
    u.id,
    'free' as plan_id,
    'Free Plan' as plan_name,
    0.00 as plan_price,
    'USD' as plan_currency,
    'month' as plan_interval,
    '{
        "max_properties": 5,
        "max_units": 25,
        "max_tenants": 50,
        "storage_gb": 1,
        "team_members": 1,
        "advanced_reports": false,
        "api_access": false,
        "priority_support": false
    }'::jsonb as plan_features,
    'active' as status,
    NOW() as current_period_start,
    NOW() + INTERVAL '30 days' as current_period_end,
    u.created_at,
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_subscriptions s WHERE s.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 5. Show summary
SELECT
    'Basic preferences filled!' as status,
    (SELECT COUNT(*) FROM public.user_profiles) as total_profiles,
    (SELECT COUNT(*) FROM public.user_preferences) as total_preferences,
    (SELECT COUNT(*) FROM public.notification_settings) as total_notifications,
    (SELECT COUNT(*) FROM public.user_subscriptions) as total_subscriptions;
