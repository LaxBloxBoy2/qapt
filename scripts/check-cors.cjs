const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://auaytfzunufzzkurjlol.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey && !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

async function checkCorsAndBuckets() {
  try {
    console.log('Checking Supabase storage buckets...');
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw bucketsError;
    }
    
    console.log(`Found ${buckets.length} buckets:`);
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name} (public: ${bucket.public})`);
    });
    
    // Check for specific buckets used in the app
    const imageUrlBucket = buckets.find(b => b.name === 'image_url');
    const propertyPhotosBucket = buckets.find(b => b.name === 'property-photos');
    const applianceFilesBucket = buckets.find(b => b.name === 'appliance-files');
    const inspectionMediaBucket = buckets.find(b => b.name === 'inspection-media');
    
    console.log('\nBucket status:');
    console.log(`- image_url bucket: ${imageUrlBucket ? 'Exists' : 'Missing'}`);
    console.log(`- property-photos bucket: ${propertyPhotosBucket ? 'Exists' : 'Missing'}`);
    console.log(`- appliance-files bucket: ${applianceFilesBucket ? 'Exists' : 'Missing'}`);
    console.log(`- inspection-media bucket: ${inspectionMediaBucket ? 'Exists' : 'Missing'}`);
    
    // Try to upload a test file to check permissions
    console.log('\nTesting file upload to image_url bucket...');
    
    if (imageUrlBucket) {
      // Create a small test file
      const testFile = new Uint8Array([0, 1, 2, 3, 4]);
      const testFileName = `test-file-${Date.now()}.bin`;
      
      const { error: uploadError } = await supabase.storage
        .from('image_url')
        .upload(testFileName, testFile);
      
      if (uploadError) {
        console.error('Upload test failed:', uploadError.message);
      } else {
        console.log('Upload test successful');
        
        // Get the public URL
        const { data } = supabase.storage.from('image_url').getPublicUrl(testFileName);
        console.log('Public URL:', data.publicUrl);
        
        // Clean up the test file
        await supabase.storage.from('image_url').remove([testFileName]);
        console.log('Test file removed');
      }
    }
    
    // Try to upload a test file to each bucket
    for (const bucketName of ['property-photos', 'appliance-files', 'inspection-media']) {
      const bucket = buckets.find(b => b.name === bucketName);
      if (bucket) {
        console.log(`\nTesting file upload to ${bucketName} bucket...`);
        const testFile = new Uint8Array([0, 1, 2, 3, 4]);
        const testFileName = `test-file-${Date.now()}.bin`;
        
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(testFileName, testFile);
        
        if (uploadError) {
          console.error(`Upload test to ${bucketName} failed:`, uploadError.message);
        } else {
          console.log(`Upload test to ${bucketName} successful`);
          
          // Get the public URL
          const { data } = supabase.storage.from(bucketName).getPublicUrl(testFileName);
          console.log('Public URL:', data.publicUrl);
          
          // Clean up the test file
          await supabase.storage.from(bucketName).remove([testFileName]);
          console.log('Test file removed');
        }
      }
    }
    
    console.log('\nDiagnostic check completed');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCorsAndBuckets();
