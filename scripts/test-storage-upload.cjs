const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
      'apikey': supabaseServiceKey || supabaseKey
    }
  },
  // Add storage-specific options
  storage: {
    // Ensure proper CORS handling for storage
    retryIntervalMs: 500,
    maxRetryCount: 3
  }
});

// Test file path - create a simple text file
const testFilePath = path.join(__dirname, 'test-upload.txt');
fs.writeFileSync(testFilePath, 'This is a test file for Supabase storage upload.');

// Function to test upload to a specific bucket
async function testBucketUpload(bucketName) {
  console.log(`\nTesting upload to ${bucketName} bucket...`);
  
  try {
    // Read the test file
    const fileBuffer = fs.readFileSync(testFilePath);
    
    // Generate a unique file name
    const fileName = `test-upload-${Date.now()}.txt`;
    
    // Upload the file
    console.log(`Uploading ${fileName} to ${bucketName}...`);
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error(`Error uploading to ${bucketName}:`, error.message);
      return false;
    }
    
    console.log(`Upload successful. Path: ${data.path}`);
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    console.log(`Public URL: ${urlData.publicUrl}`);
    
    // Test downloading the file
    console.log(`Testing download from ${bucketName}...`);
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(fileName);
    
    if (downloadError) {
      console.error(`Error downloading from ${bucketName}:`, downloadError.message);
      return false;
    }
    
    console.log(`Download successful. Size: ${downloadData.size} bytes`);
    
    // Clean up - remove the test file
    console.log(`Cleaning up - removing ${fileName} from ${bucketName}...`);
    const { error: removeError } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);
    
    if (removeError) {
      console.error(`Error removing file from ${bucketName}:`, removeError.message);
    } else {
      console.log(`File removed successfully from ${bucketName}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Unexpected error with ${bucketName}:`, error.message);
    return false;
  }
}

// Main function to test all buckets
async function testAllBuckets() {
  console.log('Starting Supabase storage test...');
  
  // List all buckets
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error('Error listing buckets:', bucketsError.message);
    return;
  }
  
  console.log(`Found ${buckets.length} buckets:`);
  buckets.forEach(bucket => {
    console.log(`- ${bucket.name} (public: ${bucket.public})`);
  });
  
  // Test each bucket
  const bucketNames = buckets.map(b => b.name);
  const results = {};
  
  for (const bucketName of bucketNames) {
    results[bucketName] = await testBucketUpload(bucketName);
  }
  
  // Print summary
  console.log('\nTest Results Summary:');
  for (const [bucket, success] of Object.entries(results)) {
    console.log(`- ${bucket}: ${success ? '✅ PASSED' : '❌ FAILED'}`);
  }
  
  // Clean up the local test file
  fs.unlinkSync(testFilePath);
  console.log('\nTest completed. Local test file removed.');
}

// Run the tests
testAllBuckets().catch(error => {
  console.error('Error in test:', error);
  process.exit(1);
});
