import assert from "node:assert/strict";
import test from "node:test";

import { rankProductsForProfile, scoreProductForProfile } from "../src/intelligence/profileProductRanking.ts";

const profile = {
  id: "p1",
  name: "Test",
  isActive: true,
  skinAnswers: { wash: "combo", oil: "oily", sensitive: "yes" },
  profileAnswers: {},
  selectedSymptoms: ["redness", "acne", "pores", "pigmentation"],
  symptomAnswers: {},
  multiSelectAnswers: {},
  redFlag: null,
};

const product = (id: string, ingredients: string[], completeness = 100) => ({
  id,
  brand: "Example",
  name: id,
  category: "serum",
  ingredients,
  ingredientListType: "full" as const,
  dataCompleteness: completeness,
  sourceUrl: "https://example.com",
  verifiedAt: "2026-08-28",
  source: "shared" as const,
}) as any;

test("weighted ranking rewards products covering multiple selected concerns", () => {
  const broad = scoreProductForProfile(product("broad", ["Water", "Niacinamide", "Azelaic Acid", "Panthenol", "Zinc PCA", "Glycerin"]), profile as any);
  const narrow = scoreProductForProfile(product("narrow", ["Water", "Panthenol", "Allantoin", "Glycerin"]), profile as any);
  assert.ok(broad.coveredConcerns.length >= narrow.coveredConcerns.length);
  assert.ok(broad.score >= narrow.score);
});

test("data completeness contributes but does not become the personalized score", () => {
  const full = scoreProductForProfile(product("full", ["Water", "Niacinamide", "Panthenol", "Glycerin"], 100), profile as any);
  const partial = scoreProductForProfile(product("partial", ["Water", "Niacinamide", "Panthenol", "Glycerin"], 65), profile as any);
  assert.ok(full.score > partial.score);
  assert.ok(full.score - partial.score < 10);
});

test("sensitive profile penalizes high-position volatile alcohol", () => {
  const gentle = scoreProductForProfile(product("gentle", ["Water", "Glycerin", "Panthenol", "Niacinamide", "Allantoin"]), profile as any);
  const alcohol = scoreProductForProfile(product("alcohol", ["Water", "Alcohol Denat.", "Niacinamide", "Panthenol", "Glycerin"]), profile as any);
  assert.ok(gentle.sensitivityScore > alcohol.sensitivityScore);
  assert.ok(gentle.score > alcohol.score);
});

test("pregnancy hard override removes retinoid products before ranking", () => {
  const pregnancy = { ...profile, profileAnswers: { pregnancy: "yes" } };
  const retinoid = product("retinoid", ["Water", "Glycerin", "Retinol", "Niacinamide"]);
  const nonRetinoid = product("azelaic", ["Water", "Glycerin", "Azelaic Acid", "Niacinamide"]);
  const scored = scoreProductForProfile(retinoid, pregnancy as any);
  assert.equal(scored.excludedBySafety, true);
  const ranked = rankProductsForProfile([retinoid, nonRetinoid], pregnancy as any);
  assert.equal(ranked.some(item => item.product.id === "retinoid"), false);
  assert.equal(ranked.some(item => item.product.id === "azelaic"), true);
});

test("ranking is deterministic for identical input", () => {
  const products = [
    product("a", ["Water", "Niacinamide", "Panthenol", "Glycerin"]),
    product("b", ["Water", "Azelaic Acid", "Zinc PCA", "Glycerin"]),
    product("c", ["Water", "Tranexamic Acid", "Niacinamide", "Glycerin"]),
  ];
  const first = rankProductsForProfile(products, profile as any).map(item => [item.product.id, item.score]);
  const second = rankProductsForProfile(products, profile as any).map(item => [item.product.id, item.score]);
  assert.deepEqual(first, second);
});
