import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { marked } from 'marked'
import { ArrowLeft, Share2, Link as LinkIcon, Copy, Check, Twitter, Linkedin, Facebook } from 'lucide-react'
import { trackMarkdownView, trackEvent } from '../utils/analytics.js'

marked.setOptions({ 
  gfm: true, 
  breaks: true,
  mangle: false,
  headerIds: false
})

// Configure image renderer - skip images in markdown content
// Use marked.use() to extend the renderer and only override the image method
marked.use({
  renderer: {
    image(href, title, text) {
      // Don't render images in markdown viewer - return empty string
      return ''
    }
  }
})

// Simple frontmatter parser for browser (replaces gray-matter)
function parseFrontmatter(text) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = text.match(frontMatterRegex)
  
  if (match) {
    const frontmatter = match[1]
    const content = match[2]
    
    // Simple YAML parser for basic key-value pairs
    const data = {}
    frontmatter.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim()
        const value = line.substring(colonIndex + 1).trim()
        if (key && value) {
          data[key] = value.replace(/^["']|["']$/g, '') // Remove quotes
        }
      }
    })
    
    return { data, content }
  }
  
  // No frontmatter, return entire text as content
  return { data: {}, content: text }
}

export default function MarkdownPage({ basePath, kind }) {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [html, setHtml] = useState('<p>Loading…</p>')
  const [loading, setLoading] = useState(true)
  const [metaData, setMetaData] = useState({ title: '', description: '' })
  const [urlCopied, setUrlCopied] = useState(false)
  
  // Get current page URL
  const pageUrl = typeof window !== 'undefined' 
    ? window.location.href 
    : `${location.pathname}`
  
  // Track markdown page view
  useEffect(() => {
    if (slug && kind) {
      trackMarkdownView(slug, kind)
    }
  }, [slug, kind])
  
  // Handle image loading after HTML is set
  useEffect(() => {
    if (!loading && html && typeof window !== 'undefined') {
      // Wait for DOM to update
      setTimeout(() => {
        // Ensure images load properly
        const images = document.querySelectorAll('.markdown-content img')
        console.log('Found', images.length, 'images in markdown content')
        images.forEach((img, index) => {
          // Log image source for debugging
          console.log(`Image ${index + 1}:`, {
            src: img.src,
            currentSrc: img.currentSrc,
            alt: img.alt,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          })
          
          // Fix image source if needed
          if (img.src && !img.src.startsWith('http') && !img.src.startsWith('data:')) {
            const srcPath = img.getAttribute('src')
            if (srcPath && srcPath.startsWith('/images/')) {
              // Ensure full URL for images
              const fullUrl = window.location.origin + srcPath
              if (img.src !== fullUrl) {
                console.log('Updating image src from', img.src, 'to', fullUrl)
                img.src = fullUrl
              }
            }
          }
          
          img.addEventListener('error', (e) => {
            console.error('Image failed to load:', {
              src: e.target.src,
              currentSrc: e.target.currentSrc,
              alt: e.target.alt
            })
            // Try to reload with base URL
            const originalSrc = e.target.getAttribute('src')
            if (originalSrc && originalSrc.startsWith('/')) {
              e.target.src = window.location.origin + originalSrc
            }
          })
          
          img.addEventListener('load', () => {
            console.log('Image loaded successfully:', img.src)
          })
        })
      }, 100)
    }
  }, [html, loading])
  
  useEffect(() => {
    if (!slug) {
      setHtml('<p class="text-slate-600">No slug provided.</p>')
      setLoading(false)
      return
    }
    
    setLoading(true)
    // Ensure basePath starts with / and slug doesn't
    const cleanBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`
    const cleanSlug = slug.startsWith('/') ? slug.slice(1) : slug
    const url = `${cleanBasePath}/${cleanSlug}.md`
    
    console.log('Fetching markdown:', { basePath, slug, url })
    
    fetch(url)
      .then(r => {
        if (!r.ok) {
          console.error('Fetch failed:', r.status, r.statusText, 'URL:', url)
          throw new Error(`Failed to fetch: ${r.status} ${r.statusText}`)
        }
        return r.text()
      })
      .then(text => {
        if (!text || text.trim().length === 0) {
          throw new Error('Empty response')
        }
        const parsed = parseFrontmatter(text)
        console.log('Parsed content length:', parsed.content.length)
        
        // Update metadata for SEO
        if (parsed.data.title || parsed.data.description) {
          setMetaData({
            title: parsed.data.title || slug,
            description: parsed.data.description || ''
          })
          
          // Update document title
          if (parsed.data.title) {
            document.title = `${parsed.data.title} | Kubernetes Community`
          }
          
          // Update meta description
          const metaDesc = document.querySelector('meta[name="description"]')
          if (metaDesc && parsed.data.description) {
            metaDesc.setAttribute('content', parsed.data.description)
          }
          
          // Add Article structured data for better SEO and backlinks
          if (typeof window !== 'undefined' && parsed.data.title) {
            const categoryName = kind === 'learn' ? 'Day-1 Basics' : kind === 'ops' ? 'Day-2 Operations' : 'Blog'
            
            // Article Schema
            const articleSchema = {
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": parsed.data.title,
              "description": parsed.data.description || parsed.data.title,
              "url": window.location.href,
              "datePublished": new Date().toISOString(),
              "dateModified": new Date().toISOString(),
              "author": {
                "@type": "Organization",
                "name": "Kubernetes Community"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Kubernetes Community",
                "logo": {
                  "@type": "ImageObject",
                  "url": `${window.location.origin}/images/hero.svg`
                }
              },
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": window.location.href
              },
              "inLanguage": "en-US",
              "isAccessibleForFree": true,
              "articleSection": categoryName
            }
            
            // Breadcrumb Schema
            const breadcrumbSchema = {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": window.location.origin
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": categoryName,
                  "item": `${window.location.origin}${kind === 'learn' ? '/#day1' : kind === 'ops' ? '/#day2' : '/blog'}`
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": parsed.data.title,
                  "item": window.location.href
                }
              ]
            }
            
            // Remove existing schemas if any
            const existingArticle = document.querySelector('script[data-schema="article"]')
            const existingBreadcrumb = document.querySelector('script[data-schema="breadcrumb"]')
            if (existingArticle) existingArticle.remove()
            if (existingBreadcrumb) existingBreadcrumb.remove()
            
            // Add article schema
            const articleScript = document.createElement('script')
            articleScript.type = 'application/ld+json'
            articleScript.setAttribute('data-schema', 'article')
            articleScript.textContent = JSON.stringify(articleSchema)
            document.head.appendChild(articleScript)
            
            // Add breadcrumb schema
            const breadcrumbScript = document.createElement('script')
            breadcrumbScript.type = 'application/ld+json'
            breadcrumbScript.setAttribute('data-schema', 'breadcrumb')
            breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema)
            document.head.appendChild(breadcrumbScript)
            
            // Update canonical URL
            let canonical = document.querySelector('link[rel="canonical"]')
            if (!canonical) {
              canonical = document.createElement('link')
              canonical.rel = 'canonical'
              document.head.appendChild(canonical)
            }
            canonical.href = window.location.href
            
            // Update Open Graph meta tags
            const ogTitle = document.querySelector('meta[property="og:title"]')
            const ogDesc = document.querySelector('meta[property="og:description"]')
            const ogUrl = document.querySelector('meta[property="og:url"]')
            if (ogTitle) ogTitle.setAttribute('content', `${parsed.data.title} | Kubernetes Community`)
            if (ogDesc) ogDesc.setAttribute('content', parsed.data.description || parsed.data.title)
            if (ogUrl) ogUrl.setAttribute('content', window.location.href)
          }
        }
        
        // Parse markdown to HTML
        try {
          console.log('Parsing markdown content, first 200 chars:', parsed.content.substring(0, 200))
          console.log('Content contains image markdown:', parsed.content.includes('!['))
          const markdownHtml = marked.parse(parsed.content)
          
          // Handle both sync and async cases
          if (markdownHtml && typeof markdownHtml.then === 'function') {
            // Async version
            markdownHtml.then((html) => {
              console.log('Markdown parsed successfully (async)')
              setHtml(html)
              setLoading(false)
            }).catch((err) => {
              console.error('Markdown parsing error:', err)
              setHtml('<p class="text-red-600">Error parsing markdown content.</p>')
              setLoading(false)
            })
          } else {
            // Sync version
            console.log('Markdown parsed successfully (sync)')
            const htmlString = String(markdownHtml)
            console.log('HTML preview (first 500 chars):', htmlString.substring(0, 500))
            console.log('HTML contains <img tags:', htmlString.includes('<img'))
            const imgMatches = htmlString.match(/<img[^>]*>/g)
            if (imgMatches) {
              console.log('Found img tags in HTML:', imgMatches)
            } else {
              console.warn('No <img> tags found in parsed HTML!')
              console.log('Full HTML:', htmlString)
            }
            setHtml(htmlString)
            setLoading(false)
          }
        } catch (error) {
          console.error('Error in markdown parsing:', error)
          setHtml('<p class="text-red-600">Error parsing markdown: ' + error.message + '</p>')
          setLoading(false)
        }
      })
      .catch((error) => {
        console.error('Error loading markdown:', error, 'URL:', url)
        setHtml(`<div class="text-slate-600 p-4 border border-red-200 rounded-lg">
          <p class="font-semibold">Content not found</p>
          <p class="text-sm mt-2">Attempted to load: <code class="bg-slate-100 px-1 rounded">${url}</code></p>
          <p class="text-sm">Error: ${error.message}</p>
          <p class="text-xs mt-2 text-slate-500">Check the browser console for more details.</p>
        </div>`)
        setLoading(false)
      })
  }, [slug, basePath])
  
  const copyToClipboard = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pageUrl).then(() => {
        setUrlCopied(true)
        trackEvent('link_copied', {
          event_category: 'engagement',
          event_label: 'Copy URL',
          page_url: pageUrl
        })
        setTimeout(() => setUrlCopied(false), 2000)
      })
    }
  }

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${metaData.title || slug} - Kubernetes Community`)
    const url = encodeURIComponent(pageUrl)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer')
    trackEvent('social_share', {
      event_category: 'engagement',
      event_label: 'Twitter Share',
      page_url: pageUrl
    })
  }

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(pageUrl)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer')
    trackEvent('social_share', {
      event_category: 'engagement',
      event_label: 'LinkedIn Share',
      page_url: pageUrl
    })
  }

  const shareToFacebook = () => {
    const url = encodeURIComponent(pageUrl)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer')
    trackEvent('social_share', {
      event_category: 'engagement',
      event_label: 'Facebook Share',
      page_url: pageUrl
    })
  }

  // Breadcrumb navigation for better SEO
  const categoryName = kind === 'learn' ? 'Day-1 Basics' : kind === 'ops' ? 'Day-2 Operations' : 'Blog'
  const categoryPath = kind === 'learn' ? '/#day1' : kind === 'ops' ? '/#day2' : '/blog'

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-600" aria-label="Breadcrumb">
          <a href="/" className="hover:text-indigo-700 transition">Home</a>
          <span>/</span>
          <a href={categoryPath} className="hover:text-indigo-700 transition">{categoryName}</a>
          <span>/</span>
          <span className="text-slate-800 font-medium">{metaData.title || slug}</span>
        </nav>
        
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
        
        {/* Share & Citation Bar */}
        {!loading && metaData.title && (
          <div className="mb-8 flex flex-wrap items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Share2 className="h-4 w-4" />
              <span className="font-medium">Share this guide:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={shareToTwitter}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition"
                aria-label="Share on Twitter"
              >
                <Twitter className="h-4 w-4" />
                <span className="hidden sm:inline">Twitter</span>
              </button>
              <button
                onClick={shareToLinkedIn}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition"
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
                <span className="hidden sm:inline">LinkedIn</span>
              </button>
              <button
                onClick={shareToFacebook}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition"
                aria-label="Share on Facebook"
              >
                <Facebook className="h-4 w-4" />
                <span className="hidden sm:inline">Facebook</span>
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition"
                aria-label="Copy link"
              >
                {urlCopied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="hidden sm:inline text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <p className="text-slate-600">Loading…</p>
          </div>
        ) : (
          <>
            <article 
              className="markdown-content max-w-none" 
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </>
        )}
      </div>
    </main>
  )
}
