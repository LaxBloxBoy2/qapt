import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// For now, we'll use a simple email simulation
// In production, you'd use SendGrid, Resend, or another email service
async function sendInvitationEmail(email: string, inviterName: string, invitationToken: string) {
  // Simulate email sending
  console.log(`
    📧 INVITATION EMAIL SENT TO: ${email}
    
    Subject: You've been invited to join ${inviterName}'s property management team
    
    Hi there!
    
    ${inviterName} has invited you to join their property management team on QAPT.
    
    Click the link below to accept the invitation:
    ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${invitationToken}
    
    If you don't have an account yet, you'll be able to create one during the invitation process.
    
    Best regards,
    The QAPT Team
  `);
  
  // In production, replace this with actual email sending:
  /*
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@qapt.com',
      to: email,
      subject: `You've been invited to join ${inviterName}'s property management team`,
      html: `
        <h2>You've been invited to join a property management team!</h2>
        <p>Hi there!</p>
        <p>${inviterName} has invited you to join their property management team on QAPT.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitationToken}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
        <p>If you don't have an account yet, you'll be able to create one during the invitation process.</p>
        <p>Best regards,<br>The QAPT Team</p>
      `,
    }),
  });
  */
  
  return { success: true };
}

export async function POST(request: Request) {
  try {
    const { email, role, permissions } = await request.json();

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
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Get the user's profile to get their name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const inviterName = profile?.full_name || 'Someone';

    // Check if user is already invited or exists
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id, status')
      .eq('owner_id', user.id)
      .eq('email', email)
      .single();

    if (existingMember) {
      if (existingMember.status === 'pending') {
        return NextResponse.json(
          { error: 'This user has already been invited and is pending acceptance' },
          { status: 400 }
        );
      } else if (existingMember.status === 'active') {
        return NextResponse.json(
          { error: 'This user is already a team member' },
          { status: 400 }
        );
      }
    }

    // Create the invitation
    const { data: invitation, error: inviteError } = await supabase
      .rpc('invite_team_member', {
        p_owner_id: user.id,
        p_email: email,
        p_full_name: '', // Will be filled when they accept
        p_role: role,
        p_permissions: permissions
      });

    if (inviteError) {
      console.error('Database error:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Send the invitation email
    try {
      await sendInvitationEmail(email, inviterName, invitation.invitation_token);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails, just log it
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        invited_at: invitation.invited_at
      }
    });

  } catch (error: any) {
    console.error('Invitation error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
