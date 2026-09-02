# Peacedskin journal

This batch adds 12 Chinese-language articles without replacing the existing
four short knowledge cards (the homepage initially displays two).

## Editing and build

- Article source: `data/blog-articles.mjs`.
- Renderer: `scripts/generate-blog.mjs`, run at the end of `npm run build`.
- Output: `/blog/` plus a static route per article. No account or JavaScript required.
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
