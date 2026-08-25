import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { rankProducts } from "../src/intelligence/productScoring.ts";

const payload = JSON.parse(readFileSync(new URL("../data/pilot_products.json", import.meta.url), "utf8"));
const products = payload.products;
const enrichments = JSON.parse(
  readFileSync(new URL("../data/pilot_formula_enrichments.json", import.meta.url), "utf8"),
);

test("pilot catalog has exactly 300 unique, sourced products", () => {
  assert.equal(products.length, 300);
  assert.equal(new Set(products.map((product: any) => product.sourceProductCode)).size, 300);
  assert.equal(
    new Set(products.map((product: any) => `${product.brand}|${product.name}`.toLowerCase())).size,
    300,
  );
  assert.ok(products.every((product: any) => /^https:\/\//.test(product.sourceUrl)));
});

test("first enrichment batch contains 50 sourced top-15 formulas", () => {
  assert.equal(enrichments.products.length, 50);
  const pilotCodes = new Set(products.map((product: any) => product.sourceProductCode));
  const codes = new Set<string>();

  enrichments.products.forEach((product: any) => {
    assert.ok(pilotCodes.has(product.sourceProductCode));
    assert.match(product.sourceUrl, /^https:\/\//);
    const ingredients = product.rawIngredients
      .split(";")
      .map((value: string) => value.trim())
      .filter(Boolean);
    assert.ok(ingredients.length >= 4 && ingredients.length <= 15);
    codes.add(product.sourceProductCode);
  });

  assert.equal(codes.size, 50);
});

test("pilot covers the expected skincare categories and formula-quality split", () => {
  const categories = new Set(products.map((product: any) => product.category));
  for (const category of ["洁面", "化妆水", "精华", "乳霜", "防晒", "焕肤", "祛痘", "面膜", "眼部"]) {
    assert.ok(categories.has(category), `missing category: ${category}`);
  }
  assert.equal(products.filter((product: any) => product.popularityTier === "retailer-bestseller").length, 99);
  assert.equal(products.filter((product: any) => product.popularityTier === "multi-source-popular").length, 1);
  assert.ok(products.filter((product: any) => product.dataCompleteness >= 60).length >= 195);
  assert.equal(products.filter((product: any) => product.qualityFlags.includes("formula_pending_verification")).length, 99);
});

test("missing-formula bestsellers cannot displace evidence-backed recommendations", () => {
  const ranked = rankProducts(products, {
    good: [
      { name: "甘油 (Glycerin)" },
      { name: "神经酰胺 (Ceramide NP)" },
      { name: "角鲨烷 (Squalane)" },
      { name: "泛醇/泛醌三乙酸酯 (Panthenol)" },
    ],
    risky: [
      { name: "变性酒精 (Alcohol/Alcohol Denat.,高浓度)" },
      { name: "香精 (Parfum/Fragrance)" },
    ],
    targetSystems: ["barrier", "hydration", "soothing"],
  });
  const evidenceBacked = ranked.filter((product) => product.recommendationAvailable);
  assert.ok(evidenceBacked.length > 0);
  assert.ok(evidenceBacked.slice(0, 20).every((product) => product.ingredients.length > 0));
  const firstPending = ranked.findIndex((product: any) => product.qualityFlags.includes("formula_pending_verification"));
  const lastAvailable = ranked.map((product) => product.recommendationAvailable).lastIndexOf(true);
  assert.ok(firstPending > lastAvailable);
});
