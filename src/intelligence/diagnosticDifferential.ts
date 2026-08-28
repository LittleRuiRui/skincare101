import { scoreCandidates, type RankedCandidate, type SymptomTree } from "./confidenceEngine.ts";
import type { SkinProfileRecord } from "../lib/skinProfile.ts";

export type DiagnosticFindingKey =
  | "barrier_damage"
  | "rosacea_tendency"
  | "sensitive_reactivity"
  | "over_exfoliation"
  | "seborrheic_dermatitis_possible"
  | "acne_vulgaris_tendency"
  | "product_induced_breakout"
  | "malassezia_folliculitis_possible"
  | "dehydration"
  | "oil_congestion"
  | "post_inflammatory_pigmentation"
  | "photoaging";

export interface DiagnosticFinding {
  key: DiagnosticFindingKey;
  labelZh: string;
  labelEn: string;
  score: number;
  level: "low" | "moderate" | "high";
  supporting: string[];
  contradicting: string[];
  risk: string[];
  sourceConcern: string;
}

const REDNESS_TREE: SymptomTree = {
  candidates: {
    barrier: "屏障受损型泛红",
    rosacea: "玫瑰痤疮倾向",
    sensitive: "单纯敏感反应",
    overexfoliate: "过度去角质",
    seborrheic: "脂溢性皮炎可能",
  },
  questions: [
    { key: "onset", q: "泛红持续时间", options: [
      { v: "acute", l: "近期突然出现", signals: { barrier: { delta: 25, label: "急性起病" }, overexfoliate: { delta: 15, label: "急性起病" }, rosacea: { delta: -10 } } },
      { v: "chronic", l: "一个月以上反复", signals: { rosacea: { delta: 20, label: "慢性反复病程" }, sensitive: { delta: 20, label: "慢性反复病程" }, barrier: { delta: -10 } } },
    ] },
    { key: "trigger", q: "近期诱因", multi: true, options: [
      { v: "product", l: "近期更换新产品", signals: { barrier: { delta: 10, label: "近期换新产品" } } },
      { v: "exfoliate", l: "近期去角质/焕肤", signals: { overexfoliate: { delta: 30, label: "近期高频去角质" }, barrier: { delta: 10, label: "近期高频去角质" } } },
      { v: "season", l: "环境变化", signals: { sensitive: { delta: 10, label: "环境变化诱发" } } },
      { v: "none", l: "没有明显外部诱因", signals: { rosacea: { delta: 15, label: "无明确外部诱因" }, sensitive: { delta: 10, label: "无明确外部诱因" }, barrier: { delta: -15 } } },
    ] },
    { key: "feel", q: "是否刺痛紧绷", options: [
      { v: "yes", l: "伴随刺痛/紧绷", signals: { barrier: { delta: 25, label: "伴随刺痛/紧绷" }, overexfoliate: { delta: 10, label: "伴随刺痛/紧绷" } } },
      { v: "no", l: "仅视觉泛红", signals: { rosacea: { delta: 15, label: "视觉泛红但无明显不适" }, sensitive: { delta: 10, label: "视觉泛红但无明显不适" }, barrier: { delta: -15 } } },
    ] },
    { key: "flush", q: "热/酒精/情绪是否诱发", options: [
      { v: "yes", l: "热/酒精/情绪触发且消退慢", signals: { rosacea: { delta: 35, label: "典型潮红触发模式" } } },
      { v: "no", l: "没有明显潮红触发", signals: { rosacea: { delta: -20 } } },
    ] },
    { key: "scale", q: "是否有油腻鳞屑", options: [
      { v: "yes", l: "鼻翼/眉间/发际线油腻鳞屑", signals: { seborrheic: { delta: 35, label: "油腻鳞屑及典型部位" }, barrier: { delta: -15 } } },
      { v: "no", l: "没有油腻鳞屑", signals: { seborrheic: { delta: -20 } } },
    ] },
  ],
};

const ACNE_TREE: SymptomTree = {
  candidates: {
    true_acne: "痤疮倾向",
    product_induced: "产品诱发爆痘",
    pseudo: "屏障受损相关爆痘",
    fungal_acne: "马拉色菌毛囊炎可能",
  },
  questions: [
    { key: "onset", q: "爆痘持续时间", options: [
      { v: "acute", l: "近期突然出现", signals: { product_induced: { delta: 20, label: "急性突发" }, pseudo: { delta: 10, label: "急性突发" }, true_acne: { delta: -10 } } },
      { v: "chronic", l: "一个月以上反复", signals: { true_acne: { delta: 25, label: "慢性反复病程" }, pseudo: { delta: -5 } } },
    ] },
    { key: "trigger", q: "近期诱因", multi: true, options: [
      { v: "product", l: "近期更换护肤/防晒/彩妆", signals: { product_induced: { delta: 30, label: "近期换新产品" } } },
      { v: "exfoliate", l: "近期去角质/焕肤", signals: { pseudo: { delta: 15, label: "近期高频去角质" }, product_induced: { delta: 10, label: "近期高频去角质" } } },
      { v: "diet", l: "作息饮食压力变化", signals: { true_acne: { delta: 10, label: "作息/饮食/压力变化" } } },
      { v: "cycle", l: "生理周期相关", signals: { true_acne: { delta: 20, label: "生理周期相关" } } },
      { v: "none", l: "无明显诱因", signals: { true_acne: { delta: 10, label: "无明确外部诱因" } } },
    ] },
    { key: "fungal", q: "马拉色菌相关线索", multi: true, options: [
      { v: "chest_back", l: "胸背/发际线为主", signals: { fungal_acne: { delta: 25, label: "胸背/发际线分布" } } },
      { v: "uniform", l: "丘疹大小高度一致", signals: { fungal_acne: { delta: 20, label: "皮损大小高度均匀" } } },
      { v: "itchy", l: "明显瘙痒", signals: { fungal_acne: { delta: 20, label: "瘙痒明显" }, true_acne: { delta: -10 } } },
      { v: "no_resolve", l: "常规祛痘处理无效", signals: { fungal_acne: { delta: 25, label: "常规祛痘处理无效" } } },
      { v: "none", l: "没有相关线索", signals: { fungal_acne: { delta: -20 } } },
    ] },
    { key: "inflamed", q: "是否红肿疼痛", options: [
      { v: "no", l: "以粉刺/小颗粒为主", signals: { true_acne: { delta: 15, label: "粉刺型表现" }, pseudo: { delta: -10 } } },
      { v: "yes", l: "存在红肿疼痛", signals: { true_acne: { delta: 5, label: "炎症性表现" } } },
    ] },
    { key: "depth", q: "皮损深度", options: [
      { v: "deep", l: "深层皮下结节/包块", signals: { true_acne: { delta: 25, label: "深层皮损" } } },
      { v: "surface", l: "浅表皮损", signals: { true_acne: { delta: 5, label: "浅表皮损" } } },
    ] },
  ],
};

const findingMap: Record<string, { key: DiagnosticFindingKey; zh: string; en: string }> = {
  barrier: { key: "barrier_damage", zh: "屏障受损可能", en: "Possible barrier impairment" },
  rosacea: { key: "rosacea_tendency", zh: "玫瑰痤疮倾向", en: "Rosacea tendency" },
  sensitive: { key: "sensitive_reactivity", zh: "敏感反应倾向", en: "Reactive sensitivity tendency" },
  overexfoliate: { key: "over_exfoliation", zh: "过度去角质可能", en: "Possible over-exfoliation" },
  seborrheic: { key: "seborrheic_dermatitis_possible", zh: "脂溢性皮炎可能", en: "Possible seborrheic dermatitis" },
  true_acne: { key: "acne_vulgaris_tendency", zh: "痤疮倾向", en: "Acne vulgaris tendency" },
  product_induced: { key: "product_induced_breakout", zh: "产品诱发爆痘可能", en: "Possible product-induced breakout" },
  fungal_acne: { key: "malassezia_folliculitis_possible", zh: "马拉色菌毛囊炎可能", en: "Possible Malassezia folliculitis" },
  pseudo: { key: "barrier_damage", zh: "屏障受损相关爆痘可能", en: "Possible barrier-related breakout" },
};

function convert(candidates: RankedCandidate[], sourceConcern: string): DiagnosticFinding[] {
  return candidates.map(candidate => {
    const mapped = findingMap[candidate.key];
    return {
      key: mapped.key,
      labelZh: mapped.zh,
      labelEn: mapped.en,
      score: candidate.pct,
      level: candidate.confidence.level,
      supporting: candidate.supporting,
      contradicting: candidate.contradicting,
      risk: candidate.risk,
      sourceConcern,
    };
  });
}

function genericFindings(profile: SkinProfileRecord): DiagnosticFinding[] {
  const findings: DiagnosticFinding[] = [];
  const selected = new Set(profile.selectedSymptoms || []);
  const push = (key: DiagnosticFindingKey, zh: string, en: string, score: number, sourceConcern: string, supporting: string[]) => findings.push({ key, labelZh: zh, labelEn: en, score, level: score >= 70 ? "high" : score >= 45 ? "moderate" : "low", supporting, contradicting: [], risk: [], sourceConcern });
  if (selected.has("dryness")) push("dehydration", "缺水 / 保湿不足倾向", "Dehydration tendency", 60, "dryness", ["你选择了干燥/缺水相关表现"]);
  if (selected.has("pores")) push("oil_congestion", "油脂与角化堵塞倾向", "Oil/congestion tendency", 60, "pores", ["你选择了毛孔相关表现"]);
  if (selected.has("pigmentation")) push("post_inflammatory_pigmentation", "炎症后色沉 / 色素沉着倾向", "Pigmentation tendency", 55, "pigmentation", ["你选择了色沉相关表现"]);
  if (selected.has("aging")) push("photoaging", "光老化 / 初老管理需求", "Photoaging / early-aging concern", 50, "aging", ["你选择了细纹或抗老相关表现"]);
  return findings;
}

export function buildDiagnosticDifferential(profile: SkinProfileRecord): DiagnosticFinding[] {
  const findings: DiagnosticFinding[] = [];
  if ((profile.selectedSymptoms || []).includes("redness")) {
    findings.push(...convert(scoreCandidates(REDNESS_TREE, profile.symptomAnswers?.redness || {}, profile.multiSelectAnswers?.redness || {}), "redness"));
  }
  if ((profile.selectedSymptoms || []).includes("acne")) {
    findings.push(...convert(scoreCandidates(ACNE_TREE, profile.symptomAnswers?.acne || {}, profile.multiSelectAnswers?.acne || {}), "acne"));
  }
  findings.push(...genericFindings(profile));
  return findings.sort((a, b) => b.score - a.score);
}

export function clinicallyRelevantFindings(profile: SkinProfileRecord, threshold = 45): DiagnosticFinding[] {
  return buildDiagnosticDifferential(profile).filter(item => item.score >= threshold);
}
