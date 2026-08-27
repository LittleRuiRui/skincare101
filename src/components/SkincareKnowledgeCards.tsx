import React,{useState}from"react";
import{ArrowLeft,ChevronRight,LibraryBig,Sparkles}from"lucide-react";
import{useLanguage}from"../lib/i18n";
import KnowledgeWatercolorArt,{type KnowledgeArtKind}from"./KnowledgeWatercolorArt";

const INK="#263027",CARD="#FBF6EA",LINE="#D9D0BC",SAGE="#2F5A40",MUSTARD="#D5A92E",MUTE="#6F6A5F";
type Topic=KnowledgeArtKind;

type TopicSpec={id:Topic;title:[string,string];sub:[string,string];tags:string[]};
const topics:TopicSpec[]=[
{id:"steps",title:["护肤步骤金字塔","The skincare pyramid"],sub:["先懂顺序，再谈效果","Order first, actives second"],tags:["护肤入门","Routine"]},
{id:"barrier",title:["什么是屏障？为什么重要？","What is the skin barrier?"],sub:["你的皮肤保护层","Your skin's protective layer"],tags:["皮肤屏障","敏感肌"]},
{id:"oily",title:["油皮为什么也会缺水？","Why can oily skin feel dehydrated?"],sub:["水油不平衡才是关键","Oil and water are different"],tags:["油性肌肤","补水保湿"]},
{id:"niacinamide",title:["常见成分小科普：烟酰胺","Ingredient 101: Niacinamide"],sub:["多效成分，但不是越高越好","Useful, but more is not always better"],tags:["成分科普","烟酰胺"]}
];

const copy:Record<Topic,[string,string][]>= {
steps:[
["护肤不是层数越多越好。最基础的是温和清洁、保湿和白天防晒。精华和针对性护理属于加分项，而不是地基。","More layers do not mean better skincare. Gentle cleansing, moisturising and daytime sunscreen are the foundation. Serums and targeted treatments are optional additions."],
["如果皮肤正在泛红、刺痛或明显脱皮，先把上层功效产品拿掉，回到底层。","If skin is red, stinging or visibly peeling, remove the upper layers first and return to the basics."]],
barrier:[
["皮肤屏障主要位于角质层，可以把它理解成‘砖墙’：角质细胞像砖，脂质像水泥。它帮助减少水分流失，也降低外界刺激物进入皮肤的机会。","The skin barrier sits mainly in the stratum corneum. Think of it as a brick wall: skin cells are the bricks and lipids are the mortar. It limits water loss and reduces entry of irritants."],
["屏障状态差时，减少刺激、做好保湿，通常比继续叠加强功效产品更重要。","When the barrier is stressed, reducing irritation and moisturising usually matters more than stacking stronger actives."]],
oily:[
["出油多和含水量不足可以同时发生。皮脂来自皮脂腺，而皮肤含水量主要和角质层保水能力有关，所以‘油’不等于‘水够’。","Oiliness and dehydration can happen at the same time. Sebum comes from sebaceous glands, while hydration depends largely on the stratum corneum's ability to hold water."],
["油皮保湿重点通常不是厚重，而是轻薄保湿剂加适量封闭成分，避免为了控油过度清洁。","For oily skin, moisturising often means light humectants plus enough occlusion, not necessarily a heavy cream. Avoid over-cleansing in the name of oil control."]],
niacinamide:[
["烟酰胺是维生素B3的一种形式，常见于提亮、屏障支持、控油和整体肤色护理。多数人并不需要追求特别高的浓度。","Niacinamide is a form of vitamin B3 used for brightening, barrier support, oil-control support and overall tone. Most people do not need extremely high concentrations."],
["敏感皮肤更适合从温和浓度开始。如果一款产品本身已经包含烟酰胺，不需要为了‘叠加功效’再同时用很多高浓度烟酰胺产品。","Sensitive skin is usually better served by moderate concentrations. If one product already contains niacinamide, stacking several high-strength niacinamide products is rarely necessary."]]
};

const cardStyle:React.CSSProperties={border:`1px solid ${LINE}`,borderRadius:22,background:CARD,overflow:"hidden",boxShadow:"0 8px 25px rgba(43,63,47,.055)"};

export default function SkincareKnowledgeCards(){
const{t,language}=useLanguage();
const[open,setOpen]=useState<Topic|null>(null),[showAll,setShowAll]=useState(false);
const zh=language==="zh";
const visible=showAll?topics:topics.slice(0,3);

if(open){
const topic=topics.find(x=>x.id===open)!;
return <section style={{...cardStyle,marginTop:30}}>
<button onClick={()=>setOpen(null)} style={{border:0,background:"transparent",padding:"15px 16px 4px",display:"inline-flex",gap:6,alignItems:"center",color:SAGE,cursor:"pointer"}}><ArrowLeft size={15}/>{t("返回护肤知识","Back to guides")}</button>
<div style={{padding:"8px 16px 22px"}}>
<div style={{borderRadius:20,overflow:"hidden",border:`1px solid ${LINE}`,background:"#FAF5E9"}}><KnowledgeWatercolorArt kind={topic.id}/></div>
<div style={{fontSize:11,fontWeight:600,color:SAGE,letterSpacing:".06em",marginTop:17}}>SKINCARE GUIDE</div>
<h2 style={{fontFamily:"'Newsreader', serif",fontWeight:500,fontSize:27,lineHeight:1.2,margin:"6px 0 7px",color:INK}}>{topic.title[zh?0:1]}</h2>
<p style={{fontSize:14,color:MUTE,lineHeight:1.65,margin:"0 0 16px"}}>{topic.sub[zh?0:1]}</p>
{copy[open].map((p,i)=><p key={i} style={{fontSize:14.5,lineHeight:1.78,color:INK,margin:"0 0 13px"}}>{p[zh?0:1]}</p>)}
<div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:15}}>{topic.tags.map(tag=><span key={tag} style={{fontSize:11,color:SAGE,background:"#EAF0E7",border:"1px solid #DDE7D8",borderRadius:999,padding:"5px 9px"}}>{tag}</span>)}</div>
</div></section>;
}

return <section style={{marginTop:32}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:13}}>
<div>
<div style={{display:"flex",alignItems:"center",gap:7,color:SAGE,fontSize:12,fontWeight:600,letterSpacing:".055em"}}><LibraryBig size={16}/>{t("护肤知识","SKINCARE GUIDE")}<Sparkles size={13} color={MUSTARD}/></div>
<div style={{fontSize:13,color:MUTE,marginTop:4}}>{t("每天懂一点，皮肤好一点","Small lessons for smarter skincare")}</div>
</div>
<button onClick={()=>setShowAll(v=>!v)} style={{border:`1px solid ${LINE}`,borderRadius:999,background:"#FFFDF7",padding:"7px 11px",fontSize:11,color:SAGE,cursor:"pointer"}}>{showAll?t("收起","Show less"):t("全部","View all")}</button>
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:12}}>
{visible.map(topic=><button key={topic.id} onClick={()=>setOpen(topic.id)} style={{...cardStyle,padding:0,textAlign:"left",cursor:"pointer",color:INK}}>
<div style={{aspectRatio:"340 / 220",overflow:"hidden",background:"#FAF5E9"}}><KnowledgeWatercolorArt kind={topic.id}/></div>
<div style={{padding:"13px 14px 14px"}}>
<div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:9}}>
<div>
<div style={{fontFamily:"'Newsreader', serif",fontSize:18,fontWeight:500,lineHeight:1.25,marginBottom:5}}>{topic.title[zh?0:1]}</div>
<div style={{fontSize:11.5,color:MUTE,lineHeight:1.5}}>{topic.sub[zh?0:1]}</div>
</div><ChevronRight size={16} color={SAGE} style={{marginTop:3,flexShrink:0}}/>
</div>
<div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:10}}>{topic.tags.map(tag=><span key={tag} style={{fontSize:10,color:SAGE,background:"#EEF2EA",borderRadius:999,padding:"4px 7px"}}>{tag}</span>)}</div>
</div>
</button>)}
</div>
</section>;
}
