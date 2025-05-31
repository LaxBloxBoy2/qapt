// @ts-check
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://auaytfzunufzzkurjlol.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey && !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey)

async function fixStorageAndPhotos() {
  try {
    // 1. Configure the storage bucket
    console.log('Configuring storage bucket...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      throw bucketsError
    }

    const imageUrlBucket = buckets?.find(b => b.name === 'image_url')
    if (!imageUrlBucket) {
      console.log('Creating image_url bucket...')
      const { error: createError } = await supabase.storage.createBucket('image_url', {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      })

      if (createError) {
        throw createError
      }
      console.log('Created image_url bucket successfully')
    } else {
      console.log('Updating image_url bucket...')
      const { error: updateError } = await supabase.storage.updateBucket('image_url', {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      })

      if (updateError) {
        throw updateError
      }
      console.log('Updated image_url bucket successfully')
    }

    // 2. Fix existing photo URLs
    console.log('Fixing photo URLs...')
    const { error: updateError } = await supabase.rpc('fix_property_photo_urls')

    if (updateError) {
      throw updateError
    }
    console.log('Fixed photo URLs successfully')

    // 3. Verify current state
    console.log('Verifying current state...')
    const { data: photos, error: selectError } = await supabase
      .from('property_photos')
      .select('id, url, storage_path')
      .order('created_at', { ascending: false })
      .limit(5)

    if (selectError) {
      throw selectError
    }

    console.log('Recent photos (up to 5):', photos)
    console.log('Fix completed successfully')

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

fixStorageAndPhotos()
