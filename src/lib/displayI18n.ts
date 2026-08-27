import type { AppLanguage } from "./i18n";

const CATEGORY_EN: Record<string,string> = {
  "卸妆":"Makeup remover",
  "洁面":"Cleanser",
  "焕肤":"Exfoliant",
  "眼部":"Eye care",
  "眼霜":"Eye cream",
  "祛痘":"Acne treatment",
  "精华":"Serum",
  "精华水":"Essence",
  "精华油":"Face oil",
  "防晒":"Sunscreen",
  "面膜":"Mask",
  "面霜":"Moisturizer",
  "乳液 / 面霜":"Lotion / moisturizer",
  "乳液/面霜":"Lotion / moisturizer",
  "化妆水":"Toner / essence",
};

const SKIN_EN: Record<string,string> = {
  "偏干":"Dry-leaning","干性":"Dry","偏油":"Oily-leaning","油性":"Oily","混合性":"Combination","中性":"Normal",
  "敏感倾向":"Sensitivity-prone","非常敏感":"Very sensitive","不敏感":"Not sensitivity-prone","一般":"Moderate",
  "泛红":"Redness","痘痘":"Acne","毛孔":"Pores","色沉":"Pigmentation","老化":"Aging","干燥":"Dryness","缺水":"Dehydration","屏障":"Barrier",
};

const GOAL_ZH: Record<string,string> = {
  Acne:"痘痘",Blackheads:"黑头",Pores:"毛孔",Redness:"泛红",Barrier:"屏障",Dehydration:"缺水",Pigmentation:"色沉",Dullness:"暗沉","Fine lines":"细纹",Firmness:"紧致","Oil control":"控油",
};

const STEP_ZH: Record<string,string> = {
  "Gentle cleanser":"温和洁面","Cleanser":"洁面","Low-irritation cleanser":"低刺激洁面","Rinse / gentle cleanser":"清水 / 温和洁面",
  "Hydrating toner / essence":"保湿化妆水 / 精华水","Soothing toner / essence":"舒缓化妆水 / 精华水",
  "Acne-support serum":"祛痘辅助精华","Niacinamide serum":"烟酰胺精华","Niacinamide / lightweight serum":"烟酰胺 / 轻薄精华",
  "Soothing serum":"舒缓精华","Barrier serum":"屏障修护精华","Humectant serum":"吸湿保湿精华","Hydrating serum":"保湿精华",
  "Vitamin C / brightening serum":"维C / 提亮精华","Antioxidant serum":"抗氧化精华","Hydrating / antioxidant serum":"保湿 / 抗氧化精华",
  "Light moisturizer":"轻薄乳液 / 面霜","Barrier moisturizer":"屏障修护乳液 / 面霜","Ceramide moisturizer":"神经酰胺乳液 / 面霜","Ceramide-rich moisturizer":"富含神经酰胺的乳液 / 面霜","Moisturizer":"乳液 / 面霜",
  "Broad-spectrum SPF":"广谱防晒","SPF":"防晒","Eye care · optional":"眼部护理 · 可选",
  "BHA or acne treatment":"BHA / 祛痘护理","BHA 2–3× weekly":"BHA 每周 2–3 次","Gentle exfoliation 1–2× weekly":"温和焕肤 每周 1–2 次",
  "Tranexamic acid / retinoid depending on tolerance":"传明酸 / 维A类（按耐受）","Retinoid if tolerated":"维A类（耐受后）","Retinoid / peptide treatment":"维A类 / 多肽护理",
};

const NOTE_EN: Record<string,string> = {
  "先控制刺激总量，不把所有祛痘活性叠在同一晚。":"Control total irritation first; do not stack every acne active in the same evening.",
  "黑头需要持续管理角栓；频繁挤压只会增加刺激。":"Blackheads need ongoing comedone control; frequent squeezing mainly adds irritation.",
  "毛孔外观更依赖油脂、角栓和光损伤管理，而不是‘收缩毛孔’。":"Visible pores depend more on oil, congestion and photodamage management than on “shrinking pores.”",
  "泛红优先稳定屏障和触发因素，再考虑更积极的功效。":"For redness, stabilize the barrier and triggers before adding more aggressive actives.",
  "屏障期减少酸、A醇和频繁更换产品。":"During barrier recovery, reduce acids, retinoids and frequent product changes.",
  "缺水不等于缺油；油皮也可以脱水。":"Dehydration is not the same as lack of oil; oily skin can also be dehydrated.",
  "色沉方案里防晒是主步骤，不是最后补的一步。":"For pigmentation, sunscreen is a core step, not an afterthought.",
  "暗沉可能来自缺水、角质、炎症或色沉，先用低频方案判断来源。":"Dullness may come from dehydration, buildup, inflammation or pigmentation; start gently to identify the driver.",
  "先把缺水细纹和真正的结构性细纹分开。":"Separate dehydration lines from structural fine lines before escalating actives.",
  "紧致依赖长期防晒和可持续活性，不靠一次性的紧绷肤感。":"Firmness depends on long-term sun protection and sustainable actives, not temporary tightness.",
  "控油不等于过度清洁；脱水可能让出油体验更明显。":"Oil control does not mean over-cleansing; dehydration can make oiliness feel worse.",
};

export function displayCategory(value:string, language:AppLanguage){return language==="en"?(CATEGORY_EN[value]||value):value;}
export function displaySkinLabel(value:string, language:AppLanguage){return language==="en"?(SKIN_EN[value]||value):value;}
export function displayGoal(value:string, language:AppLanguage){return language==="zh"?(GOAL_ZH[value]||value):value;}
export function displayRoutineStep(value:string, language:AppLanguage){return language==="zh"?(STEP_ZH[value]||value):value;}
export function displayRoutineNote(value:string, language:AppLanguage){return language==="en"?(NOTE_EN[value]||value):value;}

export function displayGuardrail(value:string, language:AppLanguage){
 if(language==="zh") return value;
 const exact:Record<string,string>={
  "敏感／屏障限制已开启：一次只新增一个活性，先做局部耐受测试。":"Sensitivity/barrier guardrails are active: add only one new active at a time and patch test first.",
  "暂不安排A醇或强酸；先连续使用基础护理2–4周。":"Skip retinoids and strong acids for now; keep the basic routine stable for 2–4 weeks first.",
  "功效产品从每周1–2晚开始，耐受后再增加频率。":"Start active treatments 1–2 nights per week, then increase only after tolerance is established.",
  "同一晚避免把强酸和A醇叠加；维C可优先放在早间。":"Avoid stacking strong acids and retinoids on the same night; vitamin C can be prioritized in the morning.",
  "若出现持续刺痛、肿胀、渗出或快速加重，应停止新产品并寻求医疗意见。":"If persistent stinging, swelling, oozing or rapid worsening occurs, stop new products and seek medical advice.",
 };
 return exact[value]||value;
}

export function displayFormulaLabel(value:string, language:AppLanguage){
 if(language==="zh") return value;
 const map:Record<string,string>={"完整配方已核验":"Verified full formula","完整配方 · 待复核":"Full formula · review pending","部分配方":"Partial formula","配方待补充":"Formula pending"};
 return map[value]||value;
}

export function displayConfidence(value:string, language:AppLanguage){
 if(language==="zh") return value;
 return value==="高"?"High":value==="中"?"Medium":value==="低"?"Low":value;
}
