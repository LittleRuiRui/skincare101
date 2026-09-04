// Editorial summaries, distinct from live catalog fields. Checked 2026-09-02.
const section=(zh,en)=>({zh,en});
const lrp='https://www.laroche-posay.sg/cicaplast/cicaplast-baume-b5-plus';
const avene='https://www.eau-thermale-avene.sg/p/cicalfate-restorative-protective-cream-3282770204667-e5e79359';
const boj='https://beautyofjoseon.com/blogs/news/mastering-relief-sun-and-aqua-fresh';
const hada='https://www.hadalabo.com.sg/collection/lotion/';
export const productEditorial={
 'medicube-pdrn-pink-collagen-capsule-cream-dca76bbb-9cd0-4995-9f0f-258ade4f043a':{
  checked:'2026-09-04',
  sections:[section('批次安全提醒：请先查看下方 HSA 通报及双语指南，核对手中面霜的批次。目录完整度不代表批次安全认证。','Batch safety notice: read the HSA update and linked bilingual guide before checking your jar. Catalog completeness does not certify batch safety.')],
  source:'https://www.hsa.gov.sg/announcements/hsa-tests-product-samples-of-medicube-pdrn-pink-collagen-capsule-cream-for-presence-of-sudan-red-dyes/',sourceLabel:'HSA Singapore — 28 August 2026',guide:'pdrn-serum-vs-skin-booster-evidence',guideZh:'查看批次提醒与 PDRN 证据指南',guideEn:'Read the batch notice and PDRN evidence guide'
 },
 'la-roche-posay-cicaplast-baume-b5':{
  sections:[
   section('这里指 Cicaplast Baume B5+ 滋养护理霜，不是同系列 B5 精华、凝胶或带 SPF 的版本。新加坡品牌资料强调 5% 泛醇、madecassoside 与 Tribioma。品牌原料组合名不等于单一 INCI，也不能仅凭它判断个人使用效果。','This entry concerns Cicaplast Baume B5+, not the B5 serum, gel or an SPF version. Singapore brand information highlights 5% panthenol, madecassoside and Tribioma. A branded ingredient blend is not a single INCI name or proof of individual results.'),
   section('目录目前仍含待核对的原始条目，例如乳木果相关条目的拼写与 Tribioma 组合名称。因此“完整”是目录原有标签，不表示本页已逐项完成官方配方验证。请与包装及下方品牌资料比对。','The catalog still contains raw entries requiring review, including the spelling of a shea-related entry and the Tribioma blend name. Full is the catalog label, not a claim that this page has independently verified every ingredient. Compare your package and the brand information below.'),
   section('选用前先确定是局部干燥护理，还是需要日常全脸保湿。不要把滋养型护理自动当成必须厚敷的步骤；已经有舒服的保湿产品时，先判断是否还有未满足的需求。','Identify whether you need care for a dry area or an everyday full-face moisturiser. Nourishing care does not automatically require a thick layer; if your current moisturisation is comfortable, first ask what need remains.')
  ],source:lrp,sourceLabel:'La Roche-Posay Singapore',guide:'cicaplast-b5-vs-cicalfate',guideZh:'B5+ 与 Cicalfate+：配方和使用需求比较',guideEn:'B5+ vs Cicalfate+: formulas and practical needs'
 },
 'avene-cicalfate':{
  sections:[
   section('这里比较的是 Cicalfate+ Restorative Protective Cream。新加坡官网列出矿油、氧化锌、甘油及铜锌相关成分，并强调保护膜的产品定位。氧化锌出现在这款护理霜的列表里，并不能赋予它一个未标示的 SPF。','This entry concerns Cicalfate+ Restorative Protective Cream. The Singapore page lists mineral oil, zinc oxide, glycerin and copper- and zinc-related ingredients, and describes a protective film. Zinc oxide in this cream does not establish an unlabelled SPF.'),
   section('如果在比较它和 B5+，先比较准确版本、配方与自己的质地偏好。两家品牌各自的试验不能直接排出修复速度的胜负。已适合的日常保湿，也不必因为“修复”定位而被替换。','When comparing it with B5+, start with exact versions, formulas and texture preferences. Separate brand studies do not establish which repairs faster. A repair positioning is not a reason to replace everyday moisturisation that already suits you.')
  ],source:avene,sourceLabel:'Avène Singapore',guide:'cicaplast-b5-vs-cicalfate',guideZh:'Cicalfate+ 与 B5+：如何比较',guideEn:'Cicalfate+ vs B5+: how to compare'
 },
 'beauty-of-joseon-relief-sun-rice-probiotics':{
  sections:[
   section('此记录对应 Rice + Probiotics 原版国际防晒。品牌比较指南标示 SPF50+ PA++++，并把它定位为比 Aqua-Fresh 更滋润。跨境购买时仍要核对完整名称、防晒标示及背标，不能把其他地区同品牌防晒自动视为相同配方。','This record is for the original international Rice + Probiotics sunscreen. The brand comparison guide lists SPF50+ PA++++ and positions it as more nourishing than Aqua-Fresh. Check the full name, protection label and ingredients for cross-border purchases; another regional sunscreen is not automatically the same formula.'),
   section('目录原始列表曾把 1,2-Hexanediol 拆成两个相邻条目，本页仅将该确定的拆分合并显示；这不是对整份配方的认证。若你主要关心黏腻、搓泥或补涂，先看与 Aqua-Fresh 的场景比较。','The raw catalog split 1,2-Hexanediol into two adjacent entries; this page joins that specific split for display only. This is not verification of the complete formula. If stickiness, pilling or reapplication is your concern, read the practical Aqua-Fresh comparison.')
  ],ingredientSource:'https://ie.beautyofjoseon.com/products/relief-sun-rice-probiotics-duo-global',source:boj,sourceLabel:'Beauty of Joseon',guide:'beauty-of-joseon-relief-sun-vs-aqua-fresh',guideZh:'原版 vs Aqua-Fresh：新加坡怎么选',guideEn:'Original vs Aqua-Fresh: choosing for Singapore'
 },
 'beauty-of-joseon-relief-sun-aqua-fresh':{
  sections:[
   section('这条记录对应 Relief Sun Aqua-Fresh: Rice + B5 国际版。品牌将它定位为较清爽的选择，比较指南标示 SPF50+ PA++++。清爽是品牌定位，不是对不致痘、零刺激或人人适用的保证。','This record concerns the international Relief Sun Aqua-Fresh: Rice + B5. The brand positions it as a lighter option and lists SPF50+ PA++++ in its comparison guide. Lightweight positioning is not a guarantee against breakouts or irritation, or a promise that it suits everyone.'),
   section('先看是否能按说明足量使用，以及与现有保湿和底妆是否合拍。长时间运动或游泳，还要核对耐水标签；不要仅凭 SPF 数字推断耐水性。','Consider comfort at the instructed amount and compatibility with your moisturiser and makeup. For extended exercise or swimming, also check water-resistance labelling instead of inferring it from SPF.')
  ],source:boj,sourceLabel:'Beauty of Joseon',guide:'beauty-of-joseon-relief-sun-vs-aqua-fresh',guideZh:'Aqua-Fresh 和原版的区别',guideEn:'How Aqua-Fresh differs from the original'
 },
 'hada-labo-gokujyun-hyaluronic-lotion-light':{
  sections:[
   section('此记录标注 JP 日本市场，不能直接当作新加坡 Hydrating Light Lotion 的配方。新加坡官网有独立的系列名称，而本次尚未完成两地背标的逐项对应。93% 是目录资料指标，不是官方验证程度或保湿得分。','This record is labelled JP, the Japanese market. It cannot automatically stand for Singapore Hydrating Light Lotion. Singapore uses its own range names, and a line-by-line label match between markets has not been completed. The 93% metric measures catalog data, not official verification or moisturising performance.'),
   section('Light 是辨识记录的名称，不能只凭名字判断适合所有油皮。先确认包装版本，再讨论洗后紧绷、叠加黏腻等具体需求。','Light identifies the record; its name alone does not establish suitability for all oily skin. Confirm the package version before considering specific needs such as post-wash tightness or sticky layering.')
  ],source:hada,sourceLabel:'Hada Labo Singapore — regional naming reference',guide:'hada-labo-light-vs-rich-market-versions',guideZh:'Light、Rich 与新加坡版：先核对版本',guideEn:'Light, Rich and Singapore versions: verify the match'
 },
 'hada-labo-gokujyun-hyaluronic-lotion-rich':{
  sections:[
   section('此 Rich 记录标注为 JP 日本市场，并未确认等同新加坡 Hydrating Lotion 或 Premium Hydrating Lotion。不要把“Rich”自动翻成“Premium”，也不要仅凭类似瓶身替换成分信息。','This Rich record is labelled JP, the Japanese market. It has not been confirmed equivalent to Singapore Hydrating Lotion or Premium Hydrating Lotion. Do not automatically interpret Rich as Premium or substitute ingredients based on similar packaging.'),
   section('资料完整度不是保湿能力排名。若已有产品能满足需要，不必为更滋润的名字加一道步骤；若想比较 Light，先把销售地区与具体背标对应好。','Data completeness is not a ranking of moisturising performance. A richer-sounding name is not a reason to add a step if your needs are met. Before comparing Light, match the market and specific package label.')
  ],source:hada,sourceLabel:'Hada Labo Singapore — regional naming reference',guide:'hada-labo-light-vs-rich-market-versions',guideZh:'Rich 与 Light：地区命名和配方边界',guideEn:'Rich vs Light: regional names and formula boundaries'
 }
};
