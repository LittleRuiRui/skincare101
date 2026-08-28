import assert from "node:assert/strict";
import test from "node:test";

import {
  buildProfileDecisionModel,
  containsPregnancyHardExclusion,
  passesSafetyOverrides,
  weightedConcernScore,
} from "../src/intelligence/profileDecisionModel.ts";

const baseProfile = {
  id: "profile-test",
  name: "Test",
  isActive: true,
  skinAnswers: { wash: "combo", oil: "oily", sensitive: "yes" },
  profileAnswers: {},
  selectedSymptoms: ["redness", "acne", "pores", "pigmentation"],
  symptomAnswers: {},
  multiSelectAnswers: {},
  redFlag: null,
};

test("builds deterministic multi-concern weights without collapsing to the first concern", () => {
  const model = buildProfileDecisionModel(baseProfile);
  assert.equal(model.skinType, "combination");
  assert.equal(model.sensitive, true);
  assert.deepEqual(model.concernWeights, [
    { concern: "redness", rank: 1, weight: 0.30 },
    { concern: "acne", rank: 2, weight: 0.25 },
    { concern: "pores", rank: 3, weight: 0.15 },
    { concern: "pigmentation", rank: 4, weight: 0.10 },
  ]);
});

test("weighted concern score uses all available concern scores", () => {
  const model = buildProfileDecisionModel(baseProfile);
  const result = weightedConcernScore({ redness: 90, acne: 70, pores: 80, pigmentation: 60 }, model);
  assert.equal(result, 77);
  assert.notEqual(result, 90);
});

test("weighted score is stable when one optional concern score is missing", () => {
  const model = buildProfileDecisionModel(baseProfile);
  const result = weightedConcernScore({ redness: 90, acne: 70, pores: 80 }, model);
  assert.equal(result, 80);
});

test("pregnancy mode becomes a hard safety override", () => {
  const model = buildProfileDecisionModel({
    ...baseProfile,
    profileAnswers: { pregnancy: "yes" },
  });
  assert.equal(model.pregnancySafetyOverride, true);
  assert.deepEqual(model.hardExcludedIngredientGroups, ["retinoids"]);
  assert.equal(passesSafetyOverrides(["Water", "Glycerin", "Retinol"], model), false);
  assert.equal(passesSafetyOverrides(["Water", "Glycerin", "Niacinamide"], model), true);
});

test("pregnancy hard exclusion catches common topical retinoid names", () => {
  for (const ingredient of ["Retinol", "Retinal", "Retinaldehyde", "Tretinoin", "Adapalene", "Tazarotene"]) {
    assert.equal(containsPregnancyHardExclusion([ingredient]), true, ingredient);
  }
  assert.equal(containsPregnancyHardExclusion(["Bakuchiol", "Niacinamide", "Azelaic Acid"]), false);
});

test("non-pregnancy profiles do not hard-filter retinoids", () => {
  const model = buildProfileDecisionModel(baseProfile);
  assert.equal(model.pregnancySafetyOverride, false);
  assert.equal(passesSafetyOverrides(["Water", "Retinol"], model), true);
});
