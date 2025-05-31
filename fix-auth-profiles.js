// Run this script to fix authentication and user profile issues
// Usage: node fix-auth-profiles.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

async function fixAuthProfiles() {
  try {
    console.log('Starting authentication and user profile fix...');

    // Check if the user_profiles table exists
    console.log('Checking user_profiles table...');
    const { data: tableData, error: tableError } = await supabase
      .from('user_profiles')
      .select('count(*)')
      .limit(1);

    if (tableError) {
      console.error('Error checking user_profiles table:', tableError);
      
      if (tableError.code === '42P01') { // Table doesn't exist
        console.log('The user_profiles table does not exist. You need to create it.');
        console.log('Please follow these steps:');
        console.log('1. Go to the Supabase dashboard: https://app.supabase.com');
        console.log('2. Select your project');
        console.log('3. Go to the SQL Editor');
        console.log('4. Create a new query');
        console.log('5. Copy and paste the contents of supabase/fixed-schema-updated.sql');
        console.log('6. Run the query');
        
        const sqlFilePath = path.join(__dirname, 'supabase', 'fixed-schema-updated.sql');
        console.log('The SQL file is located at:', sqlFilePath);
        
        rl.close();
        return;
      }
    }

    console.log('User profiles table exists.');

    // Ask if the user wants to try to fix the schema
    rl.question('Do you want to try to fix the schema? (y/n) ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        // Try to fix the schema
        console.log('Attempting to fix the schema...');
        
        // First, try to create the user_profiles table if it doesn't exist
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.user_profiles (
          id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          full_name TEXT,
          role TEXT CHECK (role IN ('admin', 'team_member')),
          created_at TIMESTAMP DEFAULT now()
        );
        `;
        
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL }).catch(() => {
          return { error: { message: 'exec_sql RPC function not available' } };
        });
        
        if (createError) {
          console.log('Could not execute SQL via RPC. You need to run the SQL manually.');
          console.log('Please follow these steps:');
          console.log('1. Go to the Supabase dashboard: https://app.supabase.com');
          console.log('2. Select your project');
          console.log('3. Go to the SQL Editor');
          console.log('4. Create a new query');
          console.log('5. Copy and paste the contents of supabase/fixed-schema-updated.sql');
          console.log('6. Run the query');
          
          const sqlFilePath = path.join(__dirname, 'supabase', 'fixed-schema-updated.sql');
          console.log('The SQL file is located at:', sqlFilePath);
          
          rl.close();
          return;
        }
        
        console.log('Table created or already exists.');
        
        // Now try to create a user profile for an existing user
        rl.question('Do you want to create a profile for an existing user? (y/n) ', async (createAnswer) => {
          if (createAnswer.toLowerCase() === 'y') {
            const email = await new Promise(resolve => {
              rl.question('Enter the user email: ', resolve);
            });
            
            // Get the user ID
            const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email).catch(() => {
              return { error: { message: 'Admin API not available with anon key' } };
            });
            
            if (userError) {
              console.log('Could not get user by email. You need to get the user ID manually.');
              console.log('Please follow these steps:');
              console.log('1. Go to the Supabase dashboard: https://app.supabase.com');
              console.log('2. Select your project');
              console.log('3. Go to Authentication > Users');
              console.log('4. Find the user with email:', email);
              console.log('5. Copy the user ID');
              
              const userId = await new Promise(resolve => {
                rl.question('Enter the user ID: ', resolve);
              });
              
              // Create the profile
              const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert([
                  {
                    id: userId,
                    full_name: '',
                    role: 'admin',
                  },
                ]);
              
              if (profileError) {
                console.error('Error creating profile:', profileError);
              } else {
                console.log('Profile created successfully!');
              }
            } else if (userData) {
              // Create the profile
              const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert([
                  {
                    id: userData.user.id,
                    full_name: '',
                    role: 'admin',
                  },
                ]);
              
              if (profileError) {
                console.error('Error creating profile:', profileError);
              } else {
                console.log('Profile created successfully!');
              }
            }
            
            rl.close();
          } else {
            rl.close();
          }
        });
      } else {
        rl.close();
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    rl.close();
  }
}

fixAuthProfiles();
