import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function configureBucket() {
  try {
    // Get existing buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      throw bucketsError
    }

    // Check if our bucket exists
    const imageUrlBucket = buckets.find(b => b.name === 'image_url')

    if (!imageUrlBucket) {
      // Create the bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket('image_url', {
        public: true,
        fileSizeLimit: 5242880, // 5MB in bytes
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      })

      if (createError) {
        throw createError
      }

      console.log('Created image_url bucket')
    } else {
      // Update the bucket if it exists
      const { error: updateError } = await supabase.storage.updateBucket('image_url', {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      })

      if (updateError) {
        throw updateError
      }

      console.log('Updated image_url bucket')
    }

    console.log('Storage bucket configured successfully')
  } catch (error) {
    console.error('Error configuring bucket:', error)
    process.exit(1)
  }
}

configureBucket()
