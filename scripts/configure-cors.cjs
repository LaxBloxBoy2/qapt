/**
 * Simple script to configure CORS for Supabase storage
 * 
 * This script will:
 * 1. Make all buckets public
 * 2. Print instructions for manually configuring CORS in the Supabase dashboard
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://auaytfzunufzzkurjlol.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey && !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

async function configureCors() {
  try {
    console.log('Starting CORS configuration...');
    
    // 1. Get all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw bucketsError;
    }
    
    console.log(`Found ${buckets.length} buckets to configure:`);
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name}`);
    });
    
    // 2. Update each bucket to be public
    for (const bucket of buckets) {
      console.log(`\nConfiguring bucket: ${bucket.name}`);
      
      // Update bucket to be public
      const { error: updateError } = await supabase.storage.updateBucket(bucket.name, {
        public: true
      });
      
      if (updateError) {
        console.error(`Error updating bucket ${bucket.name}:`, updateError.message);
        continue;
      }
      
      console.log(`✅ Updated bucket ${bucket.name} to be public`);
    }
    
    console.log('\nCORS configuration completed.');
    console.log('\nIMPORTANT: Please manually configure CORS in the Supabase dashboard:');
    console.log('1. Go to https://app.supabase.com/project/_/settings/api');
    console.log('2. In the CORS section, add * to the "Allowed Origins" field');
    console.log('3. Save the changes');
    
  } catch (error) {
    console.error('Error configuring CORS:', error);
    process.exit(1);
  }
}

configureCors();
