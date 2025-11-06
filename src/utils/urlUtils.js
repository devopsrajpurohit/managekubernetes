/**
 * Normalize URL to always use www version for consistency
 * This ensures canonical URLs are consistent regardless of how users access the site
 */
export function normalizeCanonicalUrl(url) {
  if (!url) return url
  
  try {
    const urlObj = new URL(url)
    
    // Add www. to hostname if not present
    if (!urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = 'www.' + urlObj.hostname
    }
    
    // Return normalized URL without query params or hash
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`
  } catch (e) {
    // If URL parsing fails, try simple string replacement
    const hasWww = url.includes('://www.')
    if (!hasWww) {
      return url.replace(/^https?:\/\//, (match) => {
        return match + 'www.'
      }).split('?')[0].split('#')[0]
    }
    return url.split('?')[0].split('#')[0]
  }
}

/**
 * Get the current page's canonical URL (normalized, with www)
 * Always returns www version regardless of how the page is accessed
 * This is the SINGLE SOURCE OF TRUTH for canonical URLs
 */
export function getCanonicalUrl() {
  try {
    if (typeof window === 'undefined' || !window.location) {
      return 'https://www.managekubernetes.com'
    }
    
    // Always use www version, even if accessed via non-www
    // NEVER use window.location.origin - always hardcode www
    const pathname = window.location.pathname || '/'
    const baseUrl = 'https://www.managekubernetes.com'
    
    // Return normalized URL with www - this is ALWAYS www
    const canonicalUrl = baseUrl + pathname
    
    // Double-check it has www (defensive)
    if (!canonicalUrl.includes('://www.')) {
      console.error('ERROR: Generated canonical URL missing www!', canonicalUrl)
      return baseUrl + pathname // Force www
    }
    
    return canonicalUrl
  } catch (error) {
    // Fallback if anything goes wrong
    console.warn('Error getting canonical URL:', error)
    return 'https://www.managekubernetes.com'
  }
}

