const { createClient } = require('@supabase/supabase-js');
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

// Function to properly encode a URL
function encodeStorageUrl(url) {
  try {
    // Parse the URL
    const parsedUrl = new URL(url);
    
    // Extract the path
    const pathParts = parsedUrl.pathname.split('/');
    
    // Find the bucket and file path
    const bucketIndex = pathParts.findIndex(part => part === 'public') + 1;
    if (bucketIndex <= 0 || bucketIndex >= pathParts.length) {
      return url; // Can't find the bucket, return original URL
    }
    
    const bucket = pathParts[bucketIndex];
    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    
    // Properly encode the file path
    const encodedPath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
    
    // Reconstruct the URL
    const newPathname = `/storage/v1/object/public/${bucket}/${encodedPath}`;
    parsedUrl.pathname = newPathname;
    
    // Add a cache-busting parameter
    parsedUrl.searchParams.set('_cb', Date.now());
    
    return parsedUrl.toString();
  } catch (error) {
    console.error('Error encoding URL:', error);
    return url; // Return original URL if there's an error
  }
}

// Function to fix image URLs in the database
async function fixImageUrls() {
  console.log('Starting to fix image URLs in the database...');
  
  try {
    // 1. Fix property_photos table
    console.log('\nFixing property_photos table...');
    const { data: photos, error: photosError } = await supabase
      .from('property_photos')
      .select('id, url, storage_path')
      .order('created_at', { ascending: false });
    
    if (photosError) {
      console.error('Error fetching property photos:', photosError.message);
    } else {
      console.log(`Found ${photos.length} property photos`);
      
      let fixedCount = 0;
      
      for (const photo of photos) {
        if (!photo.url) {
          console.log(`Skipping photo ${photo.id} - no URL`);
          continue;
        }
        
        // Encode the URL
        const encodedUrl = encodeStorageUrl(photo.url);
        
        // Check if the URL needs to be updated
        if (photo.url !== encodedUrl) {
          console.log(`Fixing photo ${photo.id}:`);
          console.log(`  Old URL: ${photo.url}`);
          console.log(`  New URL: ${encodedUrl}`);
          
          const { error: updateError } = await supabase
            .from('property_photos')
            .update({ url: encodedUrl })
            .eq('id', photo.id);
          
          if (updateError) {
            console.error(`  Error updating photo ${photo.id}:`, updateError.message);
          } else {
            console.log(`  Updated successfully`);
            fixedCount++;
          }
        }
      }
      
      console.log(`Fixed ${fixedCount} URLs in property_photos table`);
    }
    
    // 2. Fix appliances table
    console.log('\nFixing appliances table...');
    const { data: appliances, error: appliancesError } = await supabase
      .from('appliances')
      .select('id, image_url')
      .not('image_url', 'is', null);
    
    if (appliancesError) {
      console.error('Error fetching appliances:', appliancesError.message);
    } else {
      console.log(`Found ${appliances.length} appliances with images`);
      
      let fixedCount = 0;
      
      for (const appliance of appliances) {
        if (!appliance.image_url) continue;
        
        // Encode the URL
        const encodedUrl = encodeStorageUrl(appliance.image_url);
        
        // Check if the URL needs to be updated
        if (appliance.image_url !== encodedUrl) {
          console.log(`Fixing appliance ${appliance.id}:`);
          console.log(`  Old URL: ${appliance.image_url}`);
          console.log(`  New URL: ${encodedUrl}`);
          
          const { error: updateError } = await supabase
            .from('appliances')
            .update({ image_url: encodedUrl })
            .eq('id', appliance.id);
          
          if (updateError) {
            console.error(`  Error updating appliance ${appliance.id}:`, updateError.message);
          } else {
            console.log(`  Updated successfully`);
            fixedCount++;
          }
        }
      }
      
      console.log(`Fixed ${fixedCount} URLs in appliances table`);
    }
    
    // 3. Fix units table
    console.log('\nFixing units table...');
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('id, image_url')
      .not('image_url', 'is', null);
    
    if (unitsError) {
      console.error('Error fetching units:', unitsError.message);
    } else {
      console.log(`Found ${units.length} units with images`);
      
      let fixedCount = 0;
      
      for (const unit of units) {
        if (!unit.image_url) continue;
        
        // Encode the URL
        const encodedUrl = encodeStorageUrl(unit.image_url);
        
        // Check if the URL needs to be updated
        if (unit.image_url !== encodedUrl) {
          console.log(`Fixing unit ${unit.id}:`);
          console.log(`  Old URL: ${unit.image_url}`);
          console.log(`  New URL: ${encodedUrl}`);
          
          const { error: updateError } = await supabase
            .from('units')
            .update({ image_url: encodedUrl })
            .eq('id', unit.id);
          
          if (updateError) {
            console.error(`  Error updating unit ${unit.id}:`, updateError.message);
          } else {
            console.log(`  Updated successfully`);
            fixedCount++;
          }
        }
      }
      
      console.log(`Fixed ${fixedCount} URLs in units table`);
    }
    
    // 4. Fix inspection_media table
    console.log('\nFixing inspection_media table...');
    const { data: media, error: mediaError } = await supabase
      .from('inspection_media')
      .select('id, url, storage_path')
      .not('url', 'is', null);
    
    if (mediaError) {
      console.error('Error fetching inspection media:', mediaError.message);
    } else {
      console.log(`Found ${media.length} inspection media items`);
      
      let fixedCount = 0;
      
      for (const item of media) {
        if (!item.url) continue;
        
        // Encode the URL
        const encodedUrl = encodeStorageUrl(item.url);
        
        // Check if the URL needs to be updated
        if (item.url !== encodedUrl) {
          console.log(`Fixing inspection media ${item.id}:`);
          console.log(`  Old URL: ${item.url}`);
          console.log(`  New URL: ${encodedUrl}`);
          
          const { error: updateError } = await supabase
            .from('inspection_media')
            .update({ url: encodedUrl })
            .eq('id', item.id);
          
          if (updateError) {
            console.error(`  Error updating inspection media ${item.id}:`, updateError.message);
          } else {
            console.log(`  Updated successfully`);
            fixedCount++;
          }
        }
      }
      
      console.log(`Fixed ${fixedCount} URLs in inspection_media table`);
    }
    
    console.log('\nURL fixing process completed');
    
  } catch (error) {
    console.error('Error fixing image URLs:', error);
    process.exit(1);
  }
}

// Run the function
fixImageUrls();
