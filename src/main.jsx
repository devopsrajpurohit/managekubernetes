import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import MarkdownPage from './components/MarkdownPage.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/learn/:slug" element={<MarkdownPage basePath="/content/learn" kind="learn" />} />
        <Route path="/ops/:slug" element={<MarkdownPage basePath="/content/ops" kind="ops" />} />
        <Route path="/blog/:slug" element={<MarkdownPage basePath="/content/blog" kind="blog" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
