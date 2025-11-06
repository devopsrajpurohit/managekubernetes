# Testing Canonical URLs Locally

## Quick Test Steps

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open the site in your browser:**
   - Go to `http://localhost:5173/learn/core-components`
   - Or any other page like `/blog/troubleshooting-pods-evicted`

3. **Check the canonical URL in browser console:**
   Open browser DevTools (F12) and run:
   ```javascript
   const canonical = document.querySelector('link[rel="canonical"]');
   console.log('Canonical URL:', canonical ? canonical.href : 'Not found');
   console.log('Has www?', canonical ? canonical.href.includes('://www.') : 'N/A');
   ```

4. **Or use this one-liner:**
   ```javascript
   console.log(document.querySelector('link[rel="canonical"]')?.href || 'Not found');
   ```

## Test with Preview (Pre-rendered HTML)

1. **Build and preview:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Navigate to a page:**
   - `http://localhost:5173/learn/core-components`
   - Check the page source (View Source) to see the pre-rendered canonical URL

3. **Inspect the HTML:**
   - Right-click → View Page Source
   - Search for `rel="canonical"`
   - Should show: `href="https://www.managekubernetes.com/learn/core-components"`

## Check ALL Pages

**Comprehensive check of all pre-rendered HTML files:**
```bash
npm run check:all-canonical
```

This checks all 23+ pages in your site and shows:
- ✅ Which pages have correct www canonical URLs
- ❌ Which pages are missing www
- ⚠️ Which pages are missing canonical tags
- Full list of all pages with their canonical URLs

## Automated Test Script

Run the test script:
```bash
npm run test:canonical
```

This will test the `getCanonicalUrl()` function with different scenarios.

## Expected Results

All canonical URLs should be:
- ✅ `https://www.managekubernetes.com/...` (with www)
- ❌ NOT `https://managekubernetes.com/...` (without www)

## Debugging

If canonical URL is wrong:

1. **Check browser console for errors**
2. **Verify the immediate script in index.html is running:**
   ```javascript
   // Should see this in console on page load
   console.log('Initial canonical set');
   ```

3. **Check React components are setting it:**
   ```javascript
   // In console after page loads
   const canonical = document.querySelector('link[rel="canonical"]');
   console.log('Final canonical:', canonical.href);
   ```

