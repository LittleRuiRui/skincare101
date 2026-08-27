import type { SkinProfileRecord } from "../lib/skinProfile.ts";
import type { FormulaSystemKey } from "./formulaDna.ts";
import type { MainCategory, Suitability } from "./productScoring.ts";

export type RecommendationConcern =
  | "acne"
  | "pores"
  | "pigmentation"
  | "redness"
  | "barrier"
  | "hydration"
  | "aging"
  | "oil-control";

const CONCERN_SYSTEMS: Record<RecommendationConcern, FormulaSystemKey[]> = {
  acne: ["oilControl", "soothing"],
  pores: ["oilControl"],
  pigmentation: ["antiAging"],
  redness: ["soothing", "barrier"],
  barrier: ["barrier", "lipid", "hydration"],
  hydration: ["hydration", "barrier"],
  aging: ["antiAging", "hydration"],
  "oil-control": ["oilControl"],
};

function inferSkinSupportSystems(profile?: SkinProfileRecord | null): FormulaSystemKey[] {
  if (!profile) return [];
  const wash = profile.skinAnswers?.wash;
  const oil = profile.skinAnswers?.oil;
  const sensitive = profile.skinAnswers?.sensitive === "yes";
  const systems = new Set<FormulaSystemKey>();

  if (wash === "dry") {
    systems.add("hydration");
    systems.add("lipid");
    systems.add("barrier");
  }
  if (oil === "oily") systems.add("oilControl");
  if (wash === "dry" && oil === "oily") {
    systems.add("hydration");
    systems.add("oilControl");
  }
  if (sensitive || profile.selectedSymptoms?.includes("redness")) {
    systems.add("soothing");
    systems.add("barrier");
  }
  if (profile.selectedSymptoms?.includes("dryness")) {
    systems.add("hydration");
    systems.add("lipid");
  }

  return [...systems];
}

export function buildRecommendationSuitability(
  profile: SkinProfileRecord | null | undefined,
  concern: RecommendationConcern,
  preferredMainCategories: MainCategory[] = [],
  base: Pick<Suitability, "good" | "risky" | "conflicting"> = { good: [], risky: [] },
): Suitability {
  const skinSupportSystems = inferSkinSupportSystems(profile);
  const needsGentleFormula =
    profile?.skinAnswers?.sensitive === "yes" ||
    profile?.selectedSymptoms?.includes("redness") ||
    concern === "redness" ||
    concern === "barrier";

  return {
    ...base,
    concernSystems: CONCERN_SYSTEMS[concern],
    skinSupportSystems,
    needsGentleFormula,
    preferredMainCategories,
  };
}

export function mainCategoryForRoutineNeed(need: string): MainCategory {
  const value = need.toLowerCase();
  if (value.includes("clean") || value.includes("rinse") || value.includes("makeup remover")) {
    return "Cleanser / Makeup Remover";
  }
  if (value.includes("spf") || value.includes("sunscreen")) return "Sunscreen";
  if (value.includes("toner") || value.includes("essence")) return "Toner / Essence";
  if (value.includes("eye")) return "Eye Care";
  if (value.includes("mask")) return "Mask";
  if (value.includes("lip")) return "Lip Care";
  if (value.includes("moistur") || value.includes("cream") || value.includes("ceramide")) {
    return "Moisturizer / Cream";
  }
  if (value.includes("bha") || value.includes("peel") || value.includes("spot treatment")) {
    return "Special Treatment";
  }
  return "Serum";
}
