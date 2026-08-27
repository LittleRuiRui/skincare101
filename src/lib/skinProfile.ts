export interface SkinProfileRecord {
  id: string;
  name: string;
  isActive: boolean;
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
  specialStates: string[];
  activeLoad: "low" | "moderate" | "high";
  isComplete: boolean;
}

const SKIN_TYPE_LABELS: Record<string, string> = {
  dry: "偏干",
  oily: "偏油",
  balanced: "中性 / 平衡",
  combination: "混合",
  combo: "混合",
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

const SPECIAL_STATE_LABELS: Record<string, string> = {
  acid: "刷酸 / 去角质期",
  retinoid: "A醇 / 维A类使用期",
  sensitive_flare: "敏感 / 屏障不稳定期",
  procedure_recovery: "医美 / 焕肤恢复期",
  breakout: "爆痘期",
  environment_change: "环境变化期",
  pregnancy_breastfeeding: "孕期 / 哺乳期",
};

export function getSpecialSkinStates(profile?: SkinProfileRecord | null): string[] {
  if (!profile) return [];
  return (profile.profileAnswers?.special_states || "").split(",").map(item => item.trim()).filter(Boolean);
}

export function summarizeSkinProfile(profile?: SkinProfileRecord | null): SkinProfileSummary {
  if (!profile) {
    return {
      skinType: "尚未建档",
      sensitivity: "未知",
      concerns: [],
      context: [],
      specialStates: [],
      activeLoad: "low",
      isComplete: false,
    };
  }

  const wash = profile.skinAnswers?.wash;
  const oil = profile.skinAnswers?.oil;
  let skinType = SKIN_TYPE_LABELS[wash] || SKIN_TYPE_LABELS[oil] || "已建档";
  if ((wash === "dry" || wash === "combo") && oil === "oily") skinType = "混合偏油 / 缺水";

  const sensitive = profile.skinAnswers?.sensitive;
  const sensitivity = sensitive === "yes" ? "敏感倾向" : sensitive === "no" ? "耐受相对稳定" : "未确认";

  const concerns = (profile.selectedSymptoms || []).map((key) => SYMPTOM_LABELS[key] || key);
  const specialStates = getSpecialSkinStates(profile);
  const context = specialStates.map(key => SPECIAL_STATE_LABELS[key] || key);
  if (profile.profileAnswers?.pregnancy === "yes" && !specialStates.includes("pregnancy_breastfeeding")) context.push("孕期 / 哺乳期安全优先");
  if (specialStates.includes("acid")) {
    const frequency = profile.profileAnswers?.acid_frequency;
    if (frequency === "high") context.push("刷酸频率较高");
    else if (frequency === "regular") context.push("规律刷酸");
  }
  if (specialStates.includes("retinoid")) {
    const stage = profile.profileAnswers?.retinoid_stage;
    if (stage === "starting") context.push("正在建立 A 醇耐受");
    if (stage === "increased") context.push("近期提高 A 醇浓度 / 频率");
  }
  if (specialStates.includes("environment_change")) {
    const direction = profile.profileAnswers?.environment_direction;
    if (direction === "cold_dry") context.push("环境更冷 / 更干");
    if (direction === "hot_humid") context.push("环境更热 / 更潮湿");
    if (direction === "aircon") context.push("长期空调环境");
  }
  if (profile.redFlag && profile.redFlag !== "none") context.push("存在需要优先就医评估的信号");

  let activeLoad: SkinProfileSummary["activeLoad"] = "low";
  if (specialStates.includes("sensitive_flare") || specialStates.includes("procedure_recovery") || profile.profileAnswers?.acid_frequency === "high" || profile.profileAnswers?.retinoid_stage === "increased") activeLoad = "high";
  else if (specialStates.includes("acid") || specialStates.includes("retinoid") || specialStates.includes("breakout")) activeLoad = "moderate";

  return {
    skinType,
    sensitivity,
    concerns,
    context,
    specialStates,
    activeLoad,
    isComplete: Object.keys(profile.skinAnswers || {}).length > 0,
  };
}

export function profileToRecommendationKey(profile?: SkinProfileRecord | null): string | null {
  if (!profile) return null;
  const states = getSpecialSkinStates(profile);
  if (states.includes("sensitive_flare") || states.includes("procedure_recovery")) return "redness";
  if (states.includes("breakout")) return "acne";
  const priorities = ["redness", "acne", "pores", "pigmentation", "dryness", "aging"];
  return priorities.find((key) => profile.selectedSymptoms?.includes(key)) || null;
}
