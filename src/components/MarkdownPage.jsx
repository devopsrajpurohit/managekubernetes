import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { marked } from 'marked'
import matter from 'gray-matter'
marked.setOptions({ gfm: true, breaks: true })
export default function MarkdownPage({ basePath }){
  const { slug } = useParams()
  const [html, setHtml] = useState('<p>Loading…</p>')
  useEffect(() => {
    fetch(`${basePath}/${slug}.md`)
      .then(r => r.text())
      .then(text => { const parsed = matter(text); setHtml(marked.parse(parsed.content)) })
      .catch(() => setHtml('<p class=\"text-slate-600\">Not found.</p>'))
  }, [slug, basePath])
  return <div className="mx-auto max-w-3xl px-4 py-10 prose prose-slate" dangerouslySetInnerHTML={{ __html: html }} />
}
