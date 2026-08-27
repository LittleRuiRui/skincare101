import type { SharedProductRecord } from "./supabase";
import type { AppLanguage } from "./i18n";

const clean = (value?: string | null) => (value || "").trim();
const distinct = (a?: string | null, b?: string | null) => {
  const left = clean(a), right = clean(b);
  return left && right && left.toLocaleLowerCase() !== right.toLocaleLowerCase();
};

export function brandNames(product: SharedProductRecord, language: AppLanguage) {
  const english = clean(product.brandEnglishName) || clean(product.brand);
  const local = clean(product.brandLocalName);
  const primary = language === "en" ? english : (local || english);
  const secondary = language === "en"
    ? (distinct(local, english) ? local : "")
    : (distinct(english, local || english) ? english : "");
  return { primary, secondary, english, local };
}

export function productNames(product: SharedProductRecord, language: AppLanguage) {
  const english = clean(product.productEnglishName) || clean(product.name);
  const local = clean(product.productLocalName);
  const primary = language === "en" ? english : (local || english);
  const secondary = language === "en"
    ? (distinct(local, english) ? local : "")
    : (distinct(english, local || english) ? english : "");
  return { primary, secondary, english, local };
}

export function bilingualBrandLine(product: SharedProductRecord, language: AppLanguage) {
  const names = brandNames(product, language);
  return names.secondary ? `${names.primary} · ${names.secondary}` : names.primary;
}

export function productSearchText(product: SharedProductRecord) {
  return [
    product.brand,
    product.name,
    product.brandLocalName,
    product.brandEnglishName,
    product.productLocalName,
    product.productEnglishName,
  ].filter(Boolean).join(" ").toLocaleLowerCase();
}
