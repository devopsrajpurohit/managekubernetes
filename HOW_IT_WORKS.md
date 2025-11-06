# How Pre-rendering Works

## Overview

This site uses **pre-rendering** to convert markdown files to HTML at build time. This ensures Google crawlers see fully rendered content instead of blank pages.

## How It Works

### 1. **Build Process** (`npm run build`)

When you run `npm run build`, two things happen:

1. **Vite builds the React app** → Creates `dist/` folder with React app
2. **Pre-render script runs** → Converts all `.md` files to HTML:
   - Reads markdown from `public/content/blog/`, `public/content/learn/`, `public/content/ops/`
   - Converts markdown to HTML using `marked`
   - Generates static HTML files:
     - `dist/blog/kubernetes-best-practices/index.html`
     - `dist/learn/what-is-kubernetes/index.html`
     - `dist/ops/check-cluster-health/index.html`
   - Each HTML file contains:
     - Full rendered content
     - Meta tags (title, description, canonical URL)
     - Open Graph tags
     - Structured data (JSON-LD)

### 2. **On Vercel (Production)**

When you deploy to Vercel:

1. **Vercel runs `npm run build`** → Generates pre-rendered HTML files
2. **Vercel serves static files first**:
   - `/blog/kubernetes-best-practices` → Serves `/blog/kubernetes-best-practices/index.html` (pre-rendered)
   - `/learn/what-is-kubernetes` → Serves `/learn/what-is-kubernetes/index.html` (pre-rendered)
3. **Google crawler visits** → Gets fully rendered HTML immediately (no blank page!)
4. **Regular users** → Get the React app (pre-rendered HTML includes React script for hydration)

### 3. **Local Development**

#### Option A: Development Mode (with markdown)
```bash
npm run dev
```
- Fetches markdown files directly from `/content/`
- Parses markdown on the fly
- Good for development and testing

#### Option B: Preview Mode (with pre-rendered HTML)
```bash
npm run dev:html
```
- First builds the site and generates pre-rendered HTML
- Then serves the built site with pre-rendered HTML
- Simulates production environment
- Good for testing SEO and pre-rendered content

## File Structure

```
managekubernetes/
├── public/
│   └── content/
│       ├── blog/
│       │   └── kubernetes-best-practices.md  ← Source markdown
│       ├── learn/
│       └── ops/
├── dist/  (generated after build)
│   ├── blog/
│   │   └── kubernetes-best-practices/
│   │       └── index.html  ← Pre-rendered HTML
│   ├── learn/
│   └── ops/
└── scripts/
    └── prerender.js  ← Build-time conversion script
```

## Vercel Configuration

The `vercel.json` file tells Vercel:

1. **Routes to serve pre-rendered HTML**:
   ```json
   {
     "source": "/blog/:slug",
     "destination": "/blog/:slug/index.html"
   }
   ```

2. **Static files** (content, images, assets) are served directly

3. **React app** (`index.html`) is served for other routes

## Benefits

✅ **SEO**: Google sees fully rendered HTML  
✅ **Performance**: No client-side markdown parsing in production  
✅ **Simplicity**: Keep markdown files, convert at build time  
✅ **Flexibility**: Works in dev (markdown) and production (HTML)

## Workflow

1. **Edit markdown files** in `public/content/`
2. **Test locally**: `npm run dev` (uses markdown)
3. **Test pre-rendered**: `npm run dev:html` (uses HTML)
4. **Deploy**: Push to Vercel → Auto-builds and pre-renders
5. **Google crawls**: Gets fully rendered HTML ✅

