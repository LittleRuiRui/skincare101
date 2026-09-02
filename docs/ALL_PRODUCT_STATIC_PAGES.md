# Full public product pages

The static generator exports every identity-bearing row in the existing approved public catalog. There is no ranking, brand limit, 50-product cap or 5,000-row pagination ceiling. Only the already-public view is read; private profiles, routines, unapproved records and database schema are unchanged.

Every product has English `/product/{slug}/` and Chinese `/zh/product/{slug}/` routes, paired reading, reciprocal language alternates and a direct link to its original app ID. The app reads `seo-products.json` for the reverse link. `seo-pilot-products.json` remains a full-coverage compatibility alias for cached clients.

The 50 previously published routes are pinned in `data/product-route-aliases.json`. Newly covered records use a name plus full UUID to distinguish same-name products and market versions. If a published name is later changed, pin the existing URL before the change to avoid breaking links.

Export pagination uses an exact count and unique ID ordering; missing identities, duplicate IDs, changed counts and route collisions fail the build instead of silently dropping rows. Dictionary mappings come from the existing public lookup. No generated efficacy claims or speculative translations are added. A Chinese mapping that is absent or a generic placeholder retains the original ingredient name.

Products with no ingredient entries are still accessible from both directories and the app, but have `noindex,follow` and are excluded from the sitemap. Once a subsequent deployment sees ingredients, those flags update automatically. Partial lists stay explicitly labelled; presence of ingredients is not clinical verification or assurance of search-engine acceptance.

The directory includes brand jump links in each language. All product language pairs, internal URLs, app IDs, old routes and sitemap/noindex consistency are checked by `npm run test:seo`. Run the normal app checks and production build before deploying via the existing GitHub Pages workflow. Do not commit unrelated files mutated by the legacy concern-expansion step.

Initial full build: 1,892 products, 3,784 language pages, 152 brand labels; 124 products without ingredients and 28 partial-list labels. These figures are a build snapshot, not permanent catalog limits. `seo-product-coverage.json` records the current export counts. No claim is made that all formulas were individually reviewed or that Google has indexed the pages.
