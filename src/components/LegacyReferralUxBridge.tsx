import {useEffect} from "react";
import {useLanguage} from "../lib/i18n";

const copy={
 zh:{
  redflagEyebrow:"第三步 · 安全提示",
  redflagTitle:"先确认一个安全问题",
  redflagBody:"如果以下情况都没有，直接继续测试；如果有，我们会先提示风险，但你仍然可以继续完成肤质测试。",
  referralEyebrow:"风险提示",
  referralTitle:"这个情况更适合先让皮肤科确认",
  referralPrefix:"可能需要排除：",
  referralBody:"这不是诊断，只是一个安全提醒。部分皮肤问题需要专业检查才能确认，护肤品不适合用来判断或处理。建议尽快咨询皮肤科，同时你仍可继续完成后续肤质测试。",
  continue:"继续后续测试",
 },
 en:{
  redflagEyebrow:"Step 3 · Safety check",
  redflagTitle:"One quick safety check",
  redflagBody:"If none of these apply, continue as usual. If one does apply, we’ll show a risk note first, but you can still finish the skin test.",
  referralEyebrow:"Risk note",
  referralTitle:"This is better checked by a dermatologist first",
  referralPrefix:"Worth ruling out: ",
  referralBody:"This is not a diagnosis, only a safety flag. Some skin conditions need a professional exam to confirm and should not be judged or treated through skincare alone. Consider seeing a dermatologist soon; you can still continue the rest of the skin test.",
  continue:"Continue skin test",
 }
} as const;

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
    const referralH2=h2s.find(el=>text(el).includes("这个特征超出了护肤品能处理的范围")||text(el).includes("这个情况更适合先让皮肤科确认")||text(el).includes("This is better checked by a dermatologist first"));
    if(referralH2){
      const root=referralH2.closest("div[style*='padding-top']")||referralH2.parentElement;
      if(root){
       const eyebrow=[...root.querySelectorAll("div")].find(el=>["建议就医","风险提示","Risk note"].includes(text(el)));
       if(eyebrow)eyebrow.textContent=c.referralEyebrow;
       referralH2.textContent=c.referralTitle;
       const card=[...root.querySelectorAll("div")].find(el=>text(el).includes("特征更符合:")||text(el).includes("可能需要排除：")||text(el).includes("Worth ruling out:"));
       if(card){
        const title=[...card.querySelectorAll("div")].find(el=>text(el).includes("特征更符合:")||text(el).includes("可能需要排除：")||text(el).includes("Worth ruling out:"));
        if(title){
         const raw=text(title).replace(/^特征更符合:/,"").replace(/^可能需要排除：/,"").replace(/^Worth ruling out:\s*/,"");
         title.textContent=c.referralPrefix+raw;
        }
        const detail=[...card.querySelectorAll("div")].find(el=>el!==title&&text(el).length>20);
        if(detail)detail.style.display="none";
       }
       const body=[...root.querySelectorAll("p")].find(el=>text(el).includes("这类情况通常需要专业检查")||text(el).includes("This is not a diagnosis"));
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
