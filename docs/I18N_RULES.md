# Skincare101 i18n rules

The UI is single-language at runtime. The language switch changes the whole interface, not just headings.

1. Never render Chinese and English together as UI copy (for example `中文 · English`). Use `useLanguage().t(zh, en)` instead.
2. Product/brand official names and INCI may remain in their official language. Generic UI labels, explanations, status text, buttons, placeholders and help copy must follow the selected locale.
3. Never render `product.category` directly. Use `displayCategory(product.category, language)`.
4. Routine step labels must use `displayRoutineStep`; goals use `displayGoal`; skin labels use `displaySkinLabel`.
5. Dynamic decision copy must store paired `...Zh` / `...En` fields or use a localized presenter. Do not concatenate both versions for display.
6. New UI components containing Chinese copy must use `useLanguage`, `t`, or a display localization helper.
7. `LanguageConsistencyGuard` is a safety net for legacy pages only. New features must be localized at the component/data-presentation layer rather than relying on DOM rewriting.
8. Run `npm run audit:i18n` before merge. CI runs the same audit and blocks new mixed-language UI patterns.

Definition of done: in EN mode, no Chinese UI text should appear except official product/brand names or user-entered content; in 中文 mode, no translatable English UI copy should appear except official names, INCI, AM/PM, SPF and other intentionally universal terms.
