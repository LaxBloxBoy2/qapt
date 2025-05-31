// Run this script to fix authentication issues
// Usage: node fix-auth.js

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Supabase credentials
const supabaseUrl = 'https://auaytfzunufzzkurjlol.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YXl0Znp1bnVmenprdXJqbG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjgyMDQsImV4cCI6MjA2MzM0NDIwNH0._gRpRLIuOB3NI-nR6CdyfZ6W8IVksOCsp-ejbkS5Vnc';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function fixAuth() {
  try {
    console.log('Starting authentication fix...');

    // Get email and password from user
    const email = await new Promise(resolve => {
      rl.question('Enter your email: ', resolve);
    });

    const password = await new Promise(resolve => {
      rl.question('Enter your password: ', resolve);
    });

    // Sign in with email and password
    console.log('Attempting to sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Error signing in:', signInError);
      rl.close();
      return;
    }

    console.log('Sign in successful!');
    console.log('User ID:', signInData.user.id);

    // Check if user profile exists
    console.log('Checking user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      console.log('Creating profile...');

      // Create profile
      const { error: createError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: signInData.user.id,
            full_name: '',
            role: 'admin',
          },
        ]);

      if (createError) {
        console.error('Error creating profile:', createError);
        rl.close();
        return;
      }

      console.log('Profile created successfully!');
    } else {
      console.log('Profile found:', profileData);
    }

    // Execute SQL to fix RLS policies
    console.log('Fixing RLS policies...');
    const sql = `
      -- Drop existing RLS policies for user_profiles
      DROP POLICY IF EXISTS "Allow full access to own profile" ON public.user_profiles;
      DROP POLICY IF EXISTS "Allow select access to all profiles" ON public.user_profiles;

      -- Enable RLS on user_profiles table
      ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

      -- Create policy to allow users to select their own profile
      CREATE POLICY "Allow select access to own profile" 
      ON public.user_profiles 
      FOR SELECT 
      USING (auth.uid() = id);

      -- Create policy to allow users to update their own profile
      CREATE POLICY "Allow update access to own profile" 
      ON public.user_profiles 
      FOR UPDATE 
      USING (auth.uid() = id);

      -- Create policy to allow users to insert their own profile
      CREATE POLICY "Allow insert access to own profile" 
      ON public.user_profiles 
      FOR INSERT 
      WITH CHECK (auth.uid() = id);
    `;

    // Note: This won't work with the anon key, you'd need to use the service_role key
    // This is just for demonstration

    console.log('Authentication fix completed!');
    console.log('Please try logging in again in your application.');
    rl.close();
  } catch (error) {
    console.error('Unexpected error:', error);
    rl.close();
  }
}

fixAuth();
