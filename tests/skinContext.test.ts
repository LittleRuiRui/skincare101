import { describe, expect, it } from "vitest";
import { getSpecialSkinStates, summarizeSkinProfile, type SkinProfileRecord } from "../src/lib/skinProfile";
import { suitabilityFor } from "../src/lib/productPresentation";

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

describe("temporary skin context", () => {
  it("keeps base skin type separate from temporary sensitive flare", () => {
    const p = profile({ profileAnswers: { special_states: "sensitive_flare,acid", acid_frequency: "high" } });
    const summary = summarizeSkinProfile(p);
    expect(summary.skinType).toBe("偏油");
    expect(summary.specialStates).toContain("sensitive_flare");
    expect(summary.activeLoad).toBe("high");
  });

  it("adds active-load cautions without changing the stored base profile", () => {
    const p = profile({ profileAnswers: { special_states: "acid", acid_frequency: "regular" } });
    expect(getSpecialSkinStates(p)).toEqual(["acid"]);
    const suitability = suitabilityFor(p, "pores");
    expect(suitability.risky.map(item => item.name)).toContain("Retinol");
    expect(suitability.targetSystems).toContain("barrier");
  });

  it("uses conservative retinoid filtering in pregnancy context", () => {
    const p = profile({ profileAnswers: { special_states: "pregnancy_breastfeeding" } });
    const suitability = suitabilityFor(p, "aging");
    expect(suitability.risky.map(item => item.name)).toContain("Retinol");
    expect(suitability.risky.map(item => item.name)).toContain("Retinal");
  });
});
