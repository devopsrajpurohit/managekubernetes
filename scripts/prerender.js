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
  // Optimize description to 150-160 characters
  const optimizeDescription = (desc) => {
    if (!desc || desc.length <= 160) return desc
    // Truncate at word boundary
    const truncated = desc.substring(0, 157)
    const lastSpace = truncated.lastIndexOf(' ')
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
  }
  
  const optimizedDesc = optimizeDescription(description || title)
  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(optimizedDesc)
  const safeTitleJson = escapeJson(title)
  const safeDescJson = escapeJson(optimizedDesc)
  
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
    <!-- Google Search Console Verification -->
    <!-- Replace YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE with your actual verification code from Google Search Console -->
    <meta name="google-site-verification" content="YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE" />
    <link rel="canonical" href="${url}" />
    <meta property="og:title" content="${safeTitle} | Kubernetes Community" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Kubernetes Community" />
    <link rel="icon" type="image/svg+xml" href="/images/kubernetes-logo.svg" />
    <!-- Tailwind CSS will be bundled by Vite and included in the main CSS file -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${safeTitle}",
      "description": "${safeDescription}",
      "url": "${url}",
      "datePublished": "2024-11-06T00:00:00Z",
      "dateModified": "2024-11-06T00:00:00Z",
      "author": {
        "@type": "Organization",
        "name": "Kubernetes Community"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Kubernetes Community",
          "logo": {
            "@type": "ImageObject",
            "url": "https://www.managekubernetes.com/images/hero.svg"
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
      "@type": "WebPage",
      "name": "${safeTitleJson}",
      "description": "${safeDescJson}",
      "url": "${url}",
      "datePublished": "2024-11-06T00:00:00Z",
      "dateModified": "2024-11-06T00:00:00Z",
      "dateCreated": "2024-11-06T00:00:00Z",
      "author": {
        "@type": "Organization",
        "name": "Kubernetes Community"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Kubernetes Community",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.managekubernetes.com/images/hero.svg",
          "width": 1200,
          "height": 630
        }
      },
      "inLanguage": "en-US",
      "isPartOf": {
        "@type": "WebSite",
        "name": "Kubernetes Community",
        "url": "${baseUrl}"
      }
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
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { 
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.5;
        color: rgb(15 23 42);
        background-color: #ffffff;
        min-height: 100vh;
      }
      main {
        min-height: 100vh;
        background-color: #ffffff;
      }
      .container {
        margin-left: auto;
        margin-right: auto;
        width: 100%;
        max-width: 72rem;
        padding-left: 1rem;
        padding-right: 1rem;
        padding-top: 2rem;
        padding-bottom: 3rem;
      }
      @media (min-width: 640px) {
        .container { padding-left: 1.5rem; padding-right: 1.5rem; }
      }
      @media (min-width: 1024px) {
        .container { padding-left: 2rem; padding-right: 2rem; }
      }
      nav {
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: rgb(71 85 105);
      }
      nav a {
        color: rgb(71 85 105);
        text-decoration: none;
      }
      nav a:hover {
        color: rgb(67 56 202);
      }
      nav span:last-child {
        color: rgb(30 41 59);
        font-weight: 500;
      }
      h1 {
        font-size: 2.25rem;
        font-weight: 700;
        color: rgb(15 23 42);
        margin-bottom: 1.5rem;
        line-height: 1.2;
      }
      .markdown-content { 
        line-height: 1.75; 
        color: rgb(15 23 42);
        max-width: none;
      }
      .markdown-content h1 { font-size: 2.25em; font-weight: 800; margin-top: 0; margin-bottom: 0.8888889em; }
      .markdown-content h2 { font-size: 1.5em; font-weight: 700; margin-top: 2em; margin-bottom: 1em; }
      .markdown-content h3 { font-size: 1.25em; font-weight: 600; margin-top: 1.6em; margin-bottom: 0.6em; }
      .markdown-content p { margin-top: 1.25em; margin-bottom: 1.25em; }
      .markdown-content ul, .markdown-content ol { margin-top: 1.25em; margin-bottom: 1.25em; padding-left: 1.625em; }
      .markdown-content code { background-color: rgb(241 245 249); color: rgb(51 65 85); padding: 0.125em 0.25em; border-radius: 0.25rem; font-size: 0.875em; }
      .markdown-content pre { background-color: rgb(15 23 42); color: rgb(248 250 252); overflow-x: auto; padding: 1em; border-radius: 0.5rem; margin-top: 1.7142857em; margin-bottom: 1.7142857em; }
      .markdown-content pre code { background-color: transparent; color: inherit; padding: 0; }
      .markdown-content a { color: rgb(79 70 229); text-decoration: underline; font-weight: 500; }
      .markdown-content a:hover { color: rgb(67 56 202); }
      .markdown-content img { display: none !important; }
      footer {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 1px solid rgb(226 232 240);
      }
      .footer-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
        font-size: 0.875rem;
      }
      @media (min-width: 768px) {
        .footer-grid { grid-template-columns: repeat(3, 1fr); }
      }
      .footer-section h3 {
        font-weight: 600;
        color: rgb(15 23 42);
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
      }
      .footer-section ul {
        list-style: none;
        padding: 0;
      }
      .footer-section li {
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
      }
      .footer-section a {
        color: rgb(71 85 105);
        text-decoration: none;
      }
      .footer-section a:hover {
        color: rgb(67 56 202);
      }
    </style>
  </head>
  <body>
    <main>
      <div class="container">
        <nav>
          <a href="/">Home</a>
          <span>/</span>
          <span>${safeTitle}</span>
        </nav>
        <h1>${safeTitle}</h1>
        <article class="markdown-content">${htmlContent}</article>
        
        <!-- Footer with internal links for SEO -->
        <footer>
          <div class="footer-grid">
            <div class="footer-section">
              <h3>Day-1 Basics</h3>
              <ul>
                <li><a href="/learn/what-is-kubernetes">What is Kubernetes?</a></li>
                <li><a href="/learn/core-components">Core Components</a></li>
                <li><a href="/learn/pods-nodes-services">Pods & Services</a></li>
                <li><a href="/learn/workloads">Deployments</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h3>Day-2 Operations</h3>
              <ul>
                <li><a href="/ops/check-cluster-health">Check Cluster Health</a></li>
                <li><a href="/ops/monitor-pods">Monitor Pods</a></li>
                <li><a href="/ops/probes">Probes</a></li>
                <li><a href="/ops/smart-alerts">Smart Alerts</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h3>Resources</h3>
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/blog">Blog</a></li>
                <li><a href="/sitemap.xml">Sitemap</a></li>
              </ul>
            </div>
          </div>
        </footer>
      </div>
    </main>
    <!-- Pre-rendered HTML - no React needed for crawlers -->
    <!-- For interactive features, the React app will hydrate if JavaScript is enabled -->
    <noscript>
      <p style="text-align: center; color: rgb(100 116 139); font-size: 0.875rem; margin-top: 2rem;">JavaScript is disabled. This is a pre-rendered static page.</p>
    </noscript>
  </body>
</html>`
}

// Process markdown files
// Normalize URL to always use www version
function normalizeUrl(url) {
  if (!url) return url
  // Add www if not present
  if (!url.includes('://www.')) {
    return url.replace(/^https?:\/\//, (match) => {
      return match + 'www.'
    })
  }
  return url
}

function processMarkdownFiles() {
  const baseUrl = normalizeUrl('https://managekubernetes.com')
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
      let htmlContent = marked.parse(markdownContent)
      // Convert H1 tags to H2 to avoid duplicate H1s (template already has H1 with title)
      htmlContent = htmlContent.replace(/<h1([^>]*)>/gi, '<h2$1>').replace(/<\/h1>/gi, '</h2>')
      const url = normalizeUrl(`${baseUrl}${route}/${slug}`)
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

