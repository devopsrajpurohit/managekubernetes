import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { marked } from 'marked'
import { ArrowLeft } from 'lucide-react'
import { trackMarkdownView } from '../utils/analytics.js'

marked.setOptions({ gfm: true, breaks: true })

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
  const [html, setHtml] = useState('<p>Loading…</p>')
  const [loading, setLoading] = useState(true)
  const [metaData, setMetaData] = useState({ title: '', description: '' })
  
  // Track markdown page view
  useEffect(() => {
    if (slug && kind) {
      trackMarkdownView(slug, kind)
    }
  }, [slug, kind])
  
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
        }
        
        // Parse markdown to HTML
        try {
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
            setHtml(String(markdownHtml))
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
  
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <button
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
        {loading ? (
          <div className="text-center py-20">
            <p className="text-slate-600">Loading…</p>
          </div>
        ) : (
          <article className="markdown-content max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </div>
  )
}
