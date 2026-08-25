import assert from "node:assert/strict";
import test from "node:test";

import { analyzeFormulaDna } from "../src/intelligence/formulaDna.ts";

test("recognizes a barrier formula as a system rather than isolated ingredients", () => {
  const dna = analyzeFormulaDna({
    ingredients: [
      "Aqua",
      "Glycerin",
      "Squalane",
      "Dimethicone",
      "Niacinamide",
      "Ceramide NP",
      "Cholesterol",
      "Linoleic Acid",
      "Panthenol",
      "Phenoxyethanol",
      "Ethylhexylglycerin",
    ],
    ingredientListType: "full",
    dataCompleteness: 100,
    category: "乳霜",
  });

  assert.equal(dna.baseType, "水基配方");
  assert.equal(dna.systems.barrier.score, 5);
  assert.ok(dna.systems.lipid.score >= 4);
  assert.ok(dna.systems.hydration.score >= 2);
  assert.ok(dna.systems.preservation.signals.length >= 2);
  assert.equal(dna.confidence, "high");
});

test("does not confuse fatty alcohols with high volatile alcohol", () => {
  const dna = analyzeFormulaDna({
    ingredients: ["Water", "Glycerin", "Cetearyl Alcohol", "Cetyl Alcohol", "Ceramide NP"],
    ingredientListType: "full",
    dataCompleteness: 95,
  });
  assert.equal(dna.alcohol.level, "none");
});

test("estimates volatile alcohol level from its ingredient-list zone", () => {
  const high = analyzeFormulaDna({
    ingredients: ["Water", "Alcohol Denat.", "Silica", "Niacinamide"],
    ingredientListType: "full",
    dataCompleteness: 100,
  });
  const low = analyzeFormulaDna({
    ingredients: ["Water", "Glycerin", "Dimethicone", "Niacinamide", "Panthenol", "Ceramide NP", "Xanthan Gum", "Alcohol Denat."],
    ingredientListType: "full",
    dataCompleteness: 100,
  });
  assert.equal(high.alcohol.level, "high");
  assert.equal(low.alcohol.level, "medium");
});

test("keeps potent late-position actives relevant", () => {
  const dna = analyzeFormulaDna({
    ingredients: [
      "Water", "Glycerin", "Propanediol", "Dimethicone", "Squalane", "Carbomer",
      "Xanthan Gum", "Disodium EDTA", "Phenoxyethanol", "Ethylhexylglycerin",
      "Sodium Hydroxide", "Tocopherol", "Retinal",
    ],
    ingredientListType: "full",
    dataCompleteness: 100,
  });
  assert.ok(dna.systems.antiAging.score >= 3);
  assert.ok(dna.systems.antiAging.signals.some((signal) => signal.label === "维A类"));
});

test("marks partial formulas as low confidence", () => {
  const dna = analyzeFormulaDna({
    ingredients: ["Glycerin", "Ceramide NP", "Squalane"],
    ingredientListType: "partial",
    dataCompleteness: 40,
  });
  assert.equal(dna.confidence, "low");
  assert.match(dna.caveats.join(" "), /部分配方/);
});
