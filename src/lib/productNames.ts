import type { SharedProductRecord } from "./supabase";
import type { AppLanguage } from "./i18n";

const clean = (value?: string | null) => (value || "").trim();
const normalizeText = (value?: string | null) => clean(value)
  .normalize("NFKC")
  .toLocaleLowerCase()
  .replace(/[®™]/g, "")
  .replace(/[\s\-–—_·•:：'’“”"()（）/\\]+/g, " ")
  .replace(/[^\p{L}\p{N}\s]+/gu, "")
  .replace(/\s+/g, " ")
  .trim();
const distinct = (a?: string | null, b?: string | null) => {
  const left = normalizeText(a), right = normalizeText(b);
  return Boolean(left && right && left !== right);
};
const normalizedIdentity = (product: SharedProductRecord) => `${product.brand} ${product.name} ${product.productEnglishName || ""} ${product.productLocalName || ""}`.toLocaleLowerCase();

const VERIFIED_ALIAS_RULES: Array<{ test: (identity: string) => boolean; aliases: string[] }> = [
  { test: x => /sk[- ]?ii/.test(x) && /facial treatment essence/.test(x), aliases: ["神仙水"] },
  { test: x => /shiseido|资生堂/.test(x) && /ultimune/.test(x), aliases: ["红腰子"] },
  { test: x => /est[eé]e lauder|雅诗兰黛/.test(x) && /advanced night repair/.test(x), aliases: ["小棕瓶"] },
  { test: x => /chanel|香奈儿/.test(x) && /sublimage/.test(x) && /(eye|yeux|眼)/.test(x), aliases: ["黑金眼霜"] },
  { test: x => /dior|迪奥/.test(x) && /prestige/.test(x) && /(lotion|essence|water|化妆水|精华水)/.test(x), aliases: ["花蜜水"] },
];

export function consumerAliases(product: SharedProductRecord): string[] {
  const explicit = product.searchAliases || [];
  const identity = normalizedIdentity(product);
  const inferred = VERIFIED_ALIAS_RULES.flatMap(rule => rule.test(identity) ? rule.aliases : []);
  return Array.from(new Set([...explicit, ...inferred].map(clean).filter(Boolean)));
}

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
    ...consumerAliases(product),
  ].filter(Boolean).join(" ").toLocaleLowerCase();
}

function brandIdentity(product: SharedProductRecord) {
  return normalizeText(product.brandEnglishName || product.brand || product.brandLocalName);
}

function productIdentityAliases(product: SharedProductRecord) {
  const values = [product.name, product.productLocalName, product.productEnglishName]
    .map(normalizeText)
    .filter(Boolean);
  return Array.from(new Set(values));
}

function richness(product: SharedProductRecord) {
  return (product.dataCompleteness || 0)
    + (product.ingredientListType === "full" ? 20 : 0)
    + (product.productLocalName ? 6 : 0)
    + (product.productEnglishName ? 6 : 0)
    + (product.brandLocalName ? 2 : 0)
    + (product.brandEnglishName ? 2 : 0)
    + Math.min(product.ingredients?.length || 0, 30) / 10;
}

function mergeStringArrays(a?: string[], b?: string[]) {
  return Array.from(new Set([...(a || []), ...(b || [])].map(clean).filter(Boolean)));
}

function mergeProducts(a: SharedProductRecord, b: SharedProductRecord): SharedProductRecord {
  const primary = richness(b) > richness(a) ? b : a;
  const secondary = primary === a ? b : a;
  const choose = <T,>(first: T | undefined | null, second: T | undefined | null) => first ?? second ?? undefined;
  const localName = clean(primary.productLocalName) || clean(secondary.productLocalName) || undefined;
  const englishName = clean(primary.productEnglishName) || clean(secondary.productEnglishName) || undefined;
  const ingredients = (primary.ingredients?.length || 0) >= (secondary.ingredients?.length || 0)
    ? primary.ingredients
    : secondary.ingredients;
  return {
    ...secondary,
    ...primary,
    brandLocalName: clean(primary.brandLocalName) || clean(secondary.brandLocalName) || undefined,
    brandEnglishName: clean(primary.brandEnglishName) || clean(secondary.brandEnglishName) || undefined,
    productLocalName: localName,
    productEnglishName: englishName,
    searchAliases: mergeStringArrays(primary.searchAliases, secondary.searchAliases),
    productFunctions: mergeStringArrays(primary.productFunctions, secondary.productFunctions),
    ingredients,
    ingredientListType: primary.ingredientListType === "full" || secondary.ingredientListType === "full" ? "full" : "partial",
    dataCompleteness: Math.max(primary.dataCompleteness || 0, secondary.dataCompleteness || 0),
    sourceUrl: clean(primary.sourceUrl) || clean(secondary.sourceUrl),
    verifiedAt: clean(primary.verifiedAt) || clean(secondary.verifiedAt),
    formulaSummary: clean(primary.formulaSummary) || clean(secondary.formulaSummary) || undefined,
    formulaVerdict: clean(primary.formulaVerdict) || clean(secondary.formulaVerdict) || undefined,
    formulaBestFor: mergeStringArrays(primary.formulaBestFor, secondary.formulaBestFor),
    formulaAlsoWorksFor: mergeStringArrays(primary.formulaAlsoWorksFor, secondary.formulaAlsoWorksFor),
    formulaLessIdealFor: mergeStringArrays(primary.formulaLessIdealFor, secondary.formulaLessIdealFor),
    formulaCaveats: mergeStringArrays(primary.formulaCaveats, secondary.formulaCaveats),
    popularitySources: mergeStringArrays(primary.popularitySources, secondary.popularitySources),
    qualityFlags: mergeStringArrays(primary.qualityFlags, secondary.qualityFlags),
    editorial: choose(primary.editorial, secondary.editorial),
  };
}

/**
 * Collapse duplicate catalog rows that represent the same product in different
 * languages or were inserted twice. Two rows are considered the same only when
 * the normalized brand matches and at least one normalized product-name variant
 * (canonical name, local name or English name) matches exactly.
 */
export function dedupeProductCatalog(products: SharedProductRecord[]): SharedProductRecord[] {
  const merged: SharedProductRecord[] = [];
  const aliasToIndex = new Map<string, number>();

  for (const product of products) {
    const brand = brandIdentity(product);
    const aliases = productIdentityAliases(product);
    if (!brand || !aliases.length) {
      merged.push(product);
      continue;
    }

    const keys = aliases.map(alias => `${brand}::${alias}`);
    const matchedIndexes = Array.from(new Set(keys.map(key => aliasToIndex.get(key)).filter((value): value is number => value !== undefined)));

    if (!matchedIndexes.length) {
      const index = merged.length;
      merged.push(product);
      keys.forEach(key => aliasToIndex.set(key, index));
      continue;
    }

    const targetIndex = matchedIndexes[0];
    let combined = mergeProducts(merged[targetIndex], product);
    for (const extraIndex of matchedIndexes.slice(1)) {
      if (extraIndex === targetIndex || !merged[extraIndex]) continue;
      combined = mergeProducts(combined, merged[extraIndex]);
      merged[extraIndex] = null as unknown as SharedProductRecord;
    }
    merged[targetIndex] = combined;
    productIdentityAliases(combined).forEach(alias => aliasToIndex.set(`${brand}::${alias}`, targetIndex));
    keys.forEach(key => aliasToIndex.set(key, targetIndex));
  }

  return merged.filter(Boolean);
}
