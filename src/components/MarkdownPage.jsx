import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Share2, Link as LinkIcon, Copy, Check, Twitter, Linkedin, Facebook } from 'lucide-react'
import { trackMarkdownView, trackEvent } from '../utils/analytics.js'
import { getCanonicalUrl } from '../utils/urlUtils.js'

export default function MarkdownPage({ basePath, kind }) {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [html, setHtml] = useState('<p>Loading…</p>')
  const [loading, setLoading] = useState(true)
  const [metaData, setMetaData] = useState({ title: '', description: '', image: '' })
  const [urlCopied, setUrlCopied] = useState(false)
  const [error, setError] = useState(null)
  
  // Get current page URL - use clean URL without query params or hash
  const pageUrl = typeof window !== 'undefined' 
    ? window.location.origin + window.location.pathname
    : `${location.pathname}`
  
  // Track markdown page view and set canonical URL immediately
  useEffect(() => {
    if (slug && kind) {
      trackMarkdownView(slug, kind)
    }
    
    // Set canonical URL immediately when component mounts - normalized to www
    if (typeof window !== 'undefined') {
      const cleanUrl = getCanonicalUrl()
      let canonical = document.querySelector('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.rel = 'canonical'
        document.head.appendChild(canonical)
      }
      // Always set to normalized www URL
      canonical.href = cleanUrl
      
      // Verify it's set correctly (defensive check)
      if (canonical.href && !canonical.href.includes('://www.')) {
        canonical.href = cleanUrl
      }
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
    try {
      if (!slug) {
        setHtml('<p class="text-slate-600">No slug provided.</p>')
        setLoading(false)
        setError(null)
        return
      }
      
      setLoading(true)
      setError(null)
      
      // Determine route path from basePath
      const routePath = basePath.includes('/blog') ? '/blog' : 
                       basePath.includes('/learn') ? '/learn' : 
                       basePath.includes('/ops') ? '/ops' : '/'
      const cleanSlug = slug.startsWith('/') ? slug.slice(1) : slug
      
      // Try pre-rendered HTML first, fallback to markdown if not available
      const cleanBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`
      const markdownUrl = `${cleanBasePath}/${cleanSlug}.md`
      const htmlUrl = `${routePath}/${cleanSlug}/index.html`
      
      console.log('Fetching content - trying pre-rendered HTML first:', htmlUrl)
      
      // Try pre-rendered HTML first
      fetch(htmlUrl)
      .then(r => {
        // If HTML not found, try markdown as fallback
        if (!r.ok) {
          console.log('Pre-rendered HTML not found (status:', r.status, '), falling back to markdown:', markdownUrl)
          return fetch(markdownUrl).then(mdRes => {
            if (!mdRes.ok) {
              console.error('Markdown fetch also failed:', mdRes.status, mdRes.statusText)
              throw new Error(`Failed to fetch both HTML (${r.status}) and markdown (${mdRes.status})`)
            }
            console.log('Successfully fetched markdown file')
            return mdRes.text().then(text => ({ text, isMarkdown: true }))
          })
        }
        console.log('Successfully fetched pre-rendered HTML')
        return r.text().then(text => ({ text, isMarkdown: false }))
      })
      .then(async ({ text: responseText, isMarkdown }) => {
        if (!responseText || responseText.trim().length === 0) {
          throw new Error('Empty response')
        }
        
        let title, description, image, articleHtml
        
        if (isMarkdown) {
          // Fallback: Parse markdown
          const { marked } = await import('marked')
          const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
          const match = responseText.match(frontMatterRegex)
          
          if (match) {
            const frontmatter = match[1]
            const content = match[2]
            const data = {}
            frontmatter.split('\n').forEach(line => {
              const colonIndex = line.indexOf(':')
              if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim()
                const value = line.substring(colonIndex + 1).trim()
                if (key && value) {
                  data[key] = value.replace(/^["']|["']$/g, '')
                }
              }
            })
            title = data.title || slug
            description = data.description || title
            image = data.image || ''
            articleHtml = marked.parse(content)
          } else {
            title = slug
            description = slug
            image = ''
            articleHtml = marked.parse(responseText)
          }
          console.log('Loaded from markdown (fallback)')
        } else {
          // Extract from pre-rendered HTML
          const parser = new DOMParser()
          const doc = parser.parseFromString(responseText, 'text/html')
          
          const articleElement = doc.querySelector('article.markdown-content')
          
          // Check if this is actually the React app's index.html (has #root div but no article)
          const hasRootDiv = doc.querySelector('#root') !== null
          const hasArticle = articleElement !== null && articleElement.innerHTML.trim().length > 0
          
          if (hasRootDiv && !hasArticle) {
            // This is the React app's index.html, not pre-rendered HTML
            // Fall back to markdown
            console.log('Detected React app HTML instead of pre-rendered HTML, falling back to markdown')
            const { marked } = await import('marked')
            const mdRes = await fetch(markdownUrl)
            if (!mdRes.ok) {
              throw new Error(`Failed to fetch markdown: ${mdRes.status} ${mdRes.statusText}`)
            }
            const mdText = await mdRes.text()
            const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
            const match = mdText.match(frontMatterRegex)
            
            if (match) {
              const frontmatter = match[1]
              const content = match[2]
              const data = {}
              frontmatter.split('\n').forEach(line => {
                const colonIndex = line.indexOf(':')
                if (colonIndex > 0) {
                  const key = line.substring(0, colonIndex).trim()
                  const value = line.substring(colonIndex + 1).trim()
                  if (key && value) {
                    data[key] = value.replace(/^["']|["']$/g, '')
                  }
                }
              })
              title = data.title || slug
              description = data.description || title
              image = data.image || ''
              articleHtml = marked.parse(content)
            } else {
              title = slug
              description = slug
              image = ''
              articleHtml = marked.parse(mdText)
            }
            console.log('Loaded from markdown (fallback after detecting React HTML)')
          } else if (hasArticle) {
            // This is actual pre-rendered HTML
            const titleElement = doc.querySelector('title')
            title = titleElement ? titleElement.textContent.replace(' | Kubernetes Community', '').replace(' | K8s Community', '') : slug
            const metaDesc = doc.querySelector('meta[name="description"]')
            description = metaDesc ? metaDesc.getAttribute('content') : ''
            const ogImage = doc.querySelector('meta[property="og:image"]')
            image = ogImage ? ogImage.getAttribute('content') : ''
            articleHtml = articleElement.innerHTML
            
            console.log('Loaded from pre-rendered HTML')
          } else {
            throw new Error('No article content found in pre-rendered HTML')
          }
        }
        
        console.log('Content loaded:', { title, description, image, htmlLength: articleHtml.length })
        
        setMetaData({ title, description, image })
        
        // Update document title - keep it under 60 characters for SEO
        if (title) {
          // Shorten title if too long (max 60 chars recommended)
          const shortTitle = title.length > 50 ? title.substring(0, 47) + '...' : title
          document.title = `${shortTitle} | K8s Community`
        }
        
        // Update meta description
        const metaDescElement = document.querySelector('meta[name="description"]')
        if (metaDescElement && description) {
          // Ensure description is under 160 characters
          const shortDesc = description.length > 160 ? description.substring(0, 157) + '...' : description
          metaDescElement.setAttribute('content', shortDesc)
        }
        
        // Add meta keywords if missing
        let metaKeywords = document.querySelector('meta[name="keywords"]')
        if (!metaKeywords) {
          metaKeywords = document.createElement('meta')
          metaKeywords.name = 'keywords'
          document.head.appendChild(metaKeywords)
        }
        const keywords = kind === 'blog' 
          ? 'kubernetes, k8s, debugging kubernetes, kubernetes troubleshooting, kubernetes applications, kubectl, container orchestration'
          : kind === 'learn'
          ? 'kubernetes, k8s, learn kubernetes, kubernetes tutorial, kubernetes guide, container orchestration'
          : 'kubernetes, k8s, kubernetes operations, kubernetes monitoring, kubernetes production, container orchestration'
        metaKeywords.setAttribute('content', keywords)
        
        // Add Article structured data for better SEO
        if (typeof window !== 'undefined' && title) {
          const categoryName = kind === 'learn' ? 'Day-1 Basics' : kind === 'ops' ? 'Day-2 Operations' : 'Blog'
          
          // Article Schema
          const articleSchema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": description || title,
            "url": window.location.origin + window.location.pathname,
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
              "@id": window.location.origin + window.location.pathname
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
                "name": title,
                "item": window.location.origin + window.location.pathname
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
          
          // Update canonical URL - normalized to www
          // Always use normalized www URL, even if pre-rendered HTML has it
          const cleanUrl = getCanonicalUrl()
          let canonical = document.querySelector('link[rel="canonical"]')
          if (!canonical) {
            canonical = document.createElement('link')
            canonical.rel = 'canonical'
            document.head.appendChild(canonical)
          }
          // Force update to ensure www version is always used
          canonical.href = cleanUrl
          
          // Double-check: if somehow the URL doesn't have www, fix it
          if (!canonical.href.includes('://www.')) {
            canonical.href = cleanUrl
          }
          
          // Get image URL for OG and Twitter - use from frontmatter or fallback
          // Use www version for consistency
          const urlObj = new URL(cleanUrl)
          const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`
          let imageUrl
          if (image && image.trim()) {
            // If image path doesn't start with http, make it absolute
            imageUrl = image.startsWith('http') 
              ? image 
              : `${baseUrl}${image.startsWith('/') ? image : '/' + image}`
          } else if (kind === 'blog') {
            // Try to infer from slug
            imageUrl = `${baseUrl}/images/blog-${slug}.svg`
          } else {
            imageUrl = `${baseUrl}/images/hero.svg`
          }
          
          // Update or create Open Graph meta tags
          const updateOrCreateMeta = (property, content) => {
            let meta = document.querySelector(`meta[property="${property}"]`)
            if (!meta) {
              meta = document.createElement('meta')
              meta.setAttribute('property', property)
              document.head.appendChild(meta)
            }
            meta.setAttribute('content', content)
          }
          
          // Shorten title for OG (max 60 chars)
          const ogTitleText = title.length > 55 ? title.substring(0, 52) + '...' : title
          updateOrCreateMeta('og:title', ogTitleText)
          
          // Shorten description for OG (max 200 chars)
          const ogDescText = (description || title).length > 200 
            ? (description || title).substring(0, 197) + '...' 
            : (description || title)
          updateOrCreateMeta('og:description', ogDescText)
          updateOrCreateMeta('og:url', cleanUrl)
          updateOrCreateMeta('og:type', 'article')
          updateOrCreateMeta('og:image', imageUrl)
          updateOrCreateMeta('og:image:secure_url', imageUrl)
          updateOrCreateMeta('og:image:width', '1200')
          updateOrCreateMeta('og:image:height', '630')
          updateOrCreateMeta('og:image:alt', title)
          updateOrCreateMeta('og:site_name', 'Kubernetes Community')
          
          // Update or create Twitter Card meta tags
          const updateOrCreateTwitterMeta = (name, content) => {
            let meta = document.querySelector(`meta[name="${name}"]`)
            if (!meta) {
              meta = document.createElement('meta')
              meta.setAttribute('name', name)
              document.head.appendChild(meta)
            }
            meta.setAttribute('content', content)
          }
          
          updateOrCreateTwitterMeta('twitter:card', 'summary_large_image')
          updateOrCreateTwitterMeta('twitter:url', cleanUrl)
          
          // Shorten title for Twitter (max 70 chars)
          const twitterTitleText = title.length > 65 ? title.substring(0, 62) + '...' : title
          updateOrCreateTwitterMeta('twitter:title', twitterTitleText)
          
          // Shorten description for Twitter (max 200 chars)
          const twitterDescText = (description || title).length > 200 
            ? (description || title).substring(0, 197) + '...' 
            : (description || title)
          updateOrCreateTwitterMeta('twitter:description', twitterDescText)
          updateOrCreateTwitterMeta('twitter:image', imageUrl)
          updateOrCreateTwitterMeta('twitter:image:alt', title)
          updateOrCreateTwitterMeta('twitter:site', '@kubernetesio')
          updateOrCreateTwitterMeta('twitter:creator', '@kubernetesio')
        }
        
        // Set the extracted HTML content
        setHtml(articleHtml)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error loading content:', error)
        setError(error.message)
        setMetaData({
          title: slug ? slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Page Not Found',
          description: 'The requested page could not be loaded.'
        })
        setHtml(`<div class="text-slate-600 p-4 border border-red-200 rounded-lg">
          <p class="font-semibold">Content not found</p>
          <p class="text-sm mt-2">Tried: <code class="bg-slate-100 px-1 rounded">${htmlUrl}</code> and <code class="bg-slate-100 px-1 rounded">${markdownUrl}</code></p>
          <p class="text-sm">Error: ${error.message}</p>
          <p class="text-xs mt-2 text-slate-500">For production: Run <code>npm run build</code> to generate pre-rendered HTML</p>
        </div>`)
        setLoading(false)
      })
    } catch (err) {
      console.error('Error in useEffect:', err)
      setError(err.message)
      setLoading(false)
      setHtml(`<div class="text-red-600 p-4">Error: ${err.message}</div>`)
    }
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

  // Debug logging
  useEffect(() => {
    console.log('MarkdownPage render:', { slug, kind, basePath, loading, htmlLength: html.length })
    console.log('Component mounted with slug:', slug, 'kind:', kind)
  }, [slug, kind, basePath, loading, html])
  
  // Log when component first mounts
  useEffect(() => {
    console.log('MarkdownPage component mounted')
    return () => console.log('MarkdownPage component unmounted')
  }, [])

  // Always render something visible
  if (error && !loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-900 mb-2">Error Loading Page</h1>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Go Home
            </button>
          </div>
        </div>
      </main>
    )
  }

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
            <p className="text-slate-600 text-lg">Loading content…</p>
            <p className="text-slate-400 text-sm mt-2">Fetching: {slug}</p>
          </div>
        ) : (
          <>
            {metaData.title && (
              <h1 className="text-4xl font-bold text-slate-900 mb-6">{metaData.title}</h1>
            )}
            {!metaData.title && slug && (
              <h1 className="text-4xl font-bold text-slate-900 mb-6">
                {slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </h1>
            )}
            {html && html.trim().length > 0 ? (
              <article 
                className="markdown-content max-w-none" 
                dangerouslySetInnerHTML={{ 
                  __html: html
                    // Convert any H1 tags in the markdown to H2 to avoid multiple H1s
                    .replace(/<h1([^>]*)>/gi, '<h2$1>')
                    .replace(/<\/h1>/gi, '</h2>')
                }}
              />
            ) : (
              <div className="text-red-600 p-4 border border-red-200 rounded-lg">
                <p className="font-semibold">No content to display</p>
                <p className="text-sm mt-2">HTML is empty. Check console for errors.</p>
              </div>
            )}
            
            {/* Footer with internal links for SEO */}
            <footer className="mt-12 pt-8 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Day-1 Basics</h3>
                  <ul className="space-y-2 text-slate-600">
                    <li><a href="/learn/what-is-kubernetes" className="hover:text-indigo-700">What is Kubernetes?</a></li>
                    <li><a href="/learn/core-components" className="hover:text-indigo-700">Core Components</a></li>
                    <li><a href="/learn/pods-nodes-services" className="hover:text-indigo-700">Pods & Services</a></li>
                    <li><a href="/learn/workloads" className="hover:text-indigo-700">Deployments</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Day-2 Operations</h3>
                  <ul className="space-y-2 text-slate-600">
                    <li><a href="/ops/check-cluster-health" className="hover:text-indigo-700">Check Cluster Health</a></li>
                    <li><a href="/ops/monitor-pods" className="hover:text-indigo-700">Monitor Pods</a></li>
                    <li><a href="/ops/probes" className="hover:text-indigo-700">Probes</a></li>
                    <li><a href="/ops/smart-alerts" className="hover:text-indigo-700">Smart Alerts</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Resources</h3>
                  <ul className="space-y-2 text-slate-600">
                    <li><a href="/" className="hover:text-indigo-700">Home</a></li>
                    <li><a href="/blog" className="hover:text-indigo-700">Blog</a></li>
                    <li><a href="/sitemap.xml" className="hover:text-indigo-700">Sitemap</a></li>
                  </ul>
                </div>
              </div>
            </footer>
          </>
        )}
      </div>
    </main>
  )
}
