import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  
  // Create a Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  try {
    // Get the session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data.session) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    
    // Get the user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.session.user.id)
      .single();
      
    if (profileError) {
      console.error('Error getting profile:', profileError);
      
      // Try to create a profile
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: data.session.user.id,
            full_name: '',
            role: 'admin',
          },
        ]);
        
      if (insertError) {
        console.error('Error creating profile:', insertError);
      }
    }
    
    return NextResponse.json({
      authenticated: true,
      user: data.session.user,
      profile: profileData || null,
    }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
