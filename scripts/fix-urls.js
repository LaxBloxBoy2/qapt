// Script to fix URLs in property_photos table
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL and key must be provided as environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUrls() {
  console.log('Starting URL fix process...');
  
  try {
    // Get all property photos
    const { data: photos, error: fetchError } = await supabase
      .from('property_photos')
      .select('*');
    
    if (fetchError) {
      throw new Error(`Error fetching photos: ${fetchError.message}`);
    }
    
    console.log(`Found ${photos.length} photos to process`);
    
    // Process each photo
    for (const photo of photos) {
      if (!photo.storage_path) {
        console.log(`Skipping photo ${photo.id} - no storage_path`);
        continue;
      }
      
      // Get the correct public URL
      const { data: { publicUrl } } = supabase.storage
        .from('image_url')
        .getPublicUrl(photo.storage_path);
      
      // Update the URL if it's different
      if (photo.url !== publicUrl) {
        console.log(`Updating photo ${photo.id} URL`);
        console.log(`  Old URL: ${photo.url}`);
        console.log(`  New URL: ${publicUrl}`);
        
        const { error: updateError } = await supabase
          .from('property_photos')
          .update({ url: publicUrl })
          .eq('id', photo.id);
        
        if (updateError) {
          console.error(`Error updating photo ${photo.id}: ${updateError.message}`);
        } else {
          console.log(`  Updated successfully`);
        }
      } else {
        console.log(`Photo ${photo.id} URL is already correct`);
      }
    }
    
    console.log('URL fix process completed');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixUrls();
