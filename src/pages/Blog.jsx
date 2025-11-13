import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import { trackPageView } from '../utils/analytics.js'
import { getCanonicalUrl } from '../utils/urlUtils.js'

// Blog posts metadata - in production, this could be fetched from an API or generated from markdown files
const blogPosts = [
  {
    slug: 'troubleshooting-pods-evicted',
    title: 'Troubleshooting Kubernetes Pods in Evicted State',
    description: 'Complete guide to understanding and fixing evicted pods, including resource pressure, disk space issues, and node maintenance scenarios.',
    date: '2024-12-20',
    readTime: '12 min read',
    category: 'Troubleshooting',
    image: '/images/blog-evicted.svg'
  },
  {
    slug: 'understanding-pods-completed-state',
    title: 'Understanding Kubernetes Pods in Completed State',
    description: 'Learn when Completed state is normal vs problematic, and how to handle completed pods for jobs, batch processes, and long-running applications.',
    date: '2024-12-22',
    readTime: '9 min read',
    category: 'Kubernetes Concepts',
    image: '/images/blog-completed-state.svg'
  },
  {
    slug: 'troubleshooting-pods-oom-killed',
    title: 'Troubleshooting Kubernetes Pods Killed by OOM (Out of Memory)',
    description: 'Complete guide to diagnosing and fixing OOMKilled pods, including memory limit configuration, memory leaks, and resource optimization strategies.',
    date: '2024-12-19',
    readTime: '11 min read',
    category: 'Troubleshooting',
    image: '/images/blog-oom-killed.svg'
  },
  {
    slug: 'troubleshooting-pods-error-state',
    title: 'Troubleshooting Kubernetes Pods in Error State',
    description: 'Complete guide to diagnosing and fixing pods in Error state, including application crashes, configuration issues, and exit code handling.',
    date: '2024-12-21',
    readTime: '9 min read',
    category: 'Troubleshooting',
    image: '/images/blog-error-state.svg'
  },
  {
    slug: 'troubleshooting-pods-pending-state',
    title: 'Troubleshooting Kubernetes Pods Stuck in Pending State',
    description: 'Learn how to diagnose and fix pods stuck in Pending state, including resource issues, scheduling problems, and storage configuration.',
    date: '2024-12-18',
    readTime: '12 min read',
    category: 'Troubleshooting',
    image: '/images/blog-pending-state.svg'
  },
  {
    slug: 'troubleshooting-pods-crashloopbackoff',
    title: 'Troubleshooting Kubernetes Pods in CrashLoopBackOff State',
    description: 'Complete guide to diagnosing and fixing pods stuck in CrashLoopBackOff state, including common causes and step-by-step solutions.',
    date: '2024-12-17',
    readTime: '10 min read',
    category: 'Troubleshooting',
    image: '/images/blog-crashloopbackoff.svg'
  },
  {
    slug: 'troubleshooting-image-pull-errors',
    title: 'Troubleshooting Kubernetes Image Pull Errors',
    description: 'Complete guide to fixing ImagePullBackOff and ErrImagePull errors, including authentication, registry access, and network issues.',
    date: '2024-12-16',
    readTime: '11 min read',
    category: 'Troubleshooting',
    image: '/images/blog-image-pull.svg'
  },
  {
    slug: 'getting-started-with-kubernetes',
    title: 'Getting Started with Kubernetes: A Complete Guide',
    description: 'Learn the fundamentals of Kubernetes and how to deploy your first application on a Kubernetes cluster.',
    date: '2024-12-15',
    readTime: '8 min read',
    category: 'Getting Started',
    image: '/images/blog-getting-started.svg'
  },
  {
    slug: 'kubernetes-best-practices',
    title: 'Kubernetes Best Practices for Production',
    description: 'Essential best practices for running Kubernetes in production environments, including security, resource management, and monitoring.',
    date: '2024-12-10',
    readTime: '12 min read',
    category: 'Best Practices',
    image: '/images/blog-best-practices.svg'
  },
  {
    slug: 'debugging-kubernetes-applications',
    title: 'Debugging Kubernetes Applications: Common Issues and Solutions',
    description: 'A comprehensive guide to debugging common issues in Kubernetes applications, with practical troubleshooting tips.',
    date: '2024-12-05',
    readTime: '10 min read',
    category: 'Troubleshooting',
    image: '/images/blog-debugging.svg'
  }
]

export default function Blog() {
  const [posts, setPosts] = useState(blogPosts)

  useEffect(() => {
    document.title = 'Kubernetes Blog | K8s Tutorials, Guides & Best Practices'
    // Update meta description - optimized to 150-160 chars
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Kubernetes tutorials: Master container orchestration with expert guides, troubleshooting tips, and best practices. Improve your Kubernetes operations today.')
    }
    try {
      // Update canonical URL - normalized to www
      // Force the canonical URL to be /blog (not /)
      const cleanUrl = 'https://www.managekubernetes.com/blog'
      
      let canonical = document.querySelector('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.rel = 'canonical'
        document.head.appendChild(canonical)
      }
      // Use setAttribute to ensure it's properly set
      canonical.setAttribute('href', cleanUrl)
      canonical.href = cleanUrl
      
      // Verify it's set correctly - force update if wrong
      const currentHref = canonical.getAttribute('href') || canonical.href
      if (currentHref !== cleanUrl) {
        canonical.setAttribute('href', cleanUrl)
        canonical.href = cleanUrl
      }
      
      // Verify www is present
      if (currentHref && !currentHref.includes('://www.')) {
        canonical.setAttribute('href', cleanUrl)
        canonical.href = cleanUrl
      }
      // Update Open Graph URL (also normalized to www)
      const ogUrl = document.querySelector('meta[property="og:url"]')
      if (ogUrl) ogUrl.setAttribute('content', cleanUrl)
      
      // Add Google Search Console verification meta tag if not present
      let gscVerification = document.querySelector('meta[name="google-site-verification"]')
      if (!gscVerification) {
        // Get verification code from environment variable or use placeholder
        const verificationCode = import.meta.env.VITE_GOOGLE_SEARCH_CONSOLE_VERIFICATION || 'YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE'
        if (verificationCode && verificationCode !== 'YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE') {
          gscVerification = document.createElement('meta')
          gscVerification.name = 'google-site-verification'
          gscVerification.content = verificationCode
          document.head.appendChild(gscVerification)
        }
      }
      
      // Add WebPage schema
      const webpageSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Kubernetes Blog | K8s Tutorials, Guides & Best Practices",
        "description": "Kubernetes tutorials: Master container orchestration with expert guides, troubleshooting tips, and best practices. Improve your Kubernetes operations today.",
        "url": cleanUrl,
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
            "url": `${cleanUrl.replace(/\/$/, '')}/images/hero.svg`,
            "width": 1200,
            "height": 630
          }
        },
        "inLanguage": "en-US",
        "isPartOf": {
          "@type": "WebSite",
          "name": "Kubernetes Community",
          "url": cleanUrl.replace(/\/blog.*$/, '')
        }
      }
      
      // Remove existing WebPage schema if any
      const existingWebPage = document.querySelector('script[data-schema="webpage"]')
      if (existingWebPage) existingWebPage.remove()
      
      // Add WebPage schema
      const webpageScript = document.createElement('script')
      webpageScript.type = 'application/ld+json'
      webpageScript.setAttribute('data-schema', 'webpage')
      webpageScript.textContent = JSON.stringify(webpageSchema)
      document.head.appendChild(webpageScript)
      
      // Update Open Graph and Twitter meta descriptions
      const updateOrCreateMeta = (property, content) => {
        let meta = document.querySelector(`meta[property="${property}"]`)
        if (!meta) {
          meta = document.createElement('meta')
          meta.setAttribute('property', property)
          document.head.appendChild(meta)
        }
        meta.setAttribute('content', content)
      }
      
      const updateOrCreateTwitterMeta = (name, content) => {
        let meta = document.querySelector(`meta[name="${name}"]`)
        if (!meta) {
          meta = document.createElement('meta')
          meta.setAttribute('name', name)
          document.head.appendChild(meta)
        }
        meta.setAttribute('content', content)
      }
      
      const ogDesc = 'Kubernetes tutorials: Master container orchestration with expert guides, troubleshooting tips, and best practices. Improve your Kubernetes operations today.'
      updateOrCreateMeta('og:description', ogDesc)
      updateOrCreateTwitterMeta('twitter:description', ogDesc)
    } catch (error) {
      console.error('Error in Blog useEffect:', error)
    }
    trackPageView('/blog', 'Kubernetes Blog | Kubernetes Community')
    
    // Try to fetch blog posts list if available
    // This could be extended to load from an API or index file
    fetch('/content/blog/index.json')
      .then(res => {
        if (res.ok) {
          return res.json()
        }
        throw new Error('Index not found')
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPosts(data)
        }
      })
      .catch(() => {
        // Use default posts if index.json doesn't exist
        console.log('Using default blog posts')
      })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <header className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Kubernetes Blog</h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Learn from the community with articles, tutorials, and insights about Kubernetes, container orchestration, and cloud-native technologies.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-600 mb-4">No blog posts available yet.</p>
            <p className="text-sm text-slate-500">Check back soon for new articles!</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group block rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm transition hover:shadow-lg hover:border-indigo-300"
              >
                <div className="w-full h-48 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden flex items-center justify-center relative">
                  <img
                    src={post.image || '/images/blog-default.svg'}
                    alt={post.title}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback to default image if specified image fails to load
                      if (e.target.src !== window.location.origin + '/images/blog-default.svg') {
                        e.target.src = '/images/blog-default.svg'
                      } else {
                        // If default also fails, show placeholder
                        e.target.style.display = 'none'
                        if (e.target.nextElementSibling) {
                          e.target.nextElementSibling.style.display = 'flex'
                        }
                      }
                    }}
                  />
                  <div 
                    className="absolute inset-0 flex items-center justify-center hidden"
                    style={{ display: 'none' }}
                  >
                    <div className="text-center p-6">
                      <div className="w-24 h-24 mx-auto mb-4 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <svg className="w-12 h-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-500 font-medium">Blog Image</p>
                      <p className="text-xs text-slate-400 mt-1">Image failed to load</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                      {post.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-indigo-700 transition">
                    {post.title}
                  </h2>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                    {post.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Related Resources</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              to="/learn/what-is-kubernetes"
              className="block p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition"
            >
              <h3 className="font-semibold text-slate-800 mb-1">What is Kubernetes?</h3>
              <p className="text-sm text-slate-600">Start with the basics of Kubernetes</p>
            </Link>
            <Link
              to="/ops/check-cluster-health"
              className="block p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition"
            >
              <h3 className="font-semibold text-slate-800 mb-1">Check Cluster Health</h3>
              <p className="text-sm text-slate-600">Monitor your Kubernetes cluster</p>
            </Link>
          </div>
        </div>
        
        {/* Footer with internal links for SEO */}
        <footer className="mt-12 pt-8 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Day-1 Basics</h3>
              <ul className="space-y-2 text-slate-600">
                <li><Link to="/learn/what-is-kubernetes" className="hover:text-indigo-700">What is Kubernetes?</Link></li>
                <li><Link to="/learn/core-components" className="hover:text-indigo-700">Core Components</Link></li>
                <li><Link to="/learn/pods-nodes-services" className="hover:text-indigo-700">Pods & Services</Link></li>
                <li><Link to="/learn/workloads" className="hover:text-indigo-700">Deployments</Link></li>
                <li><Link to="/learn/control-plane" className="hover:text-indigo-700">Control Plane</Link></li>
                <li><Link to="/learn/basic-troubleshooting" className="hover:text-indigo-700">Troubleshooting Basics</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Day-2 Operations</h3>
              <ul className="space-y-2 text-slate-600">
                <li><Link to="/ops/check-cluster-health" className="hover:text-indigo-700">Check Cluster Health</Link></li>
                <li><Link to="/ops/monitor-pods" className="hover:text-indigo-700">Monitor Pods</Link></li>
                <li><Link to="/ops/probes" className="hover:text-indigo-700">Probes</Link></li>
                <li><Link to="/ops/smart-alerts" className="hover:text-indigo-700">Smart Alerts</Link></li>
                <li><Link to="/ops/cost-optimization" className="hover:text-indigo-700">Cost Optimization</Link></li>
                <li><Link to="/ops/day2-checklist" className="hover:text-indigo-700">Day-2 Checklist</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Resources</h3>
              <ul className="space-y-2 text-slate-600">
                <li><Link to="/" className="hover:text-indigo-700">Home</Link></li>
                <li><Link to="/blog" className="hover:text-indigo-700">Blog</Link></li>
                <li><a href="/sitemap.xml" className="hover:text-indigo-700">Sitemap</a></li>
                <li><a href="/robots.txt" className="hover:text-indigo-700">Robots.txt</a></li>
              </ul>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

