const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

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
  storage: {
    retryIntervalMs: 500,
    maxRetryCount: 3
  }
});

// Download a sample image for testing
async function downloadSampleImage() {
  const imagePath = path.join(__dirname, 'test-image.jpg');
  const imageUrl = 'https://picsum.photos/200/300'; // Random sample image
  
  return new Promise((resolve, reject) => {
    console.log('Downloading sample image...');
    const file = fs.createWriteStream(imagePath);
    
    https.get(imageUrl, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Sample image downloaded to ${imagePath}`);
        resolve(imagePath);
      });
    }).on('error', (err) => {
      fs.unlink(imagePath, () => {}); // Delete the file if there's an error
      reject(err);
    });
  });
}

// Test image upload to a specific bucket
async function testImageUpload(bucketName, imagePath) {
  console.log(`\nTesting image upload to ${bucketName} bucket...`);
  
  try {
    // Read the image file
    const fileBuffer = fs.readFileSync(imagePath);
    
    // Generate a unique file name
    const fileName = `test-image-${Date.now()}.jpg`;
    
    // Upload the image
    console.log(`Uploading ${fileName} to ${bucketName}...`);
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error(`Error uploading to ${bucketName}:`, error.message);
      return { success: false, url: null };
    }
    
    console.log(`Upload successful. Path: ${data.path}`);
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    console.log(`Public URL: ${urlData.publicUrl}`);
    
    // Insert a record in the database (for property_photos)
    if (bucketName === 'image_url') {
      console.log('Inserting record in property_photos table...');
      
      const { data: insertData, error: insertError } = await supabase
        .from('property_photos')
        .insert([
          {
            property_id: '264f4e7d-905b-4f47-a948-0facbb324b0c', // Use an existing property ID
            url: urlData.publicUrl,
            storage_path: fileName
          }
        ])
        .select();
      
      if (insertError) {
        console.error('Error inserting record:', insertError.message);
      } else {
        console.log('Record inserted successfully:', insertData);
      }
    }
    
    return { success: true, url: urlData.publicUrl, path: fileName };
  } catch (error) {
    console.error(`Unexpected error with ${bucketName}:`, error.message);
    return { success: false, url: null };
  }
}

// Main function to test image uploads
async function testImageUploads() {
  console.log('Starting Supabase image upload test...');
  
  try {
    // Download a sample image
    const imagePath = await downloadSampleImage();
    
    // Test upload to each bucket
    const results = {};
    const uploadedFiles = [];
    
    for (const bucketName of ['image_url', 'property-photos', 'appliance-files', 'inspection-media']) {
      const result = await testImageUpload(bucketName, imagePath);
      results[bucketName] = result.success;
      
      if (result.success) {
        uploadedFiles.push({ bucket: bucketName, path: result.path, url: result.url });
      }
    }
    
    // Print summary
    console.log('\nTest Results Summary:');
    for (const [bucket, success] of Object.entries(results)) {
      console.log(`- ${bucket}: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    }
    
    // Print URLs for manual testing
    console.log('\nUploaded Image URLs (for manual testing):');
    uploadedFiles.forEach(file => {
      console.log(`- ${file.bucket}: ${file.url}`);
    });
    
    // Clean up the local test image
    fs.unlinkSync(imagePath);
    console.log('\nTest completed. Local test image removed.');
    
    // Don't clean up the uploaded files so they can be manually tested
    console.log('Note: Uploaded files were not removed to allow for manual testing.');
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the tests
testImageUploads().catch(error => {
  console.error('Error in test:', error);
  process.exit(1);
});
