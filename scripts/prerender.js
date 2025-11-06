import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { marked } from 'marked'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: true,
  mangle: false,
  headerIds: false
})

// Simple frontmatter parser
function parseFrontmatter(text) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = text.match(frontMatterRegex)
  
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
    
    return { data, content }
  }
  
  return { data: {}, content: text }
}

// HTML template
function generateHTML(title, description, htmlContent, url, categoryName = 'Blog', baseUrl = 'https://managekubernetes.com', route = '/blog') {
  // Escape HTML in meta tags
  const escapeHtml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
  const escapeJson = (str) => String(str || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')
  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description || title)
  const safeTitleJson = escapeJson(title)
  const safeDescJson = escapeJson(description || title)
  
  // Determine category URL
  const categoryUrl = route.includes('/blog') ? `${baseUrl}/blog` : 
                      route.includes('/learn') ? `${baseUrl}/#day1` : 
                      `${baseUrl}/#day2`
  
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle} | Kubernetes Community</title>
    <meta name="description" content="${safeDescription}" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
    <link rel="canonical" href="${url}" />
    <meta property="og:title" content="${safeTitle} | Kubernetes Community" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Kubernetes Community" />
    <link rel="icon" type="image/svg+xml" href="/images/kubernetes-logo.svg" />
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${safeTitle}",
      "description": "${safeDescription}",
      "url": "${url}",
      "datePublished": "${new Date().toISOString()}",
      "dateModified": "${new Date().toISOString()}",
      "author": {
        "@type": "Organization",
        "name": "Kubernetes Community"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Kubernetes Community",
        "logo": {
          "@type": "ImageObject",
          "url": "https://managekubernetes.com/images/hero.svg"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "${url}"
      },
      "inLanguage": "en-US",
      "isAccessibleForFree": true,
      "articleSection": "${categoryName}"
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "${baseUrl}"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "${categoryName}",
          "item": "${categoryUrl}"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "${safeTitleJson}",
          "item": "${url}"
        }
      ]
    }
    </script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; }
      .markdown-content { line-height: 1.75; color: rgb(15 23 42); }
      .markdown-content h1 { font-size: 2.25em; font-weight: 800; margin-top: 0; margin-bottom: 0.8888889em; }
      .markdown-content h2 { font-size: 1.5em; font-weight: 700; margin-top: 2em; margin-bottom: 1em; }
      .markdown-content h3 { font-size: 1.25em; font-weight: 600; margin-top: 1.6em; margin-bottom: 0.6em; }
      .markdown-content p { margin-top: 1.25em; margin-bottom: 1.25em; }
      .markdown-content ul, .markdown-content ol { margin-top: 1.25em; margin-bottom: 1.25em; padding-left: 1.625em; }
      .markdown-content code { background-color: rgb(241 245 249); color: rgb(51 65 85); padding: 0.125em 0.25em; border-radius: 0.25rem; font-size: 0.875em; }
      .markdown-content pre { background-color: rgb(15 23 42); color: rgb(248 250 252); overflow-x: auto; padding: 1em; border-radius: 0.5rem; margin-top: 1.7142857em; margin-bottom: 1.7142857em; }
      .markdown-content pre code { background-color: transparent; color: inherit; padding: 0; }
      .markdown-content a { color: rgb(79 70 229); text-decoration: underline; font-weight: 500; }
      .markdown-content img { display: none !important; }
    </style>
  </head>
  <body>
    <main class="min-h-screen bg-white">
      <div class="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <nav class="mb-6 flex items-center gap-2 text-sm text-slate-600">
          <a href="/" class="hover:text-indigo-700">Home</a>
          <span>/</span>
          <span class="text-slate-800 font-medium">${title}</span>
        </nav>
        <h1 class="text-4xl font-bold text-slate-900 mb-6">${safeTitle}</h1>
        <article class="markdown-content max-w-none">${htmlContent}</article>
        
        <!-- Footer with internal links for SEO -->
        <footer class="mt-12 pt-8 border-t border-slate-200">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 class="font-semibold text-slate-900 mb-3">Day-1 Basics</h3>
              <ul class="space-y-2 text-slate-600">
                <li><a href="/learn/what-is-kubernetes" class="hover:text-indigo-700">What is Kubernetes?</a></li>
                <li><a href="/learn/core-components" class="hover:text-indigo-700">Core Components</a></li>
                <li><a href="/learn/pods-nodes-services" class="hover:text-indigo-700">Pods & Services</a></li>
                <li><a href="/learn/workloads" class="hover:text-indigo-700">Deployments</a></li>
              </ul>
            </div>
            <div>
              <h3 class="font-semibold text-slate-900 mb-3">Day-2 Operations</h3>
              <ul class="space-y-2 text-slate-600">
                <li><a href="/ops/check-cluster-health" class="hover:text-indigo-700">Check Cluster Health</a></li>
                <li><a href="/ops/monitor-pods" class="hover:text-indigo-700">Monitor Pods</a></li>
                <li><a href="/ops/probes" class="hover:text-indigo-700">Probes</a></li>
                <li><a href="/ops/smart-alerts" class="hover:text-indigo-700">Smart Alerts</a></li>
              </ul>
            </div>
            <div>
              <h3 class="font-semibold text-slate-900 mb-3">Resources</h3>
              <ul class="space-y-2 text-slate-600">
                <li><a href="/" class="hover:text-indigo-700">Home</a></li>
                <li><a href="/blog" class="hover:text-indigo-700">Blog</a></li>
                <li><a href="/sitemap.xml" class="hover:text-indigo-700">Sitemap</a></li>
              </ul>
            </div>
          </div>
        </footer>
      </div>
    </main>
    <!-- Pre-rendered HTML - no React needed for crawlers -->
    <!-- For interactive features, the React app will hydrate if JavaScript is enabled -->
    <noscript>
      <p class="text-center text-slate-500 text-sm mt-8">JavaScript is disabled. This is a pre-rendered static page.</p>
    </noscript>
  </body>
</html>`
}

// Process markdown files
function processMarkdownFiles() {
  const baseUrl = 'https://managekubernetes.com'
  const contentDirs = [
    { dir: path.join(__dirname, '../public/content/blog'), route: '/blog', category: 'Blog' },
    { dir: path.join(__dirname, '../public/content/learn'), route: '/learn', category: 'Day-1 Basics' },
    { dir: path.join(__dirname, '../public/content/ops'), route: '/ops', category: 'Day-2 Operations' }
  ]
  
  const outputDir = path.join(__dirname, '../dist')
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  contentDirs.forEach(({ dir, route }) => {
    if (!fs.existsSync(dir)) {
      console.log(`Directory not found: ${dir}`)
      return
    }
    
    const files = fs.readdirSync(dir).filter(file => file.endsWith('.md'))
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const slug = file.replace('.md', '')
      const content = fs.readFileSync(filePath, 'utf-8')
      const { data, content: markdownContent } = parseFrontmatter(content)
      
      const title = data.title || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      const description = data.description || title
      const htmlContent = marked.parse(markdownContent)
      const url = `${baseUrl}${route}/${slug}`
      const categoryName = route.includes('/blog') ? 'Blog' : route.includes('/learn') ? 'Day-1 Basics' : 'Day-2 Operations'
      
      // Create route directory
      const routeDir = path.join(outputDir, route.substring(1), slug)
      if (!fs.existsSync(routeDir)) {
        fs.mkdirSync(routeDir, { recursive: true })
      }
      
      // Write HTML file with category info
      const htmlFile = path.join(routeDir, 'index.html')
      fs.writeFileSync(htmlFile, generateHTML(title, description, htmlContent, url, categoryName, baseUrl, route))
      
      console.log(`Pre-rendered: ${route}/${slug}`)
    })
  })
  
  console.log('Pre-rendering complete!')
}

processMarkdownFiles()

