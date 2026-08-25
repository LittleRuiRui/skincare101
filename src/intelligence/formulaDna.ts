export type FormulaSystemKey =
  | "lipid"
  | "barrier"
  | "hydration"
  | "preservation"
  | "oilControl"
  | "antiAging"
  | "soothing";

export type FormulaConfidence = "low" | "medium" | "high";
export type AlcoholLevel = "none" | "low" | "medium" | "high";

export interface FormulaSignal {
  ingredient: string;
  position: number;
  label: string;
}

export interface FormulaSystemResult {
  key: FormulaSystemKey;
  label: string;
  score: number;
  interpretation: string;
  signals: FormulaSignal[];
}

export interface FormulaDna {
  version: "formula-dna-v1";
  listType: "full" | "partial";
  baseType: string;
  topZone: string[];
  systems: Record<FormulaSystemKey, FormulaSystemResult>;
  alcohol: {
    level: AlcoholLevel;
    ingredient?: string;
    position?: number;
    note: string;
  };
  sensory: {
    labels: string[];
    summary: string;
    confidence: FormulaConfidence;
  };
  confidence: FormulaConfidence;
  caveats: string[];
}

interface FormulaProduct {
  ingredients: string[];
  ingredientListType?: "full" | "partial";
  dataCompleteness?: number;
  category?: string;
  formulaDna?: FormulaDna;
}

interface SystemRule {
  label: string;
  patterns: RegExp[];
  points: number;
  positionIndependent?: boolean;
}

const SYSTEM_LABELS: Record<FormulaSystemKey, string> = {
  lipid: "脂质体系",
  barrier: "屏障体系",
  hydration: "保湿体系",
  preservation: "防腐体系",
  oilControl: "控油体系",
  antiAging: "抗老体系",
  soothing: "舒缓体系",
};

const RULES: Record<FormulaSystemKey, SystemRule[]> = {
  lipid: [
    { label: "神经酰胺", patterns: [/ceramide|神经酰胺/i], points: 1.8, positionIndependent: true },
    { label: "胆固醇", patterns: [/cholesterol|胆固醇|beta.?sitosterol|谷甾醇/i], points: 1.4, positionIndependent: true },
    { label: "脂肪酸", patterns: [/stearic acid|palmitic acid|linoleic acid|oleic acid|fatty acid|硬脂酸|棕榈酸|亚油酸|油酸/i], points: 1.2 },
    { label: "角鲨烷", patterns: [/squalane|角鲨烷/i], points: 1.2 },
    { label: "油脂/脂类润肤剂", patterns: [/seed oil|kernel oil|fruit oil|植物油|籽油|petrolatum|矿脂|shea butter|乳木果|triglyceride|甘油三酯|ethylhexyl palmitate|c12-15 alkyl benzoate/i], points: 0.8 },
  ],
  barrier: [
    { label: "神经酰胺", patterns: [/ceramide|神经酰胺/i], points: 1.8, positionIndependent: true },
    { label: "胆固醇/植物甾醇", patterns: [/cholesterol|胆固醇|beta.?sitosterol|谷甾醇|phytosterol/i], points: 1.2, positionIndependent: true },
    { label: "屏障脂质前体", patterns: [/phytosphingosine|植物鞘氨醇|sphingosine/i], points: 1.2, positionIndependent: true },
    { label: "封闭保护", patterns: [/petrolatum|矿脂|dimethicone|聚二甲基硅氧烷|shea butter|乳木果/i], points: 0.9 },
    { label: "屏障支持活性", patterns: [/niacinamide|烟酰胺|panthenol|泛醇|beta.?glucan|β.?葡聚糖/i], points: 0.9, positionIndependent: true },
  ],
  hydration: [
    { label: "甘油", patterns: [/glycerin|glycerol|甘油/i], points: 1.2 },
    { label: "多元醇", patterns: [/butylene glycol|propanediol|pentylene glycol|propylene glycol|丁二醇|丙二醇|戊二醇|hexanediol|己二醇/i], points: 0.8 },
    { label: "透明质酸", patterns: [/hyaluron|透明质酸/i], points: 1, positionIndependent: true },
    { label: "天然保湿因子", patterns: [/urea|尿素|sodium pca|pca钠|amino acid|氨基酸|betaine|甜菜碱/i], points: 1, positionIndependent: true },
    { label: "糖类/多糖保湿", patterns: [/saccharide|xylitol|trehalose|糖类|木糖醇|海藻糖|biosaccharide|多糖/i], points: 0.8, positionIndependent: true },
    { label: "封闭锁水", patterns: [/petrolatum|矿脂|dimethicone|聚二甲基硅氧烷|squalane|角鲨烷/i], points: 0.7 },
  ],
  preservation: [
    { label: "主防腐剂", patterns: [/phenoxyethanol|苯氧乙醇|chlorphenesin|氯苯甘醚|paraben|尼泊金|imidazolidinyl urea|咪唑烷基脲/i], points: 1.6, positionIndependent: true },
    { label: "有机酸防腐", patterns: [/sodium benzoate|benzoic acid|potassium sorbate|sorbic acid|苯甲酸|山梨酸/i], points: 1.4, positionIndependent: true },
    { label: "防腐增效", patterns: [/ethylhexylglycerin|乙基己基甘油|caprylyl glycol|辛甘醇|1,2-hexanediol|1,2-己二醇|hydroxyacetophenone|羟基苯乙酮/i], points: 1.1, positionIndependent: true },
    { label: "螯合稳定", patterns: [/disodium edta|依地酸二钠|phytic acid|植酸|trisodium ethylenediamine disuccinate/i], points: 0.8, positionIndependent: true },
  ],
  oilControl: [
    { label: "烟酰胺", patterns: [/niacinamide|烟酰胺/i], points: 1.3, positionIndependent: true },
    { label: "锌盐", patterns: [/zinc pca|锌pca|zinc gluconate|葡萄糖酸锌/i], points: 1.3, positionIndependent: true },
    { label: "角质/毛孔调理", patterns: [/salicylic acid|水杨酸|bha/i], points: 1.5, positionIndependent: true },
    { label: "吸油粉体", patterns: [/silica|二氧化硅|kaolin|高岭土|bentonite|膨润土|nylon-12|尼龙-12|starch|淀粉/i], points: 1 },
    { label: "清爽挥发体系", patterns: [/alcohol denat|ethanol|变性酒精|isododecane|异十二烷|cyclopentasiloxane|环五聚二甲基硅氧烷/i], points: 0.7 },
  ],
  antiAging: [
    { label: "维A类", patterns: [/retinol|retinal|retinyl|视黄醇|视黄醛|维a/i], points: 2.2, positionIndependent: true },
    { label: "胜肽", patterns: [/peptide|tripeptide|tetrapeptide|hexapeptide|oligopeptide|胜肽|肽-/i], points: 1.6, positionIndependent: true },
    { label: "维C体系", patterns: [/ascorbic acid|ascorbyl|抗坏血酸|维生素c/i], points: 1.5, positionIndependent: true },
    { label: "抗氧化网络", patterns: [/tocopher|生育酚|ferulic acid|阿魏酸|resveratrol|白藜芦醇|coenzyme q10|辅酶q10/i], points: 1, positionIndependent: true },
    { label: "更新型酸类", patterns: [/glycolic acid|lactic acid|mandelic acid|果酸|乳酸|杏仁酸|pha|gluconolactone/i], points: 1.3, positionIndependent: true },
    { label: "烟酰胺", patterns: [/niacinamide|烟酰胺/i], points: 0.8, positionIndependent: true },
    { label: "腺苷", patterns: [/adenosine|腺苷/i], points: 0.9, positionIndependent: true },
  ],
  soothing: [
    { label: "泛醇", patterns: [/panthenol|泛醇/i], points: 1.3, positionIndependent: true },
    { label: "积雪草体系", patterns: [/centella|madecass|asiaticoside|积雪草|羟基积雪草/i], points: 1.3, positionIndependent: true },
    { label: "燕麦体系", patterns: [/avena sativa|oat|燕麦/i], points: 1.2, positionIndependent: true },
    { label: "甘草体系", patterns: [/glycyrrh|licorice|甘草/i], points: 1.2, positionIndependent: true },
    { label: "尿囊素", patterns: [/allantoin|尿囊素/i], points: 1.1, positionIndependent: true },
    { label: "β-葡聚糖", patterns: [/beta.?glucan|β.?葡聚糖/i], points: 1.1, positionIndependent: true },
    { label: "红没药醇", patterns: [/bisabolol|红没药醇/i], points: 1, positionIndependent: true },
  ],
};

const DRYING_ALCOHOL = /(^|[^a-z])(alcohol denat|sd alcohol|ethanol|ethyl alcohol)([^a-z]|$)|变性酒精|乙醇/i;
const FATTY_ALCOHOL = /cetearyl alcohol|cetyl alcohol|stearyl alcohol|behenyl alcohol|鲸蜡硬脂醇|鲸蜡醇|硬脂醇|山嵛醇/i;

const hasAny = (ingredient: string, patterns: RegExp[]) => patterns.some((pattern) => pattern.test(ingredient));

const positionMultiplier = (position: number, positionIndependent = false) => {
  if (positionIndependent) return position <= 15 ? 1 : 0.85;
  if (position <= 5) return 1;
  if (position <= 10) return 0.75;
  if (position <= 15) return 0.5;
  return 0.3;
};

const scoreInterpretation = (score: number) => {
  if (score >= 5) return "体系完整";
  if (score >= 4) return "体系较强";
  if (score >= 3) return "有明确支持";
  if (score >= 2) return "有部分支持";
  if (score >= 1) return "轻度涉及";
  return "未从配料表识别";
};

function scoreSystem(key: FormulaSystemKey, ingredients: string[]): FormulaSystemResult {
  const signals: FormulaSignal[] = [];
  let rawScore = 0;

  for (const rule of RULES[key]) {
    const index = ingredients.findIndex((ingredient) => hasAny(ingredient, rule.patterns));
    if (index < 0) continue;
    rawScore += rule.points * positionMultiplier(index + 1, rule.positionIndependent);
    signals.push({ ingredient: ingredients[index], position: index + 1, label: rule.label });
  }

  if (key === "barrier") {
    const hasCeramide = signals.some((signal) => signal.label === "神经酰胺");
    const hasSterol = signals.some((signal) => signal.label === "胆固醇/植物甾醇");
    const hasLipid = scoreSystemRaw("lipid", ingredients) >= 1.5;
    const hasHumectant = scoreSystemRaw("hydration", ingredients) >= 1.5;
    if (hasCeramide && hasSterol) rawScore += 0.8;
    if (hasLipid && hasHumectant) rawScore += 0.7;
  }

  if (key === "hydration") {
    const hasHumectants = signals.filter((signal) => signal.label !== "封闭锁水").length >= 2;
    const hasOcclusive = signals.some((signal) => signal.label === "封闭锁水");
    if (hasHumectants && hasOcclusive) rawScore += 0.7;
  }

  const score = Math.max(0, Math.min(5, Math.round(rawScore)));
  return { key, label: SYSTEM_LABELS[key], score, interpretation: scoreInterpretation(score), signals };
}

function scoreSystemRaw(key: FormulaSystemKey, ingredients: string[]) {
  return RULES[key].reduce((total, rule) => {
    const index = ingredients.findIndex((ingredient) => hasAny(ingredient, rule.patterns));
    return index < 0 ? total : total + rule.points * positionMultiplier(index + 1, rule.positionIndependent);
  }, 0);
}

function inferBaseType(ingredients: string[], category = "") {
  const firstThree = ingredients.slice(0, 3).join(" ");
  const firstSix = ingredients.slice(0, 6).join(" ");
  if (/洁面|cleanser|cleansing/i.test(category) || /coco.*betaine|glucoside|sarcosinate|sulfate|surfactant|表活/i.test(firstSix)) return "清洁表活基底";
  if (DRYING_ALCOHOL.test(firstThree) && !FATTY_ALCOHOL.test(firstThree)) return "水醇型基底";
  if (/cyclopentasiloxane|dimethicone|siloxane|硅氧烷|硅油/i.test(firstThree)) return "硅感基底";
  if (/water|aqua|eau|水/i.test(ingredients[0] || "")) return "水基配方";
  if (/oil|squalane|triglyceride|油|角鲨烷|甘油三酯/i.test(firstThree)) return "油基/无水配方";
  return "混合基底";
}

function inferAlcohol(ingredients: string[], fullList: boolean) {
  const index = ingredients.findIndex((ingredient) => DRYING_ALCOHOL.test(ingredient) && !FATTY_ALCOHOL.test(ingredient));
  if (index < 0) {
    return {
      level: "none" as AlcoholLevel,
      note: fullList ? "完整配料表中未识别到乙醇或变性酒精。" : "当前资料未识别到乙醇；部分配方不能据此断言无酒精。",
    };
  }
  const position = index + 1;
  const level: AlcoholLevel = position <= 5 ? "high" : position <= 10 ? "medium" : "low";
  return {
    level,
    ingredient: ingredients[index],
    position,
    note: `${ingredients[index]} 位于第 ${position} 位，推测为${level === "high" ? "较高" : level === "medium" ? "中等" : "较低"}含量；1%以下成分顺序可能不代表精确浓度。`,
  };
}

function inferSensory(ingredients: string[], alcoholLevel: AlcoholLevel, confidence: FormulaConfidence) {
  const text = ingredients.join(" ");
  const labels: string[] = [];
  if (alcoholLevel === "high" || /cyclopentasiloxane|isododecane|isohexadecane|环五聚二甲基硅氧烷|异十二烷|异十六烷/i.test(text)) labels.push("挥发快");
  if (/dimethicone|siloxane|dimethiconol|聚二甲基硅氧烷|硅氧烷/i.test(text)) labels.push("顺滑硅感");
  if (/silica|kaolin|bentonite|nylon-12|starch|二氧化硅|高岭土|膨润土|尼龙-12|淀粉/i.test(text)) labels.push("偏哑光");
  if (/petrolatum|shea butter|beeswax|wax|矿脂|乳木果|蜂蜡|蜡/i.test(text)) labels.push("偏厚润");
  if (/squalane|seed oil|kernel oil|triglyceride|角鲨烷|籽油|甘油三酯/i.test(text)) labels.push("柔润油感");
  if (/acrylates|copolymer|polymer|gum|carbomer|丙烯酸|共聚物|胶|卡波姆/i.test(text)) labels.push("有成膜感");
  if (labels.length === 0) labels.push("常规乳液感");
  return {
    labels: [...new Set(labels)].slice(0, 4),
    summary: `推测${[...new Set(labels)].slice(0, 3).join("、")}；实际肤感仍受浓度、工艺和用量影响。`,
    confidence,
  };
}

export function analyzeFormulaDna(product: FormulaProduct): FormulaDna {
  if (product.formulaDna?.version === "formula-dna-v1") return product.formulaDna;
  const ingredients = (product.ingredients || []).filter(Boolean);
  const completeness = product.dataCompleteness ?? (product.ingredientListType === "full" ? 100 : 50);
  const fullList = product.ingredientListType === "full";
  const confidence: FormulaConfidence = fullList && completeness >= 85 && ingredients.length >= 8
    ? "high"
    : completeness >= 60 && ingredients.length >= 5
      ? "medium"
      : "low";
  const alcohol = inferAlcohol(ingredients, fullList);

  const systems = (Object.keys(SYSTEM_LABELS) as FormulaSystemKey[]).reduce(
    (result, key) => ({ ...result, [key]: scoreSystem(key, ingredients) }),
    {} as Record<FormulaSystemKey, FormulaSystemResult>,
  );

  const caveats = ["前10–15位主要用于识别配方骨架；低浓度高效活性物和防腐剂按成分角色单独加权。"];
  if (!fullList) caveats.push("当前只有部分配方，未出现不等于产品一定不含有，体系评分仅作初步参考。");
  if (fullList) caveats.push("1%及以下成分可能不按浓度排序，位置不能换算成精确百分比。");

  return {
    version: "formula-dna-v1",
    listType: fullList ? "full" : "partial",
    baseType: fullList ? inferBaseType(ingredients, product.category) : "部分配方·基底未知",
    topZone: ingredients.slice(0, 15),
    systems,
    alcohol,
    sensory: inferSensory(ingredients, alcohol.level, confidence),
    confidence,
    caveats,
  };
}

export const FORMULA_SYSTEM_ORDER: FormulaSystemKey[] = [
  "lipid",
  "barrier",
  "hydration",
  "oilControl",
  "antiAging",
  "soothing",
  "preservation",
];
