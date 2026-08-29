import {useEffect} from "react";
import {useLanguage} from "../lib/i18n";

const EN:Record<string,string>={
 "肤质":"Skin type","基础信息":"Basic info","安全提醒":"Safety check","状态分析":"Skin analysis",
 "通常约3分钟完成":"Usually takes about 3 minutes","已完成":"complete","进行中":"in progress","未开始":"not started",
 "现在最想改善哪些问题?":"What would you most like to improve?","泛红":"Redness","爆痘":"Acne / breakouts","暗沉":"Dullness","毛孔粗大/黑头":"Enlarged pores / blackheads",
 "你的肌肤分析":"Your skin analysis","先做这三件事":"Start with these three steps","当前优先方向：":"Current priority: ",
 "1 · 先简化":"1 · Simplify first","2 · 保留基础":"2 · Keep the basics","3 · 再做选择":"3 · Choose selectively",
 "你的成分方向":"Your ingredient direction","优先看的产品":"Products to consider first","护肤建议":"Skincare guidance","合并护肤建议":"Combined skincare guidance",
 "就医提示":"Medical note","就医时可咨询的治疗方向":"Treatment options to discuss with a clinician",
 "证据拆解 · Confidence Engine":"Evidence breakdown · Confidence Engine","基础":"Base","支持":"Support","矛盾":"Contradiction","不确定":"Uncertainty","高":"High","中":"Medium","低":"Low",
 "导出 PDF 报告":"Export PDF report","查看成分匹配分析":"View ingredient match analysis","从产品数据库为我匹配":"Match products for me","重新开始":"Start over",
 "成分匹配分析 · 第一步":"Ingredient match · Step 1","先告诉我们你在用哪一瓶":"Which product are you using?","数据完整度":"Data completeness","未识别":"Unrecognised","结论":"Conclusion",
 "冲突":"Conflict","一致":"Match","低权重":"Lower weight","未标准化":"Unstandardised","中性":"Normal",
 "为你推荐 · 本地产品数据库":"Recommended for you · Product database","数据来源":"Source","完整配方":"Full formula","部分配方":"Partial formula","证据不足":"Insufficient evidence","有效证据":"Evidence","方向冲突":"Conflicting direction",
 "为什么不是黑箱推荐?":"Why this is not a black-box recommendation","打分逻辑":"Scoring logic","全部":"All","搜索品牌或产品名":"Search brand or product","再显示 24 款":"Show 24 more",
 "Formula DNA · 配方结构":"Formula DNA · Formula structure","酒精":"Alcohol","肤感":"Skin feel","可信度":"Confidence"
};

const patterns:Array<[RegExp,(m:RegExpMatchArray)=>string]>=[
 [/^约\s*(\d+)\s*题进一步了解$/,(m)=>`About ${m[1]} follow-up questions`],
 [/^开始分析\s*[（(](\d+)个问题[）)]$/,(m)=>`Start analysis (${m[1]} concerns)`],
 [/^本阶段问题\s*(\d+)\/(\d+)$/,(m)=>`Question ${m[1]} of ${m[2]}`],
 [/^本症状问题\s*(\d+)\/(\d+)$/,(m)=>`Question ${m[1]} of ${m[2]}`],
 [/^找到\s*(\d+)\s*款，当前显示\s*(\d+)\s*款$/,(m)=>`${m[1]} products found · showing ${m[2]}`],
 [/^数据完整度\s*(\d+)%$/,(m)=>`Data completeness ${m[1]}%`]
];

function translateText(text:string){
 const trimmed=text.trim();if(!trimmed)return text;
 let out=EN[trimmed];
 if(!out){for(const[p,fn]of patterns){const m=trimmed.match(p);if(m){out=fn(m);break}}}
 if(!out)return text;
 const start=text.indexOf(trimmed);return text.slice(0,start)+out+text.slice(start+trimmed.length);
}

export default function LegacyResultsI18nBridge():null{
 const{language}=useLanguage();
 useEffect(()=>{
  const root=document.querySelector('[data-skin-test-root="true"]');if(!root)return;
  const originals=new WeakMap<Text,string>();let busy=false;
  const apply=()=>{if(busy)return;busy=true;try{
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node:Node|null;
   while((node=walker.nextNode())){const n=node as Text;if(!originals.has(n))originals.set(n,n.nodeValue||"");const original=originals.get(n)||"";const next=language==="en"?translateText(original):original;if(n.nodeValue!==next)n.nodeValue=next}
   root.querySelectorAll('input[placeholder],textarea[placeholder]').forEach((el)=>{const input=el as HTMLInputElement|HTMLTextAreaElement;if(!input.dataset.zhPlaceholder)input.dataset.zhPlaceholder=input.placeholder||"";input.placeholder=language==="en"?(input.dataset.zhPlaceholder==="搜索品牌或产品名"?"Search brand or product":input.dataset.zhPlaceholder||""):input.dataset.zhPlaceholder||""});
  }finally{busy=false}};
  apply();const obs=new MutationObserver(()=>queueMicrotask(apply));obs.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["placeholder"]});return()=>obs.disconnect();
 },[language]);
 return null;
}
