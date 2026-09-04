// Original bilingual editorial; sources checked 2026-09-02.
export const growthSources = {
 hsaMedicube:{label:'HSA | Medicube batch update, 28 August 2026',url:'https://www.hsa.gov.sg/announcements/hsa-tests-product-samples-of-medicube-pdrn-pink-collagen-capsule-cream-for-presence-of-sudan-red-dyes/',note:'新加坡批次安全通报；2026-09-04 核对，不是功效证据。',en:'Singapore batch safety update; checked 2026-09-04, not efficacy evidence.'},
 bojGuide:{label:'Beauty of Joseon | Relief Sun and Aqua-fresh guide',url:'https://beautyofjoseon.com/blogs/news/mastering-relief-sun-and-aqua-fresh',note:'品牌对两款国际版的定位；不是独立比较试验。',en:'Brand positioning for the two international versions; not an independent comparative trial.'},
 hadaSG:{label:'Hada Labo Singapore | Lotion collection',url:'https://www.hadalabo.com.sg/collection/lotion/',note:'新加坡官网的系列名称；不能用于证明日本版配方相同。',en:'Singapore collection names; not evidence that Japanese formulas are identical.'},
 pdrnStudy:{label:'Kim et al. (2022) | PDRN combination study',url:'https://pubmed.ncbi.nlm.nih.gov/35209068/',note:'紫外线照射动物模型，使用微针递送；并非普通精华的人体日常涂抹试验。',en:'A UV-exposed animal model using microneedling delivery, not a human trial of everyday serum application.'}
};
const p=(slug,label)=>({url:'/product/'+slug+'/',label});
export const growthArticles=[
{zh:{
 slug:'beauty-of-joseon-relief-sun-vs-aqua-fresh',date:'2026-09-02',category:'产品选择',art:'shopping',
 title:'BOJ 原版防晒 vs Aqua-Fresh：新加坡湿热天气怎么选？',
 excerpt:'比较 Beauty of Joseon 两款国际版防晒的定位、版本与使用场景。先分清 Rice + Probiotics 和 Rice + B5，再看肤感与补涂。',
 answer:'品牌把原版定位为更滋润，把 Aqua-Fresh 定位为更清爽。油皮可以先关注后者，干皮可以先关注前者，但实际耐受、包装版本和能否足量使用比标签更重要。',
 sections:[
 {heading:'先核对名字，避免拿不同市场的产品比较',paragraphs:['本文比较 Relief Sun: Rice + Probiotics 与 Relief Sun Aqua-Fresh: Rice + B5，品牌比较指南将两款标示为 SPF50+ PA++++。购买时请看完整名称及瓶身防晒标示，不能只看“BOJ 防晒”四个字。海外购物页面可能切换地区；如果名字、SPF 或成分不一致，应按手中的版本重新核对。'],sources:['bojGuide']},
 {heading:'两款的区别，先看实际使用需求',table:{headers:['判断点','原版 Rice + Probiotics','Aqua-Fresh Rice + B5'],rows:[['品牌质地定位','更滋润的乳霜感','更轻盈清爽'],['品牌面向的需求','偏干或普通皮肤的滋润需求','偏油或混合皮肤的清爽需求'],['不要据此推断','滋润不等于人人闷痘','清爽不等于保证不刺激'],['购买前核对','完整名称、销售地区、成分与防晒标签','完整名称、销售地区、成分与防晒标签']]},sources:['bojGuide']},
 {heading:'在新加坡，通勤和户外运动要分开考虑',paragraphs:['如果你大部分时间在空调房，选择重点可以是足量涂抹后的舒适度，以及与日常保湿、底妆是否配合。不要只用一点点试在手背，就认定全脸使用也一定清爽。我们的建议是保持其他步骤稳定，再观察出门后的肤感、搓泥和补涂是否方便。','游泳、跑步或大量出汗时，另外核对包装上的耐水标示。SPF 数字并不能替代耐水信息。AAD 建议选择广谱、SPF30 或更高的防晒，户外通常每两小时补涂，游泳或出汗后也需要补涂；具体仍要看产品说明。'],sources:['sunscreen','sunscreenLabel']},
 {heading:'原版有益生菌，Aqua-Fresh 有 B5，就能判胜负吗？',paragraphs:['不能。名字强调的成分只是配方线索，不能把它变成个人体验或临床效果的保证。看一项成分有没有出现，也不能直接判断谁更防晒、更不致痘，或谁更适合所有敏感皮肤。品牌给出的质地定位是试选起点，不是你必须符合的肤质规则。','没有必要为了完成比较同时购买两支。如果目前用的防晒能按说明持续使用，肤感也舒服，另一款新品并不自动成为升级。确实想换时，先确认是为了减少黏腻、配合底妆，还是改善补涂体验，把一个理由写清楚更有帮助。']},
 {heading:'成分表和主站应该怎么一起用',paragraphs:['下面两张成分页分别连到主站对应产品，可以逐项查看已收录的 INCI，再结合自己的使用记录。目录是整理资料，不是对你手里那一批产品的实验室验证。如果包装与目录不同，请优先以包装为准，尤其留意跨境版本及配方更新。']}
 ],related:['singapore-commute-sunscreen','ingredient-list-how-to-read'],next:'先选定一个版本，查看成分，再用主站整理自己的需求；无需因为一篇比较文章更换已经合适的防晒。',
 products:[p('beauty-of-joseon-relief-sun-rice-probiotics','查看 BOJ 原版成分'),p('beauty-of-joseon-relief-sun-aqua-fresh','查看 BOJ Aqua-Fresh 成分')]
},en:{
 title:'Beauty of Joseon Relief Sun vs Aqua-Fresh: choosing for Singapore',
 excerpt:'Compare the international Rice + Probiotics and Rice + B5 sunscreens by positioning, version and everyday use in humid weather.',
 answer:'The brand positions the original as more nourishing and Aqua-Fresh as lighter. Oily skin may start with the latter and dry skin with the former, but tolerance, the exact version and comfortable full application matter more than labels.',
 sections:[
 {heading:'Check the full names before comparing markets',paragraphs:['This guide compares Relief Sun: Rice + Probiotics and Relief Sun Aqua-Fresh: Rice + B5. The brand comparison guide lists both as SPF50+ PA++++. Check the complete name and protection label, not simply “BOJ sunscreen”. Overseas shopping pages can switch regions; if the name, SPF or ingredients differ, verify the version you actually have.']},
 {heading:'Start with the experience you need',table:{headers:['Decision point','Original Rice + Probiotics','Aqua-Fresh Rice + B5'],rows:[['Brand texture positioning','A more nourishing cream feel','A lighter, fresher feel'],['Needs described by the brand','Nourishment for dry or normal skin','A lighter option for oily or combination skin'],['Do not infer','Nourishing does not mean everyone will break out','Lightweight does not guarantee freedom from irritation'],['Check before buying','Full name, market, ingredients and protection label','Full name, market, ingredients and protection label']]}},
 {heading:'Separate commuting from outdoor exercise',paragraphs:['For mostly air-conditioned days, consider comfort at the intended application amount and compatibility with moisturiser and makeup. A tiny hand swatch does not establish full-face comfort. Our suggestion is to keep other steps stable and observe texture, pilling and the practicality of reapplication after going out.','For swimming, running or heavy sweating, check the water-resistance label separately. SPF does not replace that information. The AAD recommends broad-spectrum SPF30 or higher and reapplication outdoors about every two hours, as well as after swimming or sweating. Follow the specific product instructions.']},
 {heading:'Can probiotics or B5 in the name decide the winner?',paragraphs:['No. Highlighted ingredients are formula clues, not guarantees of personal experience or clinical outcomes. The presence of one ingredient cannot establish which product offers better protection, causes fewer breakouts or suits every person with sensitive skin. Brand texture positioning is a starting point, not a rule your skin must follow.','You do not need to buy both to complete a comparison. If your current sunscreen is comfortable and you use it consistently as directed, a new release is not automatically an upgrade. If you want a change, identify one reason: less stickiness, makeup compatibility or easier reapplication.']},
 {heading:'Use the ingredient pages together with the app',paragraphs:['The two ingredient pages below link to the matching products in the app. Compare the indexed INCI with your own usage notes. The directory organises information; it is not laboratory verification of your batch. If the package differs, use it as your reference, especially for cross-border versions and reformulations.']}
 ],related:[],next:'Choose a specific version, check its ingredients and organise your needs in the app. A comparison article is not a reason to replace sunscreen that already suits you.',
 products:['View original BOJ ingredients','View BOJ Aqua-Fresh ingredients']
}},
{zh:{
 slug:'hada-labo-light-vs-rich-market-versions',date:'2026-09-02',category:'产品选择',art:'shopping',
 title:'肌研 Light vs Rich：日本版和新加坡版，先别当成同一瓶',
 excerpt:'Gokujyun、Hydrating、Light、Rich、Premium 容易看混。用版本清单核对肌研化妆水，再讨论你需不需要更滋润。',
 answer:'Peacedskin 当前 Light 与 Rich 记录标注为日本市场；新加坡官网有自己的 Hydrating 系列命名。名称相似不能证明配方相同，先核对销售地区、完整名称和包装成分，再比较肤感。',
 sections:[
 {heading:'为什么搜同一个名字，会看到不同瓶子？',paragraphs:['跨境卖家可能用中文俗称、英文译名或自己的标题描述同一系列，也可能把不同版本放在相邻位置。新加坡官网的乳液水类目录使用 Hydrating Light Lotion、Hydrating Lotion 和 Premium Hydrating Lotion 等名称。不要因为都带玻尿酸、都来自肌研，就自动把它们对应成日本版 Light 与 Rich。'],sources:['hadaSG']},
 {heading:'当前目录能告诉你什么，不能告诉你什么',table:{headers:['项目','Light 目录记录','Rich 目录记录'],rows:[['市场标签','JP，日本市场','JP，日本市场'],['资料完整度','93%，目录字段指标','93%，目录字段指标'],['名称含义','用于辨识这条记录','用于辨识这条记录'],['尚不能确认','与新加坡在售 Light 是否同配方','与新加坡 Hydrating 或 Premium 是否同配方']]}},
 {heading:'三步核对，避免买到“看起来一样”的版本',bullets:['先记录销售地区和完整产品名，别只截图电商搜索标题。容量、条码和背标照片也有助于区分。','把包装成分和目录逐项比对。若一项不同，不要先假设商家卖假货，也可能是翻译、地区或更新差异。','到品牌对应地区官网核对，再决定是否采用网上针对另一版本的评价。官方名称不能直接替代你手里包装的信息。'],paragraphs:['这是一份编辑核对清单，不是商品真伪鉴定。如果卖家无法提供清楚的背标，或来源不明，不要仅凭颜色、瓶盖和热门评价下结论。购买渠道、标签及宣传是否可信，比赶在优惠结束前买下更值得检查。'],sources:['hsaSafety']},
 {heading:'想选清爽还是滋润，先确定你缺什么',paragraphs:['“Rich”听起来更强，并不表示保湿效果必然优于其他版本；“Light”也不表示功能更少。第一次选择时，先描述你的具体问题，例如洗后紧绷、叠面霜太黏，或防晒前容易搓泥。只有明确目标，才知道哪种使用体验值得保留。','如果目前的保湿已经舒服，不需要为了补齐“水—精华—乳—霜”而再买一瓶。若只是想尝试更清爽的质地，尽量保持其余步骤不变。肌研的 Lotion 名称也不应机械套用成英语语境里的身体乳；实际产品形式请看地区官网和使用说明。']},
 {heading:'这篇为什么不给统一的“油皮买 Light、干皮买 Rich”答案？',paragraphs:['因为版本尚未对应时，直接给肤质结论可能是在推荐另一瓶产品。我们保留 Light 和 Rich 两条目录记录，公开它们的市场标签和未确认部分，并分别链接主站。等你对上具体包装，再讨论使用需求，才能避免把不同市场的资料拼成一个并不存在的配方。']}
 ],related:['serum-or-moisturizer-budget','ingredient-list-how-to-read'],next:'把手里产品的完整名称和地区先确认下来。下面是日本市场目录记录，不等于新加坡在售版本的认证。',
 products:[p('hada-labo-gokujyun-hyaluronic-lotion-light','查看日本市场 Light 记录'),p('hada-labo-gokujyun-hyaluronic-lotion-rich','查看日本市场 Rich 记录')]
},en:{
 title:'Hada Labo Light vs Rich: check Japanese and Singapore versions first',
 excerpt:'Gokujyun, Hydrating, Light, Rich and Premium can be confusing. Verify the market and label before comparing these lotions.',
 answer:'Peacedskin currently labels its Light and Rich records as Japanese-market products. Singapore uses its own Hydrating range names. Similar names do not establish identical formulas: check the market, full name and package ingredients first.',
 sections:[
 {heading:'Why can one search return different bottles?',paragraphs:['Cross-border sellers may use nicknames, translations or their own titles, and may display different versions together. The Singapore lotion collection uses names including Hydrating Light Lotion, Hydrating Lotion and Premium Hydrating Lotion. Shared references to hyaluronic acid and the same brand do not automatically map them to Japanese Light and Rich versions.']},
 {heading:'What the current directory does and does not establish',table:{headers:['Field','Light catalog record','Rich catalog record'],rows:[['Market label','JP, Japanese market','JP, Japanese market'],['Data completeness','93%, a catalog field metric','93%, a catalog field metric'],['Meaning of the name','Identifies this record','Identifies this record'],['Not yet confirmed','Whether it matches Singapore Hydrating Light','Whether it matches Singapore Hydrating or Premium']]}},
 {heading:'Three checks before buying a similar-looking version',bullets:['Record the market and full product name, not just a marketplace search title. Size, barcode and back-label photographs can help distinguish versions.','Compare package ingredients against the directory. A difference could reflect translation, market or reformulation; do not immediately assume a counterfeit.','Check the brand website for that market before using reviews about another version. Official naming does not replace the information on your package.'],paragraphs:['This is an editorial checklist, not an authenticity assessment. If a seller cannot provide a clear label or the source is unclear, do not rely only on bottle colour, cap design or popular reviews. Reliable channels, labels and claims deserve more attention than a sale countdown.']},
 {heading:'Define your need before choosing light or rich',paragraphs:['Rich does not establish superior moisturisation, and Light does not necessarily mean fewer functions. Describe a specific issue: tightness after washing, stickiness under cream or pilling before sunscreen. A clear goal helps you decide which experience is worth keeping.','If your moisturisation is comfortable, you do not need another bottle to complete a water-serum-emulsion-cream sequence. For a texture experiment, keep the rest of the routine stable. Do not mechanically interpret Lotion as an English-language body-lotion category; check the regional product format and instructions.']},
 {heading:'Why not simply recommend Light for oily skin and Rich for dry skin?',paragraphs:['Without a verified version match, that could recommend a different product. We retain both records, disclose their market labels and uncertainties, and link each to the matching app entry. Identify your exact package before discussing your needs, instead of assembling information from several markets into a formula that may not exist.']}
 ],next:'Confirm your product’s complete name and market first. These are Japanese-market catalog records, not certification of the versions sold in Singapore.',
 products:['View the Japanese-market Light record','View the Japanese-market Rich record']
}},
{zh:{
 slug:'pdrn-serum-vs-skin-booster-evidence',date:'2026-09-02',modified:'2026-09-04',category:'产品选择',art:'routine',
 title:'PDRN 精华是“涂抹式水光针”吗？追热点前看懂证据',
 excerpt:'PDRN、三文鱼 DNA、水光针常被放在同一段广告里。分清普通涂抹、微针递送和注射，再判断研究与你手里的精华有多大关系。',
 answer:'普通 PDRN 精华不能仅凭相同的成分名，就被当成注射项目的替代品。研究对象、给药方式和完整配方必须对应；动物实验或微针研究也不能直接证明一瓶日常精华的效果。',
 sections:[
 {heading:'先把热门名字拆开',paragraphs:['PDRN 是 polydeoxyribonucleotide 的缩写。讨论它时，最容易被省略的问题是：究竟研究了什么产品、用在谁身上、通过什么方式使用？“三文鱼 DNA”是你可能看到的营销说法，但仅凭这一说法，不能核定具体原料来源、剂量或效果。','“水光针”在消费语境里也不是一个足以确定配方的名称。看到精华被称为涂抹式水光针时，先要求品牌提供针对这款成品和这种用法的依据，而不是把两个热门名词当作已经完成的科学比较。']},
 {heading:'一个实际例子：论文标题有 topical，也不等于日常涂抹',paragraphs:['Kim 等人在 2022 年发表的研究考察了 PDRN、维生素 C 和烟酰胺的组合。摘要明确描述的是紫外线照射的动物模型，配方通过微针系统递送。作者报告了该条件下的相关变化。这个例子说明，只读标题里的“外用”或“弹性改善”，会漏掉影响解释的关键条件。','它没有直接回答普通人在完整皮肤上每天涂一款市售精华会怎样，也不能把组合配方的结果全部归给 PDRN。这里指出的是外推边界，不是宣布所有 PDRN 产品无效。具体成品若有其他人体研究，需要单独阅读其设计与结果。'],sources:['pdrnStudy']},
 {heading:'用这四个问题检查品牌给的证据',table:{headers:['问题','你要找的信息','缺少时不能直接推断'],rows:[['研究对象是谁？','人、动物还是细胞，以及样本与肤况','动物结果等于你的使用结果'],['使用方式是什么？','普通涂抹、微针递送或注射','一种方式等于另一种方式'],['测试了哪种配方？','原料、混合物还是与你购买相同的成品','单一成分解释全部变化'],['如何判断改善？','对照组、观察时间、测量指标和不良反应','一张前后照片证明因果']]}},
 {heading:'如果只是想买保湿精华，怎么避免被热点带着走？',paragraphs:['先写下你原本要解决的问题，再检查现有产品是否已经满足。觉得皮肤干，并不自动意味着缺少 PDRN；看到别人推荐某个热门数字或浓度，也不能用名称替代完整标签。比较时把价格、质地、实际使用意愿以及成品证据放在一起，不要只按热词多少评分。','购买前核对可靠来源与标签；新加坡 HSA 的消费提醒也强调警惕误导宣传。下面的 Anua 目录链接只是一个已收录产品的资料入口，并不是本文对其效果的验证，也不是品牌排名。我们没有在这里进行产品实测。'],sources:['hsaSafety']},
 {heading:'要记住的英文表达',bullets:['Topical application：涂在皮肤表面的使用方式；还要继续核对有没有辅助递送。','Finished-product evidence：针对完整成品的证据，不只是原料宣传。','Animal model：动物模型；不能直接等同日常人体使用。','Delivery method：递送方式，是比较研究时不能省略的条件。'],paragraphs:['你可以打开中英对照，把这些词放回上下文阅读。不要自行模仿论文里的微针或注射方法来追求“更好吸收”；这篇文章用于理解信息，不提供操作流程。']}
 ],related:['ingredient-list-how-to-read','skincare-tracking-not-guessing'],next:'先读证据，再看成分。目录中的产品名和数字不能替代完整配方、包装说明或成品研究。',
 products:[p('anua-pdrn-hyaluronic-acid-100-moisturizing-cream','查看 Anua PDRN 面霜目录记录（非效果背书）'),p('medicube-pdrn-pink-collagen-capsule-cream-dca76bbb-9cd0-4995-9f0f-258ade4f043a','查看 Medicube 对应面霜资料与批次提醒（非购买推荐）')]
},en:{
 title:'Is PDRN serum a topical skin booster? What the evidence actually tests',
 excerpt:'PDRN, salmon DNA and injectable skin boosters often share an advert. Separate ordinary application, microneedling delivery and injection before interpreting the research.',
 answer:'A PDRN serum cannot be treated as a substitute for an injectable procedure simply because of a shared ingredient name. Participants, delivery and the complete formula must match. Animal or microneedling research does not directly establish the effects of an everyday serum.',
 sections:[
 {heading:'Unpack the popular names first',paragraphs:['PDRN stands for polydeoxyribonucleotide. The often-missing questions are what product was studied, in whom and how it was used. Salmon DNA is a marketing expression you may encounter, but the phrase alone cannot establish the exact raw-material source, dose or effects.','Skin booster is also not a consumer term precise enough to identify a formulation. When a serum is called a topical skin booster, ask for evidence about that finished product used that way. Two popular terms do not constitute a scientific comparison.']},
 {heading:'A real example: topical in a title need not mean ordinary application',paragraphs:['A 2022 study by Kim and colleagues investigated a combination of PDRN, vitamin C and niacinamide. Its abstract describes a UV-exposed animal model with delivery through a microneedling system. The authors reported changes under those conditions. Reading only topical or improved elasticity in a title misses important context.','The study does not directly answer what happens when people apply a retail serum daily to intact skin, nor can all results of the mixture be assigned to PDRN. This is a limit on extrapolation, not a declaration that all PDRN products are ineffective. Any other human research on a specific finished product requires its own assessment.']},
 {heading:'Four questions for evidence supplied by a brand',table:{headers:['Question','Look for','Do not assume if missing'],rows:[['Who was studied?','Humans, animals or cells; sample and skin condition','Animal results predict your results'],['How was it used?','Ordinary application, microneedling delivery or injection','One delivery method equals another'],['What was tested?','Raw material, mixture or the same finished product you buy','One ingredient explains all changes'],['How was improvement assessed?','Control group, duration, endpoints and adverse events','One before-and-after photograph establishes causation']]}},
 {heading:'Buying a moisturising serum without following every trend',paragraphs:['Write down your original need and check whether your current products meet it. Dry-feeling skin does not automatically indicate a need for PDRN. A popular number or concentration claim in a name does not replace a full label. Consider price, texture, willingness to use the product and finished-product evidence together, not the number of buzzwords.','Check reliable sources and labels before buying; Singapore HSA also warns consumers about misleading claims. The Anua link below is only an existing catalog entry, not validation of that product’s effects or a brand ranking. We have not performed hands-on product testing here.']},
 {heading:'Useful English terms to remember',bullets:['Topical application: use on the skin surface; still check whether assisted delivery was involved.','Finished-product evidence: evidence for the complete formula, not just a raw-material claim.','Animal model: research in animals, not equivalent to everyday human use.','Delivery method: how the material reaches its target, an essential research distinction.'],paragraphs:['Use Chinese + English mode to read these terms in context. Do not copy microneedling or injection methods from a paper to seek better absorption. This article helps interpret information and does not provide procedure instructions.']}
 ],next:'Read the evidence before the ingredients. Product names and numbers in the directory do not replace the complete formula, package instructions or finished-product research.',
 products:['View the Anua PDRN cream record (not an efficacy endorsement)','View the Medicube cream record and batch notice (not a purchase recommendation)']
}}
];

// A dated addition, not a new article or an inference about all PDRN products.
const pdrnGuide=growthArticles.find(a=>a.zh.slug==='pdrn-serum-vs-skin-booster-evidence');
pdrnGuide.zh.sections.unshift({heading:'新加坡批次提醒：先核对这款面霜',paragraphs:[
 'HSA 2026 年 8 月 28 日通报：Venus Beauty 销售的 Medicube PDRN Pink Collagen Capsule Cream 两个批次（2E122I.2E117I、2E191G.2E193G）检出 Sudan IV，已要求召回。受影响产品应停止使用，退款问题联系卖家。未受影响批次可恢复销售；供本地销售的每批产品须按 HSA 要求检测。',
 '这不是对所有 PDRN 产品的召回。请核对完整名称、批次和购买渠道；本页目录不能鉴定你手中的产品。此次新增的是安全信息，不改变上面关于功效研究外推的结论。'
],sources:['hsaMedicube']});
pdrnGuide.en.sections.unshift({heading:'Singapore batch notice: check this cream first',paragraphs:[
 'HSA’s 28 August 2026 update identifies two Venus Beauty batches of Medicube PDRN Pink Collagen Capsule Cream (2E122I.2E117I and 2E191G.2E193G) recalled after Sudan IV detection. Stop using affected products; contact the seller about refunds. Unaffected batches may return to sale, with HSA-required testing for each batch supplied locally.',
 'This is not a recall of all PDRN products. Check the full name, batch and seller; our catalog cannot authenticate your jar. This safety addition does not change the efficacy-evidence distinctions above.'
]});
