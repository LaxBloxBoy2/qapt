# Supabase Storage Setup Guide (Dashboard Method)

If the SQL scripts don't work due to permission issues, you can set up storage policies manually through the Supabase Dashboard.

## Step 1: Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Enter bucket details:
   - **Name**: `document-files`
   - **Public bucket**: ✅ **Enable this**
   - **File size limit**: 50MB (or as needed)
   - **Allowed MIME types**: Leave empty for all types
5. Click **"Save"**

## Step 2: Create Storage Policies

### Policy 1: Allow Uploads
1. Go to **Storage** → **Policies**
2. Click **"New policy"**
3. Select **"For full customization"**
4. Enter policy details:
   - **Policy name**: `Allow authenticated uploads`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **USING expression**: Leave empty
   - **WITH CHECK expression**: `bucket_id = 'document-files'`
5. Click **"Save policy"**

### Policy 2: Allow Public Reads
1. Click **"New policy"** again
2. Select **"For full customization"**
3. Enter policy details:
   - **Policy name**: `Allow public reads`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `public`
   - **USING expression**: `bucket_id = 'document-files'`
   - **WITH CHECK expression**: Leave empty
4. Click **"Save policy"**

### Policy 3: Allow Updates
1. Click **"New policy"** again
2. Select **"For full customization"**
3. Enter policy details:
   - **Policy name**: `Allow authenticated updates`
   - **Allowed operation**: `UPDATE`
   - **Target roles**: `authenticated`
   - **USING expression**: `bucket_id = 'document-files'`
   - **WITH CHECK expression**: `bucket_id = 'document-files'`
4. Click **"Save policy"**

### Policy 4: Allow Deletes
1. Click **"New policy"** again
2. Select **"For full customization"**
3. Enter policy details:
   - **Policy name**: `Allow authenticated deletes`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **USING expression**: `bucket_id = 'document-files'`
   - **WITH CHECK expression**: Leave empty
4. Click **"Save policy"**

## Step 3: Verify Setup

1. Go to **Storage** → **Buckets**
2. Confirm `document-files` bucket exists and shows "Public" badge
3. Go to **Storage** → **Policies**
4. Confirm all 4 policies are listed and enabled
5. Test upload functionality in your app

## Alternative: Use Existing Bucket

If you already have a storage bucket (like `image_url`), you can:

1. Update your code to use the existing bucket name
2. Create policies for that bucket instead
3. Change `bucket_id = 'document-files'` to your bucket name in all policies

## Troubleshooting

- **Bucket not public**: Make sure "Public bucket" is enabled
- **Policies not working**: Check that target roles are correct (`authenticated` vs `public`)
- **Still getting errors**: Try using `anon` role instead of `public` for read policies
- **Permission denied**: Make sure you're logged in as the project owner

This manual approach should work even if SQL scripts fail due to permission restrictions.
