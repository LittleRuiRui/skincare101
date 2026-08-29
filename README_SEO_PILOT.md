# PEACED SKIN SEO + AI discovery pilot

This pilot keeps the existing React/Vite + Supabase architecture and adds build-time static public product pages.

## Build flow

`npm run build` now runs:

1. `vite build`
2. `scripts/generate-seo-product-pages.mjs`
3. Fetches the public `approved_product_catalog` from Supabase
4. Scores approved products by brand recognition, iconic-product keywords, formula completeness and verification status
5. Selects up to 50 products with a maximum of 3 per brand
6. Generates `/product/<brand-product-slug>/index.html`
7. Generates `/sitemap.xml`
8. Generates `/seo-pilot-products.json` for QA

## Static vs dynamic

Static pages contain only public product facts: brand, product name, category, market, indexed ingredients, completeness and verification context. Login state, Favorites, Watchlist, Tried, routines, reviews and other user-specific features remain in the React/Supabase app.

## AI/search discovery

The pages include canonical URLs, meta descriptions, Open Graph metadata, Product JSON-LD, visible FAQ-style explanations and FAQPage JSON-LD. `robots.txt` and `llms.txt` describe public crawlability and data semantics.

The implementation does not claim guaranteed ranking or citation by Google, ChatGPT, Claude, Doubao, Kimi or DeepSeek. The goal is standards-based discoverability and machine-readable evidence.

## Configuration

- `SEO_PRODUCT_LIMIT` controls pilot size (default `50`).
- `SITE_URL` controls canonical origin (default `https://peacedskin.com`).
- Supabase URL/key can come from existing Supabase/Vite environment variables; public project defaults match the existing catalog export script.

## QA before merge

Check the generated `dist/seo-pilot-products.json`, inspect several generated product pages, confirm `dist/sitemap.xml`, and verify the Cloudflare preview build before merging to `main`.
