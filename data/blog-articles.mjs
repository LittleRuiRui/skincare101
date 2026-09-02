// Original editorial text. Source links support the adjacent factual sections;
import {growthArticles,growthSources} from './growth-content.mjs';
// practical shopping frameworks are editorial guidance, not clinical protocols.
export const art = {
  climate:{file:'singapore-climate.webp',alt:'手绘插画：女性在热带城市与室内环境之间安排日常护肤'},
  routine:{file:'skincare-essentials.webp',alt:'手绘插画：洁面、保湿和防晒用品组成的精简护肤台'},
  shopping:{file:'thoughtful-shopping.webp',alt:'手绘插画：女性比较两瓶护肤品，思考适合自己的选择'}
};
export const sources = {
  oily:{label:'AAD｜How to control oily skin',url:'https://www.aad.org/public/everyday-care/skin-care-basics/dry/oily-skin',note:'油性皮肤的温和清洁、保湿与防晒原则。'},
  moisturiser:{label:'AAD｜How to pick the right moisturizer',url:'https://www.aad.org/public/everyday-care/skin-care-basics/dry/pick-moisturizer',note:'不同质地与肤质的选择；不是本文具体产品的临床比较。'},
  dry:{label:'DermNet｜Dry skin',url:'https://dermnetnz.org/topics/dry-skin',note:'低湿度、空调及刺激因素与皮肤干燥。'},
  emollient:{label:'NHS｜Emollients',url:'https://www.nhs.uk/tests-and-treatments/emollients/',note:'润肤剂的作用与不同剂型。'},
  sunscreen:{label:'AAD｜How to apply sunscreen',url:'https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-apply-sunscreen',note:'广谱防晒、SPF、涂抹与户外补涂。'},
  sunscreenLabel:{label:'AAD｜How to select a sunscreen',url:'https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-select-sunscreen',note:'防晒标签与耐水性；并非新加坡全部标签制度的说明。'},
  wash:{label:'AAD｜Face washing 101',url:'https://www.aad.org/public/everyday-care/skin-care-basics/care/face-washing-101',note:'温和洗脸与大量出汗后的清洁。'},
  workout:{label:'AAD｜Is your workout causing your acne?',url:'https://www.aad.org/public/diseases/acne/causes/workouts',note:'运动前后卫生、摩擦与皮肤护理。'},
  fragrance:{label:'FDA｜Fragrances in cosmetics',url:'https://www.fda.gov/cosmetics/cosmetic-ingredients/fragrances-cosmetics',note:'无明显香味不一定等于无香精；美国监管机构说明。'},
  allergy:{label:'FDA｜Allergens in cosmetics',url:'https://www.fda.gov/cosmetics/cosmetic-ingredients/allergens-cosmetics',note:'化妆品可能涉及多种过敏原；不能仅凭营销标签保证安全。'},
  hsa:{label:'HSA｜Regulatory overview of cosmetic products',url:'https://www.hsa.gov.sg/cosmetic-products/overview/',note:'新加坡化妆品成分与标签要求。'},
  hsaSafety:{label:'HSA｜Staying safe while looking good',url:'https://www.hsa.gov.sg/announcements/staying-safe-cosmetic-products/',note:'购买渠道、标签与误导性宣称的提醒。'},
  budget:{label:'AAD｜Skin care on a budget',url:'https://www.aad.org/public/everyday-care/skin-care-basics/care/skin-care-budget',note:'基础护肤优先以及价格不等同功效。'},
  lrp:{label:'La Roche-Posay Singapore｜Cicaplast Baume B5+',url:'https://www.laroche-posay.sg/cicaplast/cicaplast-baume-b5-plus',note:'品牌官方的新加坡产品资料；不是独立头对头试验。'},
  avene:{label:'Avène Singapore｜Cicalfate+ Restorative Protective Cream',url:'https://www.eau-thermale-avene.sg/p/cicalfate-restorative-protective-cream-3282770204667-e5e79359',note:'品牌官方的新加坡产品资料及成分；不是独立头对头试验。'},
  masks:{label:'AAD｜Facial masks and skin care',url:'https://www.aad.org/public/everyday-care/skin-care-secrets/routine/facial-masks-and-skin-care',note:'面膜可以作为补充，但不替代基础护理或疾病治疗。'},
  test:{label:'AAD｜How to test skin care products',url:'https://www.aad.org/public/everyday-care/skin-care-secrets/prevent-skin-problems/test-skin-care-products',note:'小范围试用建议及与医疗斑贴试验的区别。'},
  exfoliate:{label:'AAD｜How to safely exfoliate at home',url:'https://www.aad.org/public/everyday-care/skin-care-secrets/routine/safely-exfoliate-at-home',note:'去角质应结合肤质、现用产品及刺激风险。'},
  acneHabits:{label:'AAD｜10 skin care habits that can worsen acne',url:'https://www.aad.org/public/diseases/acne/skin-care/habits-stop',note:'频繁更换祛痘产品与观察时间的提醒。'},
  antiage:{label:'AAD｜How to select anti-aging skin care products',url:'https://www.aad.org/public/everyday-care/skin-care-secrets/anti-aging/selecting-anti-aging-products',note:'明确单一目标、合理期待与基础护理。'}
};
const date='2026-09-02';
Object.assign(sources,growthSources);
export const articles=[
{
  slug:'moisturizer-humid-singapore',date,category:'新加坡日常',art:'climate',
  title:'新加坡天气闷热，保湿霜到底该怎么选？',
  excerpt:'不把“清爽”误当成“适合”：从白天叠涂、空调环境和局部干燥三个场景，找到保湿产品的实际位置。',
  answer:'天气湿热不等于每个人都可以省掉保湿。先看皮肤是否紧绷、脱屑，再看你已有的防晒和其他产品能否满足保湿需求；不必为了凑步骤再叠一层。',
  sections:[
    {heading:'先区分天气、肤感和皮肤状态',paragraphs:['一走出地铁就觉得脸黏，不一定说明皮肤不需要保湿。你感受到的黏腻可能来自几层产品的叠加，也可能夹杂汗液和皮脂。相反，坐进办公室后脸颊紧绷，也不等于要立刻换掉整套护肤品。选产品前，把“现在难受在哪里”说具体，比先给自己贴干皮或油皮标签更有用。','AAD 提醒油性皮肤也可能需要保湿；其保湿剂选择指南同时指出，部分油性皮肤可选择较轻的凝胶质地，或按实际需要调整额外保湿。两者并不矛盾：目标是舒适且够用，不是统一规定每个人必须涂同样厚度。'],sources:['oily','moisturiser']},
    {heading:'按一天的使用场景选，不按瓶子名字选',table:{headers:['你的主要场景','先尝试的调整','不必马上做的事'],rows:[['白天防晒后已经舒适','精简防晒前的重复保湿层','再加精华水、凝胶和乳霜凑齐步骤'],['只有脸颊干，T 区容易黏','让保湿重点留在较干区域','把全脸都改成最厚重的霜'],['夜间或空调房持续紧绷','评估更润的质地以及清洁方式','只因为身在新加坡就排除乳霜']]}},
    {heading:'“Gel”只是起点，不是保证书',paragraphs:['凝胶、乳液、面霜这些名称帮助你大致判断使用体验，但同类产品也可能差很多。最值得观察的是：涂后是否持续刺痛、与防晒是否明显搓泥、几个小时后是否仍然舒服。成分表可以提示配方组成，却不能替你体验真实的成膜感。','我们的购物建议是先选一款小容量、单独试用，再决定是否购买正装。不要因为包装写着适合热带，就默认它一定适合正在泛红、脱皮的你。']},
    {heading:'给自己一个只改变一件事的试用安排',bullets:['保留原本耐受的清洁和防晒，先只调整保湿这一项。','记录“上脸后”“午后”“晚上”三个时间点的紧绷与黏腻，而不是只记刚涂时的清爽。','如果有持续红痒或脱屑，把它当成需要评估的问题，不要一直在清爽霜和厚重霜之间反复购买。'],paragraphs:['这个安排是生活中的观察工具，不是临床试验。它不能排除皮炎，也不能证明一款产品“零致痘”，但能让下一次购买比凭天气猜更有依据。']}
  ],related:['aircon-office-dry-skin','serum-or-moisturizer-budget'],next:'先明确你最需要改善的使用场景，再用产品目录核对候选产品的配方。'
},
{
  slug:'aircon-office-dry-skin',date,category:'新加坡日常',art:'climate',
  title:'空调房里脸干，出门又油：上班族怎么调整护肤？',
  excerpt:'不用在“干皮”和“油皮”之间每天改答案。先观察干燥出现的时间、位置和环境，再决定调整哪一步。',
  answer:'先处理具体的不适，而不是重新购买一整套产品。空调环境可能加重干燥，但紧绷也可能和清洁、刺激或皮肤问题有关；一个环境解释不了所有症状。',
  sections:[
    {heading:'“外面潮湿”不能代表办公桌前的空气',paragraphs:['DermNet 将过度空调、低湿度、频繁清洗及刺激性外用产品列为可能与干燥有关的因素。所以，即使你住在湿热城市，也可能在某些室内环境里觉得皮肤干。这里说的是一种可能性，不是远程判断你的办公室湿度，更不是给所有红痒下诊断。'],sources:['dry']},
    {heading:'先写下三条线索',bullets:['时间：刚洗完就紧绷，还是在办公室几个小时后才出现？','位置：全脸都干，还是只在眼周、脸颊或口周？','变化：最近是否换了洁面、增加酸类、开了更强空调，或者连续擦拭同一块皮肤？'],paragraphs:['例如，“下午三点两边脸颊紧，额头仍油”比“我是外油内干”更方便采取行动。前者可以帮助你尝试局部保湿，后者很容易让你一次买下整套控油又补水的产品。']},
    {heading:'把调整留给真正需要的位置',paragraphs:['我们的场景建议是：早上使用已经耐受的护理，中午先确认是否确实干燥，再决定是否需要在较干区域补用原本耐受的保湿产品。不要因为一侧脸颊紧，就把额头、鼻子也不断叠厚。','润肤产品能帮助减少水分流失；不同剂型的浓稠度与油腻感并不相同。喷雾和润肤霜也不是完全相同的产品形式，因此不要只凭喷后短暂的舒服，就认定保湿问题已经解决。'],sources:['emollient']},
    {heading:'不要把不舒服都归因于“缺水”',paragraphs:['如果一用清水也明显刺痛，或者红、痒、脱屑反复出现，就不只是“再补一点水”的购买题。先暂停新增的非必要护肤步骤，记录近期变化，寻求医生评估。正在使用处方产品的人，应和开药医生讨论耐受性。','也不必因此把工作日、周末各配置一套复杂 routine。先找到那一个影响最大的变量：清洁是否太强、使用层数是否过多，或保湿是否不够。能解释并改善不适的一次小调整，比五瓶同时上场更有信息量。']}
  ],related:['moisturizer-humid-singapore','skincare-tracking-not-guessing'],next:'在肤质档案里描述位置和当下状态，而不只选择一个永久的干皮或油皮标签。'
},
{
  slug:'singapore-commute-sunscreen',date,category:'新加坡日常',art:'climate',
  title:'新加坡通勤防晒：不要只盯着 SPF 数字',
  excerpt:'从步行、午餐外出到运动出汗，把防晒标签和真实的一天对应起来，不靠一个高 SPF 数字代替所有防护。',
  answer:'选有广谱防护、SPF 30 或以上的防晒，并按场景考虑耐水性。更重要的是足量覆盖、户外补涂和遮阳措施；高 SPF 不能代替这些动作。',
  sections:[
    {heading:'先看三个基本信息',paragraphs:['AAD 建议选择广谱、SPF 30 或以上且具耐水性的防晒。广谱涉及 UVA 与 UVB 防护；耐水不等于可以一直不补涂。不同市场的标签表达会有差异，购买时要看清手中那一版的完整说明，而不是只认一个包装颜色。'],sources:['sunscreen','sunscreenLabel']},
    {heading:'让一天的行程决定准备方式',table:{headers:['日程','出门前要想到的事'],rows:[['地铁加一段步行','在出门前完成防晒，不等走到太阳下才想起'],['午餐长时间在户外','把补涂用品放在容易拿到的位置，也找阴凉处'],['下班跑步或周末游泳','核对耐水标签，并安排出汗或游泳后的补涂'],['今天戴帽子、走有遮蔽的路线','把遮阳当补充措施，不把它当成所有裸露部位的万能保护']]}},
    {heading:'补涂不是“早上涂过就算了”',paragraphs:['按照 AAD 的建议，户外一般约每两小时补涂，并在游泳或出汗后补涂；还要遵循具体产品说明。这个建议不能反过来理解成：不论你在哪里，都只要定时打卡一下就完成防晒。覆盖是否充分、擦拭和出汗情况同样重要。','如果你讨厌某一款的肤感，先解决“能否持续使用”这个问题。为了避免黏腻而只涂极少量，或者买了高倍数却一直留在抽屉里，都没有把标签上的防护真正落实。'],sources:['sunscreen']},
    {heading:'选择时别制造新的误区',bullets:['不要把有 SPF 的产品随意混进面霜稀释后使用；按标签使用成品。','修复霜含有某些同名成分，不代表它就有经过标示的防晒能力。','不把“物理”“化学”当作一定适合或不适合自己的唯一依据；还需要看完整配方与耐受。'],paragraphs:['我们的选购顺序是先满足防护要求，再比较肤感、是否影响化妆和你愿意承担的价格。防晒是日常习惯，不是一次成分考试。如果涂后反复出现不适，换用已确认耐受的选择，并寻求专业建议。']}
  ],related:['moisturizer-humid-singapore','ingredient-list-how-to-read'],next:'先把防晒要求与通勤、运动安排对齐，再到产品目录核对具体版本。'
},
{
  slug:'post-workout-cleansing',date,category:'新加坡日常',art:'routine',
  title:'运动后要不要再洗一次脸？别把清洁变成惩罚',
  excerpt:'出汗后的清洁很重要，但反复搓洗不等于更干净。给健身、跑步和下班运动安排一个温和的收尾。',
  answer:'大量出汗后应温和清洁，避免用力摩擦。把运动后的清洁和晚间护理合理合并，比连续重复两套强清洁更有意义。',
  sections:[
    {heading:'洗掉汗液，不是搓掉一层皮',paragraphs:['AAD 建议日常洗脸通常不超过早晚两次，并在大量出汗后清洁；使用温水、指腹和温和产品，避免擦洗刺激。这里的重点不是死守次数，而是同时考虑出汗和耐受。运动后需要清洁，不等于要加磨砂、洁面刷和一轮酸。'],sources:['wash']},
    {heading:'三个常见场景，安排可以不同',table:{headers:['场景','可考虑的安排'],rows:[['晚上运动，之后直接回家休息','把运动后的清洁作为晚间清洁，不机械重复整套流程'],['午间运动，下午还要上班','温和清洁后按需要保湿；再次外出前做好防晒'],['短距离走路，只轻微出汗','先观察实际汗量和不适，不必每到一个室内就强力洗脸']]}},
    {heading:'毛巾、衣物和手，也属于护肤',paragraphs:['运动相关的皮肤问题不只取决于洁面产品。AAD 提醒保持衣物与器材卫生、避免反复用力擦汗。用干净毛巾轻按汗液，比来回摩擦同一片皮肤更温和。头盔或帽子接触的部位，也值得留意摩擦和闷热。'],sources:['workout']},
    {heading:'不必把“排汗”写成皮肤排毒故事',paragraphs:['我们不把出汗后出现的小疙瘩一概叫作排毒，也不建议用更强的清洁去“逼出来”。如果疙瘩反复、明显瘙痒或疼痛，需要判断具体原因；仅凭发生在健身之后，不能区分痘痘、刺激和其他问题。','试着准备一个小而固定的运动包：自己耐受的清洁用品、干净毛巾、必要的保湿和防晒。不要每次用健身房随机提供的新产品，再把所有反应归因于运动本身。']},
    {heading:'如何知道是不是清洁过头了',paragraphs:['可以记录洗完后的紧绷、持续刺痛和后续产品上脸时的反应。这不是自我诊断标准，但如果每次清洁后都明显不舒服，就值得重新检查产品、温度、摩擦和频率，而不是把“洗得涩”当成任务完成。','温和并不意味着随便冲一下就忽略防晒或彩妆残留；清洁方式仍应匹配实际使用的产品和说明。目标是足够清洁，同时保留皮肤的舒适度。']}
  ],related:['aircon-office-dry-skin','singapore-commute-sunscreen'],next:'把运动时间加入你的 routine，而不是把运动日变成额外堆叠步骤的一天。'
},
{
  slug:'fragrance-free-sensitive-skin',date,category:'产品选择',art:'shopping',
  title:'敏感肌选护肤品：无香精只是起点，不是安全保证',
  excerpt:'分清 fragrance-free、unscented 和“敏感肌适用”，再把完整配方、既往反应与试用方式放进判断。',
  answer:'无香精可以帮助部分人减少一个潜在刺激或过敏来源，但不能保证整瓶产品绝不引发反应。标签应当用于缩小范围，而不是替代个人耐受观察。',
  sections:[
    {heading:'没闻到香味，不等于没有香精',paragraphs:['FDA 说明，标为 unscented 的产品也可能加入用于掩盖原料气味的香料。因此，“闻起来没味道”与“没有添加香精”不是一回事。另一方面，原料本身也可能有气味，不能只靠鼻子把一个配方判断完。'],sources:['fragrance']},
    {heading:'“敏感肌适用”仍然不是你的个人测试结果',paragraphs:['化妆品可能涉及香料、防腐剂或其他过敏原；不同人的反应对象并不相同。FDA 的资料提醒，化妆品可以引发过敏反应。我们因此不把天然、温和或低敏这样的词翻译成“所有人都能安心用”。'],sources:['allergy']},
    {heading:'购物时用三道筛选，而不是一张黑名单',bullets:['第一道：回避你已经明确知道会引起反应的成分，必要时依据医生的检测结果。','第二道：确认具体产品的完整名称和配方版本，不把同品牌另一款的评价套过来。','第三道：留下小范围试用和观察的空间，不同时把洁面、精华和乳霜全换掉。'],paragraphs:['不要只因为一款含有某个长名字的化学成分就排除它，也不要把“植物提取”自动放进安全区。短成分表不一定更适合你，长成分表也不等于更危险；关键在于具体配方和个人反应。']},
    {heading:'当你已经反复红痒，买得更谨慎还不够',paragraphs:['如果你已经不断出现红、痒、肿或脱屑，需要把问题从“哪瓶更温和”推进到“究竟为什么反复发生”。把近期用过的产品名称、开始时间和反应位置整理好，带给医生，比再买一瓶宣传零刺激的新品更有帮助。','我们的取舍是：先选择范围更清楚、自己已耐受的基础护理，再逐步加入有明确目的的产品。护肤不需要证明你能耐受多少种成分。']}
  ],related:['how-to-test-new-skincare','ingredient-list-how-to-read'],next:'用产品目录核对标签；如果你有已知过敏史，以医疗建议优先，不以网站匹配分替代它。'
},
{
  slug:'ingredient-list-how-to-read',date,category:'产品选择',art:'shopping',
  title:'看懂 INCI 成分表：能看出什么，不能猜出什么？',
  excerpt:'成分表不是功效排行榜。读懂排序、版本与数据缺口，比把每个陌生成分都判成好或坏更有用。',
  answer:'成分表能告诉你产品包含哪些已标示成分，却通常不能给出所有准确浓度，也不能单独证明刺激性、致痘性或最终功效。先确认完整性，再做有限判断。',
  sections:[
    {heading:'先确认你看的到底是不是同一瓶',paragraphs:['同一个系列可能同时有精华、乳霜、凝胶与带防晒版本。搜索得到的成分表也可能来自另一个市场或旧配方。先核对完整产品名、容量对应的包装、销售地区和更新信息，再开始分析；否则看得越仔细，反而可能研究的是另一瓶。']},
    {heading:'排序有信息，但不能反推整张浓度表',paragraphs:['HSA 的新加坡化妆品标签说明要求完整成分按加入时重量递减列出，并允许低于 1% 的成分在高于 1% 的成分之后不按浓度顺序排列。这个规则的实际意义是：排序能提供一定线索，却不是一条均匀下降、可以自行换算百分比的尺子。','因此，不能说第十位一定没有用，也不能只因为某成分排前面就宣布整瓶一定刺激。没有公开浓度或配方数据时，把“不知道”保留下来，比计算一个看似精确的数字诚实。'],sources:['hsa']},
    {heading:'把成分表当地图，不当判决书',table:{headers:['可以支持的判断','不能单独证明的结论'],rows:[['是否标示某个你需要回避的成分','你一定会过敏或一定不会过敏'],['配方里有哪些保湿、油脂或其他组成','上脸必定轻薄、不搓泥'],['不同版本的组成是否有变化','新配方一定比旧配方有效'],['来源是否只有部分成分','靠缺失的信息给产品打满分']]}},
    {heading:'Peacedskin 里的“数据完整度”也不是功效分',paragraphs:['当目录提示部分配方、来源不足或版本待核实时，那是在描述我们掌握的信息，不是在给产品的临床效果打分。更完整的数据让分析更有依据，却不能把一个不适合你的产品变成必买。','同样，不应把含有某种明星成分理解成它已经解决了你的问题。浓度、使用方式、配方整体、稳定性与实际证据都可能影响判断；一份 INCI 不能代替所有这些信息。']},
    {heading:'最后再检查卖家怎么说',paragraphs:['HSA 提醒消费者注意误导性宣称，例如把化妆品宣传成由 HSA 背书或批准。选择可靠渠道并核对标签，比被一个“认证级”形容词打动更重要。下单前可以留一张包装照片，之后复购时也更容易发现版本变化。'],sources:['hsaSafety']}
  ],related:['fragrance-free-sensitive-skin','cicaplast-b5-vs-cicalfate'],next:'选一个你正在用的产品，核对市场、配方完整度和来源；先知道资料边界，再看适配建议。'
},
{
  slug:'serum-or-moisturizer-budget',date,category:'精简护肤',art:'routine',
  title:'精华、精华水还是面霜？预算有限先补哪一格',
  excerpt:'不按价格和产品名字分配预算，而按你的 routine 缺了什么、已有产品做了什么来决定。',
  answer:'如果基础清洁、保湿或防晒还不合适，先解决基础问题。精华水和精华不应仅因为名字听起来更高级，就自动排在预算前面。',
  sections:[
    {heading:'先问“少了哪项功能”，再问“买哪类产品”',paragraphs:['AAD 的预算护肤建议强调简化清洁、保湿和防护，并指出有效产品不必昂贵。这是优先级原则，不是在说所有便宜产品都一样好，也不是说贵产品一定没有价值。先让最基本的日常需求得到满足，再为额外目标付费。'],sources:['budget']},
    {heading:'三种情况，下一笔钱应该去不同地方',table:{headers:['现在的情况','更值得优先解决的事'],rows:[['每天洗后紧绷，却准备买提亮精华','先审视清洁强度与保湿是否合适'],['基础护理舒服，但没有愿意天天用的防晒','优先找到能持续使用的防晒产品'],['基础已稳定，想处理一个明确目标','再评估针对性产品的证据、耐受和使用成本']]}},
    {heading:'精华水不是必选，面霜也不一定要另买一瓶',paragraphs:['产品名称往往是品牌对质地与定位的描述，并不是彼此完全独立的功能清单。如果现有产品已经满足保湿需要，不必为了“完整流程”同时买水、精华和霜。反过来，只涂一款很水润的产品却一直不舒服，也不必因为它叫精华就坚持认为已经足够。','我们的购物练习是给每瓶写一句用途：例如“洗后减少紧绷”“白天防晒”“针对一个我在意的问题”。如果三瓶都只能写“补水”，先别急着买第四瓶。']},
    {heading:'把闲置风险也算进价格',paragraphs:['不要只比较每毫升价格。大瓶单价便宜，但如果你不喜欢、用不完，实际浪费可能更多。小容量虽然单价高，却可能降低第一次试错的损失。这个判断属于购买策略，不代表小样能完成全面的功效或过敏评估。','也可以把预算分成基础补货和尝试新品两部分：基础产品用完再补，新品一次只试一种。这样不会为了满减把下个月的皮肤变成一场无法归因的联合实验。']},
    {heading:'贵价体验可以喜欢，但不要替它虚构效果',paragraphs:['香气、包装、使用仪式感都可以是消费理由，只要你知道自己在买什么。问题不是“花得多”，而是把愉悦感误当成已经证实更强的治疗效果。预算紧时，我们更愿意先保留真正稳定在用的东西，而不是保留价格最高的东西。']}
  ],related:['face-masks-optional-not-essential','skincare-tracking-not-guessing'],next:'先列出你已在用的产品和各自用途，再决定需要补哪一项，而不是按完整套装购买。'
},
{
  slug:'cicaplast-b5-vs-cicalfate',date,category:'产品选择',art:'shopping',
  title:'理肤泉 B5+ vs Avène Cicalfate+：先弄清你在比较哪两瓶',
  excerpt:'依据新加坡品牌官网比较两款修复护理产品的定位与配方线索，不把品牌试验当作头对头胜负。',
  answer:'两者都偏向干燥、敏感或不适时的护理，但并不是同一配方。没有可靠头对头证据时，不能宣布谁“修复更快”；选择应回到版本、个人耐受和是否需要这类质地。',
  sections:[
    {heading:'这一篇比较的具体版本',paragraphs:['这里讨论 La Roche-Posay Cicaplast Baume B5+ 与 Avène Cicalfate+ Restorative Protective Cream，依据 2026 年 9 月 2 日可查的新加坡官网。不是 B5 精华、凝胶、面膜或带 SPF 的其他版本。请先核对包装完整名称，不要把同系列所有产品都简称成同一瓶“B5”。']},
    {heading:'官方资料能确认哪些差异',table:{headers:['比较点','Cicaplast Baume B5+','Cicalfate+ Cream'],rows:[['官网强调的配方线索','5% 泛醇、madecassoside 及 Tribioma 等','C+-Restore、铜锌相关成分等'],['官网描述的护理方向','干燥不适区域的舒缓、滋养和保护','干燥敏感皮肤的保护膜与舒适护理'],['质地相关描述','品牌描述为滋养型质地','品牌强调保护膜感'],['能否因此断言谁更有效','不能，仅凭品牌资料无法作头对头比较','不能，仅凭品牌资料无法作头对头比较']]},sources:['lrp','avene']},
    {heading:'不要把不同试验的数字放在一起比赛',paragraphs:['两家官网的宣传资料可能分别使用不同人群、观察时长和评价方式。即使都出现“修复”“舒缓”，也不代表测量的是同一件事。没有相同条件下的比较，就不应做出一款比另一款快多少、强多少的排名。','因此本文不引用这些百分比来判胜负。你真正能拿来用的信息是产品定位、完整配方、具体版本，以及你自己是否能耐受，而不是谁的网页数字更漂亮。']},
    {heading:'在湿热天气，先判断需不需要全脸使用',paragraphs:['我们的编辑建议是：如果问题只是局部干燥，不必自动把这类护理全脸厚敷；如果你现有的日常保湿已经舒服，也没有理由仅为了“修复”二字再加一层。具体使用范围与频率仍以产品说明和专业建议为准。','这不是说油皮不能使用，也不是说厚重就必然致痘。它只是提醒你把需求和产品形式对应起来，而不是拿“别人急救有效”替代自己的选择。']},
    {heading:'两款都不应该替代什么',paragraphs:['本次比较的两款不是因为带有“修复”定位，就自动变成防晒、抗感染药或所有红痒问题的治疗。术后、明显破损、渗液或持续皮疹应遵循医生指导。也不要把一个产品不耐受，理解成必须靠另一款厚敷来抵消。','如果你仍在犹豫，先保留已经耐受的基础产品；确有需求时，再选择一个具体版本试用。一次把两款叠上脸，不会让比较更科学，反而更难知道哪一款带来什么变化。']}
  ],related:['ingredient-list-how-to-read','how-to-test-new-skincare'],next:'先核对产品目录和手中的包装。以下链接用于查看成分资料，不代表购买推荐或医疗背书。',products:[{label:'查看 Cicaplast Baume B5+ 成分页',url:'/product/la-roche-posay-cicaplast-baume-b5/'},{label:'查看 Avène Cicalfate+ 成分页',url:'/product/avene-cicalfate/'}]
},
{
  slug:'face-masks-optional-not-essential',date,category:'精简护肤',art:'routine',
  title:'面膜值得买吗？先分清“加分项”和“补救任务”',
  excerpt:'享受敷面膜没有问题，但不必把它变成每天必须完成的护肤工作，更不要用它掩盖持续的不适。',
  answer:'面膜可以是额外的护理和放松，但不是必需步骤，也不能替代基础护理或皮肤疾病治疗。如果需要天天靠面膜维持舒服，先检查日常流程。',
  sections:[
    {heading:'面膜可以有作用，但用途有边界',paragraphs:['AAD 将面膜视为可能帮助保湿等需求的补充，具体取决于配方；同时明确提醒，面膜不能代替湿疹、痤疮等问题的治疗，也不能替代完整的日常护理。由此不应推导出“人人必须敷”或“越频繁越好”。'],sources:['masks']},
    {heading:'先回答：你为什么想加这一片？',bullets:['因为喜欢放松的过程：可以把它当作自选的体验，不需要替它制造医学任务。','因为白天一直干：先检查原有保湿是否合适，别只在晚上做短暂补救。','因为刚用了刺激产品想急救：先处理可能的刺激来源，不要继续叠加新配方。','因为大促囤了很多：库存不是皮肤需要更高频使用的理由。'],paragraphs:['这些问题让“要不要买面膜”从一个跟风问题变成明确选择。即使最后仍然决定买，也会更清楚你期待的是使用感，还是一个需要其他方式解决的问题。']},
    {heading:'不要把停留时间当成效果倍增器',paragraphs:['按具体产品的频率和停留时间使用；一次性片状面膜不要自行变成整夜湿敷。出现刺痛、灼热或明显不适时，应取下并停止使用，而不是等到倒计时结束。面膜越贵，也不意味着需要“坚持敷完才不浪费”。','清洁类、去角质类和单纯保湿类面膜并不是同一个任务，不宜因为都叫面膜就轮番塞进一周。尤其已有针对性产品时，应检查是否重复增加刺激负担。'],sources:['masks']},
    {heading:'比较成本时，看看你放弃了什么',paragraphs:['我们的预算思路是：如果买一盒面膜意味着延后补防晒、继续使用让你紧绷的洁面，优先级可能放反了。反之，基础护理已稳定、预算充足且你喜欢它，面膜完全可以是一个不需要内疚的选择。','不要强迫每一项消费都变成“最高性价比”。但需要区分：喜欢它，是体验判断；它能治好某个问题，则需要另一种证据。']},
    {heading:'敷后柔软，不等于长期问题已经解决',paragraphs:['即时肤感值得记录，但不要把一次拍照的光泽作为整个护肤计划成功的证明。第二天是否仍舒适、有无延迟不适、基础 routine 是否稳定，更值得继续观察。反复红痒或破损时，面膜不是拖延就医的工具。']}
  ],related:['serum-or-moisturizer-budget','stop-stacking-actives'],next:'先明确面膜在你日常护理里的角色；如果只是想让基础护理更舒服，先看保湿与使用记录。'
},
{
  slug:'how-to-test-new-skincare',date,category:'精简护肤',art:'shopping',
  title:'新护肤品怎么试？别在同一晚换掉整套 routine',
  excerpt:'小范围试用、一次一个变量、留下完整产品信息。减少试错，不等于能保证永不过敏。',
  answer:'先按说明做小范围试用，观察是否出现反应，再逐步引入。一次只加入一种新产品，更容易识别问题；家用试用不能替代医生的斑贴试验。',
  sections:[
    {heading:'小范围试用是在筛查风险，不是发安全证',paragraphs:['AAD 建议在上臂内侧或肘弯等适当小范围试用产品，通常连续 7—10 天观察；清洗型产品应按其正常停留时间处理。这类观察可以帮助发现不耐受，但不能保证之后全脸或长期使用都没有反应。','产品说明仍然优先：如果标示低频使用的酸类或其他针对性产品，不应为了测试而自行提高到每天多次。已知某成分会引起过敏的人，也不应通过重新试用来挑战它。'],sources:['test']},
    {heading:'试用期间，把其余变量尽量留住',paragraphs:['我们的实际安排是：保留已经耐受的基础产品，不在同一周同时新增洁面、爽肤水、精华和面霜。如果一切同时改变，即使状态改善，你也很难知道真正有帮助的是哪一瓶；一旦变差，更难找原因。','旅行、熬夜或暴晒后的状态，也可能让观察更复杂。不是说这些时候永远不能换产品，而是不要在结果解释时把全部功劳或责任都算到新品身上。']},
    {heading:'留下四项信息就够用',table:{headers:['记录什么','为什么值得记'],rows:[['完整名称与包装照片','避免日后把系列或版本弄混'],['开始日期与频率','知道反应发生在引入多久之后'],['使用位置与同时用的产品','便于发现是否有叠加或局部差异'],['不适的表现和变化','比一句“不适合”更便于复盘或就诊']]}},
    {heading:'出现反应，不要靠意志力继续',paragraphs:['如果出现红、痒、肿等反应，AAD 建议停止使用并洗掉产品；反应严重或持续时寻求专业帮助。不要把不舒服一律解释为“建立耐受”或“排毒”。持续性皮疹可能需要医生评估，必要时进行医疗斑贴试验。'],sources:['test']},
    {heading:'试用通过后，也保留合理的不确定性',paragraphs:['没有早期刺激，不等于已经证明美白、祛痘或抗老效果。不同目标需要不同观察尺度，而临床功效也不能由一次个人尝试确认。把“目前用着舒服”和“已证实有效”分开，你会更容易决定是继续用完、换一个产品，还是停止追逐这个目标。']}
  ],related:['fragrance-free-sensitive-skin','skincare-tracking-not-guessing'],next:'把一个新品的开始时间写进 routine；先求能解释变化，再求一次换出完美皮肤。'
},
{
  slug:'stop-stacking-actives',date,category:'精简护肤',art:'routine',
  title:'酸、A 醇、磨砂一起上？先给功效护肤做减法',
  excerpt:'别只问“能不能搭配”。先弄清每一步解决什么，以及当前皮肤能否承受整套流程。',
  answer:'护肤负担来自整套流程，不只来自某一瓶。皮肤正在刺痛、红或脱屑时，不应继续用更多去角质产品追求见效；处方治疗的调整请先问医生。',
  sections:[
    {heading:'“单瓶温和”加起来，也可能并不温和',paragraphs:['AAD 的去角质指南提醒，要考虑已经使用的药物与护肤品；某些产品本身就可能使皮肤更敏感，再去角质可能加重干燥或刺激。品牌分别把每瓶描述为温和，也不能证明它们叠加之后同样适合你。'],sources:['exfoliate']},
    {heading:'不要先画兼容表，先画用途表',table:{headers:['这一步','先问的问题'],rows:[['去角质洁面或爽肤水','是不是已在完成其他产品也在做的去角质？'],['A 醇或其他针对性护理','目前目标是什么，最近是否改变频率？'],['磨砂、清洁面膜或刷具','是不是因为觉得“不够干净”而临时加码？'],['修复护理','是真有保湿需要，还是想抵消前面过度使用？']]}},
    {heading:'一次先处理一个最在意的目标',paragraphs:['如果你同时想淡印、控油、平滑肤质、抗老，很容易每个目标各加一瓶。AAD 的抗老选购建议强调聚焦一个主要问题，并保持合理期待。我们的延伸建议是：把次要目标暂时放进“以后再考虑”，让当前计划能被执行，也能被评估。'],sources:['antiage']},
    {heading:'不舒服不是功效进度条',paragraphs:['出现持续灼痛、明显红痒或脱皮时，不要靠加厚另一瓶产品继续硬撑。先停止新增的非必要刺激步骤，回到已耐受的护理，必要时就医。开放伤口或晒伤区域不应进行去角质。正在用医生开具的治疗者，需询问医生如何调整，不自行取消处方。'],sources:['exfoliate']},
    {heading:'恢复以后，也不必把删掉的全部加回来',paragraphs:['如果精简后已经舒服，而且最重要的目标没有被耽误，原先那些步骤未必都需要回归。你可以重新问：这瓶是否有明确用途？已有产品是否重复？我是否愿意承担它带来的使用复杂度？','所谓高阶护肤，不一定是把成分浓度一路拉高。有时是知道哪些事情没必要同时做，也知道什么时候应把选择题交给专业评估。']}
  ],related:['how-to-test-new-skincare','serum-or-moisturizer-budget'],next:'先列出所有含针对性活性成分或去角质用途的产品，再检查是否在同一天重复使用。'
},
{
  slug:'skincare-tracking-not-guessing',date,category:'精简护肤',art:'shopping',
  title:'这瓶到底有没有用？用一张简单记录表少一点瞎猜',
  excerpt:'把即时肤感、耐受和目标变化分开记录。你不需要做实验室，但可以避免每次都只靠当天的镜子下结论。',
  answer:'先定义你想改善什么，再记录使用和变化。舒服、没有刺激、目标改善是三个不同问题；个人记录有助于决策，但不能证明因果或替代临床证据。',
  sections:[
    {heading:'别把所有目标都写成“皮肤变好”',paragraphs:['“皮肤变好”太宽，几乎任何一天的变化都能套进去。可以换成更具体的观察，例如午后脸颊是否紧绷、同一部位是否持续不适，或你在意的肤色问题是否有可见变化。一次选择一个主要目标，其他变化放在备注里，不急着逐一追赶。']},
    {heading:'把三种判断放在不同格子里',table:{headers:['维度','可以记录的内容','不要直接推导成'],rows:[['使用体验','黏腻、搓泥、是否愿意继续用','舒服就一定有长期功效'],['耐受情况','刺痛、红痒、脱屑及发生时间','早期没反应就永远不会反应'],['目标变化','在相似条件下观察一个具体问题','所有改善都由这一瓶造成']]}},
    {heading:'一个不费力的记录方式',paragraphs:['我们的编辑建议是：开始前记录一次基线，之后选固定时间做简短复盘。尽量使用相近光线、角度与距离，不开美颜；同时写下重大变化，比如旅行、治疗调整或又加了新品。照片可以只保存在自己的设备上，不必为了记录而公开。','记录也不需要每天给自己打分。对容易因为皮肤状态焦虑的人，频繁放大照片可能适得其反。以帮助做决定为目的，而不是让观察本身成为另一项负担。']},
    {heading:'不要把一个统一天数套在所有产品上',paragraphs:['即时肤感可以较早评价，但祛痘等目标需要更长的观察。AAD 在痤疮护理资料中提醒，频繁换产品可能刺激皮肤；一些痤疮治疗通常要数周才开始出现改善。这是特定问题的时间尺度，不代表任何面霜、精华或皮疹都应该等同样久。','如果出现明显不良反应，不用为了“凑满测试周期”继续用。处方治疗的复诊与评估时间以医生安排为准。'],sources:['acneHabits']},
    {heading:'到复盘时，只做一个明确决定',bullets:['继续：使用舒服，成本可接受，而且目前有理由保留。','调整：只有一个具体环节不合适，先改变一个变量。','停止或咨询：持续不适、问题加重，或无法判断是否涉及皮肤疾病。'],paragraphs:['如果用了以后没有可判断的改善，也可以诚实写“还不知道”。这比为了证明自己没买错而强行总结有效更有用。最好的记录，不是让每一瓶都赢，而是让下一次选择不再从零猜起。']}
  ],related:['how-to-test-new-skincare','stop-stacking-actives'],next:'用 Peacedskin 的 routine 功能整理你在用的东西，个人记录请按自己的隐私偏好保存。'
}
];

articles.push(...growthArticles.map(a=>a.zh));
articles.find(a=>a.slug==='cicaplast-b5-vs-cicalfate').sections.push({heading:'从成分线索回到实际选择',paragraphs:['Cicalfate+ 的新加坡官网列有矿油、甘油、氧化锌等；这些能帮助辨识配方，但氧化锌在面霜中出现不代表它可以替代有明确防晒标示的产品。B5+ 官网强调的 Tribioma 是品牌组合名称，不应把它当成单一 INCI 来与另一款某个成分一对一计分。','如果你只是某一小块皮肤干燥，先看局部护理需求；如果整天在空调房里紧绷，先检查日常保湿是否够用。选其中一款时，可以记录涂后舒适度、与现有防晒是否搓泥，以及是否出现不适。这个记录用来帮助你决定是否保留产品，不能证明哪款修复速度更快。','本页没有上脸实测，也没有价格或库存的实时比较。成分页展示的是已收录目录；如果包装不同或列表出现品牌混合物名称，请到来源页重新核对，不把资料完整度百分比当成权威认证。'],sources:['avene','lrp']});
