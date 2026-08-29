import React,{useEffect}from"react";

const PHRASES:Array<[string,string]>=[
 ["暂不建议买","Not recommended"],
 ["你已经有功能高度相近的强活性产品；新增更可能增加刺激负荷，而不是补足缺口。","You already own a strong active product with a very similar role. Adding this is more likely to increase irritation load than fill a real gap."],
 ["与它最接近。","is the closest match in your current shelf."],
 ["与你当前肤质匹配：","Fit with your current skin profile: "],
 ["它没有补上当前 Routine 的明显硬缺口。","It does not fill a clear gap in your current routine."],
 ["与现有产品存在部分功能重叠。","It partially overlaps with products you already own."],
 ["新加坡常见品牌级预算区间","typical Singapore brand-level budget range"],
 ["特征更符合:","Features are more consistent with: "],
 ["特征更符合：","Features are more consistent with: "],
 ["和色沉、晒斑的方向相反,容易被误判成\"美白过度\",不属于护肤品能干预的范畴。","This is the opposite of pigmentation or sun spots and can be mistaken for excessive lightening. It is not something skincare products can meaningfully treat."],
 ["和色沉、晒斑的方向相反，容易被误判成\"美白过度\"，不属于护肤品能干预的范畴。","This is the opposite of pigmentation or sun spots and can be mistaken for excessive lightening. It is not something skincare products can meaningfully treat."],
 ["属于需要系统性皮肤科管理的慢性病,鳞屑厚度和点状出血是和普通干燥脱皮最大的区别。","This is a chronic condition that requires ongoing dermatologic management. Thick scaling and pinpoint bleeding are key features that distinguish it from ordinary dry, flaky skin."],
 ["属于需要系统性皮肤科管理的慢性病，鳞屑厚度和点状出血是和普通干燥脱皮最大的区别。","This is a chronic condition that requires ongoing dermatologic management. Thick scaling and pinpoint bleeding are key features that distinguish it from ordinary dry, flaky skin."],
 ["病毒感染,和痤疮/接触性皮炎的水疱表现需要鉴别,不适合按护肤流程处理。","A viral infection can produce blisters that need to be distinguished from acne or contact dermatitis, so it should not be handled as a routine skincare issue."],
 ["起消速度是关键特征,和接触性皮炎、普通泛红的病程明显不同。","How quickly the welts appear and disappear is an important clue and differs from the course of contact dermatitis or ordinary redness."],
 ["属于癌前病变,检测到疑似特征应立即建议就医,而不是继续走护肤建议路径。","This can be a precancerous lesion. If this pattern is suspected, medical assessment should take priority over skincare recommendations."],
 ["控油体系","Oil-control system"],
 ["舒缓体系","Soothing system"],
 ["保湿体系","Hydration system"],
 ["屏障体系","Barrier-support system"],
 ["抗氧化体系","Antioxidant system"],
 ["提亮体系","Brightening system"],
 ["抗老体系","Anti-aging system"],
 ["焕肤体系","Exfoliation system"],
 ["祛痘体系","Acne-care system"],
 ["防晒体系","UV-protection system"],
 ["混合性","Combination"],
 ["混合","Combination"],
 ["敏感叠加","Sensitivity-prone"],
 ["油性","Oily"],
 ["干性","Dry"],
 ["中性","Balanced"]
];

function english(){return document.documentElement.lang.toLowerCase().startsWith("en")}
function translateText(value:string){let next=value;for(const[zh,en]of PHRASES)next=next.split(zh).join(en);return next}
function process(root:Node){if(!english())return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node:Node|null;while((node=walker.nextNode())){const p=node.parentElement;if(!p||p.closest("script,style"))continue;const old=node.textContent||"";const next=translateText(old);if(next!==old)node.textContent=next}}
export default function EnglishDynamicContentGuard():React.ReactElement|null{useEffect(()=>{let frame=0;const run=(root:Node=document.body)=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>process(root))};run();const observer=new MutationObserver(ms=>{for(const m of ms){if(m.type==="characterData"){run(m.target);continue}for(const n of Array.from(m.addedNodes))run(n)}});observer.observe(document.body,{subtree:true,childList:true,characterData:true});const onLang=()=>run();window.addEventListener("skincare101:language-changed",onLang);return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("skincare101:language-changed",onLang)}},[]);return null}
