import { analyzeFormulaDna, type FormulaDna, type FormulaSystemKey } from "../intelligence/formulaDna.ts";
import { rankProducts, scoreProduct, type ProductScore, type Suitability } from "../intelligence/productScoring.ts";
import type { SharedProductRecord } from "./supabase.ts";
import type { SkinProfileRecord } from "./skinProfile.ts";
import { getSpecialSkinStates } from "./skinProfile.ts";
import { productExperienceAdjustment } from "./productFeedback.ts";

export type BrowseSkinType = "all" | "normal" | "dry" | "oily" | "combination" | "sensitive" | "acne";
export type BrowseConcern = "all" | "hydration" | "barrier" | "redness" | "pores" | "acne" | "pigmentation" | "aging";
export type UiLanguage = "zh" | "en";

const rule = (name: string) => ({ name });
const CONCERN_RULES: Record<Exclude<BrowseConcern, "all">, Suitability> = {
 hydration:{good:[rule("Glycerin"),rule("Hyaluronic Acid"),rule("Sodium Hyaluronate"),rule("Panthenol"),rule("Betaine"),rule("Urea")],risky:[],targetSystems:["hydration"]},
 barrier:{good:[rule("Ceramide"),rule("Cholesterol"),rule("Phytosphingosine"),rule("Squalane"),rule("Panthenol"),rule("Niacinamide")],risky:[rule("Alcohol Denat."),rule("Fragrance"),rule("Parfum")],targetSystems:["barrier","lipid","soothing"]},
 redness:{good:[rule("Panthenol"),rule("Centella Asiatica"),rule("Madecassoside"),rule("Allantoin"),rule("Bisabolol"),rule("Beta-Glucan")],risky:[rule("Alcohol Denat."),rule("Fragrance"),rule("Parfum"),rule("Menthol")],targetSystems:["soothing","barrier"]},
 pores:{good:[rule("Niacinamide"),rule("Salicylic Acid"),rule("Zinc PCA"),rule("Silica")],risky:[],targetSystems:["oilControl","hydration"]},
 acne:{good:[rule("Salicylic Acid"),rule("Azelaic Acid"),rule("Niacinamide"),rule("Zinc PCA"),rule("Sulfur")],risky:[rule("Coconut Oil"),rule("Isopropyl Myristate")],targetSystems:["oilControl","soothing"]},
 pigmentation:{good:[rule("Tranexamic Acid"),rule("Niacinamide"),rule("Ascorbic Acid"),rule("Alpha-Arbutin"),rule("Licorice")],risky:[],targetSystems:["antiAging"]},
 aging:{good:[rule("Retinol"),rule("Retinal"),rule("Peptide"),rule("Ascorbic Acid"),rule("Adenosine"),rule("Niacinamide")],risky:[],targetSystems:["antiAging","hydration","barrier"]},
};
const ACTIVE_LOAD_RULE:Suitability={good:[rule("Ceramide"),rule("Panthenol"),rule("Glycerin"),rule("Squalane"),rule("Madecassoside")],risky:[rule("Glycolic Acid"),rule("Lactic Acid"),rule("Salicylic Acid"),rule("Retinol"),rule("Retinal"),rule("Alcohol Denat."),rule("Fragrance"),rule("Parfum")],targetSystems:["barrier","hydration","soothing"]};
const PROCEDURE_RULE:Suitability={good:[rule("Panthenol"),rule("Glycerin"),rule("Ceramide"),rule("Squalane"),rule("Madecassoside")],risky:[rule("Glycolic Acid"),rule("Lactic Acid"),rule("Salicylic Acid"),rule("Retinol"),rule("Retinal"),rule("Menthol"),rule("Alcohol Denat."),rule("Fragrance"),rule("Parfum")],targetSystems:["barrier","hydration","soothing"]};
const PREGNANCY_CONSERVATIVE_RULE:Suitability={good:[rule("Niacinamide"),rule("Panthenol"),rule("Ceramide"),rule("Glycerin"),rule("Azelaic Acid")],risky:[rule("Retinol"),rule("Retinal")],targetSystems:["barrier","hydration","soothing"]};
const HUMID_RULE:Suitability={good:[rule("Niacinamide"),rule("Zinc PCA"),rule("Silica"),rule("Glycerin")],risky:[],targetSystems:["oilControl","hydration"]};
function mergeSuitability(parts:Suitability[]):Suitability { const dedupe=(items:Array<{name:string}>)=>Array.from(new Map(items.map(i=>[i.name,i])).values()); return {good:dedupe(parts.flatMap(p=>p.good)),risky:dedupe(parts.flatMap(p=>p.risky)),conflicting:[],targetSystems:Array.from(new Set(parts.flatMap(p=>p.targetSystems||[])))}; }
export function profileConcern(profile?:SkinProfileRecord|null):Exclude<BrowseConcern,"all"> { const states=getSpecialSkinStates(profile); if(states.includes("sensitive_flare")||states.includes("procedure_recovery"))return "redness"; if(states.includes("breakout"))return "acne"; const s=profile?.selectedSymptoms||[]; if(s.includes("redness")||s.includes("sensitivity"))return "redness"; if(s.includes("acne"))return "acne"; if(s.includes("pores"))return "pores"; if(s.includes("pigmentation"))return "pigmentation"; if(s.includes("aging"))return "aging"; if(s.includes("dryness"))return "hydration"; return "barrier"; }
export function suitabilityFor(profile?:SkinProfileRecord|null,concern?:BrowseConcern):Suitability { const selected:Exclude<BrowseConcern,"all">=concern&&concern!=="all"?concern:profileConcern(profile); const parts=[CONCERN_RULES[selected]]; const states=getSpecialSkinStates(profile); if(profile?.skinAnswers?.sensitive==="yes"&&selected!=="redness"&&selected!=="barrier")parts.push(CONCERN_RULES.redness); if(profile?.skinAnswers?.wash==="dry"||profile?.skinAnswers?.oil==="dry")parts.push(CONCERN_RULES.hydration); if(states.includes("sensitive_flare"))parts.push(CONCERN_RULES.redness,CONCERN_RULES.barrier); if(states.includes("procedure_recovery"))parts.push(PROCEDURE_RULE); if(states.includes("acid")||states.includes("retinoid"))parts.push(ACTIVE_LOAD_RULE); if(profile?.profileAnswers?.acid_frequency==="high"||profile?.profileAnswers?.retinoid_stage==="increased"||profile?.profileAnswers?.retinoid_stage==="starting")parts.push(CONCERN_RULES.barrier); if(states.includes("breakout")&&selected!=="acne")parts.push(CONCERN_RULES.acne); if(states.includes("pregnancy_breastfeeding")||profile?.profileAnswers?.pregnancy==="yes")parts.push(PREGNANCY_CONSERVATIVE_RULE); if(states.includes("environment_change")){const direction=profile?.profileAnswers?.environment_direction;if(direction==="cold_dry"||direction==="aircon")parts.push(CONCERN_RULES.hydration,CONCERN_RULES.barrier);if(direction==="hot_humid")parts.push(HUMID_RULE);} return mergeSuitability(parts); }
export function personalizedScore(product:SharedProductRecord,profile?:SkinProfileRecord|null,concern?:BrowseConcern):ProductScore|null { if(!profile&&(!concern||concern==="all"))return null; return scoreProduct(product,suitabilityFor(profile,concern)); }
export function rankForProfile(products:SharedProductRecord[],profile?:SkinProfileRecord|null,concern?:BrowseConcern){return rankProducts(products,suitabilityFor(profile,concern)).sort((a,b)=>{const f=productExperienceAdjustment(b.id)-productExperienceAdjustment(a.id);return f||(b.score||0)-(a.score||0);});}
export function matchRating(match:ProductScore|null|undefined){
 if(!match?.recommendationAvailable||match.score==null)return {stars:0,starsText:"☆☆☆☆☆",label:"数据不足",detail:"现有配方证据不足，暂不强行判断。",suitable:false,bonus:false};
 const score=match.score;
 const stars=score>=85?5:score>=70?4:score>=55?3:score>=35?2:1;
 const starsText=`${"★".repeat(stars)}${"☆".repeat(5-stars)}`;
 const bonus=stars>=3&&(match.positiveEvidence.length+match.systemEvidence.filter(e=>e.score>=3).length)>=4&&match.negativeEvidence.length===0&&match.formulaPenalty>=0;
 if(stars===5)return {stars,starsText,label:"非常适合",detail:"与你当前的肤质、需求和护理状态高度匹配。",suitable:true,bonus};
 if(stars===4)return {stars,starsText,label:"适合",detail:"整体匹配良好，也考虑了你当前的特殊护理状态。",suitable:true,bonus};
 if(stars===3)return {stars,starsText,label:"可以用",detail:"没有明显不适配；只是未必是当前最优选择，或核心功效并非你最需要的。",suitable:true,bonus};
 if(stars===2)return {stars,starsText,label:"谨慎尝试",detail:"存在一定不匹配或潜在刺激风险，尤其要考虑当前活性成分负荷。",suitable:false,bonus:false};
 return {stars,starsText,label:"不推荐",detail:"与当前肤质、需求或护理状态存在明显冲突，潜在风险高于适配收益。",suitable:false,bonus:false};
}
export function confidenceLabel(confidence:ProductScore["confidence"]|undefined){return confidence==="high"?"高":confidence==="medium"?"中":"低";}
export function formulaDataLabel(product:SharedProductRecord){if(product.ingredientListType==="full"&&product.dataCompleteness>=85)return {label:"完整配方已核验",detail:"完整 INCI 已保存，可进行完整配方结构分析。",tone:"good" as const};if(product.ingredientListType==="full")return {label:"完整配方 · 待复核",detail:"已保存完整列表，但来源或版本仍需进一步复核。",tone:"warn" as const};if(product.ingredients.length>0)return {label:"部分配方",detail:"目前只有部分成分证据，结论会相应保守。",tone:"warn" as const};return {label:"配方待补充",detail:"尚无足够 INCI 数据，不进入优先推荐。",tone:"muted" as const};}
const SYSTEM_PRIORITY:FormulaSystemKey[]=["barrier","hydration","soothing","antiAging","oilControl","lipid"];
const SYSTEM_ZH:Record<FormulaSystemKey,string>={barrier:"屏障",hydration:"保湿",soothing:"舒缓",antiAging:"抗老",oilControl:"控油",lipid:"脂质",preservation:"防腐"};
const SYSTEM_EN:Record<FormulaSystemKey,string>={barrier:"barrier support",hydration:"hydration",soothing:"soothing",antiAging:"anti-aging",oilControl:"oil control",lipid:"lipid support",preservation:"preservation"};
export function oneLineVerdict(product:SharedProductRecord,dna:FormulaDna=analyzeFormulaDna(product)){
 if(!product.ingredients.length)return "目前配方资料还不够完整，暂时不建议只凭产品定位判断功效。";
 const systems=SYSTEM_PRIORITY.map(k=>dna.systems[k]).filter(s=>s.score>=2).sort((a,b)=>b.score-a.score);
 const lead=systems.slice(0,2).map(s=>s.label.replace("体系","")).join("＋")||"基础保湿";
 const texture=dna.sensory.labels.slice(0,2).join("、");
 const caution=dna.alcohol.level==="high"?"；高位酒精使敏感或屏障不稳时需要更谨慎":product.ingredientListType==="partial"?"；由于目前只有部分配方，判断偏保守":"";
 return `这是一款以${lead}为核心的${product.category}，${texture?`整体更偏${texture}肤感`:`定位偏日常使用`}${caution}。`;
}
export function oneLineVerdictEn(product:SharedProductRecord,dna:FormulaDna=analyzeFormulaDna(product)){
 if(!product.ingredients.length)return "Formula data is still too limited to judge performance from positioning alone.";
 const systems=SYSTEM_PRIORITY.map(k=>({key:k,score:dna.systems[k].score})).filter(s=>s.score>=2).sort((a,b)=>b.score-a.score);
 const lead=systems.slice(0,2).map(s=>SYSTEM_EN[s.key]).join(" + ")||"basic hydration";
 const texture=dna.sensory.labels.length?" with a texture profile that may vary by skin type":" for straightforward daily use";
 const caution=dna.alcohol.level==="high"?"; high-position volatile alcohol makes it less forgiving for reactive or barrier-compromised skin":product.ingredientListType==="partial"?"; the conclusion is conservative because only a partial INCI is available":"";
 return `A ${product.category.toLowerCase()} built mainly around ${lead}${texture}${caution}.`;
}
const PLACEHOLDER_EDITORIAL=/^待完整\s*INCI|^配方证据不足|^待核验|^按产品类别|^先按产品类别/i;
export function productVerdict(product:SharedProductRecord,dna:FormulaDna=analyzeFormulaDna(product)){
 const editorial=product.editorial?.summary?.trim();
 if(editorial&&!PLACEHOLDER_EDITORIAL.test(editorial))return editorial;
 if(product.formulaVerdict?.trim()&&!PLACEHOLDER_EDITORIAL.test(product.formulaVerdict.trim()))return product.formulaVerdict.trim();
 return oneLineVerdict(product,dna);
}
export function productVerdictLocalized(product:SharedProductRecord,language:UiLanguage,dna:FormulaDna=analyzeFormulaDna(product)){
 if(language==="en")return oneLineVerdictEn(product,dna);
 return productVerdict(product,dna);
}
export function productAudience(product:SharedProductRecord){
 const merge=(...groups:(string[]|undefined)[])=>Array.from(new Set(groups.flatMap(group=>group||[]).map(item=>item.trim()).filter(Boolean)));
 const dna=analyzeFormulaDna(product);
 const bestFor=merge(product.editorial?.bestFor,product.formulaBestFor,product.formulaAlsoWorksFor);
 const notIdealFor=merge(product.editorial?.notIdealFor,product.formulaLessIdealFor);
 const caveats=merge(product.editorial?.caveats,product.formulaCaveats);
 if(!bestFor.length){
  if(dna.systems.hydration.score>=3)bestFor.push("缺水、需要稳定保湿的人");
  if(dna.systems.barrier.score>=2||dna.systems.lipid.score>=2)bestFor.push("屏障偏弱或干燥肤质");
  if(dna.systems.soothing.score>=2)bestFor.push("容易泛红、想要舒缓的人");
  if(dna.systems.oilControl.score>=2)bestFor.push("油皮或在意出油毛孔的人");
  if(dna.systems.antiAging.score>=2)bestFor.push("有抗老、细纹需求的人");
  if(!bestFor.length)bestFor.push("中性肌或没有明显特殊需求的人");
 }
 if(!notIdealFor.length){
  if(dna.alcohol.level==="high")notIdealFor.push("酒精耐受较差、屏障不稳定的人");
  if(/厚润|油感/.test(dna.sensory.labels.join(" ")))notIdealFor.push("非常油、容易觉得闷的人");
 }
 if(!caveats.length&&product.ingredientListType==="partial")caveats.push("目前为部分配方，适合度判断需要保留余地");
 return{bestFor:Array.from(new Set(bestFor)),notIdealFor:Array.from(new Set(notIdealFor)),caveats:Array.from(new Set(caveats))};
}

type ClaimTheme={key:FormulaSystemKey;zh:string;en:string;patterns:RegExp[]};
const CLAIM_THEMES:ClaimTheme[]=[
 {key:"hydration",zh:"补水保湿",en:"Hydration",patterns:[/hydrat|moistur|hyaluron|aqua|水润|补水|保湿/i]},
 {key:"barrier",zh:"屏障修护",en:"Barrier repair",patterns:[/barrier|repair|restore|ceramide|修护|修复|屏障/i]},
 {key:"soothing",zh:"舒缓维稳",en:"Soothing",patterns:[/sooth|calm|cica|centella|敏感|舒缓|积雪草/i]},
 {key:"antiAging",zh:"抗老紧致",en:"Anti-aging",patterns:[/anti.?aging|age|wrinkle|firm|lift|retinol|retinal|抗老|抗皱|紧致|淡纹/i]},
 {key:"oilControl",zh:"控油净肤",en:"Oil control",patterns:[/oil|pore|acne|blemish|clear|控油|毛孔|痘|净肤/i]},
];
const BRIGHTEN_PATTERNS=[/bright|radiance|glow|whiten|spot|pigment|vitamin c|niacinamide|亮白|美白|提亮|淡斑|色沉/i];
export interface MarketingRealityItem{label:string;score:number;support:"strong"|"moderate"|"weak";}
export interface MarketingReality{claims:string[];items:MarketingRealityItem[];summary:string;sourceNote:string;}
export function marketingReality(product:SharedProductRecord,language:UiLanguage,dna:FormulaDna=analyzeFormulaDna(product)):MarketingReality{
 const text=[product.name,product.productLocalName,product.productEnglishName,product.formulaSummary].filter(Boolean).join(" ");
 const themes=CLAIM_THEMES.filter(theme=>theme.patterns.some(pattern=>pattern.test(text)));
 const items:MarketingRealityItem[]=themes.map(theme=>{const score=Math.max(0,Math.min(5,dna.systems[theme.key].score));return{label:language==="zh"?theme.zh:theme.en,score,support:score>=4?"strong":score>=2?"moderate":"weak"};});
 if(BRIGHTEN_PATTERNS.some(pattern=>pattern.test(text))){const names=product.ingredients.map(x=>x.toLowerCase());const hits=["niacinamide","ascorbic acid","tranexamic acid","alpha-arbutin","arbutin","licorice"].filter(x=>names.some(n=>n.includes(x))).length;const score=Math.min(5,hits>=3?5:hits===2?4:hits===1?2:1);items.push({label:language==="zh"?"提亮淡斑":"Brightening",score,support:score>=4?"strong":score>=2?"moderate":"weak"});}
 const deduped=Array.from(new Map(items.map(item=>[item.label,item])).values());
 const claims=deduped.map(item=>item.label);
 if(!deduped.length){
  const strongest=SYSTEM_PRIORITY.map(key=>({key,score:dna.systems[key].score})).sort((a,b)=>b.score-a.score).slice(0,2).filter(x=>x.score>0);
  const labels=strongest.map(x=>language==="zh"?SYSTEM_ZH[x.key]:SYSTEM_EN[x.key]);
  return{claims:labels,items:strongest.map(x=>({label:language==="zh"?SYSTEM_ZH[x.key]:SYSTEM_EN[x.key],score:x.score,support:x.score>=4?"strong":x.score>=2?"moderate":"weak"})),summary:language==="zh"?`目前没有保存可核验的官方功效宣称；从配方看，真正更突出的方向是${labels.join("、")||"基础护理"}。`:`No verified official efficacy claim is stored yet. The formula itself is strongest in ${labels.join(" and ")||"basic care"}.`,sourceNote:language==="zh"?"未保存官方 claim，以下按产品命名/定位与配方结构做保守对照。":"No verified official claim is stored; this is a conservative comparison of product positioning and formula structure."};
 }
 const strong=deduped.filter(x=>x.support==="strong").map(x=>x.label),weak=deduped.filter(x=>x.support==="weak").map(x=>x.label);
 const summary=language==="zh"?(weak.length?`配方对${strong.join("、")||"部分主打方向"}支持较明确，但${weak.join("、")}的营销强度可能高于现有配方证据。`:`产品定位与配方结构整体一致，${strong.length?`${strong.join("、")}的支持尤其清楚`:`主要主打方向都有一定配方支持`}。`):(weak.length?`The formula clearly supports ${strong.join(", ")||"some of the positioning"}, while ${weak.join(", ")} appears stronger in marketing than in the current formula evidence.`:`The positioning is broadly consistent with the formula${strong.length?`, with especially clear support for ${strong.join(", ")}`:""}.`);
 return{claims,items:deduped,summary,sourceNote:language==="zh"?"主打方向优先根据产品名称与现有定位字段识别；并非品牌官网逐字宣称，后续可用官方 claim 数据替换。":"Claim themes are inferred from the product name and stored positioning fields, not quoted from brand copy; verified official claims can replace them later."};
}

export function matchesSkinType(product:SharedProductRecord,skinType:BrowseSkinType){if(skinType==="all")return true;const dna=analyzeFormulaDna(product);if(skinType==="sensitive")return dna.alcohol.level!=="high"&&dna.systems.soothing.score>=2;if(skinType==="acne")return dna.systems.oilControl.score>=2||product.category==="祛痘";if(skinType==="oily")return dna.systems.oilControl.score>=1||!/厚润|油感/.test(dna.sensory.labels.join(" "));if(skinType==="dry")return dna.systems.hydration.score>=3||dna.systems.lipid.score>=2;if(skinType==="normal")return dna.alcohol.level!=="high"&&dna.systems.hydration.score>=1;return dna.systems.hydration.score>=2&&dna.alcohol.level!=="high";}