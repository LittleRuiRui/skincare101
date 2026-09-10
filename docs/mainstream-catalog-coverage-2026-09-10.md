# Mainstream Singapore catalog coverage checkpoint — 2026-09-10

This checkpoint separates a verified official snapshot from an estimate of a
brand's whole range. Counts do not include gift sets, travel sizes, refills,
shade or capacity variants, body care, hair care, fragrance, or duplicate
formulas.

## Coverage table

| Brand / source | Official SG snapshot | In-scope formula-distinct products | Already represented before this run | Added | Deferred for missing/unavailable full INCI | Snapshot coverage after run |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Sisley Singapore face care | 83 listed | 68 | 27 exact snapshot matches | 10 | 2 | 37/68 (54.4%) |
| Chanel Singapore skincare snapshot | 70 | 70 | 70 | 0 | 0 | 70/70 (100%) |
| Dior Singapore skincare snapshot | 47 | 47 | 47 | 0 | 0 | 47/47 (100%) |
| Avène official snapshot | 47 | 47 | 47 | 0 | 0 | 47/47 (100%) |
| Bioderma official snapshot | 32 | 32 | 32 | 0 | 0 | 32/32 (100%) |
| CeraVe official snapshot | 10 | 10 | 10 | 0 | 0 | 10/10 (100%) |
| Cetaphil official snapshot | 18 | 18 | 18 | 0 | 0 | 18/18 (100%) |
| La Roche-Posay official snapshot | 22 | 22 | 22 | 0 | 0 | 22/22 (100%) |

The older brand snapshots above were generated on 2026-08-25 and show that
every product in those files is represented. They are not a claim that the
brands' live Singapore sites have no newer or reformulated products. Sisley's
snapshot was rebuilt from the live Singapore face-care listing on 2026-09-10.

## Sisley category check

The live snapshot is classified into the nine operational review lanes:
cleanser, makeup remover, toner/mist, serum/oil, lotion/cream, eye care,
mask, sunscreen, and exfoliant/targeted treatment. The ten additions prioritize
the Black Rose flagship line, eye care, a practical makeup remover, a mask, and
three official Singapore sunscreen pages. SPF values are stored as product-name
facts from those regional pages; no independent efficacy claim is inferred.

Two pages were deferred rather than guessed: Ginkgo Gua Sha did not expose a
complete INCI and Sisleyum for Men returned an upstream server error during the
verified fetch. Four additional URLs collapsed as duplicate names or identical
formulas. `data/sisley_official_catalog.json` retains the exact official URLs,
full published INCI lists, exclusions, and fetch errors for the next comparison.

## Database and publishing checkpoint

The approved public catalog contains 1,969 products after this batch. Sisley has
44 public entries in total; 37 match this current formula-distinct snapshot and
the remainder are older or differently scoped catalog entries. The ten newly
imported official-Singapore records all have a full ingredient list and 100%
source completeness. Static bilingual
page counts and sitemap totals are generated from the approved catalog during
the deployment build, not hard-coded in this report.
