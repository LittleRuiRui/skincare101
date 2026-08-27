import test from "node:test";
import assert from "node:assert/strict";
import { getSpecialSkinStates, summarizeSkinProfile, type SkinProfileRecord } from "../src/lib/skinProfile.ts";
import { suitabilityFor } from "../src/lib/productPresentation.ts";

function profile(overrides: Partial<SkinProfileRecord> = {}): SkinProfileRecord {
  return {
    id: "p1",
    name: "test",
    isActive: true,
    skinAnswers: { wash: "oily", sensitive: "no" },
    profileAnswers: {},
    selectedSymptoms: [],
    symptomAnswers: {},
    multiSelectAnswers: {},
    redFlag: null,
    ...overrides,
  };
}

test("temporary sensitive flare does not overwrite base skin type", () => {
  const p = profile({ profileAnswers: { special_states: "sensitive_flare,acid", acid_frequency: "high" } });
  const summary = summarizeSkinProfile(p);
  assert.equal(summary.skinType, "偏油");
  assert.ok(summary.specialStates.includes("sensitive_flare"));
  assert.equal(summary.activeLoad, "high");
});

test("active-load context adds cautions without changing stored base profile", () => {
  const p = profile({ profileAnswers: { special_states: "acid", acid_frequency: "regular" } });
  assert.deepEqual(getSpecialSkinStates(p), ["acid"]);
  const suitability = suitabilityFor(p, "pores");
  assert.ok(suitability.risky.map(item => item.name).includes("Retinol"));
  assert.ok(suitability.targetSystems?.includes("barrier"));
});

test("pregnancy context uses conservative retinoid filtering", () => {
  const p = profile({ profileAnswers: { special_states: "pregnancy_breastfeeding" } });
  const suitability = suitabilityFor(p, "aging");
  const risky = suitability.risky.map(item => item.name);
  assert.ok(risky.includes("Retinol"));
  assert.ok(risky.includes("Retinal"));
});
