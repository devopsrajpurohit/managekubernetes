import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import MarkdownPage from './components/MarkdownPage.jsx'
import { trackPageView } from './utils/analytics.js'
import { setupAnalytics } from './utils/setupAnalytics.js'

// Setup analytics from environment variable
setupAnalytics()

// Component to track page views on route changes
function PageTracker() {
  const location = useLocation()

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname + location.search, document.title)
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
