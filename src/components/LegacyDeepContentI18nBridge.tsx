import {useEffect} from "react";
import {useLanguage} from "../lib/i18n";

const EN:Record<string,string>={
  "近期建议以修复为主:避免高浓度酸类和物理去角质,选择含神经酰胺、泛醇的修复类产品,清洁产品换成温和氨基酸表活。抗老/抗氧化类活性成分建议暂缓引入,待屏障状态稳定后再逐步添加。":"Prioritise barrier recovery for now: avoid high-strength acids and physical exfoliation, choose barrier-supportive products with ceramides or panthenol, and use a gentle cleanser. Delay stronger anti-aging or antioxidant actives until the barrier is stable, then reintroduce gradually.",
  "避免热水洗脸、酒精类护肤品和高浓度活性成分,以舒缓抗炎为主要方向,减少一切可能扩张血管的刺激源。":"Avoid hot-water cleansing, alcohol-heavy skincare and high-strength actives. Prioritise soothing, anti-inflammatory care and reduce triggers that may promote flushing.",
  "以基础舒缓保湿为主,减少新品尝试频率,给皮肤留出适应时间,避免叠加多种活性成分。":"Keep the routine simple and soothing, reduce how often you introduce new products, allow time for adaptation, and avoid stacking multiple actives.",
  "立即停用一切去角质/焕肤类产品至少2-4周,专注基础保湿修复,待屏障感受恢复后再谨慎低频重启。":"Stop exfoliating or resurfacing products for at least 2–4 weeks and focus on basic moisturising and barrier support. Restart cautiously at low frequency only after the skin feels recovered.",
  "这更接近脂溢性皮炎而非单纯屏障受损,机制和马拉色菌相关,单纯保湿修复效果有限——护理方向应该侧重控油+抗真菌+抗炎的平衡,过度保湿反而可能加重油腻感。":"This pattern is more consistent with seborrheic dermatitis than simple barrier damage and may involve Malassezia. Moisturising alone may be insufficient; care usually balances oil control, antifungal treatment and inflammation control.",
  "这种情况容易被当成油痘处理,但方向恰恰相反——应避免控油/祛痘产品线里的高浓度酸类和收敛成分,转向屏障修复,痘痘往往会随屏障恢复自然消退。":"This can be mistaken for oily acne, but the direction may be the opposite. Avoid strong acids and astringents, focus on barrier recovery, and reassess as the barrier improves.",
  "护理方向以角质代谢调节+抗炎为主,粉刺和轻度丘疹阶段护肤品/非处方药可以起到明显作用,单靠护肤品对中重度炎症效果有限。":"Focus on normalising keratinisation and reducing inflammation. Skincare and over-the-counter options can help comedones and mild papules, but skincare alone is limited for moderate-to-severe inflammation.",
  "已经出现脓疱,说明炎症比单纯粉刺更明确,护肤品能辅助但不该单独承担治疗任务——控油和抗炎方向的产品可以配合,但核心还是药物介入。":"Pustules indicate clearer inflammation than simple comedones. Skincare can support oil and inflammation control, but it should not be the sole treatment strategy.",
  "结节囊肿型的炎症位置比表面痘痘更深,护肤品这个阶段基本起不到治疗作用,处理不及时容易留下凹陷疤痕,这不是护肤能解决的范畴。":"Nodular or cystic acne is deeper than surface acne. Skincare has little treatment effect at this stage, and delayed treatment increases the risk of permanent scarring.",
  "先排查近期新用产品,停用可疑品项做单一变量测试,通常在停用后1-2周内会看到明显改善。":"Review recently introduced products first and stop the most suspicious item as a single-variable test. Improvement is often noticeable within 1–2 weeks if the product is the trigger.",
  "这不是细菌性痤疮,是马拉色菌(一种酵母菌)在毛囊内过度增殖导致的炎症,常规祛痘产品(尤其是含厚重油脂/发酵成分的)和抗生素类无效,甚至会因为破坏皮肤菌群平衡而加重。护理方向应该是抗真菌,而不是抗痘。":"This is not typical bacterial acne; it may reflect Malassezia overgrowth in follicles. Standard acne products or antibiotics may not help, so the treatment direction is antifungal rather than conventional acne care.",
  "可以引入低浓度、低频率的化学去角质(如低浓度果酸/PHA),配合保湿,避免过度物理摩擦。":"Consider low-strength, low-frequency chemical exfoliation such as mild AHA or PHA, paired with moisturising. Avoid excessive physical friction.",
  "重点在于抑制黑色素生成+严格防晒:建议加入烟酰胺、传明酸等美白方向成分,防晒是效果能否维持的关键。":"Focus on reducing excess pigment production and strict sun protection. Ingredients such as niacinamide or tranexamic acid may help; sunscreen is essential for maintaining results.",
  "护肤品能起到的作用有限,更多需要从睡眠、压力管理入手;日常可用含咖啡因、维C的提亮类精华辅助。":"Skincare has limited impact here. Sleep and stress management matter more; caffeine- or vitamin C-based brightening products can be supportive.",
  "这是慢性累积效应,建议引入低浓度维A醇建立耐受,配合抗氧化精华(维C/阿魏酸)和严格防晒,效果显现需要数月周期。":"This is a cumulative process. Consider gradually building tolerance to a low-strength retinoid, paired with antioxidants such as vitamin C/ferulic acid and consistent sunscreen. Visible improvement usually takes months.",
  "以控油、疏通毛孔为主:含锌PCA、烟酰胺的产品能持续调节皮脂分泌,避免频繁去角质或用力挤压,否则毛孔会被进一步物理撑大。":"Prioritise sebum control and keeping pores clear. Zinc PCA or niacinamide may help regulate oil; avoid frequent exfoliation or forceful extraction.",
  "这种情况很容易被误判成出油旺盛去做控油,但方向恰恰相反——应该加强保湿修复,皮脂会随着屏障水润度恢复而回归正常分泌,继续控油只会让代偿性出油更严重。":"This can be mistaken for simple oiliness. The better direction may be hydration and barrier support rather than stronger oil control.",
  "建议低浓度、低频率的化学去角质(水杨酸因为亲脂性,对疏通毛孔内堆积皮脂更有针对性),配合温和保湿,避免用手挤压黑头导致毛孔发炎撑大。":"Use low-strength, low-frequency chemical exfoliation. Salicylic acid is oil-soluble and can target pore buildup; pair it with gentle moisturising and avoid squeezing blackheads.",
  "核心是胶原流失导致的支撑力下降,日常护肤能做的有限——建议引入低浓度维A醇建立耐受以刺激胶原新生,配合严格防晒延缓流失速度,效果显现通常需要数月。":"The main driver is reduced structural support from collagen loss. Skincare can help modestly; a low-strength retinoid introduced gradually plus consistent sunscreen may support collagen over time.",

  "触发模式提示玫瑰痤疮可能性未被排除,建议挂皮肤科做进一步评估,确认后再决定用药方案。":"The trigger pattern does not rule out rosacea. Consider a dermatology assessment before choosing medication.",
  "如果反复发作或面积较大、常规护理没有改善,建议皮肤科确认诊断后再决定长期方案。":"If it recurs, covers a larger area, or does not improve with basic care, consider dermatology confirmation before deciding on a long-term plan.",
  "周期性、粉刺明显的模式提示可能与激素相关,建议挂皮肤科做评估,明确用药方案与浓度。":"A cyclical pattern with prominent comedones may have a hormonal component. Consider dermatology assessment for an appropriate treatment plan.",
  "已经有脓疱形成,建议尽快挂皮肤科明确治疗方案,拖延可能增加炎症后色沉和留印的风险。":"Pustules are present. Consider prompt dermatology review; delay can increase the risk of post-inflammatory pigmentation and marks.",
  "结节囊肿型痤疮建议尽快就医,不建议自行护理观察——炎症深、留疤风险高,越早规范治疗、遗留疤痕的概率越低。":"Nodular or cystic acne should be assessed promptly because deep inflammation carries a higher scarring risk.",
  "如果面部也出现类似皮损,建议皮肤科做刮片镜检确认诊断,避免长期误用祛痘产品延误处理。":"If similar lesions appear on the face, consider dermatology confirmation, potentially including microscopy, to avoid prolonged use of inappropriate acne treatments.",
  "如果斑块边界不规则或近期明显扩大,建议皮肤科确认是否为黄褐斑或其他色素性疾病,再决定治疗方案。":"If a pigmented patch has irregular borders or is enlarging, seek dermatology assessment before choosing treatment.",

  "抗炎抑菌,刺激性低,起效慢":"Anti-inflammatory and antimicrobial; generally lower irritation, but gradual onset.",
  "玫瑰痤疮一线外用,耐受性较好":"Common topical option for rosacea with generally good tolerability.",
  "兼具抗炎,适用于炎性丘疹":"Anti-inflammatory and useful for inflammatory papules.",
  "中重度炎症性情况使用,需医生评估":"Used for moderate-to-severe inflammatory disease under clinician guidance.",
  "非处方,日常维稳可用":"Non-prescription option for routine soothing support.",
  "非药物,但是这个阶段的核心":"Not a medication, but a core barrier-support step at this stage.",
  "抗真菌方向,通常间歇性使用而非长期连续":"Antifungal approach, typically used intermittently rather than continuously long term.",
  "兼具抗真菌和抗炎,常见于相关洗护产品":"Combines antifungal and anti-inflammatory activity and is used in some cleansing products.",
  "兼顾抗炎和轻度调节角质,刺激性低":"Combines anti-inflammatory action with mild keratinisation regulation and is generally relatively gentle.",
  "调节角质代谢,刺激性低于传统维A酸":"Regulates keratinisation and is generally less irritating than tretinoin.",
  "强抗菌,起效快但刺激性明显":"Strong antibacterial action with relatively fast onset, but can be irritating.",
  "针对激素周期性痤疮,需医生评估内分泌情况":"Used for hormonally patterned acne and requires clinician assessment.",
  "调节角质代谢,长期使用可减少新发脓疱":"Regulates keratinisation and may reduce new inflammatory lesions over time.",
  "强抗菌抗炎,起效快,常与阿达帕林联合使用":"Strong antibacterial and anti-inflammatory action; often combined with adapalene.",
  "通常与过氧化苯甲酰联合,避免单独使用产生耐药性":"Usually paired with benzoyl peroxide to reduce antibiotic-resistance risk.",
  "重度囊肿型痤疮的标准选择,效果强但副作用系统性(致畸性、肝功能影响等),必须医生严格监控":"A standard option for severe cystic acne, but it has important systemic risks and requires strict medical monitoring.",
  "如果同时有激素周期性规律,可作为联合治疗方向":"May be considered as part of combination treatment when a hormonal pattern is present.",
  "医生操作,用于单个严重结节的快速消肿止痛":"Clinician-administered treatment sometimes used for rapid relief of an individual severe nodule.",
  "抗真菌方向,常用于身体/头皮部位,面部需谨慎":"Antifungal approach commonly used on the body or scalp; facial use requires care.",
  "较强效美白成分,需医生指导浓度和使用周期":"A stronger depigmenting agent that should be used with clinician guidance on strength and duration.",
  "长期光损伤的经典处方选择,需建立耐受":"A classic prescription option for chronic photodamage that requires gradual tolerance building.",
  "长期用于刺激胶原合成,需建立耐受,起效缓慢":"Used long term to support collagen production; requires gradual tolerance and works slowly.",
  "亲脂性强,较易进入毛孔溶解堆积的皮脂和角质":"Oil-soluble and able to penetrate pores to help loosen accumulated sebum and keratin.",

  "壬二酸 (Azelaic Acid)":"Azelaic Acid","甲硝唑凝胶":"Metronidazole gel","壬二酸":"Azelaic acid","低剂量四环素类抗生素":"Low-dose tetracycline-class antibiotic","泛醇/积雪草类舒缓成分":"Panthenol / Centella-based soothing ingredients","神经酰胺类修复霜":"Ceramide barrier cream","酮康唑洗剂/乳膏":"Ketoconazole wash / cream","锌吡硫酮":"Zinc pyrithione","阿达帕林 (Adapalene)":"Adapalene","过氧化苯甲酰":"Benzoyl peroxide","螺内酯 / 口服避孕药":"Spironolactone / oral contraceptive","外用抗生素(克林霉素等)":"Topical antibiotic (e.g. clindamycin)","口服异维A酸":"Oral isotretinoin","皮损内糖皮质激素注射":"Intralesional corticosteroid injection","酮康唑洗剂/硫化硒洗剂":"Ketoconazole / selenium sulfide wash","氢醌 (Hydroquinone)":"Hydroquinone","维A酸 (Tretinoin)":"Tretinoin","水杨酸 (BHA,低浓度)":"Salicylic acid (low-strength BHA)",

  "补充屏障脂质,减少经皮水分流失":"Replenishes barrier lipids and reduces transepidermal water loss.",
  "神经酰胺合成前体,协同修复屏障":"Ceramide precursor that supports barrier repair.",
  "配合神经酰胺按比例修复屏障脂质结构":"Supports barrier-lipid structure alongside ceramides.",
  "仿生皮脂,低致痘性封闭保湿":"Sebum-like emollient that provides low-comedogenic occlusion.",
  "成分结构接近人体皮脂,温和不易致痘":"Structurally similar to human sebum; generally gentle and low-comedogenic.",
  "高含量脂肪酸,强效封闭滋润":"Fatty-acid-rich occlusive moisturiser.",
  "氧化稳定性高的轻质植物油,滋润不粘腻":"Oxidatively stable lightweight plant oil with a less greasy feel.",
  "极强封闭锁水,但部分肤质可能闷痘":"Strongly occlusive and water-retaining; may feel congesting for some skin types.",
  "强滋润封闭剂,少数人可能致敏":"Rich occlusive emollient; a minority of users may react.",
  "成膜封闭、改善肤感,不致痘但可能闷痘体质需注意":"Film-forming emollient that improves slip; acne-prone users may still prefer lighter textures.",
  "快速补水,分子量小、渗透表层":"Humectant hydration for the skin surface.",
  "经典吸湿剂,性价比高、刺激性低":"Classic low-irritation humectant.",
  "小分子吸湿保湿剂,兼做其他成分的溶剂":"Small-molecule humectant that also serves as a solvent.",
  "糖类保湿剂,兼具一定的细胞保护作用":"Sugar-derived humectant with supportive cell-protection properties.",
  "糖醇类保湿剂,质地稳定":"Stable sugar-alcohol humectant.",
  "渗透压保护,增强细胞抗刺激能力":"Osmoprotective ingredient that supports resilience to environmental stress.",
  "温和清洁,不过度破坏屏障脂质":"Gentle cleansing with less disruption to barrier lipids.",
  "温和两性表活,常与氨基酸表活复配":"Gentle amphoteric surfactant often combined with amino-acid surfactants.",
  "清洁力强但偏碱性,容易破坏屏障":"Strong cleansing surfactant that can be more disruptive to the barrier.",
  "抗炎+促进屏障修复":"Soothes inflammation and supports barrier recovery.",
  "抗炎抗敏,促进创面愈合":"Soothing botanical support for inflammation and recovery.",
  "抗炎舒缓,常用于刺激后修复":"Anti-inflammatory soothing ingredient often used after irritation.",
  "促进修复、舒缓刺激,质地温和":"Supports recovery and soothes irritation with generally good tolerability.",
  "抗炎兼具轻度美白效果":"Anti-inflammatory with mild brightening support.",
  "植物来源舒缓成分,常用于敏感肌产品":"Botanical soothing ingredient commonly used in sensitive-skin products.",
  "植物抗炎,常见于舒缓精华":"Botanical anti-inflammatory ingredient used in soothing serums.",
  "抗炎抑菌,轻度调节角质,刺激性低":"Anti-inflammatory and antimicrobial with mild keratinisation regulation.",
  "亲脂性,疏通毛孔内堆积的角质和皮脂":"Oil-soluble exfoliant that helps clear keratin and sebum inside pores.",
  "促进表层角质脱落,改善暗沉粗糙":"Promotes surface exfoliation to improve dullness and rough texture.",
  "分子量大、渗透慢,焕肤效果温和,敏感肌也可尝试":"Larger-molecule exfoliant with slower penetration and generally gentler resurfacing.",
  "温和螯合+轻度焕肤,兼具抗氧化":"Mild chelating and exfoliating action with antioxidant support.",
  "调节角质代谢,减少粉刺形成":"Regulates keratinisation and helps reduce comedone formation.",
  "刺激胶原新生,加速角质代谢,起效强但刺激明显":"Supports collagen production and skin turnover but can be irritating.",
  "促进胶原蛋白合成,改善细纹":"Supports collagen synthesis and the appearance of fine lines.",
  "调节炎症反应,辅助抗老":"Helps modulate inflammation and supports anti-aging care.",
  "松弛类多肽,常用于表情纹改善":"Peptide used to support the appearance of expression lines.",
  "促进细胞修复,改善细纹和松弛":"Supports cellular repair and the appearance of fine lines and laxity.",
  "调节皮脂分泌,兼具轻度抗菌":"Helps regulate sebum with mild antimicrobial activity.",
  "促进神经酰胺合成、控油、抑制黑色素转移":"Supports ceramide production, oil regulation and reduced pigment transfer.",
  "收敛毛孔外观,促进微循环,常用于眼部和头皮":"Supports a tighter-looking pore appearance and circulation; commonly used around the eyes or scalp.",
  "中和自由基,抑制黑色素合成,比左旋VC稳定刺激低":"Antioxidant vitamin C derivative that supports brightening with improved stability.",
  "增强维C稳定性,协同抗氧化":"Improves vitamin C stability and provides synergistic antioxidant support.",
  "多酚类抗氧化,常与阿魏酸复配":"Polyphenol antioxidant often paired with ferulic acid.",
  "经典脂溶性抗氧化剂,兼具轻度保湿":"Classic oil-soluble antioxidant with mild emollient benefit.",
  "阻断黑色素细胞活化路径,改善色沉":"Helps reduce melanocyte activation pathways involved in hyperpigmentation.",
  "抑制酪氨酸酶活性,减少黑色素生成":"Helps inhibit tyrosinase and reduce melanin production.",
  "物理防晒,阻断光损伤和色沉加重,敏感肌友好":"Mineral UV filters that help prevent photodamage and worsening pigmentation.",
  "吸收紫外线转化为热能,肤感更轻薄但少数人可能刺激":"Chemical UV filters with lighter textures; a minority of sensitive users may react.",
  "抑制马拉色菌过度增殖":"Helps suppress Malassezia overgrowth.",
  "兼具抗真菌和抗炎":"Provides antifungal and anti-inflammatory activity.",
  "强抗菌,起效快但刺激性明显":"Strong antibacterial effect with rapid onset but higher irritation potential.",
  "玫瑰痤疮一线外用抗炎抗菌":"Common topical anti-inflammatory and antimicrobial option for rosacea.",
  "调节配方酸碱度,不直接作用于皮肤功效":"Adjusts formula pH rather than providing a direct skin benefit.",
  "螯合金属离子,提升配方稳定性和防腐效果":"Chelates metal ions to improve formula stability and preservation.",
  "广谱防腐,维持产品稳定性,常规浓度下大部分人耐受良好":"Broad-spectrum preservation that maintains product stability and is generally well tolerated at standard concentrations.",
  "多元醇类防腐增效剂,兼具保湿":"Polyol preservative booster with humectant properties.",
  "改善气味体验,但是最常见的致敏原之一":"Adds fragrance but is also a common sensitisation concern.",
  "天然存在或添加的常见致敏原,欧盟要求单独标注":"Common fragrance allergens that may be naturally present or added.",
  "制造清凉/发热感,但会刺激血管扩张":"Creates cooling or warming sensations but may aggravate vascular reactivity.",
  "调整产品颜色,不参与功效,敏感肌偶见反应":"Adjusts product colour without contributing to efficacy; sensitive users may occasionally react."
};

function translate(text:string){
  const trimmed=text.trim();
  if(!trimmed)return text;
  const out=EN[trimmed];
  if(!out)return text;
  const start=text.indexOf(trimmed);
  return text.slice(0,start)+out+text.slice(start+trimmed.length);
}

export default function LegacyDeepContentI18nBridge(){
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
          if(!originals.has(n)) originals.set(n,n.nodeValue||"");
          const original=originals.get(n)||"";
          const next=language==="en"?translate(original):original;
          if(n.nodeValue!==next)n.nodeValue=next;
        }
      }finally{busy=false}
    };
    apply();
    const obs=new MutationObserver(()=>queueMicrotask(apply));
    obs.observe(root,{subtree:true,childList:true,characterData:true});
    return()=>obs.disconnect();
  },[language]);
  return null;
}
