export interface SkinProfileRecord {
  skinAnswers: Record<string, string>;
  profileAnswers: Record<string, string>;
  selectedSymptoms: string[];
  symptomAnswers: Record<string, Record<string, string>>;
  multiSelectAnswers: Record<string, Record<string, string[]>>;
  redFlag: string | null;
  updatedAt?: string;
}

export interface SkinProfileSummary {
  skinType: string;
  sensitivity: string;
  concerns: string[];
  context: string[];
  isComplete: boolean;
}

const SKIN_TYPE_LABELS: Record<string, string> = {
  dry: "偏干",
  oily: "偏油",
  balanced: "中性 / 平衡",
  combination: "混合",
};

const SYMPTOM_LABELS: Record<string, string> = {
  redness: "泛红",
  acne: "痘痘",
  pores: "毛孔",
  pigmentation: "色沉",
  dryness: "干燥",
  sensitivity: "敏感",
  aging: "细纹 / 抗老",
};

export function summarizeSkinProfile(profile?: SkinProfileRecord | null): SkinProfileSummary {
  if (!profile) {
    return {
      skinType: "尚未建档",
      sensitivity: "未知",
      concerns: [],
      context: [],
      isComplete: false,
    };
  }

  const wash = profile.skinAnswers?.wash;
  const oil = profile.skinAnswers?.oil;
  let skinType = SKIN_TYPE_LABELS[wash] || SKIN_TYPE_LABELS[oil] || "已建档";
  if (wash === "dry" && oil === "oily") skinType = "混合偏油 / 缺水";

  const sensitive = profile.skinAnswers?.sensitive;
  const sensitivity = sensitive === "yes" ? "敏感倾向" : sensitive === "no" ? "耐受相对稳定" : "未确认";

  const concerns = (profile.selectedSymptoms || []).map((key) => SYMPTOM_LABELS[key] || key);
  const context: string[] = [];
  if (profile.profileAnswers?.pregnancy === "yes") context.push("孕期 / 哺乳期安全优先");
  if (profile.redFlag && profile.redFlag !== "none") context.push("存在需要优先就医评估的信号");

  return {
    skinType,
    sensitivity,
    concerns,
    context,
    isComplete: Object.keys(profile.skinAnswers || {}).length > 0,
  };
}

export function profileToRecommendationKey(profile?: SkinProfileRecord | null): string | null {
  if (!profile) return null;
  const priorities = ["redness", "acne", "pores", "pigmentation", "dryness", "aging"];
  return priorities.find((key) => profile.selectedSymptoms?.includes(key)) || null;
}
