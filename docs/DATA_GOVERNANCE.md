# Skincare101 data governance

This is the write contract for new catalog data. The database is the final enforcement layer; UI deduplication is only a safety net.

## 1. Canonical product rule

One real product should have one canonical product record. English name, local-language name, Chinese display name, nicknames and search aliases belong to that record rather than separate product rows.

`products.canonical_key` is generated from canonical brand + English product name + market. Exact collisions are marked `data_status=duplicate` and linked through `canonical_product_id`. Same local-language name with a different English name is a QA candidate, not an automatic merge, because genuinely different products can share a loose Chinese translation.

## 2. Brand profile rule

Every brand entering `products` automatically gets a `brand_profiles` row. New brand profiles start as `pending`. A brand is not considered complete until country/region, segment, bilingual description/positioning, known-for, best-for, price tier and a reliable source have been reviewed.

## 3. Required product fields

New production products should have: canonical brand, category, market/version, source URL, English name where one exists, local-language name where one exists, source locale, formula completeness state and provenance. Missing category/source moves the record to `review` rather than silently presenting it as clean data.

## 4. Formula version rule

Do not overwrite a materially different INCI list simply because the product name is unchanged. Keep formula versions in `product_formulas`, preserve market/version/source/verified date, and use `version_label`, `version_status` and `reformulated_from`. Multiple current formulas or multiple markets appear in the admin version-conflict queue for review.

## 5. Localization rule

Chinese UI renders Chinese copy; English UI renders English copy. Product/brand official names, INCI and AM/PM may remain language-neutral. New UI must use `useLanguage()/t()` or display helpers. The deploy workflow runs `npm run audit:i18n` and blocks new mixed-language UI debt.

## 6. QA dashboard

The admin console is opened with `?admin=1`. It is protected by `admin_users` and RLS. It shows product/brand counts, brand profile gaps, duplicate candidates, missing names/sources, product-data reports, user experiences and account support. Admin-only auth actions are implemented in the `admin-console` Edge Function.

## 7. Account-support rule

Admins never see user passwords and do not directly assign a replacement password. The admin console can send the user a Supabase password-recovery email. The recovery link opens a secure in-app screen where the user chooses the new password.

## Release gate

Do not treat a successful frontend render as data QA. Before catalog expansion is considered clean, review the admin queues for: duplicate/local-name collisions, missing brand profiles, missing source, localized-name gaps, formula-version conflicts and open user reports.