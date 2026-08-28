import type { SkinProfileRecord } from "../lib/skinProfile.ts";
import type { SharedProductRecord } from "../lib/supabase.ts";
import { personalizedScore, type BrowseConcern } from "../lib/productPresentation.ts";
import { buildProfileDecisionModel, passesSafetyOverrides, weightedConcernScore, type DecisionConcern } from "./profileDecisionModel.ts";
import { analyzeFormulaDna } from "./formulaDna.ts";

const CONCERN_MAP: Record<DecisionConcern, BrowseConcern> = {
  redness: "redness",
  acne: "acne",
  pores: "pores",
  pigmentation: "pigmentation",
  aging: "aging",
  dryness: "hydration",
};

export interface ProfileProductMatch {
  product: SharedProductRecord;
  score: number;
  concernScore: number;
  skinTypeScore: number;
  sensitivityScore: number;
  dataQualityScore: number;
  perConcernScores: Partial<Record<DecisionConcern, number>>;
  coveredConcerns: DecisionConcern[];
  excludedBySafety: boolean;
  confidence: "low" | "medium" | "high";
  evidenceCount: number;
}

function skinTypeFit(product: SharedProductRecord, profile: SkinProfileRecord): number {
  const model = buildProfileDecisionModel(profile);
  const dna = analyzeFormulaDna(product);
  const hydration = dna.systems.hydration.score;
  const barrier = dna.systems.barrier.score;
  const lipid = dna.systems.lipid.score;
  const oil = dna.systems.oilControl.score;
  if (model.skinType === "dry") return Math.min(100, 45 + hydration * 10 + lipid * 10 + barrier * 7);
  if (model.skinType === "oily") return Math.min(100, 50 + oil * 12 + hydration * 6 - lipid * 4);
  if (model.skinType === "combination") return Math.min(100, 45 + oil * 8 + hydration * 8 + barrier * 4);
  if (model.skinType === "balanced") return Math.min(100, 65 + hydration * 5 + barrier * 5);
  return 60;
}

function sensitivityFit(product: SharedProductRecord, profile: SkinProfileRecord, negativeEvidenceCount: number): number {
  const model = buildProfileDecisionModel(profile);
  if (!model.sensitive) return 85;
  const dna = analyzeFormulaDna(product);
  let score = 90 - negativeEvidenceCount * 15;
  if (dna.alcohol.level === "high") score -= 35;
  else if (dna.alcohol.level === "medium") score -= 15;
  return Math.max(10, Math.min(100, score));
}

export function scoreProductForProfile(product: SharedProductRecord, profile: SkinProfileRecord): ProfileProductMatch {
  const model = buildProfileDecisionModel(profile);
  const excludedBySafety = !passesSafetyOverrides(product.ingredients, model);
  const perConcernScores: Partial<Record<DecisionConcern, number>> = {};
  let evidenceCount = 0;
  let negativeEvidenceCount = 0;
  let confidence: ProfileProductMatch["confidence"] = "low";

  for (const item of model.concernWeights) {
    const result = personalizedScore(product, profile, CONCERN_MAP[item.concern]);
    if (!result?.recommendationAvailable || result.score == null) continue;
    perConcernScores[item.concern] = result.score;
    evidenceCount += result.evidenceCount;
    negativeEvidenceCount += result.negativeEvidence.length;
    if (result.confidence === "high") confidence = "high";
    else if (result.confidence === "medium" && confidence === "low") confidence = "medium";
  }

  const concernScore = weightedConcernScore(perConcernScores, model);
  const skinTypeScore = skinTypeFit(product, profile);
  const sensitivityScore = sensitivityFit(product, profile, negativeEvidenceCount);
  const dataQualityScore = Math.max(0, Math.min(100, product.dataCompleteness || 0));
  const hasConcernEvidence = Object.keys(perConcernScores).length > 0;
  const score = excludedBySafety
    ? 0
    : Math.round(
        (hasConcernEvidence ? concernScore : 50) * 0.70 +
        skinTypeScore * 0.15 +
        sensitivityScore * 0.10 +
        dataQualityScore * 0.05,
      );

  return {
    product,
    score,
    concernScore,
    skinTypeScore,
    sensitivityScore,
    dataQualityScore,
    perConcernScores,
    coveredConcerns: model.concernWeights.map(item => item.concern).filter(concern => typeof perConcernScores[concern] === "number"),
    excludedBySafety,
    confidence,
    evidenceCount,
  };
}

export function rankProductsForProfile(products: SharedProductRecord[], profile: SkinProfileRecord): ProfileProductMatch[] {
  return products
    .map(product => scoreProductForProfile(product, profile))
    .filter(match => !match.excludedBySafety && match.evidenceCount > 0 && match.product.dataCompleteness >= 60)
    .sort((a, b) => b.score - a.score || b.coveredConcerns.length - a.coveredConcerns.length || b.dataQualityScore - a.dataQualityScore);
}
