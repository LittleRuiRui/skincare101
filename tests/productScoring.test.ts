import assert from "node:assert/strict";
import test from "node:test";

import { rankProducts, scoreProduct } from "../src/intelligence/productScoring.ts";

const suitability = {
  good: [{ name: "烟酰胺 (Niacinamide)" }, { name: "神经酰胺 (Ceramide NP)" }],
  risky: [{ name: "香精 (Parfum/Fragrance)" }],
  conflicting: [],
};

test("exposes positive and negative score contributions", () => {
  const score = scoreProduct(
    {
      id: "complete",
      dataCompleteness: 90,
      ingredients: ["烟酰胺 (Niacinamide)", "香精 (Parfum/Fragrance)"],
    },
    suitability,
  );
  assert.equal(score.positiveEvidence[0].points, 24);
  assert.equal(score.negativeEvidence[0].points, -28);
  assert.equal(score.score, 46);
});

test("withholds a recommendation when no relevant evidence exists", () => {
  const score = scoreProduct(
    { id: "unknown", dataCompleteness: 90, ingredients: ["Water"] },
    suitability,
  );
  assert.equal(score.recommendationAvailable, false);
  assert.equal(score.score, null);
});

test("ranks supported products before insufficient-data products", () => {
  const ranked = rankProducts(
    [
      { id: "none", dataCompleteness: 95, ingredients: ["Water"] },
      { id: "supported", dataCompleteness: 70, ingredients: ["烟酰胺 (Niacinamide)", "神经酰胺 (Ceramide NP)"] },
    ],
    suitability,
  );
  assert.equal(ranked[0].id, "supported");
  assert.equal(ranked[1].score, null);
});
