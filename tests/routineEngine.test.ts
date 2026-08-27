import assert from "node:assert/strict";
import test from "node:test";

import { buildRoutine, categoryForRoutineStep, routineGuardrails, ROUTINE_GOALS, ROUTINE_TEMPLATES } from "../src/intelligence/routineEngine.ts";
import { rankForProfile } from "../src/lib/productPresentation.ts";

test("every exposed goal has an expert AM and PM template", () => {
  assert.equal(ROUTINE_GOALS.length, 11);
  for (const goal of ROUTINE_GOALS) {
    assert.ok(ROUTINE_TEMPLATES[goal].am.length >= 3);
    assert.ok(ROUTINE_TEMPLATES[goal].pm.length >= 3);
    assert.ok(ROUTINE_TEMPLATES[goal].note.length >= 15);
  }
});

test("minimal routines remove optional serum and essence layers", () => {
  const standard = buildRoutine("Dehydration", "standard");
  const minimal = buildRoutine("Dehydration", "minimal");
  assert.ok(minimal.am.length < standard.am.length);
  assert.ok(minimal.pm.length < standard.pm.length);
});

test("sensitive beginners receive active-use guardrails", () => {
  const notes = routineGuardrails({ skinAnswers: { sensitive: "yes" }, profileAnswers: {}, selectedSymptoms: [], symptomAnswers: {}, multiSelectAnswers: {}, redFlag: null }, "Fine lines", "beginner");
  assert.ok(notes.some((note) => note.includes("局部耐受")));
  assert.ok(notes.some((note) => note.includes("每周1–2晚")));
  assert.ok(notes.some((note) => note.includes("强酸和A醇")));
});

test("routine steps resolve to usable catalog categories", () => {
  assert.equal(categoryForRoutineStep("Broad-spectrum SPF"), "防晒");
  assert.equal(categoryForRoutineStep("Gentle cleanser"), "洁面");
  assert.equal(categoryForRoutineStep("Ceramide moisturizer"), "乳液 / 面霜");
  assert.equal(categoryForRoutineStep("BHA 2–3× weekly"), "焕肤");
});

test("sensitive redness profiles rank soothing formulas above fragranced alcohol formulas", () => {
  const base = { category: "精华", ingredientListType: "full" as const, dataCompleteness: 100, sourceUrl: "https://example.com", verifiedAt: "2026-08-26", source: "shared" as const };
  const products = [
    { ...base, id: "calm", brand: "A", name: "Calm", ingredients: ["Water", "Glycerin", "Panthenol", "Madecassoside", "Beta-Glucan"] },
    { ...base, id: "sting", brand: "B", name: "Sting", ingredients: ["Water", "Alcohol Denat.", "Fragrance", "Menthol", "Glycerin"] },
  ];
  const profile = { skinAnswers: { sensitive: "yes" }, profileAnswers: {}, selectedSymptoms: ["redness"], symptomAnswers: {}, multiSelectAnswers: {}, redFlag: null };
  const ranked = rankForProfile(products, profile, "redness");
  assert.equal(ranked[0].id, "calm");
  assert.ok((ranked[0].score || 0) > (ranked[1].score || 0));
});

test("twenty fixed profile scenarios produce bounded evidence-backed recommendations", () => {
  const base = { category: "精华", ingredientListType: "full" as const, dataCompleteness: 100, sourceUrl: "https://example.com", verifiedAt: "2026-08-26", source: "shared" as const };
  const products = [
    { ...base, id: "hydrate", brand: "A", name: "Hydrate", ingredients: ["Water", "Glycerin", "Sodium Hyaluronate", "Panthenol", "Betaine"] },
    { ...base, id: "barrier", brand: "B", name: "Barrier", ingredients: ["Water", "Glycerin", "Ceramide NP", "Cholesterol", "Squalane", "Panthenol"] },
    { ...base, id: "calm", brand: "C", name: "Calm", ingredients: ["Water", "Glycerin", "Centella Asiatica", "Madecassoside", "Beta-Glucan"] },
    { ...base, id: "pores", brand: "D", name: "Pores", ingredients: ["Water", "Niacinamide", "Zinc PCA", "Salicylic Acid", "Glycerin"] },
    { ...base, id: "bright", brand: "E", name: "Bright", ingredients: ["Water", "Niacinamide", "Tranexamic Acid", "Ascorbic Acid", "Licorice"] },
    { ...base, id: "aging", brand: "F", name: "Aging", ingredients: ["Water", "Glycerin", "Retinol", "Peptide", "Adenosine", "Niacinamide"] },
  ];
  const concerns = ["hydration", "barrier", "redness", "pores", "acne", "pigmentation", "aging"] as const;
  const scenarios = Array.from({ length: 20 }, (_, index) => ({
    profile: { skinAnswers: { sensitive: index % 3 === 0 ? "yes" : "no", wash: index % 2 ? "dry" : "normal" }, profileAnswers: {}, selectedSymptoms: [], symptomAnswers: {}, multiSelectAnswers: {}, redFlag: null },
    concern: concerns[index % concerns.length],
  }));
  for (const scenario of scenarios) {
    const first = rankForProfile(products, scenario.profile, scenario.concern)[0];
    assert.equal(first.recommendationAvailable, true);
    assert.ok((first.score || 0) >= 5 && (first.score || 0) <= 95);
    assert.ok(first.evidenceCount > 0);
  }
});
