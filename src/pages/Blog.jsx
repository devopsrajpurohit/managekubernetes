import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import { trackPageView } from '../utils/analytics.js'

// Blog posts metadata - in production, this could be fetched from an API or generated from markdown files
const blogPosts = [
  {
    slug: 'getting-started-with-kubernetes',
    title: 'Getting Started with Kubernetes: A Complete Guide',
    description: 'Learn the fundamentals of Kubernetes and how to deploy your first application on a Kubernetes cluster.',
    date: '2024-12-15',
    readTime: '8 min read',
    category: 'Getting Started'
  },
  {
    slug: 'kubernetes-best-practices',
    title: 'Kubernetes Best Practices for Production',
    description: 'Essential best practices for running Kubernetes in production environments, including security, resource management, and monitoring.',
    date: '2024-12-10',
    readTime: '12 min read',
    category: 'Best Practices'
  },
  {
    slug: 'debugging-kubernetes-applications',
    title: 'Debugging Kubernetes Applications: Common Issues and Solutions',
    description: 'A comprehensive guide to debugging common issues in Kubernetes applications, with practical troubleshooting tips.',
    date: '2024-12-05',
    readTime: '10 min read',
    category: 'Troubleshooting'
  }
]

export default function Blog() {
  const [posts, setPosts] = useState(blogPosts)

  useEffect(() => {
    document.title = 'Blog | Kubernetes Community'
    trackPageView('/blog', 'Blog | Kubernetes Community')
    
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
                className="group block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg hover:border-indigo-300"
              >
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
      </div>
    </div>
  )
}

