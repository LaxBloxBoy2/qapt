import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch invitation by token
    const { data: invitation, error } = await supabase
      .from('team_members')
      .select(`
        id,
        email,
        role,
        permissions,
        status,
        invited_at,
        owner_id
      `)
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // Get owner profile separately
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', invitation.owner_id)
      .single();

    // Check if invitation is expired (optional: 7 days)
    const invitedAt = new Date(invitation.invited_at);
    const now = new Date();
    const daysDiff = (now.getTime() - invitedAt.getTime()) / (1000 * 3600 * 24);

    if (daysDiff > 7) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        permissions: invitation.permissions,
        status: invitation.status,
        owner_name: ownerProfile?.full_name || 'Unknown',
      }
    });

  } catch (error: any) {
    console.error('Invitation fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
