// Run this script to fix the sequence issue in Supabase
// Usage: node fix-sequence-issue.js

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://auaytfzunufzzkurjlol.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YXl0Znp1bnVmenprdXJqbG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjgyMDQsImV4cCI6MjA2MzM0NDIwNH0._gRpRLIuOB3NI-nR6CdyfZ6W8IVksOCsp-ejbkS5Vnc';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSequenceIssue() {
  try {
    console.log('Starting sequence issue fix...');

    // Check if the user_profiles table exists
    console.log('Checking user_profiles table...');
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error checking user_profiles table:', error);
      
      if (error.code === '42P01') { // Table doesn't exist
        console.log('The user_profiles table does not exist. Creating it...');
        
        // Create the table
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.user_profiles (
          id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          full_name TEXT,
          role TEXT CHECK (role IN ('admin', 'team_member')),
          created_at TIMESTAMP DEFAULT now()
        );
        `;
        
        // Note: This won't work with the anon key, you'd need to use the service_role key
        console.log('Please run the following SQL in the Supabase SQL Editor:');
        console.log(createTableSQL);
      }
      
      return;
    }

    console.log('User profiles table exists.');
    
    // Try to create a user profile for a test user
    console.log('Creating a test user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test-user-' + Date.now() + '@example.com',
      password: 'password123',
    });
    
    if (signUpError) {
      console.error('Error creating test user:', signUpError);
      return;
    }
    
    console.log('Test user created:', signUpData.user.id);
    
    // Wait a moment for the trigger to run
    console.log('Waiting for trigger to run...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if the profile was created
    console.log('Checking if profile was created...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', signUpData.user.id)
      .single();
    
    if (profileError) {
      console.error('Error checking profile:', profileError);
      
      if (profileError.code === 'PGRST116') { // Record not found
        console.log('Profile was not created. Creating it manually...');
        
        // Create the profile
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([
            {
              id: signUpData.user.id,
              full_name: '',
              role: 'admin',
            },
          ]);
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
          
          if (insertError.message && insertError.message.includes('user_profiles_id_seq')) {
            console.log('The error is related to the sequence. Please run the following SQL in the Supabase SQL Editor:');
            console.log(`
            -- Drop the GRANT statement that references the non-existent sequence
            REVOKE USAGE ON SEQUENCE public.user_profiles_id_seq FROM authenticated;
            
            -- Re-create the trigger function
            CREATE OR REPLACE FUNCTION public.handle_new_user()
            RETURNS TRIGGER AS $$
            BEGIN
              -- Disable RLS temporarily
              ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
            
              -- Insert the user profile
              INSERT INTO public.user_profiles (id, full_name, role)
              VALUES (new.id, '', 'admin');
            
              -- Re-enable RLS
              ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
            
              RETURN new;
            EXCEPTION
              WHEN OTHERS THEN
                -- Make sure RLS is re-enabled even if there's an error
                ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
                RAISE;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            
            -- Re-create the trigger
            DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
            CREATE TRIGGER on_auth_user_created
              AFTER INSERT ON auth.users
              FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
            `);
          }
        } else {
          console.log('Profile created successfully!');
        }
      }
    } else {
      console.log('Profile was created successfully:', profileData);
    }
    
    console.log('Sequence issue fix completed!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixSequenceIssue();
