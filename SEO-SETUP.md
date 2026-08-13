# The Summer Lounge — SEO Setup

This version includes on-page SEO, Open Graph metadata, Twitter/X metadata, Restaurant structured data, a favicon, lazy-loaded gallery images, robots.txt and Netlify headers.

## After connecting the final custom domain
1. Replace the placeholder sitemap comment in `robots.txt` with the real sitemap URL.
2. Add a canonical URL and create `sitemap.xml` using the final HTTPS domain.
3. Add the website to Google Search Console and request indexing for the homepage.
4. Claim/verify the restaurant's Google Business Profile and keep the name, address, phone and opening hours identical to the website.

Google uses page titles, headings, visible content and sometimes meta descriptions when generating search results, while structured data can help it understand a business and potentially enable richer search features.


## Google Analytics 4
The production site includes the Google tag for Measurement ID `G-DZS4JCWP9G` and conversion-oriented event tracking. Google recommends placing the tag on every page; this site is a single-page restaurant website, so it is loaded in the document head.

After deployment, open Google Analytics and use **Reports → Realtime** while visiting the site yourself to confirm data collection. Google notes that initial data can take up to about 30 minutes to appear.
