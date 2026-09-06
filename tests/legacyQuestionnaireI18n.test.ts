import assert from "node:assert/strict";
import test from "node:test";

import { localizeLegacySkinText } from "../src/lib/legacySkinText.ts";

test("simplified questionnaire keeps natural English equivalents", () => {
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location: { search: "?view=profileBuilder" },
      localStorage: { getItem: () => "en" },
    },
  });

  try {
    assert.equal(
      localizeLegacySkinText("大多数日子到了中午，你的 T 区和两颊通常是什么状态？", "en"),
      "On most days by midday, how do your T-zone and cheeks usually feel?",
    );
    assert.equal(localizeLegacySkinText("第二步 · 安全筛选", "en"), "Step 2 · Safety filter");
    assert.equal(
      localizeLegacySkinText("开始分析（最多 8 题）", "en"),
      "Start analysis (up to 8 questions)",
    );
  } finally {
    Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
  }
});
