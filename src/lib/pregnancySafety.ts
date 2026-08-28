import type { SharedProductRecord } from "./supabase";
import type { SkinProfileRecord } from "./skinProfile.ts";
import { getSpecialSkinStates } from "./skinProfile.ts";

export type PregnancySafetyLevel = "risk" | "no-known-trigger" | "insufficient-data";

export interface PregnancySafetyTrigger {
  ingredient: string;
  family: string;
  level: "risk";
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

type Rule = { family:string; patterns:RegExp[]; reasonZh:string; reasonEn:string };

// Deliberately conservative product-level screen: any matched pregnancy-related
// ingredient is presented as a risk product. We do not ask consumers to judge
// concentration, treated area, or exposure pattern themselves.
const RULES:Rule[]=[
 {family:"Topical retinoids / 维A类",patterns:[/\bretinol\b/i,/\bretinal(dehyde)?\b/i,/\btretinoin\b/i,/\badapalene\b/i,/\btazarotene\b/i,/\bisotretinoin\b/i,/\bretinyl\s+(palmitate|acetate|propionate|linoleate)\b/i,/hydroxypinacolone\s+retinoate/i,/retinoyl/i],reasonZh:"命中维A相关成分，孕期安全模式按风险产品处理。",reasonEn:"A retinoid-related ingredient was detected, so this product is treated as a risk product in pregnancy safety mode."},
 {family:"Hydroquinone / 氢醌",patterns:[/\bhydroquinone\b/i],reasonZh:"命中氢醌，孕期安全模式按风险产品处理。",reasonEn:"Hydroquinone was detected, so this product is treated as a risk product in pregnancy safety mode."},
 {family:"Salicylic acid / 水杨酸",patterns:[/\bsalicylic\s+acid\b/i,/\bbha\b/i],reasonZh:"命中水杨酸；即使实际风险与浓度、面积和使用方式有关，本产品模式仍统一标为风险。",reasonEn:"Salicylic acid was detected. Although exposure depends on strength, area, and use pattern, this product is conservatively flagged as risk."},
 {family:"Arbutin / 熊果苷",patterns:[/\barbutin\b/i,/alpha[-\s]?arbutin/i,/beta[-\s]?arbutin/i],reasonZh:"命中熊果苷；孕期直接安全数据有限，统一按风险产品处理。",reasonEn:"Arbutin was detected. Direct pregnancy safety data are limited, so the product is conservatively flagged as risk."},
 {family:"Bakuchiol / 补骨脂酚",patterns:[/\bbakuchiol\b/i],reasonZh:"命中补骨脂酚；孕期人体安全数据有限，统一按风险产品处理。",reasonEn:"Bakuchiol was detected. Human pregnancy safety data are limited, so the product is conservatively flagged as risk."},
];

const LEVEL_COPY:Record<PregnancySafetyLevel,{zh:string;en:string}>={
 risk:{zh:"孕期风险产品",en:"Pregnancy risk product"},
 "no-known-trigger":{zh:"未发现明确孕期风险触发项",en:"No known pregnancy risk trigger found"},
 "insufficient-data":{zh:"孕期风险信息不足",en:"Insufficient pregnancy-risk data"},
};
function normalizeIngredient(value:string){return value.replace(/[（）()]/g," ").replace(/\s+/g," ").trim()}
export function isPregnancySafetyMode(profile?:SkinProfileRecord|null):boolean{if(!profile)return false;const states=getSpecialSkinStates(profile);return profile.profileAnswers?.pregnancy==="yes"||states.includes("pregnancy_breastfeeding")}
export function assessPregnancySafety(product:Pick<SharedProductRecord,"ingredients"|"ingredientListType"|"dataCompleteness">):PregnancySafetyAssessment{
 const ingredients=(product.ingredients||[]).map(normalizeIngredient).filter(Boolean),found:PregnancySafetyTrigger[]=[];
 for(const ingredient of ingredients)for(const rule of RULES){if(!rule.patterns.some(pattern=>pattern.test(ingredient)))continue;if(found.some(item=>item.family===rule.family&&item.ingredient.toLowerCase()===ingredient.toLowerCase()))continue;found.push({ingredient,family:rule.family,level:"risk",reasonZh:rule.reasonZh,reasonEn:rule.reasonEn})}
 const dataIsStrong=product.ingredientListType==="full"&&product.dataCompleteness>=80;
 const level:PregnancySafetyLevel=found.length?"risk":dataIsStrong?"no-known-trigger":"insufficient-data",copy=LEVEL_COPY[level];
 return{level,triggers:found,labelZh:copy.zh,labelEn:copy.en,summaryZh:found.length?`检测到 ${found.map(x=>x.ingredient).join("、")}，本系统统一按孕期风险产品处理。`:level==="no-known-trigger"?"基于当前完整成分表，没有命中本系统的孕期风险规则。":"当前成分表不够完整，不能据此判断为低风险。",summaryEn:found.length?`Detected ${found.map(x=>x.ingredient).join(", ")}; this product is conservatively classified as a pregnancy risk product.`:level==="no-known-trigger"?"The current full ingredient list does not match this system's pregnancy-risk rules.":"The ingredient list is not complete enough to classify this product as low risk.",dataNoteZh:"这是保守的护肤成分风险筛查，不代表医学诊断。命中风险项时不再让用户自行判断浓度或用量。",dataNoteEn:"This is a conservative ingredient-risk screen, not a medical diagnosis. When a risk trigger is detected, the app does not ask users to self-assess concentration or exposure."}
}
export function pregnancySafetyRank(level:PregnancySafetyLevel):number{return level==="no-known-trigger"?0:level==="insufficient-data"?1:2}
