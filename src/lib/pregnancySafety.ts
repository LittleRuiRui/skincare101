import type { SharedProductRecord } from "./supabase";
import type { SkinProfileRecord } from "./skinProfile";
import { getSpecialSkinStates } from "./skinProfile";

export type PregnancySafetyLevel = "avoid" | "caution" | "no-known-trigger" | "insufficient-data";

export interface PregnancySafetyTrigger {
  ingredient: string;
  family: string;
  level: "avoid" | "caution";
  reasonZh: string;
  reasonEn: string;
}

export interface PregnancySafetyAssessment {
  level: PregnancySafetyLevel;
  triggers: PregnancySafetyTrigger[];
  labelZh: string;
  labelEn: string;
  summaryZh: string;
  summaryEn: string;
  dataNoteZh: string;
  dataNoteEn: string;
}

type Rule = {
  family: string;
  level: "avoid" | "caution";
  patterns: RegExp[];
  reasonZh: string;
  reasonEn: string;
};

const RULES: Rule[] = [
  {
    family: "Topical retinoids / 维A类",
    level: "avoid",
    patterns: [
      /\bretinol\b/i,
      /\bretinal(dehyde)?\b/i,
      /\btretinoin\b/i,
      /\badapalene\b/i,
      /\btazarotene\b/i,
      /\bisotretinoin\b/i,
      /\bretinyl\s+(palmitate|acetate|propionate|linoleate)\b/i,
      /hydroxypinacolone\s+retinoate/i,
      /retinoyl/i,
    ],
    reasonZh: "孕期通常建议避免外用维A类。",
    reasonEn: "Topical retinoids are generally avoided during pregnancy.",
  },
  {
    family: "Hydroquinone / 氢醌",
    level: "avoid",
    patterns: [/\bhydroquinone\b/i],
    reasonZh: "氢醌经皮吸收相对较高，孕期通常建议避免。",
    reasonEn: "Hydroquinone has relatively high dermal absorption and is generally avoided during pregnancy.",
  },
  {
    family: "Salicylic acid / 水杨酸",
    level: "caution",
    patterns: [/\bsalicylic\s+acid\b/i, /\bbha\b/i],
    reasonZh: "低浓度、小面积外用通常与高浓度焕肤不同；数据库缺少浓度和使用面积时按谨慎处理。",
    reasonEn: "Low-strength, limited-area topical use differs from high-strength peels; without concentration and exposure data this is flagged for caution.",
  },
  {
    family: "Arbutin / 熊果苷",
    level: "caution",
    patterns: [/\barbutin\b/i, /alpha[-\s]?arbutin/i, /beta[-\s]?arbutin/i],
    reasonZh: "孕期直接安全数据有限，且与氢醌代谢路径相关，按证据不足谨慎处理。",
    reasonEn: "Direct pregnancy safety data are limited and the ingredient is related to hydroquinone chemistry, so it is treated cautiously.",
  },
  {
    family: "Bakuchiol / 补骨脂酚",
    level: "caution",
    patterns: [/\bbakuchiol\b/i],
    reasonZh: "常被作为维A替代物，但孕期人体安全数据仍有限，不把“天然”直接等同于孕期安全。",
    reasonEn: "It is often marketed as a retinoid alternative, but human pregnancy safety data remain limited; natural does not automatically mean pregnancy-safe.",
  },
];

const LEVEL_COPY: Record<PregnancySafetyLevel, { zh: string; en: string }> = {
  avoid: { zh: "孕期建议避免", en: "Avoid during pregnancy" },
  caution: { zh: "孕期谨慎使用", en: "Use with caution in pregnancy" },
  "no-known-trigger": { zh: "未发现明确孕期触发项", en: "No known pregnancy trigger found" },
  "insufficient-data": { zh: "孕期安全信息不足", en: "Insufficient pregnancy-safety data" },
};

function normalizeIngredient(value: string) {
  return value.replace(/[（）()]/g, " ").replace(/\s+/g, " ").trim();
}

export function isPregnancySafetyMode(profile?: SkinProfileRecord | null): boolean {
  if (!profile) return false;
  const states = getSpecialSkinStates(profile);
  return profile.profileAnswers?.pregnancy === "yes" || states.includes("pregnancy_breastfeeding");
}

export function assessPregnancySafety(product: Pick<SharedProductRecord, "ingredients" | "ingredientListType" | "dataCompleteness">): PregnancySafetyAssessment {
  const ingredients = (product.ingredients || []).map(normalizeIngredient).filter(Boolean);
  const found: PregnancySafetyTrigger[] = [];

  for (const ingredient of ingredients) {
    for (const rule of RULES) {
      if (!rule.patterns.some((pattern) => pattern.test(ingredient))) continue;
      if (found.some((item) => item.family === rule.family && item.ingredient.toLowerCase() === ingredient.toLowerCase())) continue;
      found.push({ ingredient, family: rule.family, level: rule.level, reasonZh: rule.reasonZh, reasonEn: rule.reasonEn });
    }
  }

  const avoid = found.filter((item) => item.level === "avoid");
  const caution = found.filter((item) => item.level === "caution");
  const dataIsStrong = product.ingredientListType === "full" && product.dataCompleteness >= 80;
  const level: PregnancySafetyLevel = avoid.length ? "avoid" : caution.length ? "caution" : dataIsStrong ? "no-known-trigger" : "insufficient-data";
  const copy = LEVEL_COPY[level];

  const triggerZh = avoid.length
    ? `检测到 ${avoid.map((item) => item.ingredient).join("、")}，建议孕期避开。`
    : caution.length
      ? `检测到 ${caution.map((item) => item.ingredient).join("、")}，需要结合浓度、面积和使用方式判断。`
      : level === "no-known-trigger"
        ? "基于当前完整成分表，没有命中本系统的明确孕期避免/谨慎规则。"
        : "当前成分表不够完整，不能据此判断为孕期安全。";
  const triggerEn = avoid.length
    ? `Detected ${avoid.map((item) => item.ingredient).join(", ")}; avoidance is recommended during pregnancy.`
    : caution.length
      ? `Detected ${caution.map((item) => item.ingredient).join(", ")}; concentration, treated area, and use pattern matter.`
      : level === "no-known-trigger"
        ? "The current full ingredient list does not match this system's avoid/caution rules."
        : "The ingredient list is not complete enough to classify this product as pregnancy-safe.";

  return {
    level,
    triggers: found,
    labelZh: copy.zh,
    labelEn: copy.en,
    summaryZh: triggerZh,
    summaryEn: triggerEn,
    dataNoteZh: "这是护肤成分风险筛查，不等于医疗许可；处方药、医美和高浓度焕肤应由医生判断。",
    dataNoteEn: "This is an ingredient-risk screen, not medical clearance. Prescription treatments, procedures, and high-strength peels require clinician review.",
  };
}

export function pregnancySafetyRank(level: PregnancySafetyLevel): number {
  return level === "no-known-trigger" ? 0 : level === "insufficient-data" ? 1 : level === "caution" ? 2 : 3;
}
