# Skincare101 V3 Site Architecture

## Product principle
Skin Profile is the shared context for every downstream decision.

`Analyze Skin -> Skin Profile -> Goals -> Routine -> Product Match -> Formula Explanation -> Feedback`

## Primary navigation
- For You
- My Skin
- Build My Routine
- Explore
- Luxury Edit
- Niche Finds

## Core screens

### Home / For You
First-time users see `Build your Skin Profile` as the primary CTA. Returning users see their profile snapshot, routine and personalized product recommendations.

### My Skin
Persistent profile containing skin type, sensitivity, concerns, climate, preferences, active ingredients and goals. Existing diagnosis/report data should feed this screen rather than living as a disconnected report.

### Find My Products
Two modes:
1. Profile-led: automatically use the saved Skin Profile.
2. Goal-led: user chooses concern, budget, texture and ingredient preferences; Skin Profile remains a safety/compatibility constraint.

### Build My Routine
Use expert routine templates, then fill each AM/PM slot from the product catalogue. Do not generate arbitrary routines from scratch.

### Explore
Facets: For You, Brand, Skin Type, Concern, Category, Luxury, Trending, Niche Finds.
Filters: brand, category, skin type, concern, formula flags, price tier and Singapore availability.
Default personalized sort: Best for Me.

### Product Detail
Answer five questions: what is it, what does it target, who is it for, who may not like it, and does it fit this user. Separate formula-data confidence from personal match. Do not present data completeness as product quality.

## Score model
- Formula Data Confidence: VERIFIED_OFFICIAL_FULL / VERIFIED_RETAILER_FULL / THIRD_PARTY_FULL / PARTIAL / UNAVAILABLE
- Match For You: personalized suitability only
- Formula Profile: hydration, barrier, brightening, acne care, anti-aging, irritation risk

## Editorial collections
### Luxury Edit
High-traffic prestige and luxury skincare. Explain what the premium formula/texture/technology is actually buying.

### Niche Finds
Curated only. A niche brand needs a reason to exist here: unusual formula, technology, strong philosophy, cult following, regional relevance, sensitive-skin specialization or exceptional value.

## Visual direction
Editorial skincare x hand-drawn science. Warm paper background, serif editorial headlines, black-ink doodles, muted sage/rose accents, scientific annotations. Avoid generic SaaS dashboard styling.

## Implementation order
1. Connected V3 home shell
2. Persistent My Skin profile adapter around existing diagnosis state
3. Explore filters and brand/concern/category facets
4. Profile-aware recommendation adapter
5. Routine template engine
6. Product detail redesign and scoring-label cleanup
7. Authentication/persistence/history
8. Final visual polish
