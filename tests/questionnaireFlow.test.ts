import assert from "node:assert/strict";
import test from "node:test";

import { MAX_SELECTED_CONCERNS, toggleConcernSelection } from "../src/intelligence/questionnaireFlow.ts";

test("questionnaire keeps multi-concern analysis without allowing an exhausting concern list", () => {
  let selected: string[] = [];
  selected = toggleConcernSelection(selected, "redness");
  selected = toggleConcernSelection(selected, "acne");
  selected = toggleConcernSelection(selected, "pores");

  assert.equal(MAX_SELECTED_CONCERNS, 2);
  assert.deepEqual(selected, ["redness", "acne"]);
});

test("a selected concern can always be removed and replaced", () => {
  let selected = ["redness", "acne"];
  selected = toggleConcernSelection(selected, "redness");
  selected = toggleConcernSelection(selected, "pores");

  assert.deepEqual(selected, ["acne", "pores"]);
});
