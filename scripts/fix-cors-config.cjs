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

async function fixCorsConfig() {
  try {
    console.log('Starting CORS configuration fix...');
    
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
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      });
      
      if (updateError) {
        console.error(`Error updating bucket ${bucket.name}:`, updateError.message);
        continue;
      }
      
      console.log(`✅ Updated bucket ${bucket.name} to be public`);
    }
    
    // 3. Execute SQL to configure CORS at the project level
    console.log('\nConfiguring project-level CORS settings...');
    
    // This SQL will configure CORS for the entire project
    const corsConfigSql = `
      -- Configure CORS for the entire project
      INSERT INTO storage.buckets_config (bucket_id, cors_origins, cors_methods, cors_allowed_headers, cors_max_age_seconds)
      VALUES 
        ('appliance-files', ARRAY['*'], ARRAY['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], ARRAY['*'], 3600),
        ('inspection-media', ARRAY['*'], ARRAY['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], ARRAY['*'], 3600),
        ('property-photos', ARRAY['*'], ARRAY['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], ARRAY['*'], 3600),
        ('image_url', ARRAY['*'], ARRAY['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], ARRAY['*'], 3600)
      ON CONFLICT (bucket_id) 
      DO UPDATE SET
        cors_origins = ARRAY['*'],
        cors_methods = ARRAY['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        cors_allowed_headers = ARRAY['*'],
        cors_max_age_seconds = 3600;
    `;
    
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: corsConfigSql });
    
    if (sqlError) {
      console.error('Error executing SQL for CORS configuration:', sqlError.message);
      console.log('Note: If the error is about "function exec_sql does not exist", you need to create this function or use the Supabase dashboard to configure CORS.');
      console.log('Please go to the Supabase dashboard > Project Settings > API > CORS and add * to the allowed origins.');
    } else {
      console.log('✅ Successfully configured CORS settings');
    }
    
    // 4. Verify storage policies
    console.log('\nVerifying storage policies...');
    
    // For each bucket, ensure there's a policy for public access
    for (const bucket of buckets) {
      // First, check if a policy already exists
      const { data: policies, error: policiesError } = await supabase
        .from('storage.policies')
        .select('*')
        .eq('bucket_id', bucket.name)
        .eq('name', `Allow public access to ${bucket.name}`);
      
      if (policiesError) {
        console.error(`Error checking policies for ${bucket.name}:`, policiesError.message);
        continue;
      }
      
      // If policy doesn't exist, create it
      if (!policies || policies.length === 0) {
        const createPolicySql = `
          -- Create policy for public access
          CREATE POLICY "Allow public access to ${bucket.name}"
          ON storage.objects
          FOR SELECT
          TO public
          USING (bucket_id = '${bucket.name}');
          
          -- Create policy for authenticated users to upload
          CREATE POLICY "Allow authenticated users to upload to ${bucket.name}"
          ON storage.objects
          FOR INSERT
          TO authenticated
          WITH CHECK (bucket_id = '${bucket.name}');
        `;
        
        const { error: policyError } = await supabase.rpc('exec_sql', { sql: createPolicySql });
        
        if (policyError) {
          console.error(`Error creating policies for ${bucket.name}:`, policyError.message);
        } else {
          console.log(`✅ Created policies for ${bucket.name}`);
        }
      } else {
        console.log(`✅ Policies already exist for ${bucket.name}`);
      }
    }
    
    console.log('\nCORS configuration completed.');
    console.log('\nIMPORTANT: If you still have issues, please manually configure CORS in the Supabase dashboard:');
    console.log('1. Go to https://app.supabase.com/project/_/settings/api');
    console.log('2. In the CORS section, add * to the "Allowed Origins" field');
    console.log('3. Save the changes');
    
  } catch (error) {
    console.error('Error fixing CORS configuration:', error);
    process.exit(1);
  }
}

fixCorsConfig();
