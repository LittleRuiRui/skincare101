import {useEffect} from "react";
import {useLanguage} from "../lib/i18n";

// Locale bridge for the legacy skin-test screens that still render historical
// Chinese copy from src/App.tsx. This runs only inside the skin-test wrapper.
const EXACT:Record<string,string>={
  "肤质":"Skin type","基础信息":"Basic info","安全提醒":"Safety check","状态分析":"Skin analysis",
  "已完成":"complete","进行中":"in progress","未开始":"not started","通常约3分钟完成":"Usually takes about 3 minutes",
  "第一步 · 了解肤质":"Step 1 · Skin type","第二步 · 基础信息":"Step 2 · Basic info","第三步 · 就医识别":"Step 3 · Safety check","第三步 · 安全提示":"Step 3 · Safety check",
  "本阶段问题":"Questions in this step","返回上一题":"Previous question","返回首页":"Back to home","首页":"Home",
  "洗完脸不涂任何东西,1小时后T区和两颊分别是什么状态?":"One hour after cleansing without applying anything, how do your T-zone and cheeks feel?",
  "T区出油,两颊偏干或正常":"Oily T-zone, cheeks dry or normal","混合性":"Combination","整脸都出油":"Oily all over","油性":"Oily","整脸紧绷、有点起皮":"Tight or slightly flaky all over","干性":"Dry","比较舒适,没什么明显感觉":"Comfortable, no obvious oiliness or tightness","中性":"Normal",
  "换新产品时,皮肤容易泛红刺痛,还是基本没什么反应?":"When you try a new product, does your skin tend to sting or turn red?","比较容易有反应":"Yes, it reacts fairly easily","敏感叠加":"Sensitive","基本没什么反应":"Usually no reaction","非敏感":"Not sensitive",
  "2个问题，帮助后续建议更贴近你的真实状态":"Two quick questions help tailor the rest of the test to your skin.",
  "你的年龄段是?":"What is your age range?","年龄会影响诊断权重——同样症状在不同年龄段更可能对应的病因不一样":"Age changes the weighting of possible causes for the same symptom.",
  "性别":"Sex","用于判断部分周期性/激素相关问题是否适用,以及用药建议的安全边界":"Used only for relevant hormonal patterns and medication-safety boundaries.",
  "目前有没有怀孕或哺乳?":"Are you currently pregnant or breastfeeding?","这一步是用药建议前的安全检查,不影响病因诊断本身":"This is a medication-safety check and does not change the underlying skin assessment.",
  "是,目前怀孕或哺乳期":"Yes, pregnant or breastfeeding","没有":"No",
  "在选具体问题之前,先排除这几种情况":"Before choosing a concern, check these safety flags",
  "这几种不属于护肤品能处理的范畴,这一步只做一次——命中任意一项会直接建议就医,不会进入后面的症状选择":"These signs may need medical assessment. This safety check appears only once.",
  "边界清楚的红斑,上面覆盖较厚的银白色鳞屑,撕掉鳞屑容易点状出血":"Clearly bordered red patches with thick silvery-white scale that may bleed in tiny spots when removed",
  "有边界清楚的色素完全脱失斑(不是变浅,是完全变白)":"Clearly bordered patches with complete loss of pigment (fully white, not just lighter)",
  "成簇的小水疱,伴刺痛或灼烧感":"Clusters of small blisters with stinging or burning",
  "风团样红斑,通常24小时内自行消退,但此起彼伏反复出现":"Hive-like welts that usually fade within 24 hours but recur elsewhere",
  "长期日晒部位(面部/手背)出现粗糙鳞屑性斑块,摸起来像砂纸":"Rough scaly patches on chronically sun-exposed areas such as the face or backs of the hands",
  "都没有以上情况":"None of these",
  "建议就医":"Medical advice","风险提示":"Risk note","这个特征超出了护肤品能处理的范围":"This feature is beyond what skincare products can address",
  "银屑病":"Psoriasis","白癜风":"Vitiligo","疱疹类病毒感染":"Herpes-family viral infection","荨麻疹":"Urticaria (hives)","日光性角化病":"Actinic keratosis",
  "重新开始演示":"Continue skin test","继续后续测试":"Continue skin test",
  "肤质已记录":"Skin profile recorded","现在最想改善哪些问题?":"What would you most like to improve?","开始分析":"Start analysis","确认":"Confirm",
  "泛红":"Redness","爆痘":"Acne / breakouts","暗沉":"Dullness","毛孔粗大/黑头":"Enlarged pores / blackheads",
  "你的肌肤分析":"Your skin analysis","先做这三件事":"Start with these three steps","当前优先方向：":"Current priority: ",
  "1 · 先简化":"1 · Simplify first","2 · 保留基础":"2 · Keep the basics","3 · 再做选择":"3 · Choose selectively",
  "暂停近期新增、明显刺激或与你当前方向冲突的产品":"Pause newly added, clearly irritating, or conflicting products.",
  "温和清洁、合适的保湿与白天防晒先保持稳定":"Keep gentle cleansing, suitable moisturising, and daytime sunscreen stable.",
  "先看下面的产品匹配，再决定下一件值得买什么":"Review the product matches below before deciding what to buy next.",
  "建议观察2–4周；若持续加重、疼痛或出现异常皮损，请及时就医":"Observe for 2–4 weeks. Seek medical care if symptoms worsen, become painful, or unusual lesions appear.",
  "你的成分方向":"Your ingredient direction","买产品时先看体系，不需要追逐一长串明星成分":"Focus on the formula system rather than chasing a long list of hero ingredients.",
  "谨慎：":"Use caution: ","优先看的产品":"Products to consider first","展开查看判断依据与完整建议":"View assessment details and full recommendations",
  "共同根因:":"Shared driver: ","合并护肤建议":"Combined skincare guidance","护肤建议":"Skincare guidance","就医时可咨询的治疗方向":"Treatment options to discuss with a clinician",
  "就医提示":"Medical note","适合 / 风险成分参考":"Suitable / caution ingredient reference","因症状而异(需结合具体诊断判断)":"Depends on the concern (interpret with the specific assessment)",
  "证据拆解 · Confidence Engine":"Evidence breakdown · Confidence Engine","基础":"Base","支持":"support","矛盾":"contradiction","不确定":"uncertainty","高":"High","中":"Medium","低":"Low",
  "矛盾信号:":"Contradicting signal: ","未观察到:":"Not observed: ","风险信号:":"Risk signal: ",
  "屏障受损":"Barrier impairment","血管性(玫瑰痤疮倾向)":"Vascular / rosacea tendency","敏感体质":"Sensitive-skin tendency","脂溢性/真菌相关":"Seborrheic / fungal-related","炎症性痤疮":"Inflammatory acne","外源刺激诱发":"External/product trigger","角质堆积":"Buildup","色素沉着":"Pigmentation","生活方式/微循环":"Lifestyle / circulation","光老化":"Photoaging","皮脂旺盛":"High sebum output",
  "屏障受损型泛红":"Barrier-related redness","玫瑰痤疮倾向":"Rosacea tendency","单纯敏感肌反应":"Sensitive-skin reaction","过度去角质":"Over-exfoliation","脂溢性皮炎":"Seborrheic dermatitis","假性痘(屏障受损型)":"Barrier-related breakout","真性痤疮":"Acne vulgaris","致痘成分诱发":"Product-induced breakout","马拉色菌毛囊炎(真菌痘)":"Malassezia folliculitis","微循环/作息问题":"Lifestyle / circulation factors","光损伤(慢性)":"Chronic photodamage","油脂型毛孔":"Oil-related pores","缺水代偿型毛孔":"Dehydration-related pores","角质堆积型毛孔":"Buildup-related pores","衰老松弛型毛孔":"Loss-of-firmness pores",
  "结节型":"Nodular","囊肿型":"Cystic","脓疱型":"Pustular",
  "已识别到怀孕/哺乳期:部分药物类别已从这组建议中移除,用药请务必经产科/皮肤科医生共同评估。":"Pregnancy/breastfeeding detected: some medication categories have been removed. Any medication should be reviewed with your obstetric and/or dermatology clinician.",
  "先验条件生效:检测到你是干性肤质,相关判断权重已相应调整。":"Dry skin was detected, so relevant assessment weights were adjusted accordingly.",
  "导出 PDF 报告":"Export PDF report","正在生成 PDF…":"Generating PDF…","PDF 已生成并开始下载。":"PDF generated.","PDF 生成失败，请刷新页面后重试。":"PDF generation failed. Refresh and try again.",
  "查看成分匹配分析":"View ingredient match analysis","从产品数据库为我匹配":"Match products for me","重新开始":"Start over",
  "成分匹配分析 · 第一步":"Ingredient match · Step 1","先告诉我们你在用哪一瓶":"Which product are you using?","已有本次完整诊断结果。默认使用刚才的诊断结论，比自己选择一个标签更准确。":"Your full assessment is available, so the ingredient analysis will use it by default rather than a self-selected label.",
  "拍照或从相册选择配料表":"Take or choose an ingredient-list photo","识别结果（请校对）":"Recognised text (please verify)","正在识别英文 INCI…":"Reading INCI list…","已标准化":"Standardised","待确认":"Needs review","覆盖率":"Coverage","确认成分并开始匹配":"Confirm ingredients and analyse",
  "或者从产品数据库选择":"Or choose from the product database","共享库暂时离线，已使用本地备份":"Shared catalog is temporarily offline; using the local fallback",
  "成分匹配分析 · 拍照识别":"Ingredient match · Photo scan","成分匹配分析 · 产品数据库":"Ingredient match · Product database","你在用的这瓶,匹配吗?":"How well does this product match your skin?",
  "数据完整度":"Data completeness","未识别":"Unrecognised","OCR 原文 → 标准成分":"OCR text → standard ingredient","结论":"Conclusion",
  "冲突":"Conflict","一致":"Match","低权重":"Lower weight","中性":"Neutral","未标准化":"Unstandardised",
  "为你推荐 · 本地产品数据库":"Recommended for you · Product database","数据来源":"Source","完整配方":"Full formula","部分配方":"Partial formula","多平台热门":"Popular across platforms","亚洲零售榜单":"Asia retail bestseller","开放数据热门":"Open-data popular","亚洲可购待核验":"Asia availability unverified","亚洲跨境渠道已见":"Seen in Asia cross-border channels","证据不足":"Insufficient evidence","分":"pts","有效证据":"Evidence","方向冲突":"Conflicting direction",
  "为什么不是黑箱推荐?":"Why this is not a black-box recommendation","打分逻辑":"Scoring logic","全部":"All","搜索品牌或产品名":"Search brand or product","再显示 24 款":"Show 24 more",
  "Formula DNA · 配方结构":"Formula DNA · Formula structure","酒精":"Alcohol","肤感":"Skin feel","可信度":"Confidence","完整配方":"Full formula","部分配方":"Partial formula",
  "脂质体系":"Lipid system","脂质体系(封闭型)":"Lipid system (occlusive)","脂质体系(强封闭型)":"Lipid system (strong occlusive)","脂质体系(硅类)":"Lipid system (silicone)","保湿体系":"Hydration system","保湿体系(小分子)":"Hydration system (small molecules)","抗炎舒缓体系":"Soothing / anti-inflammatory system","抗炎/抗痘体系":"Anti-inflammatory / anti-acne system","角质代谢体系":"Exfoliation / keratinisation system","维A酸类体系":"Retinoid system","肽类修护体系":"Peptide repair system","肽类/抗老体系":"Peptide / anti-aging system","控油体系":"Oil-control system","控油/屏障强化体系":"Oil-control / barrier-support system","控油/循环体系":"Oil-control / circulation system","抗氧化体系":"Antioxidant system","美白体系":"Brightening system","防晒体系(物理)":"Mineral sunscreen system","防晒体系(化学)":"Chemical sunscreen system","抗真菌体系":"Antifungal system","抗菌体系":"Antibacterial system","抗炎/抗菌体系":"Anti-inflammatory / antibacterial system","发酵活性体系":"Ferment-active system","微量元素体系":"Trace-mineral system","防腐香精体系":"Preservative / fragrance system","溶剂/收敛体系":"Solvent / astringent system","感官体系":"Sensory system","着色剂":"Colorant","防腐体系":"Preservative system","质地/基质成分":"Texture / base ingredient","pH调节体系":"pH-adjusting system","螯合体系":"Chelating system","植物精粹体系":"Botanical extract system","保湿/舒缓体系":"Hydration / soothing system","保湿/抗炎体系":"Hydration / anti-inflammatory system","防晒体系(化学,新一代)":"Next-generation chemical sunscreen system","防晒体系(辅助)":"Sunscreen support system","质地/基质成分(硅类)":"Texture / base ingredient (silicone)","品牌复合活性体系":"Brand complex-active system"
};

const REPLACE:Array<[RegExp,string|((...args:any[])=>string)]>=[
  [/^第\s*(\d+)\s*位$/,(m:string,n:string)=>`#${n}`],
  [/^未标准化\s*(\d+)$/,(m:string,n:string)=>`Unstandardised ${n}`],
  [/^本阶段问题\s*(\d+)\/(\d+)$/,(m:string,a:string,b:string)=>`Question ${a} of ${b}`],
  [/^本症状问题\s*(\d+)\/(\d+)$/,(m:string,a:string,b:string)=>`Question ${a} of ${b}`],
  [/^约\s*(\d+)\s*题进一步了解$/,(m:string,n:string)=>`About ${n} follow-up questions`],
  [/^开始分析[（(](\d+)个问题[）)]$/,(m:string,n:string)=>`Start analysis (${n} concerns)`],
  [/^找到\s*(\d+)\s*款，当前显示\s*(\d+)\s*款$/,(m:string,a:string,b:string)=>`${a} products found · showing ${b}`],
  [/^数据完整度\s*(\d+)%$/,(m:string,n:string)=>`Data completeness ${n}%`],
  [/^可信度：(.+) · 有效证据\s*(\d+)\s*条$/,(m:string,a:string,b:string)=>`Confidence: ${a} · ${b} evidence signals`],
  [/^\+(\d+) · (.+)（配料第\s*(\d+)\s*位）$/,(m:string,p:string,n:string,pos:string)=>`+${p} · ${n} (ingredient #${pos})`],
  [/^(-?\d+) · (.+)（配料第\s*(\d+)\s*位）$/,(m:string,p:string,n:string,pos:string)=>`${p} · ${n} (ingredient #${pos})`],
  [/^\+(\d+) · (.+)协同（体系强度\s*(\d+)\/5）$/,(m:string,p:string,n:string,s:string)=>`+${p} · ${n} synergy (system strength ${s}/5)`],
  [/^酒精\s*(.+)$/,(m:string,v:string)=>`Alcohol ${v}`],
  [/^肤感：(.+) · 配方画像可信度\s*(.+)$/,(m:string,a:string,b:string)=>`Skin feel: ${a} · Formula-profile confidence ${b}`],
  [/^特征更符合:(.+)$/,(m:string,v:string)=>`Feature is more consistent with: ${translateCore(v)}`],
  [/^共同根因:(.+)$/,(m:string,v:string)=>`Shared driver: ${translateCore(v)}`],
  [/^(.+):(.+) · (结节型|囊肿型|脓疱型)$/,(m:string,a:string,b:string,c:string)=>`${translateCore(a)}: ${translateCore(b)} · ${translateCore(c)}`],
  [/^(.+):(.+)$/,(m:string,a:string,b:string)=>`${translateCore(a)}: ${translateCore(b)}`]
];

const PHRASE_REPLACEMENTS:Array<[string,string]>=[
  ["（排位靠后，风险权重相应调低）"," (lower concentration estimate, so lower risk weight)"],
  ["当前诊断下不参与加减分。","Not used as positive or negative evidence for this assessment."],
  ["已记录，但当前规则库没有把它列为适合或风险证据。","Recorded, but the current rules do not classify it as positive or caution evidence."],
  ["OCR 已读取这段文字，但暂时无法映射到标准成分名，因此不参与评分。","OCR read this text, but it cannot yet be mapped to a standard ingredient name, so it is not scored."],
  ["不同症状下适用性相反，不计入分数","Its suitability differs by concern, so it is not scored"],
  ["当前需求偏温和，但挥发性酒精位置较高","Your current needs favour gentler formulas, but volatile alcohol appears relatively high in the list"],
  ["当前配方数据或相关证据不足，因此不生成精确推荐分数，也不会把它当作首选。","There is not enough formula data or relevant evidence to generate a precise match score, so this is not treated as a top pick."],
  ["配方可能因地区与批次调整，购买或使用前仍应与手中包装核对。","Formulas can vary by market and batch; verify against the package you have before purchase or use."],
  ["评分同时使用单个成分证据和 Formula DNA 体系协同","Scoring combines individual ingredient evidence with Formula DNA system-level synergy"],
  ["证据不足的产品不显示精确分数。","Products with insufficient evidence do not receive a precise score."],
  ["同一个成分,风险会因诊断结论而不同","The same ingredient can carry different risk depending on the assessment"],
  ["识别到","Recognised "],["个成分库条目"," ingredient-library entries"],["条成分规则"," ingredient rules"],
  ["正在比对「","Comparing “"],["」。","”."],
  ["基于本次所有已选症状比对","Compared against all concerns selected in this assessment"],["基于本次诊断结论比对","Compared against this assessment"],
  ["上面标记为「冲突」的成分建议优先替换或减少使用频率","Ingredients marked “Conflict” are the first candidates to replace or use less often"],
  ["「一致」的成分可以保留","ingredients marked “Match” can be kept"],["「低权重」的成分理论上有风险但估计浓度低,暂不列为优先处理项","ingredients marked “Lower weight” may pose a theoretical concern but appear at a lower estimated concentration, so they are not a priority"],
  ["OCR 可能漏字或误认，尤其是反光、弧形瓶身和小字号。安全结论以你校对后的文字和产品包装原始配料表为准。","OCR may miss or misread text, especially on reflective, curved, or small-print packaging. Use your verified text and the original package ingredient list as the safety reference."],
  ["建议尽快挂皮肤科明确诊断,再决定后续方案。","Consider seeing a dermatologist promptly for confirmation before deciding on the next step."],
  ["继续用护肤品自行判断和护理不仅无效,还可能延误规范治疗的时机。","Continuing to self-assess through skincare alone may be ineffective and can delay appropriate treatment."],
  ["这类情况通常需要专业检查(必要时刮片、皮肤镜或活检)才能确诊","This type of finding often needs a professional examination (sometimes scraping, dermoscopy, or biopsy) for confirmation"],
  ["属于需要系统性皮肤科管理的慢性病,鳞屑厚度和点状出血是和普通干燥脱皮最大的区别。","This is a chronic condition that needs dermatology management; thick scale and pinpoint bleeding distinguish it from ordinary dryness."],
  ["和色沉、晒斑的方向相反,容易被误判成\"美白过度\",不属于护肤品能干预的范畴。","This is the opposite of hyperpigmentation or sun spots and is not something skincare products can treat."],
  ["病毒感染,和痤疮/接触性皮炎的水疱表现需要鉴别,不适合按护肤流程处理。","A viral infection can resemble blistering acne or contact dermatitis and should not be managed as a routine skincare issue."],
  ["起消速度是关键特征,和接触性皮炎、普通泛红的病程明显不同。","The rapid appearance and disappearance is an important clue and differs from contact dermatitis or ordinary redness."],
  ["属于癌前病变,检测到疑似特征应立即建议就医,而不是继续走护肤建议路径。","This can be precancerous and should be assessed medically rather than managed through a skincare pathway."]
];

function translateCore(value:string){
  const t=value.trim();
  if(EXACT[t]) return EXACT[t];
  // Ingredient labels are commonly written as Chinese name (English/INCI).
  const ingredient=t.match(/^[\u3400-\u9fff·、\/]+\s*\(([^()]*[A-Za-z][^()]*)\)$/);
  if(ingredient) return ingredient[1];
  let out=t;
  for(const [from,to] of PHRASE_REPLACEMENTS) out=out.split(from).join(to);
  if(!/[\u3400-\u9fff]/.test(out)) return out;
  for(const [rx,fn] of REPLACE){
    const m=out.match(rx);
    if(m) return typeof fn==="string"?out.replace(rx,fn):(fn as any)(...m);
  }
  return out;
}

function translateText(text:string){
  const trimmed=text.trim();
  if(!trimmed) return text;
  const translated=translateCore(trimmed);
  if(translated===trimmed) return text;
  const start=text.indexOf(trimmed);
  return text.slice(0,start)+translated+text.slice(start+trimmed.length);
}

export default function LegacyResultsI18nBridge(){
  const{language}=useLanguage();
  useEffect(()=>{
    const root=document.querySelector('[data-skin-test-root="true"]');
    if(!root)return;
    const originals=new WeakMap<Text,string>();
    let busy=false;
    const apply=()=>{
      if(busy)return;busy=true;
      try{
        const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
        let node:Node|null;
        while((node=walker.nextNode())){
          const n=node as Text;
          if(!originals.has(n))originals.set(n,n.nodeValue||"");
          const original=originals.get(n)||"";
          const next=language==="en"?translateText(original):original;
          if(n.nodeValue!==next)n.nodeValue=next;
        }
        if(language==="en"){
          root.querySelectorAll('input[placeholder],textarea[placeholder]').forEach((el:any)=>{
            if(!el.dataset.zhPlaceholder)el.dataset.zhPlaceholder=el.placeholder||"";
            const p=el.dataset.zhPlaceholder||"";
            if(p==="搜索品牌或产品名")el.placeholder="Search brand or product";
            if(p.startsWith("例如："))el.placeholder="e.g. Aqua, Glycerin, Niacinamide, Ceramide NP…";
          });
        }else{
          root.querySelectorAll('[data-zh-placeholder]').forEach((el:any)=>{el.placeholder=el.dataset.zhPlaceholder||""});
        }
      }finally{busy=false}
    };
    apply();
    const obs=new MutationObserver(()=>queueMicrotask(apply));
    obs.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["placeholder"]});
    return()=>obs.disconnect();
  },[language]);
  return null;
}
