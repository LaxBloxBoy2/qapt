const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const url = require('url');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://auaytfzunufzzkurjlol.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey && !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey || supabaseKey,
      'X-Client-Info': 'supabase-js/2.x'
    }
  }
});

// Function to check if a URL is accessible
async function checkUrl(urlToCheck) {
  return new Promise((resolve) => {
    const parsedUrl = url.parse(urlToCheck);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = protocol.get(urlToCheck, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Origin': 'http://localhost:3000'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          success: res.statusCode >= 200 && res.statusCode < 300,
          data: data.substring(0, 100) // Just get a sample of the data
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        status: 0,
        success: false,
        error: error.message
      });
    });
    
    // Set a timeout
    req.setTimeout(5000, () => {
      req.abort();
      resolve({
        status: 0,
        success: false,
        error: 'Request timed out'
      });
    });
  });
}

// Function to test image URLs
async function testImageUrls() {
  console.log('Testing image URLs from Supabase storage...');
  
  try {
    // 1. Get recent images from the database
    const { data: photos, error: photosError } = await supabase
      .from('property_photos')
      .select('id, url, storage_path')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (photosError) {
      throw photosError;
    }
    
    console.log(`Found ${photos.length} recent photos to test`);
    
    // 2. Test each URL
    for (const photo of photos) {
      console.log(`\nTesting photo ${photo.id}:`);
      console.log(`URL: ${photo.url}`);
      
      // Check if the URL is accessible
      const result = await checkUrl(photo.url);
      
      if (result.success) {
        console.log(`✅ URL is accessible (Status: ${result.status})`);
        
        // Check CORS headers
        const corsHeaders = [
          'access-control-allow-origin',
          'access-control-allow-methods',
          'access-control-allow-headers'
        ];
        
        let hasCorsHeaders = false;
        console.log('CORS Headers:');
        
        for (const header of corsHeaders) {
          if (result.headers[header]) {
            console.log(`  ✅ ${header}: ${result.headers[header]}`);
            hasCorsHeaders = true;
          } else {
            console.log(`  ❌ ${header}: Missing`);
          }
        }
        
        if (!hasCorsHeaders) {
          console.log('⚠️ No CORS headers found. This might cause issues with loading images.');
        }
        
        // Try to regenerate the URL with a cache-busting parameter
        const urlObj = new URL(photo.url);
        urlObj.searchParams.set('_cb', Date.now());
        const cacheBustedUrl = urlObj.toString();
        
        console.log(`Testing with cache-busting: ${cacheBustedUrl}`);
        const cacheBustedResult = await checkUrl(cacheBustedUrl);
        
        if (cacheBustedResult.success) {
          console.log(`✅ Cache-busted URL is accessible (Status: ${cacheBustedResult.status})`);
        } else {
          console.log(`❌ Cache-busted URL is NOT accessible (Status: ${cacheBustedResult.status})`);
          if (cacheBustedResult.error) {
            console.log(`  Error: ${cacheBustedResult.error}`);
          }
        }
      } else {
        console.log(`❌ URL is NOT accessible (Status: ${result.status})`);
        if (result.error) {
          console.log(`  Error: ${result.error}`);
        }
      }
    }
    
    // 3. Test URLs for each bucket
    console.log('\nTesting URLs for each bucket...');
    
    const buckets = ['image_url', 'property-photos', 'appliance-files', 'inspection-media'];
    
    for (const bucket of buckets) {
      console.log(`\nTesting bucket: ${bucket}`);
      
      // Get a list of files in the bucket
      const { data: files, error: filesError } = await supabase.storage
        .from(bucket)
        .list();
      
      if (filesError) {
        console.error(`Error listing files in ${bucket}:`, filesError.message);
        continue;
      }
      
      if (!files || files.length === 0) {
        console.log(`No files found in ${bucket}`);
        continue;
      }
      
      console.log(`Found ${files.length} files in ${bucket}`);
      
      // Test the first file
      const file = files[0];
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(file.name);
      
      console.log(`Testing file: ${file.name}`);
      console.log(`URL: ${urlData.publicUrl}`);
      
      const result = await checkUrl(urlData.publicUrl);
      
      if (result.success) {
        console.log(`✅ URL is accessible (Status: ${result.status})`);
      } else {
        console.log(`❌ URL is NOT accessible (Status: ${result.status})`);
        if (result.error) {
          console.log(`  Error: ${result.error}`);
        }
      }
    }
    
    console.log('\nURL testing completed');
    
  } catch (error) {
    console.error('Error testing image URLs:', error);
    process.exit(1);
  }
}

// Run the tests
testImageUrls();
