import assert from "node:assert/strict";
import test from "node:test";
import { assessPositioningFit, buildMatchExplanation } from "../src/intelligence/productInterpretation.ts";

test("strong formula match can coexist with low marketed-audience fit", () => {
  const product = {
    marketingPositioning: "For acne-prone skin experiencing treatment-related dryness",
    intendedSkinTypes: ["oily", "acne"],
    intendedConcerns: ["acne"],
    intendedUseContext: ["acne treatment"],
    formulaFunctionSummary: "A moisturizing and soothing formula that supports dryness and irritation.",
  };
  const user = { skinTypes: ["dry", "sensitive"], concerns: ["redness", "hydration"] };
  const fit = assessPositioningFit(product, user);
  assert.equal(fit.level, "low");
  const explanation = buildMatchExplanation(product, user, ["Hydration", "Soothing"]);
  assert.match(explanation, /formula match rather than a primary intended-user match/i);
});

test("matching intended audience is reported separately", () => {
  const product = {
    intendedSkinTypes: ["dry", "sensitive"],
    intendedConcerns: ["redness"],
    formulaVerdict: "A gentle barrier-supporting moisturizer.",
  };
  const user = { skinTypes: ["dry", "sensitive"], concerns: ["redness"] };
  const fit = assessPositioningFit(product, user);
  assert.equal(fit.level, "high");
  assert.equal(fit.matched.length, 3);
});

test("missing marketing data does not create an artificial mismatch", () => {
  const fit = assessPositioningFit({}, { skinTypes: ["dry"], concerns: ["redness"] });
  assert.equal(fit.level, "unknown");
});
