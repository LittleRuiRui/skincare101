import type { FormulaSystemKey } from "./formulaDna.ts";

export interface ProductInterpretation {
  marketingPositioning?: string | null;
  intendedSkinTypes?: string[];
  intendedConcerns?: string[];
  intendedUseContext?: string[];
  formulaFunctionSummary?: string | null;
  primaryFormulaFunctions?: string[];
  secondaryFormulaFunctions?: string[];
  formulaBestFor?: string[];
  formulaAlsoWorksFor?: string[];
  formulaLessIdealFor?: string[];
  formulaCaveats?: string[];
  formulaVerdict?: string | null;
}

export interface PersonalFitContext {
  skinTypes?: string[];
  concerns?: string[];
  useContext?: string[];
  targetSystems?: FormulaSystemKey[];
}

export interface PositioningFit {
  level: "high" | "medium" | "low" | "unknown";
  matched: string[];
  mismatched: string[];
}

const normalize = (value: string) => value.trim().toLowerCase();
const overlaps = (left: string[] = [], right: string[] = []) => {
  const rightSet = new Set(right.map(normalize));
  return left.filter((value) => rightSet.has(normalize(value)));
};

export function assessPositioningFit(
  product: ProductInterpretation,
  user: PersonalFitContext,
): PositioningFit {
  const intended = [
    ...(product.intendedSkinTypes || []),
    ...(product.intendedConcerns || []),
    ...(product.intendedUseContext || []),
  ];
  const actual = [
    ...(user.skinTypes || []),
    ...(user.concerns || []),
    ...(user.useContext || []),
  ];
  if (!intended.length || !actual.length) return { level: "unknown", matched: [], mismatched: [] };

  const matched = overlaps(intended, actual);
  const mismatched = intended.filter((value) => !matched.some((match) => normalize(match) === normalize(value)));
  const ratio = matched.length / intended.length;
  return {
    level: ratio >= 0.5 ? "high" : matched.length > 0 ? "medium" : "low",
    matched,
    mismatched,
  };
}

export function buildMatchExplanation(
  product: ProductInterpretation,
  user: PersonalFitContext,
  matchedFormulaSystems: string[],
): string {
  const positioning = assessPositioningFit(product, user);
  const formula = product.formulaFunctionSummary || product.formulaVerdict;
  const formulaPart = formula
    ? formula
    : matchedFormulaSystems.length
      ? `The formula matches your needs through ${matchedFormulaSystems.join(", ")}.`
      : "The formula has some features that match your current skin needs.";

  if (positioning.level === "low") {
    return `${formulaPart} Its marketed target is different from your profile, so this is a formula match rather than a primary intended-user match.`;
  }
  if (positioning.level === "medium") {
    return `${formulaPart} You overlap with some, but not all, of the product's intended-use profile.`;
  }
  if (positioning.level === "high") {
    return `${formulaPart} Your profile also aligns with the product's intended-use positioning.`;
  }
  return formulaPart;
}
