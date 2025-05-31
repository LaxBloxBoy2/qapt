// Run this script to fix Supabase schema issues
// Usage: node fix-supabase-schema.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials
const supabaseUrl = 'https://auaytfzunufzzkurjlol.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YXl0Znp1bnVmenprdXJqbG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjgyMDQsImV4cCI6MjA2MzM0NDIwNH0._gRpRLIuOB3NI-nR6CdyfZ6W8IVksOCsp-ejbkS5Vnc';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSupabaseSchema() {
  try {
    console.log('Starting Supabase schema fix...');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'supabase', 'fixed-schema-updated.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL
    // Note: This requires the 'exec_sql' RPC function to be available in your Supabase project
    // If it's not available, you'll need to execute the SQL through the Supabase dashboard SQL editor
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('Error executing SQL:', error);
      console.log('Please execute the SQL manually through the Supabase dashboard SQL editor.');
      console.log('The SQL file is located at:', sqlFilePath);
      return;
    }

    console.log('SQL executed successfully!');
    console.log('Checking user profiles table...');

    // Check if the user_profiles table exists
    const { data: tableData, error: tableError } = await supabase
      .from('user_profiles')
      .select('count(*)')
      .single();

    if (tableError) {
      console.error('Error checking user_profiles table:', tableError);
      return;
    }

    console.log('User profiles count:', tableData.count);
    console.log('Supabase schema fix completed successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixSupabaseSchema();
