// Run this script to fix profiles for existing users
// Usage: node fix-existing-users.js

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

async function fixExistingUsers() {
  try {
    console.log('Starting the process to fix profiles for existing users...');
    
    // Ask for the user's email
    const email = await new Promise(resolve => {
      rl.question('Enter the email of the user to fix: ', resolve);
    });
    
    // Sign in with the user's email
    const password = await new Promise(resolve => {
      rl.question('Enter the password for this user: ', resolve);
    });
    
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
    
    // Check if the user has a profile
    console.log('Checking if user has a profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();
    
    if (profileError) {
      console.error('Error checking profile:', profileError);
      
      if (profileError.code === 'PGRST116') { // Record not found
        console.log('User does not have a profile. Creating one...');
        
        // Create a profile for the user
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([
            {
              id: signInData.user.id,
              full_name: '',
              role: 'admin',
            },
          ]);
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
          
          if (insertError.message && insertError.message.includes('user_profiles_id_seq')) {
            console.log('The error is related to the sequence. Please run the fix-sequence.sql script first.');
          }
          
          rl.close();
          return;
        }
        
        console.log('Profile created successfully!');
      }
    } else {
      console.log('User already has a profile:', profileData);
    }
    
    // Ask if the user wants to fix another user
    rl.question('Do you want to fix another user? (y/n) ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        rl.close();
        fixExistingUsers();
      } else {
        console.log('Process completed!');
        rl.close();
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    rl.close();
  }
}

fixExistingUsers();
