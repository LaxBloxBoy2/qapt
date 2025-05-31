# Supabase CORS Configuration Guide

This guide explains how to configure CORS (Cross-Origin Resource Sharing) in your Supabase project to allow image loading from your frontend application.

## Steps to Configure CORS

1. **Log in to your Supabase Dashboard**
   - Go to https://app.supabase.io/
   - Select your project

2. **Navigate to Project Settings**
   - Click on the gear icon (⚙️) in the left sidebar
   - Select "API" from the settings menu

3. **Configure CORS**
   - Scroll down to the "CORS" section
   - In the "Allowed Origins" field, add the following:
     ```
     *
     ```
   - Alternatively, for better security in production, add your specific domain:
     ```
     http://localhost:3000
     https://yourdomain.com
     ```
   - Make sure "Allowed Methods" includes at least:
     ```
     GET, POST, PUT, DELETE, OPTIONS
     ```
   - Make sure "Allowed Headers" includes:
     ```
     *
     ```
   - Click "Save" to apply the changes

4. **Verify Configuration**
   - After saving, wait a few minutes for the changes to propagate
   - Try loading images in your application again

## Troubleshooting

If images still don't load after configuring CORS:

1. **Check Browser Console**
   - Open your browser's developer tools (F12)
   - Look for CORS-related errors in the Console tab

2. **Verify Storage Bucket Settings**
   - In Supabase Dashboard, go to Storage
   - Make sure the "image_url" bucket is set to public
   - Check that the bucket policies allow public access for SELECT operations

3. **Test Direct URL Access**
   - Try accessing an image URL directly in your browser
   - The URL format should be:
     ```
     https://auaytfzunufzzkurjlol.supabase.co/storage/v1/object/public/image_url/your-file-path
     ```

4. **Restart Your Application**
   - Sometimes a simple restart of your frontend application can help

## Additional Resources

- [Supabase Storage Documentation](https://supabase.io/docs/guides/storage)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
