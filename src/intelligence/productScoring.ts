import { ingredientMatches } from "./ingredientParser.ts";
import {
  analyzeFormulaDna,
  type FormulaDna,
  type FormulaSystemKey,
} from "./formulaDna.ts";

interface IngredientRule {
  name: string;
}

export type MainCategory =
  | "Moisturizer / Cream"
  | "Serum"
  | "Eye Care"
  | "Cleanser / Makeup Remover"
  | "Toner / Essence"
  | "Sunscreen"
  | "Mask"
  | "Lip Care"
  | "Special Treatment";

export interface Suitability {
  good: IngredientRule[];
  risky: IngredientRule[];
  conflicting?: IngredientRule[];

  /** Backwards compatible. New callers should use concernSystems. */
  targetSystems?: FormulaSystemKey[];
  /** Systems that directly address what the user wants to improve. */
  concernSystems?: FormulaSystemKey[];
  /** Systems that make the product more compatible with the user's skin profile. */
  skinSupportSystems?: FormulaSystemKey[];
  /** Used for redness/reactivity/barrier-compromised profiles. */
  needsGentleFormula?: boolean;
  /** Optional product-type constraint from routine slot / browse context. */
  preferredMainCategories?: MainCategory[];
}

interface Product {
  id: string;
  ingredients: string[];
  dataCompleteness: number;
  ingredientListType?: "full" | "partial";
  category?: string;
  mainCategory?: MainCategory | string;
  formulaDna?: FormulaDna;
}

export interface ProductEvidence {
  name: string;
  points: number;
  ingredientPosition: number;
}

export interface SystemEvidence {
  key: FormulaSystemKey;
  label: string;
  score: number;
  points: number;
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
  /** Evidence for the user's requested concern. */
  concernEvidence: SystemEvidence[];
  /** Evidence that the product suits the user's skin profile. */
  skinFitEvidence: SystemEvidence[];
  /** Legacy combined system evidence for existing UI consumers. */
  systemEvidence: SystemEvidence[];
  concernBonus: number;
  skinFitBonus: number;
  formulaPenalty: number;
  categoryBonus: number;
  confidenceAdjustment: number;
}

const clampMatch = (value: number) => Math.max(5, Math.min(95, Math.round(value)));
const calibrateMatch = (netEvidence: number) => clampMatch(50 + 44 * Math.tanh(netEvidence / 72));

const uniqueSystems = (systems: FormulaSystemKey[] = []) => [...new Set(systems)];

function getSystemEvidence(
  formulaDna: FormulaDna,
  systems: FormulaSystemKey[],
  multiplier = 1,
): SystemEvidence[] {
  return uniqueSystems(systems)
    .map((key) => formulaDna.systems[key])
    .filter((system) => system.score >= 2)
    .map((system) => ({
      key: system.key,
      label: system.label,
      score: system.score,
      points: Math.max(2, (system.score - 1) * 2) * multiplier,
    }));
}

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

  // Concern efficacy is deliberately weighted more strongly than generic skin support:
  // first ask "can this address what the user wants?", then "is it suitable for this skin?".
  const concernSystems = suitability.concernSystems || suitability.targetSystems || [];
  const skinSystems = suitability.skinSupportSystems || [];
  const concernEvidence = getSystemEvidence(formulaDna, concernSystems, 1.35);
  const skinFitEvidence = getSystemEvidence(formulaDna, skinSystems, 1);
  const concernBonus = Math.min(22, concernEvidence.reduce((sum, evidence) => sum + evidence.points, 0));
  const skinFitBonus = Math.min(14, skinFitEvidence.reduce((sum, evidence) => sum + evidence.points, 0));

  const inferredGentleNeed = [...skinSystems, ...concernSystems].some(
    (key) => key === "barrier" || key === "soothing",
  );
  const needsGentleFormula = suitability.needsGentleFormula ?? inferredGentleNeed;
  const formulaPenalty = needsGentleFormula
    ? formulaDna.alcohol.level === "high"
      ? -16
      : formulaDna.alcohol.level === "medium"
        ? -9
        : 0
    : 0;

  const preferredCategories = suitability.preferredMainCategories || [];
  const categoryBonus =
    preferredCategories.length === 0
      ? 0
      : preferredCategories.includes(product.mainCategory as MainCategory)
        ? 8
        : -10;

  const positive = positiveEvidence.reduce((sum, evidence) => sum + evidence.points, 0);
  const negative = negativeEvidence.reduce((sum, evidence) => sum + evidence.points, 0);

  // Data quality affects confidence and ranking, but should not erase a genuinely better formula match.
  const confidenceAdjustment =
    product.dataCompleteness >= 90
      ? 4
      : product.dataCompleteness >= 75
        ? 1
        : product.dataCompleteness >= 60
          ? -4
          : -12;

  const netEvidence =
    positive +
    negative +
    concernBonus +
    skinFitBonus +
    formulaPenalty +
    categoryBonus +
    confidenceAdjustment;
  const rawScore = calibrateMatch(netEvidence);

  const systemEvidence = [...concernEvidence, ...skinFitEvidence].filter(
    (evidence, index, all) => all.findIndex((candidate) => candidate.key === evidence.key) === index,
  );
  const evidenceCount =
    positiveEvidence.length +
    negativeEvidence.length +
    conflictingEvidence.length +
    systemEvidence.length;
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
    concernEvidence,
    skinFitEvidence,
    systemEvidence,
    concernBonus,
    skinFitBonus,
    formulaPenalty,
    categoryBonus,
    confidenceAdjustment,
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

      // Match score is now primary. Confidence breaks close calls rather than dominating them.
      const scoreGap = (b.score || 0) - (a.score || 0);
      if (Math.abs(scoreGap) >= 3) return scoreGap;
      if (confidenceRank[a.confidence] !== confidenceRank[b.confidence]) {
        return confidenceRank[b.confidence] - confidenceRank[a.confidence];
      }
      return scoreGap;
    });
}
