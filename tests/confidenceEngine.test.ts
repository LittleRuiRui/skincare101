import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateCandidateEvidence,
  scoreCandidates,
  type SymptomTree,
} from "../src/intelligence/confidenceEngine.ts";

const tree: SymptomTree = {
  candidates: { rosacea: "玫瑰痤疮倾向", barrier: "屏障受损" },
  questions: [
    {
      key: "flush",
      q: "热刺激后是否持久泛红?",
      options: [
        {
          v: "yes",
          l: "会且消退缓慢",
          signals: { rosacea: { delta: 35, label: "热触发且持续不退" } },
        },
        {
          v: "no",
          l: "不会或消退较快",
          signals: { rosacea: { delta: -20 } },
        },
      ],
    },
    {
      key: "feel",
      q: "是否刺痛紧绷?",
      options: [
        {
          v: "yes",
          l: "刺痛紧绷",
          signals: { barrier: { delta: 25, label: "伴随刺痛/紧绷" } },
        },
        { v: "no", l: "无不适", signals: { barrier: { delta: -15 } } },
      ],
    },
  ],
};

test("confidence is decomposable and uses only selected observations", () => {
  const evidence = evaluateCandidateEvidence(
    tree,
    { flush: "yes", feel: "no" },
    {},
    "rosacea",
  );

  assert.deepEqual(evidence.supporting, ["热触发且持续不退"]);
  assert.deepEqual(evidence.contradicting, []);
  assert.deepEqual(evidence.missing, []);
  assert.equal(evidence.confidence.baseScore, 30);
  assert.equal(evidence.confidence.supportingContribution, 35);
  assert.equal(evidence.confidence.score, 65);
  assert.equal(evidence.confidence.rawScore, 65);
});

test("a selected negative signal is contradiction, not missing evidence", () => {
  const evidence = evaluateCandidateEvidence(tree, { flush: "no" }, {}, "rosacea");

  assert.deepEqual(evidence.contradicting, ["不会或消退较快"]);
  assert.deepEqual(evidence.missing, []);
  assert.equal(evidence.confidence.contradictingContribution, -20);
  assert.equal(evidence.confidence.score, 10);
});

test("only unanswered relevant questions add uncertainty", () => {
  const evidence = evaluateCandidateEvidence(tree, {}, {}, "rosacea");

  assert.deepEqual(evidence.missing, ["热刺激后是否持久泛红?"]);
  assert.equal(evidence.confidence.uncertaintyPenalty, -5);
  assert.equal(evidence.confidence.score, 25);
});

test("observed high-risk features emit stored risk rules", () => {
  const evidence = evaluateCandidateEvidence(tree, { flush: "yes" }, {}, "rosacea");

  assert.equal(evidence.risk.length, 1);
  assert.match(evidence.risk[0], /继续刺激/);
});

test("candidate ranking is derived from the same evidence calculation", () => {
  const ranked = scoreCandidates(tree, { flush: "yes", feel: "no" }, {});

  assert.equal(ranked[0].key, "rosacea");
  assert.equal(ranked[0].pct, ranked[0].confidence.score);
  assert.equal(ranked[1].key, "barrier");
});

test("deep acne risk is independent from pus morphology", () => {
  const acneTree: SymptomTree = {
    candidates: { true_acne: "真性痤疮" },
    questions: [
      {
        key: "depth",
        q: "深浅?",
        options: [{ v: "deep", l: "深层", signals: { true_acne: { delta: 25 } } }],
      },
      {
        key: "pus",
        q: "有脓?",
        options: [
          { v: "yes", l: "有", signals: { true_acne: { delta: 25 } } },
          { v: "no", l: "无", signals: { true_acne: { delta: 5 } } },
        ],
      },
    ],
  };

  const withoutPus = evaluateCandidateEvidence(
    acneTree,
    { depth: "deep", pus: "no" },
    {},
    "true_acne",
  );
  const withPus = evaluateCandidateEvidence(
    acneTree,
    { depth: "deep", pus: "yes" },
    {},
    "true_acne",
  );

  assert.equal(withoutPus.risk.length, 1);
  assert.equal(withPus.risk.length, 1);
});
