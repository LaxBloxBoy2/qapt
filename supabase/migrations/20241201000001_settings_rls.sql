-- Row Level Security Policies for Settings Tables

-- Enable RLS on all settings tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- User Preferences Policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Notification Settings Policies
CREATE POLICY "Users can view their own notification settings" ON notification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" ON notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" ON notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification settings" ON notification_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Team Members Policies
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

-- User Subscriptions Policies
CREATE POLICY "Users can view their own subscription" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscription" ON user_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Billing Info Policies
CREATE POLICY "Users can view their own billing info" ON billing_info
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own billing info" ON billing_info
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own billing info" ON billing_info
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own billing info" ON billing_info
    FOR DELETE USING (auth.uid() = user_id);

-- Invoices Policies
CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices" ON invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" ON invoices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" ON invoices
    FOR DELETE USING (auth.uid() = user_id);
