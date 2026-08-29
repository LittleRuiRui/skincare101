import React,{useEffect}from"react";

const PHRASES:Array<[string,string]>=[
 ["暂不建议买","Not recommended"],
 ["你已经有功能高度相近的强活性产品；新增更可能增加刺激负荷，而不是补足缺口。","You already own a strong active product with a very similar role. Adding this is more likely to increase irritation load than fill a real gap."],
 ["与它最接近。","is the closest match in your current shelf."],
 ["与你当前肤质匹配：","Fit with your current skin profile: "],
 ["它没有补上当前 Routine 的明显硬缺口。","It does not fill a clear gap in your current routine."],
 ["与现有产品存在部分功能重叠。","It partially overlaps with products you already own."],
 ["新加坡常见品牌级预算区间","typical Singapore brand-level budget range"],
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
