import type { SkinProfileRecord } from "../lib/skinProfile.ts";
import type { BrowseConcern } from "../lib/productPresentation.ts";

export type RoutineGoal = "Acne" | "Blackheads" | "Pores" | "Redness" | "Barrier" | "Dehydration" | "Pigmentation" | "Dullness" | "Fine lines" | "Firmness" | "Oil control";
export type RoutineComplexity = "minimal" | "standard";
export type ActiveTolerance = "none" | "beginner" | "experienced";

export interface RoutineTemplate {
  concern: BrowseConcern;
  am: string[];
  pm: string[];
  note: string;
}

export const ROUTINE_GOALS: RoutineGoal[] = ["Acne", "Blackheads", "Pores", "Redness", "Barrier", "Dehydration", "Pigmentation", "Dullness", "Fine lines", "Firmness", "Oil control"];

export const ROUTINE_TEMPLATES: Record<RoutineGoal, RoutineTemplate> = {
  Acne: { concern: "acne", am: ["Gentle cleanser", "Light moisturizer", "Broad-spectrum SPF"], pm: ["Cleanser", "BHA or acne treatment", "Barrier-support moisturizer"], note: "先控制刺激总量，不把所有祛痘活性叠在同一晚。" },
  Blackheads: { concern: "pores", am: ["Gentle cleanser", "Light moisturizer", "Broad-spectrum SPF"], pm: ["Cleanser", "BHA 2–3× weekly", "Light moisturizer"], note: "黑头需要持续管理角栓；频繁挤压只会增加刺激。" },
  Pores: { concern: "pores", am: ["Gentle cleanser", "Niacinamide / lightweight serum", "SPF"], pm: ["Cleanser", "BHA 2–3× weekly", "Light moisturizer"], note: "毛孔外观更依赖油脂、角栓和光损伤管理，而不是‘收缩毛孔’。" },
  Redness: { concern: "redness", am: ["Low-irritation cleanser", "Soothing serum", "Barrier moisturizer", "SPF"], pm: ["Gentle cleanser", "Barrier serum", "Moisturizer"], note: "泛红优先稳定屏障和触发因素，再考虑更积极的功效。" },
  Barrier: { concern: "barrier", am: ["Rinse / gentle cleanser", "Humectant serum", "Ceramide moisturizer", "SPF"], pm: ["Gentle cleanser", "Barrier serum", "Ceramide-rich moisturizer"], note: "屏障期减少酸、A醇和频繁更换产品。" },
  Dehydration: { concern: "hydration", am: ["Gentle cleanser", "Humectant serum", "Moisturizer", "SPF"], pm: ["Cleanser", "Hydrating essence / serum", "Moisturizer"], note: "缺水不等于缺油；油皮也可以脱水。" },
  Pigmentation: { concern: "pigmentation", am: ["Gentle cleanser", "Vitamin C / brightening serum", "SPF"], pm: ["Cleanser", "Tranexamic acid / retinoid depending on tolerance", "Moisturizer"], note: "色沉方案里防晒是主步骤，不是最后补的一步。" },
  Dullness: { concern: "pigmentation", am: ["Gentle cleanser", "Antioxidant serum", "SPF"], pm: ["Cleanser", "Gentle exfoliation 1–2× weekly", "Moisturizer"], note: "暗沉可能来自缺水、角质、炎症或色沉，先用低频方案判断来源。" },
  "Fine lines": { concern: "aging", am: ["Hydrating serum", "Antioxidant serum", "Moisturizer", "SPF"], pm: ["Cleanser", "Retinoid if tolerated", "Moisturizer"], note: "先把缺水细纹和真正的结构性细纹分开。" },
  Firmness: { concern: "aging", am: ["Antioxidant serum", "Moisturizer", "SPF"], pm: ["Cleanser", "Retinoid / peptide treatment", "Moisturizer"], note: "紧致依赖长期防晒和可持续活性，不靠一次性的紧绷肤感。" },
  "Oil control": { concern: "pores", am: ["Gentle cleanser", "Niacinamide serum", "Light moisturizer", "SPF"], pm: ["Cleanser", "BHA 2–3× weekly", "Light moisturizer"], note: "控油不等于过度清洁；脱水可能让出油体验更明显。" },
};

export function buildRoutine(goal: RoutineGoal, complexity: RoutineComplexity) {
  const template = ROUTINE_TEMPLATES[goal];
  if (complexity === "standard") return template;
  const trim = (steps: string[]) => steps.filter((step) => !/serum|essence|antioxidant/i.test(step));
  return { ...template, am: trim(template.am), pm: trim(template.pm) };
}

export function routineGuardrails(profile: SkinProfileRecord | null, goal: RoutineGoal, tolerance: ActiveTolerance): string[] {
  const sensitive = profile?.skinAnswers?.sensitive === "yes";
  const barrierGoal = goal === "Barrier" || goal === "Redness";
  const notes: string[] = [];
  if (sensitive || barrierGoal) notes.push("敏感／屏障限制已开启：一次只新增一个活性，先做局部耐受测试。 ");
  if (tolerance === "none") notes.push("暂不安排A醇或强酸；先连续使用基础护理2–4周。 ");
  if (tolerance === "beginner" && ["Acne", "Blackheads", "Pores", "Dullness", "Fine lines", "Firmness"].includes(goal)) notes.push("功效产品从每周1–2晚开始，耐受后再增加频率。 ");
  if (["Pigmentation", "Dullness", "Fine lines", "Firmness"].includes(goal)) notes.push("同一晚避免把强酸和A醇叠加；维C可优先放在早间。 ");
  notes.push("若出现持续刺痛、肿胀、渗出或快速加重，应停止新产品并寻求医疗意见。 ");
  return notes.map((note) => note.trim());
}

export function categoryForRoutineStep(step: string) {
  const value = step.toLowerCase();
  if (value.includes("clean") || value.includes("rinse")) return "洁面";
  if (value.includes("spf")) return "防晒";
  if (value.includes("moistur") || value.includes("ceramide")) return "乳霜";
  if (value.includes("bha") || value.includes("treatment") || value.includes("retinoid") || value.includes("exfoliation")) return "祛痘";
  return "精华";
}
