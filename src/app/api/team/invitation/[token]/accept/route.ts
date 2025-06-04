import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Get the current user from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the current user
    const authToken = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(authToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Fetch invitation by token
    const { data: invitation, error: inviteError } = await supabase
      .from('team_members')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // Check if the user's email matches the invitation email
    if (user.email !== invitation.email) {
      return NextResponse.json(
        { error: 'This invitation is for a different email address' },
        { status: 403 }
      );
    }

    // Check if invitation is expired (7 days)
    const invitedAt = new Date(invitation.invited_at);
    const now = new Date();
    const daysDiff = (now.getTime() - invitedAt.getTime()) / (1000 * 3600 * 24);
    
    if (daysDiff > 7) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // Accept the invitation using the database function
    const { data: acceptedInvitation, error: acceptError } = await supabase
      .rpc('accept_team_invitation', {
        p_invitation_token: token,
        p_member_id: user.id
      });

    if (acceptError) {
      console.error('Accept invitation error:', acceptError);
      return NextResponse.json(
        { error: 'Failed to accept invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      teamMember: {
        id: acceptedInvitation.id,
        email: acceptedInvitation.email,
        role: acceptedInvitation.role,
        status: acceptedInvitation.status,
        accepted_at: acceptedInvitation.accepted_at
      }
    });

  } catch (error: any) {
    console.error('Accept invitation error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
