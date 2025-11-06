/**
 * Normalize URL to always use non-www version for consistency
 * This ensures canonical URLs are consistent regardless of how users access the site
 */
export function normalizeCanonicalUrl(url) {
  if (!url) return url
  
  try {
    const urlObj = new URL(url)
    
    // Remove www. from hostname
    if (urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = urlObj.hostname.replace(/^www\./, '')
    }
    
    // Return normalized URL without query params or hash
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`
  } catch (e) {
    // If URL parsing fails, try simple string replacement
    return url.replace(/^https?:\/\/(www\.)?/, (match, www) => {
      return match.replace('www.', '')
    }).split('?')[0].split('#')[0]
  }
}

/**
 * Get the current page's canonical URL (normalized, non-www)
 */
export function getCanonicalUrl() {
  if (typeof window === 'undefined') {
    return 'https://managekubernetes.com'
  }
  
  const currentUrl = window.location.origin + window.location.pathname
  return normalizeCanonicalUrl(currentUrl)
}

