-- Fix Team Members Table Schema
-- This script ensures the team_members table has the correct structure for invitations

-- Drop the existing table if it has the wrong structure
DROP TABLE IF EXISTS public.team_members CASCADE;

-- Create the correct team_members table for invitations
CREATE TABLE public.team_members (
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

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view team members they own" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view their own record" ON public.team_members;
DROP POLICY IF EXISTS "Users can insert team members they own" ON public.team_members;
DROP POLICY IF EXISTS "Users can update team members they own" ON public.team_members;
DROP POLICY IF EXISTS "Team members can update their own record" ON public.team_members;
DROP POLICY IF EXISTS "Users can delete team members they own" ON public.team_members;

-- Create RLS policies
CREATE POLICY "Users can view team members they own" ON public.team_members
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Team members can view their own record" ON public.team_members
    FOR SELECT USING (auth.uid() = member_id);

CREATE POLICY "Users can insert team members they own" ON public.team_members
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update team members they own" ON public.team_members
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Team members can update their own record" ON public.team_members
    FOR UPDATE USING (auth.uid() = member_id);

CREATE POLICY "Users can delete team members they own" ON public.team_members
    FOR DELETE USING (auth.uid() = owner_id);

-- Create or replace the invite_team_member function
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

-- Create or replace the accept_team_invitation function
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

-- Create or replace the get_team_members function
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
