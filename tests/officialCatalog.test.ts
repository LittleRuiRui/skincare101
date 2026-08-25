import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

for (const file of ["chanel_official_catalog.json", "dior_official_catalog.json"]) {
  test(`${file} retains complete official formulas instead of only the first 15`, () => {
    const payload = JSON.parse(readFileSync(new URL(`../data/${file}`, import.meta.url), "utf8"));
    assert.ok(payload.products.length > 40);
    assert.ok(payload.products.some((product: any) => product.rawIngredients.split(";").filter(Boolean).length > 15));
    for (const product of payload.products) {
      const count = product.rawIngredients.split(";").filter(Boolean).length;
      assert.equal(product.ingredientListType, "full");
      assert.equal(product.dataCompleteness, 100);
      assert.equal(product.analysisIngredientCount, Math.min(15, count));
      assert.match(product.sourceUrl, /^https:\/\//);
    }
  });
}

test("official collection scripts never truncate storage to a top-15 slice", () => {
  for (const file of ["build_chanel_official_catalog.py", "build_dior_official_catalog.py", "build_derm_official_catalog.py"]) {
    const source = readFileSync(new URL(`../scripts/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /rawIngredients[^\n]+\[:15\]/);
  }
});
