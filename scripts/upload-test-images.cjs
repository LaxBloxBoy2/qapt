/**
 * Simple script to upload test images to Supabase storage
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://auaytfzunufzzkurjlol.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey && !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

// Function to upload a test image to a bucket
async function uploadTestImage(bucket) {
  try {
    console.log(`Uploading test image to ${bucket} bucket...`);
    
    // Create a simple test image (1x1 pixel transparent PNG)
    const testImagePath = path.join(__dirname, 'test-image.png');
    
    // Check if the test image exists, if not create it
    if (!fs.existsSync(testImagePath)) {
      // This is a 1x1 transparent PNG
      const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const imageBuffer = Buffer.from(base64Image, 'base64');
      fs.writeFileSync(testImagePath, imageBuffer);
      console.log('Created test image');
    }
    
    // Upload the image
    const filename = `test-image-${Date.now()}.png`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, fs.readFileSync(testImagePath), {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      throw error;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);
    
    console.log(`✅ Successfully uploaded test image to ${bucket} bucket`);
    console.log(`Public URL: ${urlData.publicUrl}`);
    
    // Update the test page with the new URL
    updateTestPage(bucket, urlData.publicUrl);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error(`Error uploading test image to ${bucket} bucket:`, error);
    return null;
  }
}

// Function to update the test page with the new URL
function updateTestPage(bucket, url) {
  try {
    const testPagePath = path.join(__dirname, '..', 'public', 'test-uploaded-images.html');
    
    if (!fs.existsSync(testPagePath)) {
      console.error('Test page not found');
      return;
    }
    
    let content = fs.readFileSync(testPagePath, 'utf8');
    
    // Find the image element for the bucket
    const bucketMap = {
      'image_url': 'image-url',
      'property-photos': 'property-photos',
      'appliance-files': 'appliance-files',
      'inspection-media': 'inspection-media'
    };
    
    const bucketId = bucketMap[bucket] || bucket;
    
    // Simple regex to update the src attribute
    const regex = new RegExp(`(src=["'])https://[^"']*?/${bucket}/[^"']*?(["'])`, 'i');
    const newContent = content.replace(regex, `$1${url}$2`);
    
    if (content !== newContent) {
      fs.writeFileSync(testPagePath, newContent);
      console.log(`✅ Updated test page with new URL for ${bucket} bucket`);
    } else {
      console.log(`⚠️ Could not update test page for ${bucket} bucket`);
    }
  } catch (error) {
    console.error('Error updating test page:', error);
  }
}

// Main function to upload test images to all buckets
async function uploadTestImages() {
  console.log('Starting to upload test images...');
  
  const buckets = ['image_url', 'property-photos', 'appliance-files', 'inspection-media'];
  
  for (const bucket of buckets) {
    await uploadTestImage(bucket);
  }
  
  console.log('\nAll test images uploaded successfully');
}

// Run the function
uploadTestImages();
