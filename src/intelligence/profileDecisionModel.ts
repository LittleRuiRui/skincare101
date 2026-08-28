import type { SkinProfileRecord } from "../lib/skinProfile.ts";
import { clinicallyRelevantFindings, type DiagnosticFinding } from "./diagnosticDifferential.ts";

export type DecisionConcern = "redness" | "acne" | "pores" | "pigmentation" | "aging" | "dryness";

export interface ConcernWeight {
  concern: DecisionConcern;
  weight: number;
  rank: number;
}

export interface ProfileDecisionModel {
  skinType: "dry" | "oily" | "combination" | "balanced" | "unknown";
  sensitive: boolean;
  concernWeights: ConcernWeight[];
  diagnosticFindings: DiagnosticFinding[];
  pregnancySafetyOverride: boolean;
  hardExcludedIngredientGroups: string[];
}

const PRIORITY_WEIGHTS = [0.30, 0.25, 0.15, 0.10, 0.08, 0.07] as const;
const KNOWN_CONCERNS = new Set<DecisionConcern>(["redness", "acne", "pores", "pigmentation", "aging", "dryness"]);

function inferSkinType(profile: SkinProfileRecord): ProfileDecisionModel["skinType"] {
  const wash = profile.skinAnswers?.wash;
  const oil = profile.skinAnswers?.oil;
  if ((wash === "dry" || wash === "combo") && oil === "oily") return "combination";
  if (wash === "dry" || oil === "dry") return "dry";
  if (wash === "oily" || oil === "oily") return "oily";
  if (wash === "balanced" || oil === "balanced") return "balanced";
  return "unknown";
}

export function buildProfileDecisionModel(profile: SkinProfileRecord): ProfileDecisionModel {
  const concerns = (profile.selectedSymptoms || [])
    .filter((value): value is DecisionConcern => KNOWN_CONCERNS.has(value as DecisionConcern));

  const concernWeights = concerns.map((concern, index) => ({
    concern,
    rank: index + 1,
    weight: PRIORITY_WEIGHTS[index] ?? 0.05,
  }));

  const states = (profile.profileAnswers?.special_states || "").split(",").map(item => item.trim());
  const pregnancySafetyOverride = profile.profileAnswers?.pregnancy === "yes" || states.includes("pregnancy_breastfeeding");

  return {
    skinType: inferSkinType(profile),
    sensitive: profile.skinAnswers?.sensitive === "yes",
    concernWeights,
    diagnosticFindings: clinicallyRelevantFindings(profile),
    pregnancySafetyOverride,
    hardExcludedIngredientGroups: pregnancySafetyOverride ? ["retinoids"] : [],
  };
}

export function containsPregnancyHardExclusion(ingredients: string[]): boolean {
  return ingredients.some(ingredient => /\b(retinol|retinal|retinaldehyde|tretinoin|adapalene|tazarotene)\b/i.test(ingredient));
}

export function passesSafetyOverrides(ingredients: string[], model: ProfileDecisionModel): boolean {
  if (model.pregnancySafetyOverride && containsPregnancyHardExclusion(ingredients)) return false;
  return true;
}

export function weightedConcernScore(scores: Partial<Record<DecisionConcern, number>>, model: ProfileDecisionModel): number {
  if (!model.concernWeights.length) return 0;
  let weighted = 0;
  let totalWeight = 0;
  for (const item of model.concernWeights) {
    const score = scores[item.concern];
    if (typeof score !== "number" || !Number.isFinite(score)) continue;
    weighted += Math.max(0, Math.min(100, score)) * item.weight;
    totalWeight += item.weight;
  }
  return totalWeight ? Math.round(weighted / totalWeight) : 0;
}
