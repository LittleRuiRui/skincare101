import { ingredientMatches } from "./ingredientParser.ts";
import {
  analyzeFormulaDna,
  type FormulaDna,
  type FormulaSystemKey,
} from "./formulaDna.ts";

interface IngredientRule {
  name: string;
}

export interface Suitability {
  good: IngredientRule[];
  risky: IngredientRule[];
  conflicting?: IngredientRule[];
  targetSystems?: FormulaSystemKey[];
}

interface Product {
  id: string;
  ingredients: string[];
  dataCompleteness: number;
  ingredientListType?: "full" | "partial";
  category?: string;
  formulaDna?: FormulaDna;
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
  formulaDna: FormulaDna;
  systemEvidence: Array<{ key: FormulaSystemKey; label: string; score: number; points: number }>;
  formulaPenalty: number;
}

const clampMatch = (value: number) => Math.max(5, Math.min(95, Math.round(value)));

// Evidence used to be added linearly, which made many reasonably supported
// products hit the old 98-point ceiling. A saturating curve preserves ordering
// while avoiding false precision and diminishing the value of repeated signals.
const calibrateMatch = (netEvidence: number) => clampMatch(50 + 44 * Math.tanh(netEvidence / 65));

export function scoreProduct(product: Product, suitability: Suitability): ProductScore {
  const positiveEvidence: ProductEvidence[] = [];
  const negativeEvidence: ProductEvidence[] = [];
  const conflictingEvidence: string[] = [];

  product.ingredients.forEach((ingredient, index) => {
    const weight = index < 5 ? 8 - index : index < 10 ? 3 : index < 15 ? 2 : 1;
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

  const formulaDna = analyzeFormulaDna(product);
  const systemEvidence = [...new Set(suitability.targetSystems || [])]
    .map((key) => formulaDna.systems[key])
    .filter((system) => system.score >= 2)
    .map((system) => ({
      key: system.key,
      label: system.label,
      score: system.score,
      points: Math.max(2, (system.score - 1) * 2),
    }));
  const systemBonus = Math.min(16, systemEvidence.reduce((sum, evidence) => sum + evidence.points, 0));
  const needsGentleFormula = (suitability.targetSystems || []).some((key) => key === "barrier" || key === "soothing");
  const formulaPenalty = needsGentleFormula
    ? formulaDna.alcohol.level === "high"
      ? -12
      : formulaDna.alcohol.level === "medium"
        ? -7
        : 0
    : 0;
  const positive = positiveEvidence.reduce((sum, evidence) => sum + evidence.points, 0);
  const negative = negativeEvidence.reduce((sum, evidence) => sum + evidence.points, 0);
  const rawScore = calibrateMatch(positive + negative + systemBonus + formulaPenalty);
  const evidenceCount = positiveEvidence.length + negativeEvidence.length + conflictingEvidence.length + systemEvidence.length;
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
    formulaDna,
    systemEvidence,
    formulaPenalty,
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
