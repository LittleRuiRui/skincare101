import {useEffect} from "react";
import {useLanguage} from "../lib/i18n";

const copy={
 zh:{
  redflagEyebrow:"第三步 · 安全提示",
  redflagTitle:"先确认一个安全问题",
  redflagBody:"如果以下情况都没有，直接继续测试；如果有，我们会先提示风险，但你仍然可以继续完成肤质测试。",
  referralEyebrow:"风险提示",
  referralTitle:"这个特征超出了护肤品能处理的范围",
  referralPrefix:"特征更符合:",
  referralBody:"这类情况通常需要专业检查(必要时刮片、皮肤镜或活检)才能确诊,继续用护肤品自行判断和护理不仅无效,还可能延误规范治疗的时机。建议尽快挂皮肤科明确诊断,再决定后续方案。",
  continue:"继续后续测试",
 },
 en:{
  redflagEyebrow:"Step 3 · Safety check",
  redflagTitle:"One quick safety check",
  redflagBody:"If none of these apply, continue as usual. If one does apply, we’ll show a risk note first, but you can still finish the skin test.",
  referralEyebrow:"Risk note",
  referralTitle:"This feature is outside what skincare products can address",
  referralPrefix:"This pattern is more consistent with: ",
  referralBody:"Conditions like this usually require a professional examination — sometimes including a scraping, dermoscopy, or biopsy — before they can be confirmed. Trying to judge or manage them with skincare alone may be ineffective and could delay appropriate treatment. Please consider seeing a dermatologist to clarify the diagnosis before deciding what to do next.",
  continue:"Continue skin test",
 }
} as const;

const conditionEn:Record<string,string>={
 "银屑病":"Psoriasis",
 "白癜风":"Vitiligo",
 "疱疹类病毒感染":"Herpes-family viral infection",
 "荨麻疹":"Urticaria (hives)",
 "日光性角化病":"Actinic keratosis",
};

const noteEn:Record<string,string>={
 "属于需要系统性皮肤科管理的慢性病,鳞屑厚度和点状出血是和普通干燥脱皮最大的区别。":"This is a chronic condition that generally needs dermatologic management. Thick scale and pinpoint bleeding help distinguish it from ordinary dryness or flaking.",
 "和色沉、晒斑的方向相反,容易被误判成\"美白过度\",不属于护肤品能干预的范畴。":"This is the opposite of pigmentation or sun spots and can be mistaken for excessive lightening. It is not something skincare products can meaningfully treat.",
 "病毒感染,和痤疮/接触性皮炎的水疱表现需要鉴别,不适合按护肤流程处理。":"A viral infection can produce blisters that need to be distinguished from acne or contact dermatitis, so it should not be handled as a routine skincare issue.",
 "起消速度是关键特征,和接触性皮炎、普通泛红的病程明显不同。":"How quickly the welts appear and disappear is an important clue and differs from the course of contact dermatitis or ordinary redness.",
 "属于癌前病变,检测到疑似特征应立即建议就医,而不是继续走护肤建议路径。":"This can be a precancerous lesion. If the pattern is suspected, medical assessment should take priority over skincare recommendations.",
};

function text(el:Element|null){return (el?.textContent||"").trim()}

export default function LegacyReferralUxBridge(){
 const{language}=useLanguage();
 useEffect(()=>{
  const c=copy[language];
  let busy=false;
  const apply=()=>{
   if(busy)return;busy=true;
   try{
    const all=[...document.querySelectorAll("div")];
    const redflag=all.find(el=>text(el).includes("在选具体问题之前,先排除这几种情况")||text(el).includes("One quick safety check"));
    if(redflag){
      const root=redflag.closest("div[style*='padding-top']")||redflag.parentElement;
      if(root){
       const eyebrow=[...root.querySelectorAll("div")].find(el=>/第三步\s*·\s*(就医识别|安全提示)|Step 3/.test(text(el)));
       if(eyebrow)eyebrow.textContent=c.redflagEyebrow;
       const h2=root.querySelector("h2");if(h2)h2.textContent=c.redflagTitle;
       const p=root.querySelector("p");if(p)p.textContent=c.redflagBody;
      }
    }

    const h2s=[...document.querySelectorAll("h2")];
    const referralH2=h2s.find(el=>text(el).includes("这个特征超出了护肤品能处理的范围")||text(el).includes("这个情况更适合先让皮肤科确认")||text(el).includes("This feature is outside what skincare products can address")||text(el).includes("This is better checked by a dermatologist first"));
    if(referralH2){
      const root=referralH2.closest("div[style*='padding-top']")||referralH2.parentElement;
      if(root){
       const eyebrow=[...root.querySelectorAll("div")].find(el=>["建议就医","风险提示","Risk note"].includes(text(el)));
       if(eyebrow)eyebrow.textContent=c.referralEyebrow;
       referralH2.textContent=c.referralTitle;
       const card=[...root.querySelectorAll("div")].find(el=>text(el).includes("特征更符合:")||text(el).includes("可能需要排除：")||text(el).includes("This pattern is more consistent with:")||text(el).includes("Worth ruling out:"));
       if(card){
        const title=[...card.querySelectorAll("div")].find(el=>text(el).includes("特征更符合:")||text(el).includes("可能需要排除：")||text(el).includes("This pattern is more consistent with:")||text(el).includes("Worth ruling out:"));
        if(title){
         const raw=text(title).replace(/^特征更符合:/,"").replace(/^可能需要排除：/,"").replace(/^This pattern is more consistent with:\s*/,"").replace(/^Worth ruling out:\s*/,"").trim();
         const localized=language==="en"?(conditionEn[raw]||raw):raw;
         title.textContent=c.referralPrefix+localized;
        }
        const detail=[...card.querySelectorAll("div")].find(el=>el!==title&&text(el).length>20);
        if(detail){
         detail.style.display="block";
         const rawDetail=text(detail);
         if(language==="en"&&noteEn[rawDetail])detail.textContent=noteEn[rawDetail];
        }
       }
       const body=[...root.querySelectorAll("p")].find(el=>text(el).includes("这类情况通常需要专业检查")||text(el).includes("This is not a diagnosis")||text(el).includes("Conditions like this usually require"));
       if(body)body.textContent=c.referralBody;
       const primary=[...root.querySelectorAll("button")].find(el=>text(el).includes("重新开始演示")||text(el).includes("继续后续测试")||text(el).includes("Continue skin test"));
       if(primary){primary.textContent=c.continue;primary.setAttribute("data-continue-skin-test","true")}
      }
    }
   }finally{busy=false}
  };

  const onClick=(event:MouseEvent)=>{
   const target=(event.target as Element|null)?.closest?.('button[data-continue-skin-test="true"]') as HTMLButtonElement|null;
   if(!target)return;
   event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
   const root=target.closest("div[style*='padding-top']")||target.parentElement;
   const back=root?[...root.querySelectorAll("button")].find(el=>text(el)==="上一步"||text(el)==="Back"):null;
   (back as HTMLButtonElement|null)?.click();
   window.setTimeout(()=>{
    const buttons=[...document.querySelectorAll("button")];
    const none=buttons.find(el=>text(el)==="都没有以上情况"||text(el)==="None of these");
    (none as HTMLButtonElement|null)?.click();
   },80);
  };

  apply();
  const obs=new MutationObserver(()=>queueMicrotask(apply));
  obs.observe(document.body,{subtree:true,childList:true,characterData:true});
  document.addEventListener("click",onClick,true);
  return()=>{obs.disconnect();document.removeEventListener("click",onClick,true)};
 },[language]);
 return null;
}
