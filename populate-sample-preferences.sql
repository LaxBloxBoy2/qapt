-- Populate Sample Preferences for All Users
-- This script creates realistic sample data for user preferences, profiles, and settings

-- 1. Create sample user profiles for all authenticated users
INSERT INTO public.user_profiles (id, email, full_name, phone, company, role, status, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    CASE 
        WHEN u.email LIKE '%john%' THEN 'John Smith'
        WHEN u.email LIKE '%jane%' THEN 'Jane Doe'
        WHEN u.email LIKE '%mike%' THEN 'Mike Johnson'
        WHEN u.email LIKE '%sarah%' THEN 'Sarah Wilson'
        WHEN u.email LIKE '%david%' THEN 'David Brown'
        WHEN u.email LIKE '%lisa%' THEN 'Lisa Davis'
        WHEN u.email LIKE '%anwar%' THEN 'Anwar Laxiro'
        ELSE INITCAP(SPLIT_PART(u.email, '@', 1)) || ' ' || 
             (ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'])[
                 (ABS(HASHTEXT(u.id::text)) % 10) + 1
             ]
    END as full_name,
    CASE 
        WHEN RANDOM() < 0.7 THEN 
            '+1 (' || (200 + (ABS(HASHTEXT(u.id::text)) % 800))::text || ') ' ||
            (200 + (ABS(HASHTEXT(u.email)) % 800))::text || '-' ||
            (1000 + (ABS(HASHTEXT(u.created_at::text)) % 9000))::text
        ELSE NULL
    END as phone,
    CASE 
        WHEN RANDOM() < 0.6 THEN 
            (ARRAY['Property Management LLC', 'Real Estate Ventures', 'Urban Properties Inc', 'Metro Rentals', 'Prime Properties', 'City Real Estate', 'Residential Holdings', 'Property Solutions', 'Elite Rentals', 'Modern Properties'])[
                (ABS(HASHTEXT(u.id::text)) % 10) + 1
            ]
        ELSE NULL
    END as company,
    'user' as role,
    'active' as status,
    u.created_at,
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    company = EXCLUDED.company,
    updated_at = NOW();

-- 2. Create sample user preferences for all users
INSERT INTO public.user_preferences (
    user_id, currency, date_format, timezone, language, theme,
    default_country, default_rent_status, default_lease_term, default_currency_symbol,
    created_at, updated_at
)
SELECT 
    u.id,
    -- Realistic currency distribution
    CASE 
        WHEN u.email LIKE '%.uk' OR u.email LIKE '%london%' OR u.email LIKE '%britain%' THEN 'GBP'
        WHEN u.email LIKE '%.de' OR u.email LIKE '%.fr' OR u.email LIKE '%.es' OR u.email LIKE '%euro%' THEN 'EUR'
        WHEN RANDOM() < 0.15 THEN 'GBP'
        WHEN RANDOM() < 0.25 THEN 'EUR'
        ELSE 'USD'
    END as currency,
    -- Date format based on region
    CASE 
        WHEN u.email LIKE '%.uk' OR u.email LIKE '%.au' OR RANDOM() < 0.2 THEN 'DD/MM/YYYY'
        WHEN RANDOM() < 0.1 THEN 'YYYY-MM-DD'
        ELSE 'MM/DD/YYYY'
    END as date_format,
    -- Timezone variety
    CASE 
        WHEN u.email LIKE '%.uk' OR u.email LIKE '%london%' THEN 'Europe/London'
        WHEN u.email LIKE '%.de' OR u.email LIKE '%berlin%' THEN 'Europe/Berlin'
        WHEN u.email LIKE '%.fr' OR u.email LIKE '%paris%' THEN 'Europe/Paris'
        WHEN u.email LIKE '%pacific%' OR u.email LIKE '%seattle%' OR u.email LIKE '%portland%' THEN 'America/Los_Angeles'
        WHEN u.email LIKE '%mountain%' OR u.email LIKE '%denver%' THEN 'America/Denver'
        WHEN u.email LIKE '%central%' OR u.email LIKE '%chicago%' OR u.email LIKE '%dallas%' THEN 'America/Chicago'
        WHEN RANDOM() < 0.15 THEN 'America/Los_Angeles'
        WHEN RANDOM() < 0.25 THEN 'America/Chicago'
        WHEN RANDOM() < 0.35 THEN 'Europe/London'
        ELSE 'America/New_York'
    END as timezone,
    -- Language preferences
    CASE 
        WHEN u.email LIKE '%.es' OR u.email LIKE '%spanish%' OR RANDOM() < 0.1 THEN 'es'
        WHEN u.email LIKE '%.fr' OR u.email LIKE '%french%' OR RANDOM() < 0.05 THEN 'fr'
        WHEN u.email LIKE '%.de' OR u.email LIKE '%german%' OR RANDOM() < 0.05 THEN 'de'
        ELSE 'en'
    END as language,
    -- Theme preferences
    CASE 
        WHEN RANDOM() < 0.4 THEN 'light'
        WHEN RANDOM() < 0.7 THEN 'dark'
        ELSE 'system'
    END as theme,
    -- Country based on email/timezone
    CASE 
        WHEN u.email LIKE '%.uk' THEN 'GB'
        WHEN u.email LIKE '%.de' THEN 'DE'
        WHEN u.email LIKE '%.fr' THEN 'FR'
        WHEN u.email LIKE '%.es' THEN 'ES'
        WHEN u.email LIKE '%.ca' THEN 'CA'
        WHEN u.email LIKE '%.au' THEN 'AU'
        ELSE 'US'
    END as default_country,
    -- Default rent status
    CASE 
        WHEN RANDOM() < 0.9 THEN 'active'
        ELSE 'inactive'
    END as default_rent_status,
    -- Lease term variety
    CASE 
        WHEN RANDOM() < 0.6 THEN 12
        WHEN RANDOM() < 0.8 THEN 6
        WHEN RANDOM() < 0.9 THEN 24
        ELSE 18
    END as default_lease_term,
    -- Currency symbol matching currency
    CASE 
        WHEN u.email LIKE '%.uk' OR u.email LIKE '%london%' OR u.email LIKE '%britain%' THEN '£'
        WHEN u.email LIKE '%.de' OR u.email LIKE '%.fr' OR u.email LIKE '%.es' OR u.email LIKE '%euro%' THEN '€'
        WHEN RANDOM() < 0.15 THEN '£'
        WHEN RANDOM() < 0.25 THEN '€'
        ELSE '$'
    END as default_currency_symbol,
    u.created_at,
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_preferences p WHERE p.user_id = u.id
)
ON CONFLICT (user_id) DO UPDATE SET
    updated_at = NOW();

-- 3. Create sample notification settings for all users
INSERT INTO public.notification_settings (
    user_id, email_enabled, in_app_enabled, lease_renewals, rent_overdue,
    maintenance_updates, inspection_reminders, payment_confirmations,
    system_updates, marketing_emails, created_at, updated_at
)
SELECT 
    u.id,
    CASE WHEN RANDOM() < 0.85 THEN true ELSE false END as email_enabled,
    CASE WHEN RANDOM() < 0.95 THEN true ELSE false END as in_app_enabled,
    CASE WHEN RANDOM() < 0.9 THEN true ELSE false END as lease_renewals,
    CASE WHEN RANDOM() < 0.95 THEN true ELSE false END as rent_overdue,
    CASE WHEN RANDOM() < 0.8 THEN true ELSE false END as maintenance_updates,
    CASE WHEN RANDOM() < 0.75 THEN true ELSE false END as inspection_reminders,
    CASE WHEN RANDOM() < 0.85 THEN true ELSE false END as payment_confirmations,
    CASE WHEN RANDOM() < 0.7 THEN true ELSE false END as system_updates,
    CASE WHEN RANDOM() < 0.3 THEN true ELSE false END as marketing_emails,
    u.created_at,
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_settings n WHERE n.user_id = u.id
)
ON CONFLICT (user_id) DO UPDATE SET
    updated_at = NOW();

-- 4. Create sample subscription data for all users
INSERT INTO public.user_subscriptions (
    user_id, plan_id, plan_name, plan_price, plan_currency, plan_interval,
    plan_features, status, current_period_start, current_period_end,
    trial_end, cancel_at_period_end, created_at, updated_at
)
SELECT 
    u.id,
    CASE 
        WHEN RANDOM() < 0.6 THEN 'free'
        WHEN RANDOM() < 0.85 THEN 'basic'
        WHEN RANDOM() < 0.95 THEN 'pro'
        ELSE 'enterprise'
    END as plan_id,
    CASE 
        WHEN RANDOM() < 0.6 THEN 'Free Plan'
        WHEN RANDOM() < 0.85 THEN 'Basic Plan'
        WHEN RANDOM() < 0.95 THEN 'Pro Plan'
        ELSE 'Enterprise Plan'
    END as plan_name,
    CASE 
        WHEN RANDOM() < 0.6 THEN 0.00
        WHEN RANDOM() < 0.85 THEN 29.99
        WHEN RANDOM() < 0.95 THEN 79.99
        ELSE 199.99
    END as plan_price,
    'USD' as plan_currency,
    'month' as plan_interval,
    CASE 
        WHEN RANDOM() < 0.6 THEN '{
            "max_properties": 5,
            "max_units": 25,
            "max_tenants": 50,
            "storage_gb": 1,
            "team_members": 1,
            "advanced_reports": false,
            "api_access": false,
            "priority_support": false
        }'::jsonb
        WHEN RANDOM() < 0.85 THEN '{
            "max_properties": 25,
            "max_units": 100,
            "max_tenants": 200,
            "storage_gb": 10,
            "team_members": 3,
            "advanced_reports": true,
            "api_access": false,
            "priority_support": false
        }'::jsonb
        WHEN RANDOM() < 0.95 THEN '{
            "max_properties": 100,
            "max_units": 500,
            "max_tenants": 1000,
            "storage_gb": 50,
            "team_members": 10,
            "advanced_reports": true,
            "api_access": true,
            "priority_support": true
        }'::jsonb
        ELSE '{
            "max_properties": -1,
            "max_units": -1,
            "max_tenants": -1,
            "storage_gb": 500,
            "team_members": -1,
            "advanced_reports": true,
            "api_access": true,
            "priority_support": true
        }'::jsonb
    END as plan_features,
    CASE 
        WHEN RANDOM() < 0.9 THEN 'active'
        WHEN RANDOM() < 0.95 THEN 'trialing'
        ELSE 'canceled'
    END as status,
    NOW() - INTERVAL '15 days' as current_period_start,
    NOW() + INTERVAL '15 days' as current_period_end,
    CASE 
        WHEN RANDOM() < 0.3 THEN NOW() + INTERVAL '7 days'
        ELSE NULL
    END as trial_end,
    CASE WHEN RANDOM() < 0.1 THEN true ELSE false END as cancel_at_period_end,
    u.created_at,
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_subscriptions s WHERE s.user_id = u.id
)
ON CONFLICT (user_id) DO UPDATE SET
    updated_at = NOW();

-- 5. Summary of what was created
SELECT 
    'Sample data populated successfully!' as status,
    (SELECT COUNT(*) FROM public.user_profiles) as profiles_created,
    (SELECT COUNT(*) FROM public.user_preferences) as preferences_created,
    (SELECT COUNT(*) FROM public.notification_settings) as notifications_created,
    (SELECT COUNT(*) FROM public.user_subscriptions) as subscriptions_created;
