/**
 * Setup Google Analytics from environment variable
 * This runs on app initialization to set window.GA_MEASUREMENT_ID
 */

export const setupAnalytics = () => {
  // Get GA ID from environment variable
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  
  if (gaId && typeof window !== 'undefined') {
    window.GA_MEASUREMENT_ID = gaId;
    
    // If gtag is already loaded, reconfigure it
    if (window.gtag) {
      window.gtag('config', gaId, {
        page_path: window.location.pathname,
      });
    }
  }
};

