# Settings Migration Instructions

## Step 1: Apply Database Schema

**RECOMMENDED: Use the minimal migration first**

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy the entire contents of `minimal-settings-migration.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

**Alternative: If you want team features, use `consolidated-settings-migration.sql` instead**

## Step 2: Verify Tables Created

After running the migration, verify these tables exist:
- `user_preferences`
- `notification_settings`
- `team_members`
- `user_subscriptions`

## Step 3: Test the Settings Page

1. Go to `/settings` in your application
2. Try updating profile information
3. Try changing app preferences
4. Try toggling notification settings

## What the Migration Does

### Tables Created:
- **user_preferences**: Stores currency, date format, theme, default values
- **notification_settings**: Stores email/in-app notification preferences
- **team_members**: Stores team member invitations and permissions
- **user_subscriptions**: Stores subscription plan and billing info

### Functions Created:
- **get_user_preferences()**: Gets or creates default preferences
- **get_notification_settings()**: Gets or creates default notification settings
- **get_user_subscription()**: Gets or creates free plan subscription
- **handle_new_user()**: Automatically creates settings for new users

### Security:
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Proper indexes for performance

### Triggers:
- Auto-update `updated_at` timestamps
- Auto-create settings for new user signups

## Troubleshooting

If you get errors:
1. Make sure you're using the Service Role key in Supabase
2. Check that the `user_profiles` table exists
3. Verify RLS policies are not blocking access
4. Check the Supabase logs for detailed error messages

## Next Steps

After the migration is successful:
1. Test all settings functionality
2. Verify data persistence
3. Test new user signup flow
4. Check that default values are applied correctly
