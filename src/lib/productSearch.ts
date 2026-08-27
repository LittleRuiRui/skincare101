import type { SharedProductRecord } from "./supabase";
import { consumerAliases } from "./productNames";

export function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/sk[\s-]?ii/g, "sk2")
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const compact = (value: string) => normalizeSearchText(value).replace(/\s+/g, "");
const fields = (product: SharedProductRecord) => [
  product.brand,
  product.name,
  product.brandLocalName,
  product.brandEnglishName,
  product.productLocalName,
  product.productEnglishName,
  ...consumerAliases(product),
].filter(Boolean) as string[];

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = old;
    }
  }
  return prev[b.length];
}

function tokenScore(queryToken: string, fieldToken: string): number {
  if (queryToken === fieldToken) return 12;
  if (fieldToken.startsWith(queryToken) || queryToken.startsWith(fieldToken)) return 9;
  if (fieldToken.includes(queryToken) || queryToken.includes(fieldToken)) return 7;
  if (queryToken.length >= 4 && fieldToken.length >= 4 && editDistance(queryToken, fieldToken) <= 1) return 5;
  return 0;
}

export function productSearchScore(product: SharedProductRecord, query: string): number {
  const q = normalizeSearchText(query);
  if (!q) return 0;
  const qCompact = compact(q);
  const searchableFields = fields(product);
  let score = 0;
  for (const raw of searchableFields) {
    const field = normalizeSearchText(raw);
    const fieldCompact = compact(raw);
    if (!field) continue;
    if (field === q) score = Math.max(score, 100);
    else if (fieldCompact === qCompact) score = Math.max(score, 96);
    else if (field.startsWith(q)) score = Math.max(score, 82);
    else if (field.includes(q)) score = Math.max(score, 74);
    else if (fieldCompact.includes(qCompact) && qCompact.length >= 3) score = Math.max(score, 70);
  }
  const allTokens = normalizeSearchText(searchableFields.join(" ")).split(" ").filter(Boolean);
  const queryTokens = q.split(" ").filter(Boolean);
  if (queryTokens.length) {
    let tokenTotal = 0;
    let matched = 0;
    for (const qt of queryTokens) {
      const best = allTokens.reduce((m, ft) => Math.max(m, tokenScore(qt, ft)), 0);
      if (best > 0) matched += 1;
      tokenTotal += best;
    }
    if (matched === queryTokens.length) score = Math.max(score, 45 + tokenTotal);
    else if (matched > 0) score = Math.max(score, 18 + tokenTotal);
  }
  return score;
}

export function rankProductMatches(products: SharedProductRecord[], query: string, limit = 20): SharedProductRecord[] {
  const q = normalizeSearchText(query);
  if (!q) return [];
  return products
    .map(product => ({ product, score: productSearchScore(product, q) }))
    .filter(item => item.score >= 22)
    .sort((a, b) => b.score - a.score || (b.product.dataCompleteness || 0) - (a.product.dataCompleteness || 0) || `${a.product.brand} ${a.product.name}`.localeCompare(`${b.product.brand} ${b.product.name}`))
    .slice(0, limit)
    .map(item => item.product);
}
