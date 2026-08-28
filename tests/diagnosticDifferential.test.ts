import assert from "node:assert/strict";
import test from "node:test";

import { buildDiagnosticDifferential } from "../src/intelligence/diagnosticDifferential.ts";

const profile = (overrides: any = {}) => ({
  id: "diagnostic-test",
  name: "Test",
  isActive: true,
  skinAnswers: { wash: "balanced", oil: "balanced", sensitive: "no" },
  profileAnswers: {},
  selectedSymptoms: [],
  symptomAnswers: {},
  multiSelectAnswers: {},
  redFlag: null,
  ...overrides,
});

function finding(result: ReturnType<typeof buildDiagnosticDifferential>, key: string) {
  const value = result.find(item => item.key === key);
  assert.ok(value, `missing finding ${key}`);
  return value;
}

test("chronic flushing pattern raises rosacea tendency without forcing barrier damage", () => {
  const result = buildDiagnosticDifferential(profile({
    selectedSymptoms: ["redness"],
    symptomAnswers: { redness: { onset: "chronic", feel: "no", flush: "yes", scale: "no" } },
    multiSelectAnswers: { redness: { trigger: ["none"] } },
  }));
  const rosacea = finding(result, "rosacea_tendency");
  const barrier = finding(result, "barrier_damage");
  assert.ok(rosacea.score >= 70);
  assert.ok(rosacea.score > barrier.score);
  assert.ok(rosacea.supporting.some(item => item.includes("潮红") || item.includes("慢性")));
});

test("acute stinging after exfoliation raises barrier damage and over-exfoliation", () => {
  const result = buildDiagnosticDifferential(profile({
    selectedSymptoms: ["redness"],
    symptomAnswers: { redness: { onset: "acute", feel: "yes", flush: "no", scale: "no" } },
    multiSelectAnswers: { redness: { trigger: ["exfoliate"] } },
  }));
  assert.ok(finding(result, "barrier_damage").score >= 60);
  assert.ok(finding(result, "over_exfoliation").score >= 60);
  assert.ok(finding(result, "rosacea_tendency").score < finding(result, "barrier_damage").score);
});

test("oily scale in classic distribution raises seborrheic dermatitis possibility", () => {
  const result = buildDiagnosticDifferential(profile({
    selectedSymptoms: ["redness"],
    symptomAnswers: { redness: { onset: "chronic", feel: "no", flush: "no", scale: "yes" } },
    multiSelectAnswers: { redness: { trigger: ["none"] } },
  }));
  assert.ok(finding(result, "seborrheic_dermatitis_possible").score >= 60);
});

test("itchy uniform chest/back eruption raises Malassezia folliculitis possibility", () => {
  const result = buildDiagnosticDifferential(profile({
    selectedSymptoms: ["acne"],
    symptomAnswers: { acne: { onset: "chronic", inflamed: "no", depth: "surface" } },
    multiSelectAnswers: { acne: { trigger: ["none"], fungal: ["chest_back", "uniform", "itchy", "no_resolve"] } },
  }));
  const fungal = finding(result, "malassezia_folliculitis_possible");
  assert.ok(fungal.score >= 80);
  assert.ok(fungal.score > finding(result, "acne_vulgaris_tendency").score);
});

test("multi-concern profile preserves differential findings and generic mechanisms together", () => {
  const result = buildDiagnosticDifferential(profile({
    selectedSymptoms: ["redness", "pores", "pigmentation", "dryness"],
    symptomAnswers: { redness: { onset: "chronic", feel: "no", flush: "yes", scale: "no" } },
    multiSelectAnswers: { redness: { trigger: ["none"] } },
  }));
  assert.ok(result.some(item => item.key === "rosacea_tendency"));
  assert.ok(result.some(item => item.key === "oil_congestion"));
  assert.ok(result.some(item => item.key === "post_inflammatory_pigmentation"));
  assert.ok(result.some(item => item.key === "dehydration"));
});

test("barrier is never fabricated as the default concern when no evidence exists", () => {
  const result = buildDiagnosticDifferential(profile());
  assert.equal(result.some(item => item.key === "barrier_damage"), false);
});
