import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey)

async function fixPhotos() {
  try {
    // 1. Update existing URLs to use the correct format
    const { error: updateError } = await supabase.from('property_photos')
      .update({
        url: `${supabaseUrl}/storage/v1/object/public/image_url/${supabase.storage.from('image_url').getPublicUrl('').data.publicUrl}`
      })
      .neq('url', null)

    if (updateError) {
      console.error('Error updating URLs:', updateError)
    } else {
      console.log('Updated photo URLs')
    }

    // 2. Configure bucket
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      throw bucketsError
    }

    const imageUrlBucket = buckets.find(b => b.name === 'image_url')
    if (!imageUrlBucket) {
      const { error: createError } = await supabase.storage.createBucket('image_url', {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      })

      if (createError) {
        console.error('Error creating bucket:', createError)
      } else {
        console.log('Created image_url bucket')
      }
    } else {
      const { error: updateError } = await supabase.storage.updateBucket('image_url', {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      })

      if (updateError) {
        console.error('Error updating bucket:', updateError)
      } else {
        console.log('Updated image_url bucket')
      }
    }

    // 3. Log current state
    const { data: photos, error: selectError } = await supabase
      .from('property_photos')
      .select('*')
      
    if (selectError) {
      console.error('Error getting photos:', selectError)
    } else {
      console.log('Current photos:', photos)
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

fixPhotos()
