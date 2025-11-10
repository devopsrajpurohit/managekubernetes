# Kubernetes Community – Modern Site

## Run locally
```bash
npm install
npm run dev
```

## Google Analytics Setup

1. Get your Google Analytics Measurement ID from [Google Analytics](https://analytics.google.com/)
2. Create a `.env` file in the root directory:
   ```bash
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
   Or set it in `index.html` by replacing `GA_MEASUREMENT_ID` with your actual ID.

3. The following events are automatically tracked:
   - Page views (including route changes)
   - Card clicks
   - Content views (markdown pages)
   - External link clicks
   - Social shares
   - Link copies

## Canonical URL Generation

The site implements a robust canonical URL system that ensures consistent, SEO-friendly URLs across all pages. Canonical URLs are always normalized to use the `www` subdomain and proper path formatting.

### How Canonical URLs Are Generated

Canonical URLs are generated and updated at multiple layers to ensure they're always correct, even for SEO crawlers that don't execute JavaScript:

#### 1. **Pre-React Script (index.html)**
A script runs immediately when the page loads, before React initializes:

```javascript
// Sets canonical URL based on current pathname
// Normalizes: removes trailing slashes (except root)
// Always uses: https://www.managekubernetes.com
```

**Key Features:**
- Runs before React loads (important for SEO crawlers)
- Normalizes pathnames (removes trailing slashes)
- Always uses `www` subdomain
- Watches for changes and fixes them automatically
- Periodic safety checks every second

#### 2. **React Component Updates**
React components update canonical URLs on route changes:

- **Landing Page** (`src/pages/Landing.jsx`): Sets canonical for homepage
- **Blog Page** (`src/pages/Blog.jsx`): Explicitly sets `https://www.managekubernetes.com/blog`
- **Markdown Pages** (`src/components/MarkdownPage.jsx`): Sets canonical for each blog/learn/ops page
- **PageTracker** (`src/main.jsx`): Updates canonical on every route change

#### 3. **Utility Function (src/utils/urlUtils.js)**
The `getCanonicalUrl()` function is the single source of truth:

```javascript
export function getCanonicalUrl() {
  // Gets current pathname
  // Normalizes: removes trailing slashes (except root)
  // Returns: https://www.managekubernetes.com + pathname
  // Always includes www subdomain
}
```

### Canonical URL Rules

1. **Always Use www Subdomain**
   - Base URL: `https://www.managekubernetes.com`
   - Never uses non-www version
   - Even if accessed via `managekubernetes.com`, canonical uses `www.managekubernetes.com`

2. **Pathname Normalization**
   - Root path (`/`) → `https://www.managekubernetes.com/`
   - Blog path (`/blog`) → `https://www.managekubernetes.com/blog`
   - Trailing slashes removed (except for root)
   - Query parameters and hash fragments removed

3. **Defensive Checks**
   - Multiple verification layers
   - MutationObserver watches for changes
   - Periodic safety checks
   - Console warnings if www is missing

### Examples

| Current URL | Canonical URL |
|-------------|---------------|
| `https://managekubernetes.com/` | `https://www.managekubernetes.com/` |
| `https://managekubernetes.com/blog` | `https://www.managekubernetes.com/blog` |
| `https://www.managekubernetes.com/blog/` | `https://www.managekubernetes.com/blog` |
| `https://managekubernetes.com/learn/what-is-kubernetes` | `https://www.managekubernetes.com/learn/what-is-kubernetes` |
| `https://www.managekubernetes.com/blog?page=2` | `https://www.managekubernetes.com/blog` |

### Implementation Details

**Files Involved:**
- `index.html` - Pre-React script for initial canonical URL
- `src/utils/urlUtils.js` - Core utility function
- `src/main.jsx` - PageTracker component for route changes
- `src/pages/Landing.jsx` - Landing page canonical URL
- `src/pages/Blog.jsx` - Blog page canonical URL (explicitly set)
- `src/components/MarkdownPage.jsx` - Markdown pages canonical URL

**Special Cases:**
- **Blog Page**: Explicitly sets canonical to `/blog` (not using pathname from URL)
- **Homepage**: Uses `/` as canonical URL
- **Markdown Pages**: Uses full pathname (e.g., `/learn/what-is-kubernetes`)

### Why This Matters

1. **SEO**: Search engines use canonical URLs to avoid duplicate content issues
2. **Consistency**: All pages have a single, authoritative URL
3. **Crawler-Friendly**: Works even if JavaScript is disabled
4. **Performance**: Pre-React script sets canonical immediately
5. **Reliability**: Multiple layers ensure canonical URL is always correct

## SEO & Backlink Features

The site includes comprehensive SEO optimizations to improve backlink potential:

### Built-in Features:
- **Article Structured Data** - Each markdown page includes Article schema for rich snippets
- **Social Sharing** - Share buttons (Twitter, LinkedIn, Facebook) on every article
- **Citation Tools** - MLA and APA citation formats provided
- **Internal Linking** - Related articles section on each page
- **Sitemap** - XML sitemap at `/sitemap.xml` for search engines
- **Canonical URLs** - Proper canonical tags for each page (see Canonical URL Generation section above)
- **Open Graph & Twitter Cards** - Enhanced social sharing previews

### Backlink Strategies:
1. **Quality Content** - Comprehensive, well-written guides on Kubernetes
2. **Easy Sharing** - Social share buttons encourage content distribution
3. **Citation Formats** - Academic-style citations make it easy to link
4. **Internal Link Clusters** - Related articles create link authority
5. **Structured Data** - Helps search engines understand and rank content
6. **Sitemap** - Makes it easy for search engines to discover all pages

### Next Steps for Backlinks:
- Submit sitemap to Google Search Console
- Share on Kubernetes community forums and Reddit
- Engage with Kubernetes blogs and link to relevant guides
- Create guest posts linking back to guides
- Share on Twitter, LinkedIn with relevant hashtags
- Submit to Kubernetes resource directories

## Sitemap Configuration

**IMPORTANT:** The sitemap file needs to be configured with your actual domain:

1. Open `public/sitemap.xml`
2. Replace all instances of `https://example.com` with your actual domain
3. Update `public/robots.txt` with your actual domain in the Sitemap line
4. Ensure the sitemap is accessible at `https://yourdomain.com/sitemap.xml`

The sitemap is automatically updated with current dates when you deploy. After updating the domain, verify it's accessible by visiting `/sitemap.xml` in your browser.

**For Production:**
- Verify sitemap is accessible: `https://yourdomain.com/sitemap.xml`
- Submit to Google Search Console: [Search Console Sitemaps](https://search.google.com/search-console)
- Submit to Bing Webmaster Tools: [Bing Webmaster](https://www.bing.com/webmasters)

## Content Optimization

The landing page has been optimized with substantial text content (600+ words) to address "thin content" SEO concerns. Additional content includes:

- Detailed introduction explaining the resource value
- Comprehensive Day-1 learning path description
- In-depth Day-2 operations overview
- Expanded community section
- Rich contextual information throughout

This helps search engines better understand your site's purpose and improves ranking potential.

## Vercel Deployment

This project is configured for easy deployment on Vercel:

### Quick Deploy:
1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in [Vercel](https://vercel.com)
3. Vercel will auto-detect Vite and configure the build settings
4. Add environment variable if using Google Analytics:
   - Go to Project Settings → Environment Variables
   - Add `VITE_GA_MEASUREMENT_ID` with your Google Analytics ID
5. Deploy!

### Vercel Configuration:
- `vercel.json` is included for proper SPA routing
- Sitemap and robots.txt are automatically served from `public/`
- All routes redirect to `index.html` for React Router compatibility

### Post-Deployment:
1. **Verify sitemap**: Visit `https://managekubernetes.com/sitemap.xml`
2. **Submit to search engines**:
   - [Google Search Console](https://search.google.com/search-console) - Add property and submit sitemap
   - [Bing Webmaster Tools](https://www.bing.com/webmasters) - Add site and submit sitemap
3. **Verify robots.txt**: Visit `https://managekubernetes.com/robots.txt`

### Custom Domain:
If you're using a custom domain (`managekubernetes.com`):
- Add domain in Vercel Project Settings → Domains
- DNS records will be provided by Vercel
- SSL certificate is automatically provisioned

## Image placeholders
- Replace hero: `public/images/hero.svg` (you can drop a PNG/JPG here and keep the same filename).
- If you add screenshots for cards, put them in `public/images/` and reference them from components.

## Edit the landing
- File: `src/pages/Landing.jsx`
- Discord: change `YOUR_SERVER_ID` (or define `window.__DISCORD_SERVER_ID__` in `index.html`).
