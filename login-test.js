// Run this script to test login functionality
// Usage: node login-test.js

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

async function testLogin() {
  try {
    console.log('Starting login test...');
    
    // Get email and password from user
    const email = await new Promise(resolve => {
      rl.question('Enter your email: ', resolve);
    });
    
    const password = await new Promise(resolve => {
      rl.question('Enter your password: ', resolve);
    });
    
    // Sign in with email and password
    console.log('Attempting to sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Error signing in:', error);
      rl.close();
      return;
    }
    
    console.log('Sign in successful!');
    console.log('User:', data.user);
    console.log('Session:', data.session);
    
    // Check if user profile exists
    console.log('\nChecking user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      
      if (profileError.code === 'PGRST116') { // Record not found
        console.log('Profile not found. Creating one...');
        
        // Create a profile for the user
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([
            {
              id: data.user.id,
              full_name: '',
              role: 'admin',
            },
          ]);
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          console.log('Profile created successfully!');
        }
      }
    } else {
      console.log('Profile found:', profileData);
    }
    
    // Sign out
    console.log('\nSigning out...');
    await supabase.auth.signOut();
    console.log('Signed out successfully!');
    
    rl.close();
  } catch (error) {
    console.error('Unexpected error:', error);
    rl.close();
  }
}

testLogin();
