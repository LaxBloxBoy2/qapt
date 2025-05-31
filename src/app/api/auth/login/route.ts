import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Create a Supabase client with the anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          status: error.status
        },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Login failed' },
        { status: 400 }
      );
    }

    // Check if user profile exists
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);

      // Create a profile if it doesn't exist
      if (profileError.code === 'PGRST116') { // Record not found
        // Create a profile with admin privileges
        const supabaseAdmin = createClient(
          supabaseUrl,
          process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
        );

        const { error: createError } = await supabaseAdmin
          .from('user_profiles')
          .insert([
            {
              id: data.user.id,
              full_name: '',
              role: 'admin',
            },
          ]);

        if (createError) {
          console.error('Profile creation error:', createError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session
    });
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
