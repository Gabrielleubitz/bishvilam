/**
 * Utility functions for handling images with cache busting
 */

/**
 * Adds cache busting parameter to image URLs to prevent caching issues
 * @param imageUrl - The original image URL
 * @param timestamp - Optional timestamp, defaults to current time
 * @returns URL with cache busting parameter
 */
export function addCacheBuster(imageUrl: string, timestamp?: number): string {
  if (!imageUrl) return imageUrl;
  
  const cacheBuster = timestamp || Date.now();
  const randomComponent = Math.random().toString(36).substring(2);
  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}v=${cacheBuster}&_t=${randomComponent}`;
}

/**
 * Extracts the storage path from a Firebase Storage URL
 * @param firebaseUrl - Firebase Storage download URL
 * @returns Storage path or null if not a valid Firebase URL
 */
export function extractStoragePathFromUrl(firebaseUrl: string): string | null {
  if (!firebaseUrl) return null;
  
  try {
    const url = new URL(firebaseUrl);
    if (!url.hostname.includes('firebasestorage.googleapis.com')) {
      return null;
    }
    
    // Extract path from Firebase Storage URL
    const pathMatch = firebaseUrl.match(/\/o\/([^?]+)/);
    if (pathMatch) {
      return decodeURIComponent(pathMatch[1]);
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting storage path:', error);
    return null;
  }
}

/**
 * Removes cache busting parameters from URLs for clean storage
 * @param imageUrl - URL that may contain cache busting parameters
 * @returns Clean URL without cache busting
 */
export function removeCacheBuster(imageUrl: string): string {
  if (!imageUrl) return imageUrl;
  
  try {
    const url = new URL(imageUrl);
    url.searchParams.delete('v');
    url.searchParams.delete('_t');
    url.searchParams.delete('cache');
    url.searchParams.delete('cachebust');
    return url.toString();
  } catch (error) {
    // If it's not a valid URL, just return as is
    return imageUrl;
  }
}

/**
 * Generates a unique filename with timestamp
 * @param originalName - Original filename
 * @param prefix - Optional prefix for the filename
 * @returns Timestamped filename
 */
export function generateTimestampedFilename(originalName: string, prefix = ''): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  
  return prefix 
    ? `${prefix}-${baseName}-${timestamp}.${extension}`
    : `${baseName}-${timestamp}.${extension}`;
}