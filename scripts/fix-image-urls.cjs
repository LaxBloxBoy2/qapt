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

async function fixImageUrls() {
  try {
    console.log('Starting to fix image URLs...');
    
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
      
      for (const photo of photos) {
        if (!photo.storage_path) {
          console.log(`Skipping photo ${photo.id} - no storage path`);
          continue;
        }
        
        // Construct the correct URL
        const correctUrl = `${supabaseUrl}/storage/v1/object/public/image_url/${photo.storage_path}`;
        
        // Check if URL needs to be updated
        if (photo.url !== correctUrl) {
          console.log(`Updating photo ${photo.id}:`);
          console.log(`  Old URL: ${photo.url}`);
          console.log(`  New URL: ${correctUrl}`);
          
          const { error: updateError } = await supabase
            .from('property_photos')
            .update({ url: correctUrl })
            .eq('id', photo.id);
          
          if (updateError) {
            console.error(`  Error updating photo ${photo.id}:`, updateError.message);
          } else {
            console.log(`  Updated successfully`);
          }
        } else {
          console.log(`Photo ${photo.id} URL is already correct`);
        }
      }
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
      
      for (const appliance of appliances) {
        if (!appliance.image_url) continue;
        
        // Extract the storage path from the URL
        const urlParts = appliance.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        if (!fileName) {
          console.log(`Skipping appliance ${appliance.id} - can't extract filename`);
          continue;
        }
        
        // Construct the correct URL
        const correctUrl = `${supabaseUrl}/storage/v1/object/public/appliance-files/appliances/${fileName}`;
        
        // Check if URL needs to be updated
        if (appliance.image_url !== correctUrl) {
          console.log(`Updating appliance ${appliance.id}:`);
          console.log(`  Old URL: ${appliance.image_url}`);
          console.log(`  New URL: ${correctUrl}`);
          
          const { error: updateError } = await supabase
            .from('appliances')
            .update({ image_url: correctUrl })
            .eq('id', appliance.id);
          
          if (updateError) {
            console.error(`  Error updating appliance ${appliance.id}:`, updateError.message);
          } else {
            console.log(`  Updated successfully`);
          }
        } else {
          console.log(`Appliance ${appliance.id} URL is already correct`);
        }
      }
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
      
      for (const unit of units) {
        if (!unit.image_url) continue;
        
        // Extract the storage path from the URL
        const urlParts = unit.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        if (!fileName) {
          console.log(`Skipping unit ${unit.id} - can't extract filename`);
          continue;
        }
        
        // Construct the correct URL
        const correctUrl = `${supabaseUrl}/storage/v1/object/public/property-photos/unit-images/${unit.id}/${fileName}`;
        
        // Check if URL needs to be updated
        if (unit.image_url !== correctUrl) {
          console.log(`Updating unit ${unit.id}:`);
          console.log(`  Old URL: ${unit.image_url}`);
          console.log(`  New URL: ${correctUrl}`);
          
          const { error: updateError } = await supabase
            .from('units')
            .update({ image_url: correctUrl })
            .eq('id', unit.id);
          
          if (updateError) {
            console.error(`  Error updating unit ${unit.id}:`, updateError.message);
          } else {
            console.log(`  Updated successfully`);
          }
        } else {
          console.log(`Unit ${unit.id} URL is already correct`);
        }
      }
    }
    
    console.log('\nImage URL fix process completed');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixImageUrls();
