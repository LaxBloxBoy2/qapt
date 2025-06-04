import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendInvitationEmail(email: string, inviterName: string, invitationToken: string) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${invitationToken}`;

  // If Resend is not configured, log the email instead
  if (!resend) {
    console.log(`
      📧 EMAIL WOULD BE SENT TO: ${email}

      Subject: You've been invited to join ${inviterName}'s property management team

      Invitation URL: ${inviteUrl}

      Note: Resend API key not configured. Email sending is disabled.
    `);
    return { success: true, messageId: 'simulated' };
  }

  console.log('✅ Resend is configured, sending real email to:', email);
  console.log('🔑 API Key exists:', !!process.env.RESEND_API_KEY);
  console.log('🔑 API Key length:', process.env.RESEND_API_KEY?.length);

  try {
    console.log('📧 Attempting to send email via Resend...');
    const { data, error } = await resend.emails.send({
      from: 'QAPT Team <onboarding@resend.dev>',  // Using Resend's default domain
      to: [email],
      subject: `You've been invited to join ${inviterName}'s property management team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Team Invitation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">QAPT</h1>
            <p style="color: #e6fffa; margin: 10px 0 0 0;">Property Management Platform</p>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0;">You've been invited to join a team!</h2>

            <p>Hi there!</p>

            <p><strong>${inviterName}</strong> has invited you to join their property management team on QAPT.</p>

            <p>QAPT is a comprehensive property management platform that helps teams manage properties, tenants, leases, maintenance, and finances all in one place.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">Accept Invitation</a>
            </div>

            <p style="color: #6b7280; font-size: 14px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="background: #f3f4f6; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 14px;">${inviteUrl}</p>

            <p style="color: #6b7280; font-size: 14px;">If you don't have an account yet, you'll be able to create one during the invitation process.</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Best regards,<br>
              The QAPT Team
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>This invitation was sent to ${email}. If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log('📬 Resend response data:', data);
    console.log('❌ Resend response error:', error);

    if (error) {
      console.error('❌ Resend API error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to send email: ${error.message || JSON.stringify(error)}`);
    }

    console.log('✅ Email sent successfully! Message ID:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('💥 Email sending failed with error:', error);
    console.error('💥 Error stack:', error.stack);
    console.error('💥 Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
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
    console.log('🚀 About to send invitation email...');
    try {
      const emailResult = await sendInvitationEmail(email, inviterName, invitation.invitation_token);
      console.log('📧 Email sending result:', emailResult);
    } catch (emailError: any) {
      console.error('💥 Email sending error in main function:', emailError);
      console.error('💥 Email error message:', emailError.message);
      console.error('💥 Email error stack:', emailError.stack);
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
