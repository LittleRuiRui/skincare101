import { ingredientMatches } from "./ingredientParser.ts";

interface IngredientRule {
  name: string;
}

interface Suitability {
  good: IngredientRule[];
  risky: IngredientRule[];
  conflicting?: IngredientRule[];
}

interface Product {
  id: string;
  ingredients: string[];
  dataCompleteness: number;
}

export interface ProductEvidence {
  name: string;
  points: number;
  ingredientPosition: number;
}

export interface ProductScore {
  score: number | null;
  rawScore: number;
  confidence: "low" | "medium" | "high";
  recommendationAvailable: boolean;
  positiveEvidence: ProductEvidence[];
  negativeEvidence: ProductEvidence[];
  conflictingEvidence: string[];
  evidenceCount: number;
  dataCompleteness: number;
}

const clamp = (value: number) => Math.max(5, Math.min(98, Math.round(value)));

export function scoreProduct(product: Product, suitability: Suitability): ProductScore {
  const positiveEvidence: ProductEvidence[] = [];
  const negativeEvidence: ProductEvidence[] = [];
  const conflictingEvidence: string[] = [];

  product.ingredients.forEach((ingredient, index) => {
    const weight = Math.max(1, 8 - index);
    const conflict = (suitability.conflicting || []).find((rule) =>
      ingredientMatches(ingredient, rule.name),
    );
    if (conflict && !conflictingEvidence.includes(conflict.name)) {
      conflictingEvidence.push(conflict.name);
      return;
    }

    const good = suitability.good.find((rule) => ingredientMatches(ingredient, rule.name));
    if (good && !positiveEvidence.some((evidence) => evidence.name === good.name)) {
      positiveEvidence.push({ name: good.name, points: weight * 3, ingredientPosition: index + 1 });
    }

    const risky = suitability.risky.find((rule) => ingredientMatches(ingredient, rule.name));
    if (risky && !negativeEvidence.some((evidence) => evidence.name === risky.name)) {
      negativeEvidence.push({ name: risky.name, points: -(weight * 4), ingredientPosition: index + 1 });
    }
  });

  const positive = positiveEvidence.reduce((sum, evidence) => sum + evidence.points, 0);
  const negative = negativeEvidence.reduce((sum, evidence) => sum + evidence.points, 0);
  const rawScore = clamp(50 + positive + negative);
  const evidenceCount = positiveEvidence.length + negativeEvidence.length + conflictingEvidence.length;
  const recommendationAvailable = product.dataCompleteness >= 60 && evidenceCount > 0;
  const confidence =
    product.dataCompleteness >= 85 && evidenceCount >= 3
      ? "high"
      : product.dataCompleteness >= 65 && evidenceCount >= 2
        ? "medium"
        : "low";

  return {
    score: recommendationAvailable ? rawScore : null,
    rawScore,
    confidence,
    recommendationAvailable,
    positiveEvidence,
    negativeEvidence,
    conflictingEvidence,
    evidenceCount,
    dataCompleteness: product.dataCompleteness,
  };
}

export function rankProducts<T extends Product>(products: T[], suitability: Suitability) {
  const confidenceRank = { high: 3, medium: 2, low: 1 };
  return products
    .map((product) => ({ ...product, ...scoreProduct(product, suitability) }))
    .sort((a, b) => {
      if (a.recommendationAvailable !== b.recommendationAvailable) {
        return a.recommendationAvailable ? -1 : 1;
      }
      if (confidenceRank[a.confidence] !== confidenceRank[b.confidence]) {
        return confidenceRank[b.confidence] - confidenceRank[a.confidence];
      }
      return (b.score || 0) - (a.score || 0);
    });
}
