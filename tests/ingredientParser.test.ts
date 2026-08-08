import assert from "node:assert/strict";
import test from "node:test";

import {
  ingredientMatches,
  parseIngredientText,
} from "../src/intelligence/ingredientParser.ts";

const library = [
  { name: "烟酰胺 (Niacinamide)" },
  { name: "神经酰胺 (Ceramide NP)" },
  { name: "水杨酸 (BHA)" },
];

test("matches English INCI names against bilingual references", () => {
  assert.equal(ingredientMatches("NIACINAMIDE", library[0].name), true);
  assert.equal(ingredientMatches("Ceramide NP", library[1].name), true);
});

test("extracts recognized ingredients from OCR-like comma-separated text", () => {
  const result = parseIngredientText(
    "Aqua, Niacinamide, Zinc PCA, Ceramide NP; Phenoxyethanol",
    library,
  );
  assert.deepEqual(result, [library[0].name, library[1].name]);
});

test("does not invent ingredients missing from OCR text", () => {
  assert.deepEqual(parseIngredientText("Aqua, Glycerin", library), []);
});

test("preserves ingredient order from the photographed label", () => {
  assert.deepEqual(
    parseIngredientText("Ceramide NP, Aqua, Niacinamide", library),
    [library[1].name, library[0].name],
  );
});

test("recognizes common INCI aliases not written out in the display name", () => {
  assert.equal(ingredientMatches("Salicylic Acid", library[2].name), true);
});
