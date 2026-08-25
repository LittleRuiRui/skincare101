import assert from "node:assert/strict";
import test from "node:test";

import {
  ingredientMatches,
  parseIngredientDetails,
  parseIngredientText,
} from "../src/intelligence/ingredientParser.ts";

const library = [
  { name: "烟酰胺 (Niacinamide)" },
  { name: "神经酰胺 (Ceramide NP)" },
  { name: "水杨酸 (BHA)" },
  { name: "大麦茎水 (Hordeum Vulgare Stem Water)" },
  { name: "甜菜碱 (Betaine)" },
  { name: "椰油酰胺丙基甜菜碱 (Cocamidopropyl Betaine)" },
  { name: "尼泊金酯类防腐剂 (Methyl/Propyl/Butyl/Ethylparaben)" },
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

test("does not reverse-match short ingredients into longer INCI names", () => {
  assert.equal(ingredientMatches("Water", library[3].name), false);
  assert.equal(ingredientMatches("Betaine", library[5].name), false);
  assert.equal(ingredientMatches("Butylene Glycol", library[6].name), false);
});

test("still recognizes explicit paraben ingredients", () => {
  assert.equal(ingredientMatches("Methylparaben", library[6].name), true);
  assert.equal(ingredientMatches("Propylparaben", library[6].name), true);
});

test("reports unknown OCR rows instead of silently discarding them", () => {
  const result = parseIngredientDetails(
    "Niacinamide, Mystery Botanical Extract, Ceramide NP",
    library,
  );
  assert.equal(result.recognized.length, 2);
  assert.deepEqual(result.unknown.map((item) => item.raw), ["Mystery Botanical Extract"]);
  assert.equal(result.coverage, 67);
});

test("conservatively corrects a close OCR typo", () => {
  const result = parseIngredientDetails("Niacinarnide", library);
  assert.equal(result.recognized[0].canonicalName, library[0].name);
  assert.equal(result.recognized[0].matchType, "fuzzy");
});
