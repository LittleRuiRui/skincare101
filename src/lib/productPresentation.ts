import { analyzeFormulaDna, type FormulaDna, type FormulaSystemKey } from "../intelligence/formulaDna.ts";
import { rankProducts, scoreProduct, type ProductScore, type Suitability } from "../intelligence/productScoring.ts";
import type { SharedProductRecord } from "./supabase.ts";
import type { SkinProfileRecord } from "./skinProfile.ts";

export type BrowseSkinType = "all" | "dry" | "oily" | "combination" | "sensitive" | "acne";
export type BrowseConcern = "all" | "hydration" | "barrier" | "redness" | "pores" | "acne" | "pigmentation" | "aging";

const rule = (name: string) => ({ name });

const CONCERN_RULES: Record<Exclude<BrowseConcern, "all">, Suitability> = {
  hydration: {
    good: [rule("Glycerin"), rule("Hyaluronic Acid"), rule("Sodium Hyaluronate"), rule("Panthenol"), rule("Betaine"), rule("Urea")],
    risky: [],
    targetSystems: ["hydration"],
  },
  barrier: {
    good: [rule("Ceramide"), rule("Cholesterol"), rule("Phytosphingosine"), rule("Squalane"), rule("Panthenol"), rule("Niacinamide")],
    risky: [rule("Alcohol Denat."), rule("Fragrance"), rule("Parfum")],
    targetSystems: ["barrier", "lipid", "soothing"],
  },
  redness: {
    good: [rule("Panthenol"), rule("Centella Asiatica"), rule("Madecassoside"), rule("Allantoin"), rule("Bisabolol"), rule("Beta-Glucan")],
    risky: [rule("Alcohol Denat."), rule("Fragrance"), rule("Parfum"), rule("Menthol")],
    targetSystems: ["soothing", "barrier"],
  },
  pores: {
    good: [rule("Niacinamide"), rule("Salicylic Acid"), rule("Zinc PCA"), rule("Silica")],
    risky: [],
    targetSystems: ["oilControl", "hydration"],
  },
  acne: {
    good: [rule("Salicylic Acid"), rule("Azelaic Acid"), rule("Niacinamide"), rule("Zinc PCA"), rule("Sulfur")],
    risky: [rule("Coconut Oil"), rule("Isopropyl Myristate")],
    targetSystems: ["oilControl", "soothing"],
  },
  pigmentation: {
    good: [rule("Tranexamic Acid"), rule("Niacinamide"), rule("Ascorbic Acid"), rule("Alpha-Arbutin"), rule("Licorice")],
    risky: [],
    targetSystems: ["antiAging"],
  },
  aging: {
    good: [rule("Retinol"), rule("Retinal"), rule("Peptide"), rule("Ascorbic Acid"), rule("Adenosine"), rule("Niacinamide")],
    risky: [],
    targetSystems: ["antiAging", "hydration", "barrier"],
  },
};

function mergeSuitability(parts: Suitability[]): Suitability {
  const dedupe = (items: Array<{ name: string }>) => Array.from(new Map(items.map((item) => [item.name, item])).values());
  return {
    good: dedupe(parts.flatMap((part) => part.good)),
    risky: dedupe(parts.flatMap((part) => part.risky)),
    conflicting: [],
    targetSystems: Array.from(new Set(parts.flatMap((part) => part.targetSystems || []))),
  };
}

export function profileConcern(profile?: SkinProfileRecord | null): Exclude<BrowseConcern, "all"> {
  const symptoms = profile?.selectedSymptoms || [];
  if (symptoms.includes("redness") || symptoms.includes("sensitivity")) return "redness";
  if (symptoms.includes("acne")) return "acne";
  if (symptoms.includes("pores")) return "pores";
  if (symptoms.includes("pigmentation")) return "pigmentation";
  if (symptoms.includes("aging")) return "aging";
  if (symptoms.includes("dryness")) return "hydration";
  return "barrier";
}

export function suitabilityFor(profile?: SkinProfileRecord | null, concern?: BrowseConcern): Suitability {
  const selected: Exclude<BrowseConcern, "all"> = concern && concern !== "all" ? concern : profileConcern(profile);
  const parts = [CONCERN_RULES[selected]];
  if (profile?.skinAnswers?.sensitive === "yes" && selected !== "redness" && selected !== "barrier") {
    parts.push(CONCERN_RULES.redness);
  }
  if (profile?.skinAnswers?.wash === "dry" || profile?.skinAnswers?.oil === "dry") {
    parts.push(CONCERN_RULES.hydration);
  }
  return mergeSuitability(parts);
}

export function personalizedScore(product: SharedProductRecord, profile?: SkinProfileRecord | null, concern?: BrowseConcern): ProductScore | null {
  if (!profile && (!concern || concern === "all")) return null;
  return scoreProduct(product, suitabilityFor(profile, concern));
}

export function rankForProfile(products: SharedProductRecord[], profile?: SkinProfileRecord | null, concern?: BrowseConcern) {
  return rankProducts(products, suitabilityFor(profile, concern));
}

export function formulaDataLabel(product: SharedProductRecord) {
  if (product.ingredientListType === "full" && product.dataCompleteness >= 85) {
    return { label: "Verified full formula", detail: "完整 INCI 已保存；分析重点读取前 10–15 位。", tone: "good" as const };
  }
  if (product.ingredientListType === "full") {
    return { label: "Full formula · needs review", detail: "已保存完整列表，但来源或版本仍需进一步复核。", tone: "warn" as const };
  }
  if (product.ingredients.length > 0) {
    return { label: "Partial formula", detail: "目前只保存了部分成分，不能据此断言产品不含未显示成分。", tone: "warn" as const };
  }
  return { label: "Formula pending", detail: "尚无足够 INCI 数据，不进入优先推荐。", tone: "muted" as const };
}

const SYSTEM_PRIORITY: FormulaSystemKey[] = ["barrier", "hydration", "soothing", "antiAging", "oilControl", "lipid"];

export function oneLineVerdict(product: SharedProductRecord, dna: FormulaDna = analyzeFormulaDna(product)) {
  if (!product.ingredients.length) return "已有产品条目，但配方证据不足，暂不做功效判断。";
  const systems = SYSTEM_PRIORITY.map((key) => dna.systems[key]).filter((system) => system.score >= 2).sort((a, b) => b.score - a.score);
  const lead = systems.slice(0, 2).map((system) => system.label.replace("体系", "")).join("＋") || "基础保湿";
  const texture = dna.sensory.labels.slice(0, 2).join("、");
  const caution = dna.alcohol.level === "high" ? "，但高位酒精让敏感肌需要谨慎" : product.ingredientListType === "partial" ? "，但目前只有部分配方" : "";
  return `以${lead}为主的${product.category}，预计${texture || "常规肤感"}${caution}。`;
}

export function matchesSkinType(product: SharedProductRecord, skinType: BrowseSkinType) {
  if (skinType === "all") return true;
  const dna = analyzeFormulaDna(product);
  if (skinType === "sensitive") return dna.alcohol.level !== "high" && dna.systems.soothing.score >= 2;
  if (skinType === "acne") return dna.systems.oilControl.score >= 2 || product.category === "祛痘";
  if (skinType === "oily") return dna.systems.oilControl.score >= 1 || !/厚润|油感/.test(dna.sensory.labels.join(" "));
  if (skinType === "dry") return dna.systems.hydration.score >= 3 || dna.systems.lipid.score >= 2;
  return dna.systems.hydration.score >= 2 && dna.alcohol.level !== "high";
}
