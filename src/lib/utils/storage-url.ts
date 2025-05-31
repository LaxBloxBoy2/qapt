/**
 * Utility functions for working with Supabase storage URLs
 */

/**
 * Properly encodes a Supabase storage URL to handle spaces and special characters
 * and adds a cache-busting parameter to prevent caching issues
 * 
 * @param url The original Supabase storage URL
 * @returns The properly encoded URL with cache-busting parameter
 */
export function encodeStorageUrl(url: string): string {
  if (!url) return '';
  
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
    parsedUrl.searchParams.set('_cb', Date.now().toString());
    
    return parsedUrl.toString();
  } catch (error) {
    console.error('Error encoding storage URL:', error);
    return url; // Return original URL if there's an error
  }
}

/**
 * Checks if a URL is a Supabase storage URL
 * 
 * @param url The URL to check
 * @returns True if the URL is a Supabase storage URL
 */
export function isStorageUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.pathname.includes('/storage/v1/object/') || 
      parsedUrl.hostname.includes('supabase.co')
    );
  } catch (error) {
    return false;
  }
}

/**
 * Gets the public URL for a file in Supabase storage
 * 
 * @param supabaseUrl The Supabase project URL
 * @param bucket The storage bucket name
 * @param path The file path within the bucket
 * @returns The properly encoded public URL for the file
 */
export function getPublicUrl(supabaseUrl: string, bucket: string, path: string): string {
  if (!supabaseUrl || !bucket || !path) return '';
  
  // Properly encode the path to handle spaces and special characters
  const encodedPath = path.split('/').map(segment => encodeURIComponent(segment)).join('/');
  
  // Construct the URL
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
  
  // Add a cache-busting parameter
  return `${publicUrl}?_cb=${Date.now()}`;
}
