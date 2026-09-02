# Peacedskin journal

This batch adds 12 Chinese-language articles and complete English translations without replacing the existing
four short knowledge cards (the homepage initially displays two).

## Editing and build

- Article source: `data/blog-articles.mjs`.
- English source: `data/blog-articles-en.mjs`; section, paragraph and table shapes must align.
- Renderer: `scripts/generate-blog.mjs`, run at the end of `npm run build`.
- Output: `/blog/` and `/en/blog/`, each with a static route per article. Reading either language requires no account or JavaScript. The optional comparison button progressively fetches the other version and pairs text; failure preserves the readable page and ordinary language links.
- Product directory: `/products/` (Chinese), `/en/products/` (English). Existing English product URLs are preserved; Chinese versions use `/zh/product/{slug}/`. All language pairs are self-canonical with reciprocal hreflang links, and all are in the sitemap.
- Static product facts use the same approved catalog and public ingredient dictionary as the app. Do not invent translations for unmatched INCI names.
- App product details look up the published manifest by product ID before linking to a matching static page. Products outside the 50-product pilot link to the directory instead. The app resolves both raw catalog IDs and shared-prefixed IDs, including old static links and browser history.
- Existing main-branch GitHub Pages workflow remains the publisher; no host migration.
- Run `npm run test:seo` after a build. It checks metadata, images, references,
  sitemap membership, internal links, source disclosures and article counts.
- Never substitute build time for publication dates. Change modified dates only
  when there has been a substantive editorial update (the current first edition
  uses the same publication and modification date).

## Evidence and editorial boundaries

Sections cite the specific supporting source. Original shopping checklists and
scenario-based suggestions are identified as editorial guidance, not clinical
protocols. Source review is dated 2026-09-02. Product comparison uses Singapore
brand pages and does not treat separate brand studies as head-to-head evidence.
There are no invented clinical reviewers, testimonials, sponsorships or personal
product tests. Each article discloses AI assistance and medical limits.

No ranking, indexing or AI-citation outcome is promised. Review Search Console
after publication before expanding content just for page count. Product links
are validated against this build; if catalog pilot selection changes, repair
the links before publishing rather than disabling the check.

## Illustration provenance

Three original built-in imagegen illustrations were generated and inspected for
this batch, then converted to WebP at original 1536 x 1024 dimensions for page
weight. They are thematic illustrations reused across relevant articles, not
product photos, medical diagrams or before/after claims. Originals were not
edited. Website assets live under `public/illustrations/blog/`.

Prompt direction: peaceful, refined editorial green-ink and watercolor on ivory
paper, mustard accents, wide 3:2 composition, no text or brands. Subjects:

1. Singapore's humid outdoor city and an air-conditioned room, an adult Asian
   woman at a window using a generic moisturizer.
2. A still life of three unbranded basic skincare containers, towel and sunlight.
3. An adult Asian woman thoughtfully comparing two unbranded skincare bottles
   at a dressing table with a magnifying-mirror motif.

Do not label these assets as real products, expert demonstrations or user photos.
