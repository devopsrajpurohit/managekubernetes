/**
 * Google Analytics tracking utilities
 * 
 * Setup:
 * 1. Create a .env file with: VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 * 2. Or set window.GA_MEASUREMENT_ID in index.html
 */

// Get GA Measurement ID from environment or window variable
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 
                         (typeof window !== 'undefined' ? window.GA_MEASUREMENT_ID : null) || 
                         null;

/**
 * Track page view
 * @param {string} path - The page path
 * @param {string} title - Optional page title
 */
export const trackPageView = (path, title = null) => {
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'GA_MEASUREMENT_ID') {
    // Only log in development
    if (import.meta.env.DEV) {
      console.log('[Analytics] Page view:', path, title);
    }
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
      page_title: title || document.title,
    });
  }
};

/**
 * Track custom event
 * @param {string} eventName - Event name
 * @param {object} eventParams - Event parameters
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'GA_MEASUREMENT_ID') {
    if (import.meta.env.DEV) {
      console.log('[Analytics] Event:', eventName, eventParams);
    }
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

/**
 * Track card click
 * @param {string} cardTitle - Card title
 * @param {string} cardUrl - Card URL
 */
export const trackCardClick = (cardTitle, cardUrl) => {
  trackEvent('card_click', {
    card_title: cardTitle,
    card_url: cardUrl,
    event_category: 'engagement',
    event_label: cardTitle,
  });
};

/**
 * Track markdown page view
 * @param {string} slug - Page slug
 * @param {string} category - Category (learn, ops, blog)
 */
export const trackMarkdownView = (slug, category) => {
  trackEvent('content_view', {
    content_slug: slug,
    content_category: category,
    event_category: 'content',
    event_label: `${category}/${slug}`,
  });
};

/**
 * Track search (if you add search functionality)
 * @param {string} searchTerm - Search term
 */
export const trackSearch = (searchTerm) => {
  trackEvent('search', {
    search_term: searchTerm,
    event_category: 'engagement',
    event_label: searchTerm,
  });
};

/**
 * Track external link click
 * @param {string} url - External URL
 * @param {string} label - Link label
 */
export const trackExternalLink = (url, label) => {
  trackEvent('external_link_click', {
    link_url: url,
    link_label: label,
    event_category: 'outbound',
    event_label: label,
  });
};

