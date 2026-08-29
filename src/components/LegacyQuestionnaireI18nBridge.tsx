import {useEffect} from "react";
import {useLanguage} from "../lib/i18n";

const EN:Record<string,string>={
"泛红":"Redness","爆痘":"Acne / breakouts","暗沉":"Dullness","毛孔粗大/黑头":"Enlarged pores / blackheads",
"屏障受损型泛红":"Barrier-damage redness","玫瑰痤疮倾向":"Rosacea tendency","单纯敏感肌反应":"Sensitive-skin reaction","过度去角质":"Over-exfoliation","脂溢性皮炎":"Seborrheic dermatitis",
"假性痘(屏障受损型)":"Barrier-related breakout","真性痤疮":"Acne vulgaris","致痘成分诱发":"Product-induced breakout","马拉色菌毛囊炎(真菌痘)":"Malassezia folliculitis (fungal acne)",
"角质堆积":"Dead-skin buildup","色素沉着":"Pigmentation","微循环/作息问题":"Circulation / lifestyle factors","光损伤(慢性)":"Chronic photodamage",
"油脂型毛孔":"Oil-related pores","缺水代偿型毛孔":"Dehydration-related pores","角质堆积型毛孔":"Buildup-related pores","衰老松弛型毛孔":"Loss-of-firmness pores",
"现在最想改善哪些问题?":"What would you most like to improve?","建议先选1–2个最困扰你的问题，完成会更快；相同的可能原因会自动合并":"Choose the 1–2 concerns that bother you most. The test will be faster, and overlapping possible causes will be combined automatically.",
"上一步":"Back","继续":"Continue","下一步":"Next","完成":"Finish","开始分析":"Start analysis","重新测试":"Retake test","查看推荐":"See recommendations","保存肤质档案":"Save skin profile",
"这种泛红是最近才出现的,还是持续超过一个月了?":"Did the redness start recently, or has it lasted for more than a month?","先做急性/慢性分流,判断是外因触发还是体质性问题":"First distinguish acute from chronic redness to assess whether it is trigger-related or more persistent.","两周以内,比较突然":"Within two weeks; fairly sudden","一个多月以上,反反复复":"More than a month; recurring",
"这段时间有没有以下情况?(可多选)":"Have any of these happened recently? (Select all that apply)","诱因具体化,而非开放式提问":"Identify specific triggers rather than relying on an open-ended description.","换了新的护肤品/精华/面霜":"Started a new skincare product, serum, or cream","用了去角质/焕肤类产品(酸类、磨砂、洁面仪)":"Used exfoliating/resurfacing products (acids, scrubs, cleansing devices)","环境明显变化(换季、出国、长期空调房)":"Major environment change (season, travel, prolonged air-conditioning)","以上都没有,就是突然开始的":"None of these; it just started suddenly",
"泛红的地方有没有刺痛、紧绷、发烫的感觉?":"Does the red area sting, feel tight, or feel hot?","区分屏障受损(有不适感)与单纯视觉泛红":"Helps distinguish barrier damage with discomfort from redness that is mainly visual.","有,会痛或者很紧绷":"Yes, it stings/hurts or feels very tight","没有,只是看起来红":"No, it only looks red",
"遇到热水洗脸、喝酒、情绪激动时,泛红会不会突然加重、并且很久不退?":"Does redness flare after hot water, alcohol, or strong emotions and then take a long time to fade?","专门排查玫瑰痤疮——这是它最具特异性的触发模式":"This specifically screens for a rosacea-like trigger pattern.","会,而且退得很慢":"Yes, and it fades slowly","不太会,或者退得挺快":"Not really, or it fades fairly quickly",
"泛红的地方有没有黄色、偏油腻的皮屑,而且集中在鼻翼两侧、眉毛、发际线这些部位?":"Is there yellowish or greasy flaking around the sides of the nose, eyebrows, or hairline?","脂溢性皮炎容易被当成普通泛红或屏障受损处理,但机制和马拉色菌相关,方向不同":"Seborrheic dermatitis can look like ordinary redness or barrier damage, but it is associated with Malassezia and needs a different approach.","有,而且油腻感、边界感比较明显":"Yes; it looks greasy and the affected area is fairly well defined","没有,就是单纯发红,没有皮屑":"No; it is simply red without flaking",
"这次爆痘是最近(两周内)突然冒出来的,还是断断续续持续一个多月了?":"Did this breakout appear suddenly within the last two weeks, or has it recurred for more than a month?","急慢性分流":"Distinguish an acute breakout from a chronic pattern.","最近突然冒出来的":"It appeared suddenly recently","断断续续一个多月以上":"It has recurred for more than a month","换了新的护肤品/防晒/彩妆":"Started new skincare, sunscreen, or makeup","用了去角质/焕肤类产品":"Used exfoliating/resurfacing products","饮食/作息明显变化(熬夜、高糖高油、压力大)":"Major diet/lifestyle change (late nights, high-sugar/high-fat food, stress)","生理周期相关(经期前后规律性出现)":"It follows my menstrual cycle","以上都没有":"None of these",
"有没有以下情况?(可多选)":"Do any of these apply? (Select all that apply)","马拉色菌毛囊炎(俗称真菌痘)外观很像痤疮,机制是酵母菌感染而非皮脂腺炎症,常规祛痘产品无效甚至加重":"Malassezia folliculitis can resemble acne, but it is yeast-related rather than typical acne inflammation, so standard acne treatments may not help.","主要长在胸背部或发际线,不是以面部为主":"Mostly on the chest, back, or hairline rather than the face","痘痘大小非常均匀,几乎一个模子刻出来的":"The bumps are very uniform in size","伴随明显瘙痒,而不是疼痛":"It is noticeably itchy rather than painful","用过祛痘产品或抗生素,没什么效果甚至更严重":"Acne products or antibiotics did not help, or made it worse","都没有以上情况":"None of these",
"现在有没有红肿或者疼痛的感觉?":"Are the spots red, swollen, or painful?","先做粉刺 vs 炎症性痘痘的分流——粉刺是没有发炎的最早期阶段":"First distinguish comedones from inflammatory acne.","不红不肿不疼,就是鼓起来的小颗粒,或者能看到黑头/白头":"No redness, swelling, or pain; just small bumps, blackheads, or whiteheads","有红肿或者疼痛感":"Yes, there is redness, swelling, or pain",
"摸起来是浅表的、能感觉到清楚边界,还是感觉埋在皮下比较深、像个包?":"Do the spots feel superficial with clear edges, or deeper under the skin like a lump?","深浅是判断严重程度的第一个独立维度":"Depth is one independent indicator of severity.","浅表,边界比较清楚":"Superficial with fairly clear edges","感觉埋在皮下,像个包,摸起来比较深":"Deep under the skin, like a lump",
"顶端有没有明显的白色/黄色脓头,或者挤压会不会出脓?":"Is there a visible white/yellow pustule, or does pus come out with pressure?","有无脓是判断严重程度的第二个独立维度,和深浅是两条不同的轴":"Pus is another independent severity indicator, separate from lesion depth.","没有脓头,挤不出什么东西":"No visible pustule and nothing much comes out","有,能看到脓头或者挤压会出脓":"Yes, there is a pustule or pus can be expressed",
"主要长在两颊,还是集中在下巴/嘴周/T区?":"Are the breakouts mainly on the cheeks, or around the chin/mouth/T-zone?","分布位置辅助区分病因":"Distribution can help differentiate likely causes.","两颊为主":"Mainly the cheeks","下巴/嘴周/T区为主":"Mainly chin / around the mouth / T-zone","这种爆痘是不是每个月固定时间会加重?":"Does the breakout worsen at roughly the same time each month?","补充确认激素相关因素":"Checks for a possible hormonal pattern.","有规律,固定时间加重":"Yes, it worsens at a regular time","没什么规律":"No clear pattern",
"这种暗沉是持续存在的,还是会随着睡眠/状态好坏明显变化?":"Is the dullness constant, or does it change noticeably with sleep and how you feel?","波动性分流":"Use fluctuation to distinguish possible causes.","随状态波动明显":"It changes noticeably with my condition","持续稳定,没怎么变过":"It stays fairly constant",
"暗沉是脸上有明显的深色斑块/印子,还是整张脸看起来均匀发暗?":"Is the dullness mainly visible as darker patches/marks, or is the whole face evenly dull?","局部 vs 整体":"Localized vs overall pattern.","有明显局部斑块/印子":"There are clear darker patches or marks","整张脸均匀发暗":"The whole face looks evenly dull",
"皮肤摸起来是粗糙、有颗粒感,还是比较光滑但就是显老、毛孔明显?":"Does the skin feel rough/grainy, or relatively smooth but with more visible pores or signs of aging?","触感线索,区分角质堆积 vs 光损伤":"Texture helps distinguish buildup from photodamage.","粗糙,有颗粒感":"Rough and grainy","光滑,但显老/毛孔明显/有细纹":"Smooth, but with visible pores/fine lines or an older-looking texture",
"这种状态是最近才这样,还是感觉持续好几年了?":"Did this start recently, or has it been present for years?","累积时长,最终确认光损伤":"Duration helps assess cumulative photodamage.","最近才这样":"It started recently","持续好几年,一直没变过":"It has persisted for years",
"毛孔的形状更接近哪一种?":"Which description best matches the shape of your pores?","形状是判断成因最直接的线索——不同成因撑大毛孔的方式不一样":"Pore shape can be a useful clue because different mechanisms enlarge pores differently.","U型,主要集中在鼻翼/T区":"U-shaped, mainly around the nose/T-zone","椭圆形,同时觉得皮肤有点紧绷缺水":"Oval, with some tightness/dehydration","水滴形,向下拉长,伴随松弛下垂感":"Teardrop-shaped and elongated downward, with some sagging","看不出明显形状,但黑头/闭口很多":"No obvious shape, but many blackheads/closed comedones",
"平时出油情况怎么样?":"How oily does your skin usually get?","区分真性出油和缺水代偿性出油——两者外观类似,方向相反":"Helps distinguish genuinely oily skin from dehydration-related compensatory oiliness.","T区很快出油,一天要按吸油纸好几次":"The T-zone gets oily quickly and needs blotting several times a day","皮肤偏干、很少出油,但毛孔看起来还是很粗":"My skin is fairly dry and rarely oily, but pores still look large","出油正常,不算严重":"Oiliness is fairly normal",
"皮肤表面有没有以下情况?(可多选)":"Do any of these describe the skin surface? (Select all that apply)","具体化角质堆积的表现,而非笼统问“清洁够不够”":"Looks for specific signs of buildup rather than simply asking whether cleansing is sufficient.","鼻头/鼻翼有明显黑头":"Visible blackheads on the nose/sides of the nose","闭口比较多,摸起来有小颗粒":"Many closed comedones; the skin feels bumpy","皮肤摸起来粗糙,角质感觉偏厚":"The skin feels rough or thickened","都没有":"None",
"有没有以下情况?":"Do any of these apply?","补充确认是否存在衰老性因素":"Checks for loss-of-firmness/aging-related factors.","毛孔感觉在往下垂,伴随皮肤松弛":"Pores appear to pull downward with some skin laxity","最近熬夜或暴晒后,感觉毛孔明显变大":"Pores look noticeably larger after late nights or heavy sun exposure","没有以上情况":"None of these",
"肤质已记录":"Skin profile recorded","鉴别问诊":"Differential assessment","本症状问题":"Questions for this concern","你的分析结果":"Your analysis results","可能原因":"Possible cause","建议":"Recommendations","为什么这么判断":"Why this result","护肤方向":"Skincare direction","需要注意":"What to watch","温和":"Gentle","中等":"Moderate","非处方":"Over the counter","处方(视情况)":"Prescription (if appropriate)","就医建议":"Medical guidance"
};

const patterns:Array<[RegExp,(m:RegExpMatchArray)=>string]>=[
[/^约\s*(\d+)\s*题进一步了解$/,(m)=>`About ${m[1]} follow-up questions`],
[/^开始分析\s*[（(](\d+)个问题[）)]$/,(m)=>`Start analysis (${m[1]} concerns)`],
[/^本症状问题\s*(\d+)\/(\d+)$/,(m)=>`Question ${m[1]} of ${m[2]}`],
[/^(.+)\s*·\s*鉴别问诊(?:\((\d+)\/(\d+)\))?$/,(m)=>`${EN[m[1]]||m[1]} · Differential assessment${m[2]?` (${m[2]}/${m[3]})`:""}`],
[/^18岁以下$/,_=>"Under 18"],[/^18-30岁$/,_=>"18–30"],[/^30-45岁$/,_=>"30–45"],[/^45岁以上$/,_=>"45+"],[/^女$/,_=>"Female"],[/^男$/,_=>"Male"],[/^怀孕\/哺乳期$/,_=>"Pregnant / breastfeeding"]
];

function translate(text:string){const trimmed=text.trim();if(!trimmed)return text;let out=EN[trimmed];if(!out){for(const[p,fn]of patterns){const m=trimmed.match(p);if(m){out=fn(m);break}}}if(!out)return text;const start=text.indexOf(trimmed);return text.slice(0,start)+out+text.slice(start+trimmed.length)}

export default function LegacyQuestionnaireI18nBridge():null{
 const{language}=useLanguage();
 useEffect(()=>{
  const originals=new WeakMap<Text,string>();
  let applying=false;
  const apply=()=>{
   if(applying)return;applying=true;
   try{
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let node:Node|null;
    while((node=walker.nextNode())){
     const textNode=node as Text;
     const parent=textNode.parentElement;
     if(!parent||parent.closest('[data-skin-i18n-ignore="true"]'))continue;
     if(!originals.has(textNode))originals.set(textNode,textNode.nodeValue||"");
     const original=originals.get(textNode)||"";
     const next=language==="en"?translate(original):original;
     if(textNode.nodeValue!==next)textNode.nodeValue=next;
    }
   }finally{applying=false}
  };
  apply();
  const obs=new MutationObserver(()=>queueMicrotask(apply));
  obs.observe(document.body,{subtree:true,childList:true,characterData:true});
  return()=>obs.disconnect();
 },[language]);
 return null;
}
