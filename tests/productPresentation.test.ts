import assert from "node:assert/strict";
import test from "node:test";

import { analyzeFormulaDna } from "../src/intelligence/formulaDna.ts";
import { approximatePriceGuide, getBrandProfile } from "../src/data/brandProfiles.ts";
import { formulaDataLabel, personalizedScore } from "../src/lib/productPresentation.ts";

const baseProduct = {
  id: "shared-1",
  brand: "Example",
  name: "Barrier Cream",
  category: "乳霜",
  ingredients: ["Water", "Glycerin", "Ceramide NP", "Cholesterol", "Panthenol", "Squalane", "Dimethicone", "Phenoxyethanol"],
  ingredientListType: "full" as const,
  dataCompleteness: 100,
  sourceUrl: "https://example.com",
  verifiedAt: "2026-08-26",
  source: "shared" as const,
};

test("keeps formula data quality separate from personalized match", () => {
  assert.equal(formulaDataLabel(baseProduct).label, "完整配方已核验");
  const match = personalizedScore(baseProduct, {
    skinAnswers: { sensitive: "yes", wash: "dry" },
    profileAnswers: {},
    selectedSymptoms: ["redness"],
    symptomAnswers: {},
    multiSelectAnswers: {},
    redFlag: null,
  });
  assert.ok(match?.recommendationAvailable);
  assert.notEqual(match?.score, baseProduct.dataCompleteness);
});

test("Formula DNA analyzes the top zone while the product may retain a full list", () => {
  const product = { ...baseProduct, ingredients: Array.from({ length: 30 }, (_, index) => index === 0 ? "Water" : index === 1 ? "Glycerin" : `Ingredient ${index + 1}`) };
  const dna = analyzeFormulaDna(product);
  assert.equal(product.ingredients.length, 30);
  assert.equal(dna.topZone.length, 15);
});

test("partial formulas are never described as verified full formulas", () => {
  const status = formulaDataLabel({ ...baseProduct, ingredientListType: "partial" as const, dataCompleteness: 78 });
  assert.equal(status.label, "部分配方");
});

test("price guides are clearly approximate Singapore ranges", () => {
  assert.match(approximatePriceGuide(getBrandProfile("Chanel"), "精华"), /^S\$\d+–\d+/);
  assert.match(approximatePriceGuide(getBrandProfile("CeraVe"), "洁面"), /新加坡常见品牌级预算区间/);
});
