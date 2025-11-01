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

## Image placeholders
- Replace hero: `public/images/hero.svg` (you can drop a PNG/JPG here and keep the same filename).
- If you add screenshots for cards, put them in `public/images/` and reference them from components.

## Edit the landing
- File: `src/pages/Landing.jsx`
- Discord: change `YOUR_SERVER_ID` (or define `window.__DISCORD_SERVER_ID__` in `index.html`).
