import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Server, Cpu, HeartPulse, Users } from 'lucide-react';
import { Link, useInRouterContext } from 'react-router-dom';
import { trackCardClick, trackExternalLink } from '../utils/analytics.js';

const GridBG = () => (
  <svg className="absolute inset-0 -z-10 h-full w-full [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" aria-hidden="true">
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0H0V40" fill="none" stroke="#e5e7eb" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
);

const FALLBACK_SVG = `data:image/svg+xml;utf8,
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'>
  <defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
    <stop offset='0%' stop-color='%231e293b'/><stop offset='100%' stop-color='%233256b6'/>
  </linearGradient></defs>
  <rect width='100%' height='100%' fill='url(%23g)'/>
  <g fill='white' font-family='Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif' text-anchor='middle'>
    <text x='320' y='170' font-size='64' font-weight='800'>Kubernetes</text>
    <text x='320' y='220' font-size='22' opacity='0.85'>Day‑1 Basics · Day‑2 Reliability</text>
  </g>
</svg>`;

function ImageWithFallback({ src, alt, className }) {
  const [url, setUrl] = useState(src);
  return (
    <img alt={alt} className={className} src={url} loading="eager" referrerPolicy="no-referrer" onError={() => setUrl(FALLBACK_SVG)} />
  );
}

function DiscordWidget({ serverId }) {
  const id = serverId || (typeof window !== 'undefined' && window.__DISCORD_SERVER_ID__) || 'YOUR_SERVER_ID';
  const src = `https://discord.com/widget?id=${id}&theme=light`;
  return (
    <div className="mt-8">
      <iframe title="Discord" src={src} width="100%" height="350" allowTransparency frameBorder="0"
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        className="rounded-xl border border-slate-200 shadow-sm" />
    </div>
  );
}

function SafeLink({ to, children, onClick, 'data-card-title': cardTitle, ...props }) {
  const inRouter = useInRouterContext();
  
  const handleClick = (e) => {
    // Track card clicks for internal links
    if (onClick) onClick(e);
    
    // Track card click if card title is provided via data attribute
    if (cardTitle && inRouter && to.startsWith('/')) {
      trackCardClick(cardTitle, to);
    }
  };
  
  if (inRouter) return <Link to={to} {...props} onClick={handleClick}>{children}</Link>;
  return <a href={to} {...props} onClick={handleClick}>{children}</a>;
}

export default function Landing() {
  // Add BreadcrumbList structured data for better SEO and update canonical URL
  useEffect(() => {
    // Update canonical URL - normalized to non-www
    const cleanUrl = getCanonicalUrl()
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = cleanUrl
    // Update Open Graph URL (also normalized)
    const ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl) ogUrl.setAttribute('content', cleanUrl)
    
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": typeof window !== 'undefined' ? window.location.origin : "https://managekubernetes.com"
        }
      ]
    }
    
    const schemaScript = document.createElement('script')
    schemaScript.type = 'application/ld+json'
    schemaScript.setAttribute('data-schema', 'breadcrumb')
    schemaScript.textContent = JSON.stringify(breadcrumbSchema)
    document.head.appendChild(schemaScript)
    
    return () => {
      const existing = document.querySelector('script[data-schema="breadcrumb"]')
      if (existing) existing.remove()
    }
  }, [])

  const day1 = [
    { icon: <Cpu className="h-6 w-6 text-indigo-600" />, title: 'What is Kubernetes?', blurb: 'Why teams use it, when not to, and what problems it solves.', to: '/learn/what-is-kubernetes', image: '/images/k8s-intro.svg' },
    { icon: <Server className="h-6 w-6 text-indigo-600" />, title: 'Core Components', blurb: 'API server, scheduler, controller manager, etcd — the control plane at a glance.', to: '/learn/core-components', image: '/images/k8s-components.svg' },
    { icon: <Cloud className="h-6 w-6 text-indigo-600" />, title: 'Pods & Services', blurb: 'How containers become pods, get traffic, and stay resilient.', to: '/learn/pods-nodes-services', image: '/images/k8s-pods.svg' },
    { icon: <Server className="h-6 w-6 text-indigo-600" />, title: 'Deployments (the easy way)', blurb: 'Rolling updates & rollbacks with one command — zero theory overload.', to: '/learn/workloads', image: '/images/k8s-deployments.svg' },
    { icon: <Cloud className="h-6 w-6 text-indigo-600" />, title: 'Control Plane Overview', blurb: 'What happens when you run kubectl — the request path explained.', to: '/learn/control-plane', image: '/images/k8s-control-plane.svg' },
    { icon: <Cpu className="h-6 w-6 text-indigo-600" />, title: 'Troubleshooting Basics', blurb: 'Your first 6 commands: get, describe, logs, exec, events, top.', to: '/learn/basic-troubleshooting', image: '/images/k8s-troubleshooting.svg' },
  ];

  const day2 = [
    { icon: <Server className="h-6 w-6 text-indigo-600" />, title: 'Check Cluster Health', blurb: 'Read node conditions, component status, and kubelet health in minutes.', to: '/ops/check-cluster-health', image: '/images/k8s-health.svg' },
    { icon: <Cloud className="h-6 w-6 text-indigo-600" />, title: 'Monitor Pods & Resources', blurb: 'CPU/memory, restarts, throttling — what to watch and why it matters.', to: '/ops/monitor-pods', image: '/images/k8s-monitoring.svg' },
    { icon: <HeartPulse className="h-6 w-6 text-indigo-600" />, title: 'Readiness & Liveness Probes', blurb: 'Design endpoints & timeouts to avoid flapping and false restarts.', to: '/ops/probes', image: '/images/k8s-probes.svg' },
    { icon: <Server className="h-6 w-6 text-indigo-600" />, title: 'Smart Alerting & Notifications', blurb: 'Turn signals into sensible alerts. Reduce noise, keep actionability.', to: '/ops/smart-alerts', image: '/images/k8s-alerts.svg' },
    { icon: <Cpu className="h-6 w-6 text-indigo-600" />, title: 'Performance & Cost Insights', blurb: 'Right-size requests/limits, spot waste, and keep latency predictable.', to: '/ops/cost-optimization', image: '/images/k8s-cost.svg' },
    { icon: <Cloud className="h-6 w-6 text-indigo-600" />, title: 'Day-2 Checklist', blurb: 'Printable weekly checklist for SLOs, backups, and security basics.', to: '/ops/day2-checklist', image: '/images/k8s-checklist.svg' },
  ];

  return (
    <main className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/90 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="#home" className="flex items-center gap-3 font-semibold">
              <img 
                src="/images/kubernetes-logo.svg" 
                alt="Kubernetes Logo" 
                className="h-8 w-8"
                onError={(e) => {
                  // Fallback to Cloud icon if logo fails to load
                  e.target.style.display = 'none'
                  const fallback = e.target.nextElementSibling
                  if (fallback) fallback.style.display = 'block'
                }}
              />
              <Cloud className="h-6 w-6 text-indigo-600 hidden" />
              <span className="text-lg">Kubernetes Community</span>
            </a>
            <nav className="hidden md:flex gap-6 text-sm font-medium">
              <a href="#day1" className="hover:text-indigo-700">Day‑1 Basics</a>
              <a href="#day2" className="hover:text-indigo-700">Day‑2 Reliability</a>
              <SafeLink to="/blog" className="hover:text-indigo-700">Blog</SafeLink>
              <a href="#community" className="hover:text-indigo-700">Community</a>
            </nav>
          </div>
        </div>
      </header>

      <section id="home" className="relative overflow-hidden">
        <GridBG />
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <motion.h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                Learn Kubernetes – Free K8s Tutorials from Basics to Production
              </motion.h1>
              <p className="mt-4 text-slate-600 text-lg max-w-2xl lg:mx-0 mx-auto">
                Master Kubernetes (K8s) container orchestration with free tutorials. Learn Kubernetes from Day-1 basics to Day-2 production operations. Comprehensive guides covering kubectl, pods, services, deployments, monitoring, and troubleshooting.
              </p>
              <div className="mt-6 text-slate-600 max-w-2xl lg:mx-0 mx-auto">
                <p className="mb-3">
                  Whether you're getting started with Kubernetes container orchestration or scaling production Kubernetes clusters, our comprehensive <SafeLink to="/learn/what-is-kubernetes" className="text-indigo-600 hover:underline font-medium">free Kubernetes tutorials</SafeLink> cover everything from Kubernetes fundamentals to advanced operational patterns. We break down complex Kubernetes concepts into digestible tutorials with real-world examples and Kubernetes best practices.
                </p>
                <p className="mb-3">
                  Our <a href="#day1" className="text-indigo-600 hover:underline font-medium">Day-1 Kubernetes guides</a> help you understand Kubernetes core architecture, Kubernetes components, and Kubernetes workflows. Learn about <SafeLink to="/learn/pods-nodes-services" className="text-indigo-600 hover:underline">Kubernetes pods and services</SafeLink>, <SafeLink to="/learn/workloads" className="text-indigo-600 hover:underline">Kubernetes deployments</SafeLink>, and the <SafeLink to="/learn/control-plane" className="text-indigo-600 hover:underline">Kubernetes control plane</SafeLink> through clear explanations and hands-on kubectl examples. Each Kubernetes tutorial builds upon the previous one, creating a structured Kubernetes learning path.
                </p>
                <p>
                  <a href="#day2" className="text-indigo-600 hover:underline font-medium">Day-2 Kubernetes operations guides</a> focus on Kubernetes reliability, Kubernetes monitoring, and Kubernetes optimization. Discover how to <SafeLink to="/ops/check-cluster-health" className="text-indigo-600 hover:underline">monitor Kubernetes cluster health</SafeLink>, <SafeLink to="/ops/probes" className="text-indigo-600 hover:underline">configure Kubernetes probes</SafeLink>, <SafeLink to="/ops/smart-alerts" className="text-indigo-600 hover:underline">set up Kubernetes alerting</SafeLink>, <SafeLink to="/ops/cost-optimization" className="text-indigo-600 hover:underline">optimize Kubernetes costs</SafeLink>, and maintain production-ready Kubernetes clusters. These Kubernetes guides are essential for teams running Kubernetes in production environments.
                </p>
              </div>
              <div className="mt-8 flex justify-center lg:justify-start gap-3">
                <a href="#day1" className="rounded-full bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition shadow-sm">Explore Day‑1</a>
                <a href="#day2" className="rounded-full border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-50 transition">Explore Day‑2</a>
              </div>
            </div>
            <motion.div className="relative" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-md">
                <ImageWithFallback alt="Kubernetes Illustration" className="w-full h-auto rounded-2xl" src="/images/hero.svg" />
              </div>
              <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-indigo-100 blur-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      <section id="day1" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-2">Day‑1: Kubernetes Core Concepts & Fundamentals</h2>
          <p className="text-slate-600 mb-6">Master Kubernetes fundamentals — from Kubernetes pods to Kubernetes networking — with comprehensive Kubernetes tutorials and visual lessons.</p>
          <div className="mb-8 text-slate-700 max-w-3xl">
            <p className="mb-4">
              Day-1 Kubernetes learning focuses on understanding Kubernetes foundational concepts and Kubernetes architecture. These <SafeLink to="/learn/core-components" className="text-indigo-600 hover:underline">Kubernetes tutorials</SafeLink> are designed for developers and engineers who are new to Kubernetes container orchestration or want to strengthen their understanding of Kubernetes core concepts. Each Kubernetes guide covers essential Kubernetes topics with practical kubectl examples and clear explanations.
            </p>
            <p>
              Our Day-1 Kubernetes curriculum covers Kubernetes container orchestration basics, <SafeLink to="/learn/core-components" className="text-indigo-600 hover:underline">Kubernetes cluster architecture</SafeLink>, Kubernetes pod and service management, Kubernetes deployment strategies, Kubernetes control plane components, and essential <SafeLink to="/learn/basic-troubleshooting" className="text-indigo-600 hover:underline">Kubernetes troubleshooting commands</SafeLink>. These Kubernetes fundamentals form the foundation for working effectively with Kubernetes clusters in any environment.
            </p>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {day1.map((card) => (
              <SafeLink 
                key={card.title} 
                to={card.to} 
                data-card-title={card.title}
                className="group block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="relative h-40 bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
                  <ImageWithFallback 
                    alt={`${card.title} illustration`} 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" 
                    src={card.image || FALLBACK_SVG} 
                  />
                </div>
                <div className="p-6">
                  <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-indigo-50 p-2 ring-1 ring-inset ring-indigo-100">{card.icon}</div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">{card.title}</h3>
                  <p className="text-sm text-slate-600">{card.blurb}</p>
                  <div className="mt-4 text-indigo-700 text-sm font-medium opacity-0 group-hover:opacity-100 transition">Read guide →</div>
                </div>
              </SafeLink>
            ))}
          </div>
        </div>
      </section>

      <section id="day2" className="py-20 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-2">Day‑2: Kubernetes Monitoring & Production Operations</h2>
          <p className="text-slate-600 mb-6">Master Kubernetes probes, Kubernetes metrics, and smart Kubernetes alerts to keep Kubernetes clusters healthy and predictable in production.</p>
          <div className="mb-8 text-slate-700 max-w-3xl">
            <p className="mb-4">
              Day-2 Kubernetes operations are critical for maintaining healthy, reliable Kubernetes clusters in production. These <SafeLink to="/ops/check-cluster-health" className="text-indigo-600 hover:underline">Kubernetes operations guides</SafeLink> focus on Kubernetes operational excellence, Kubernetes monitoring strategies, and Kubernetes reliability patterns that ensure your Kubernetes applications run smoothly at scale. Learn how experienced Kubernetes SRE teams manage Kubernetes infrastructure.
            </p>
            <p>
              Our Day-2 Kubernetes operations guides cover <SafeLink to="/ops/check-cluster-health" className="text-indigo-600 hover:underline">Kubernetes cluster health monitoring</SafeLink>, <SafeLink to="/ops/monitor-pods" className="text-indigo-600 hover:underline">Kubernetes pod resource tracking</SafeLink>, <SafeLink to="/ops/probes" className="text-indigo-600 hover:underline">Kubernetes health probe configuration</SafeLink>, intelligent Kubernetes alerting strategies, <SafeLink to="/ops/cost-optimization" className="text-indigo-600 hover:underline">Kubernetes cost optimization</SafeLink>, and comprehensive <SafeLink to="/ops/day2-checklist" className="text-indigo-600 hover:underline">Kubernetes operational checklists</SafeLink>. These Kubernetes practices help teams prevent incidents, reduce Kubernetes costs, and maintain service level objectives (SLOs) in production Kubernetes environments.
            </p>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {day2.map((card) => (
              <SafeLink 
                key={card.title} 
                to={card.to} 
                data-card-title={card.title}
                className="group block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="relative h-40 bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
                  <ImageWithFallback 
                    alt={`${card.title} illustration`} 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" 
                    src={card.image || FALLBACK_SVG} 
                  />
                </div>
                <div className="p-6">
                  <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-indigo-50 p-2 ring-1 ring-inset ring-indigo-100">{card.icon}</div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">{card.title}</h3>
                  <p className="text-sm text-slate-600">{card.blurb}</p>
                  <div className="mt-4 text-indigo-700 text-sm font-medium opacity-0 group-hover:opacity-100 transition">Read guide →</div>
                </div>
              </SafeLink>
            ))}
          </div>
        </div>
      </section>

      <section id="community" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Users className="h-12 w-12 mx-auto text-indigo-600 mb-4" />
            <h2 className="text-3xl font-bold mb-3">Join the Kubernetes Community</h2>
            <p className="text-slate-600 max-w-2xl mx-auto mb-4">Share questions, troubleshoot issues, and get real-world advice from Kubernetes engineers and SREs.</p>
          </div>
          <div className="max-w-3xl mx-auto text-slate-700 mb-8">
            <p className="mb-4">
              Learning Kubernetes is more effective when you're part of a community. Connect with other engineers who are building, deploying, and maintaining Kubernetes clusters. Share your experiences, ask questions, and contribute your knowledge to help others succeed.
            </p>
            <p className="mb-4">
              Our community provides a space for discussing best practices, troubleshooting common issues, and staying updated with the latest Kubernetes developments. Whether you're working on Day-1 basics or Day-2 operations, there's always something new to learn and share.
            </p>
            <p>
              Join discussions on cluster configuration, deployment strategies, monitoring approaches, and cost optimization. The collective knowledge of the community helps everyone build better, more reliable Kubernetes infrastructure.
            </p>
          </div>
          <div className="text-center">
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="https://kubernetes.io/community/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="rounded-full bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition"
                onClick={() => trackExternalLink('https://kubernetes.io/community/', 'Join Kubernetes Community')}
              >
                Join Kubernetes Community
              </a>
              <SafeLink to="/blog" className="rounded-full border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-50 transition">Read the Blog</SafeLink>
            </div>
            <DiscordWidget />
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-12 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Day-1 Basics</h3>
              <ul className="space-y-2 text-sm">
                <li><SafeLink to="/learn/what-is-kubernetes" className="text-slate-600 hover:text-indigo-700">What is Kubernetes?</SafeLink></li>
                <li><SafeLink to="/learn/core-components" className="text-slate-600 hover:text-indigo-700">Core Components</SafeLink></li>
                <li><SafeLink to="/learn/pods-nodes-services" className="text-slate-600 hover:text-indigo-700">Pods & Services</SafeLink></li>
                <li><SafeLink to="/learn/workloads" className="text-slate-600 hover:text-indigo-700">Deployments</SafeLink></li>
                <li><SafeLink to="/learn/control-plane" className="text-slate-600 hover:text-indigo-700">Control Plane</SafeLink></li>
                <li><SafeLink to="/learn/basic-troubleshooting" className="text-slate-600 hover:text-indigo-700">Troubleshooting Basics</SafeLink></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Day-2 Operations</h3>
              <ul className="space-y-2 text-sm">
                <li><SafeLink to="/ops/check-cluster-health" className="text-slate-600 hover:text-indigo-700">Check Cluster Health</SafeLink></li>
                <li><SafeLink to="/ops/monitor-pods" className="text-slate-600 hover:text-indigo-700">Monitor Pods</SafeLink></li>
                <li><SafeLink to="/ops/probes" className="text-slate-600 hover:text-indigo-700">Probes</SafeLink></li>
                <li><SafeLink to="/ops/smart-alerts" className="text-slate-600 hover:text-indigo-700">Smart Alerts</SafeLink></li>
                <li><SafeLink to="/ops/cost-optimization" className="text-slate-600 hover:text-indigo-700">Cost Optimization</SafeLink></li>
                <li><SafeLink to="/ops/day2-checklist" className="text-slate-600 hover:text-indigo-700">Day-2 Checklist</SafeLink></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><SafeLink to="/blog" className="text-slate-600 hover:text-indigo-700">Blog</SafeLink></li>
                <li><SafeLink to="/blog/troubleshooting-pods-evicted" className="text-slate-600 hover:text-indigo-700">Pods Evicted</SafeLink></li>
                <li><SafeLink to="/blog/troubleshooting-pods-oom-killed" className="text-slate-600 hover:text-indigo-700">OOM Killed</SafeLink></li>
                <li><SafeLink to="/blog/troubleshooting-pods-error-state" className="text-slate-600 hover:text-indigo-700">Error State</SafeLink></li>
                <li><SafeLink to="/blog/troubleshooting-pods-pending-state" className="text-slate-600 hover:text-indigo-700">Pending State</SafeLink></li>
                <li><SafeLink to="/blog/troubleshooting-pods-crashloopbackoff" className="text-slate-600 hover:text-indigo-700">CrashLoopBackOff</SafeLink></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between">
            <p className="text-sm text-slate-500">© {new Date().getFullYear()} Kubernetes Community</p>
            <div className="mt-4 sm:mt-0 text-sm text-slate-500">
              <a href="/sitemap.xml" className="hover:text-indigo-700">Sitemap</a>
              <span className="mx-2">•</span>
              <a href="/robots.txt" className="hover:text-indigo-700">Robots.txt</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
