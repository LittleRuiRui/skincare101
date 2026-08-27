import type { SharedProductRecord } from "./supabase";
import type { AppLanguage } from "./i18n";

const clean = (value?: string | null) => (value || "").trim();
const distinct = (a?: string | null, b?: string | null) => {
  const left = clean(a), right = clean(b);
  return left && right && left.toLocaleLowerCase() !== right.toLocaleLowerCase();
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
