import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Blog from './pages/Blog.jsx'
import MarkdownPage from './components/MarkdownPage.jsx'
import { trackPageView } from './utils/analytics.js'
import { setupAnalytics } from './utils/setupAnalytics.js'
import { getCanonicalUrl } from './utils/urlUtils.js'

// Setup analytics from environment variable
setupAnalytics()

// Component to track page views on route changes and update canonical URL
function PageTracker() {
  const location = useLocation()

  useEffect(() => {
    try {
      // Update canonical URL immediately on route change (normalized to www)
      const cleanUrl = getCanonicalUrl()
      let canonical = document.querySelector('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.rel = 'canonical'
        document.head.appendChild(canonical)
      }
      canonical.href = cleanUrl
      
      // Update Open Graph URL (also normalized to www)
      const ogUrl = document.querySelector('meta[property="og:url"]')
      if (ogUrl) ogUrl.setAttribute('content', cleanUrl)
      
      // Track page view on route change
      trackPageView(location.pathname + location.search, document.title)
    } catch (error) {
      console.error('Error in PageTracker:', error)
    }
  }, [location])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <PageTracker />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/learn/:slug" element={<MarkdownPage basePath="/content/learn" kind="learn" />} />
        <Route path="/ops/:slug" element={<MarkdownPage basePath="/content/ops" kind="ops" />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<MarkdownPage basePath="/content/blog" kind="blog" />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
