import React,{useEffect}from"react";
import{trackEventLater}from"../lib/analytics";
import type{AppLanguage}from"../lib/i18n";

function currentLanguage():AppLanguage{return document.documentElement.lang.toLowerCase().startsWith("en")?"en":"zh"}
function isAffiliateHref(href:string){try{const u=new URL(href,window.location.href);const host=u.hostname.toLowerCase();const q=u.search.toLowerCase();return /taobao|tmall|sephora|shopee|lazada|amazon|lookfantastic|yesstyle|stylevana/.test(host)||/(^|[?&])(aff|affiliate|ref|tag|utm_source)=/.test(q)}catch{return false}}
const PRODUCT_BACK_RE=/\u8fd4\u56de\u4ea7\u54c1\u5e93|Back to products/i;
const JOURNEY_ACTIONS:[RegExp,string][]=[
 [/\u6211\u7684\u80a4\u8d28|My Skin/i,"open_skin_profile"],
 [/\u4e3a\u4f60\u63a8\u8350|For You/i,"open_recommendations"],
 [/\u67e5\u6210\u5206|Ingredient \/ Product Check|Ingredient Match/i,"open_ingredient_check"],
 [/\u6211\u7684\u65e9\u665a\u62a4\u80a4|My AM\/PM Routine/i,"open_routine"],
 [/\u6211\u9700\u8981\u4e70\u5417|Do I need this/i,"open_need_this"],
 [/\u6211\u7684\u62a4\u80a4\u67dc|My Shelf/i,"open_shelf"],
 [/\u53d1\u73b0\u6570\u636e\u6709\u8bef|Report/i,"open_data_report"],
 [/\u5efa\u7acb.*\u80a4\u8d28|Create.*profile|\u5f00\u59cb\u5efa\u6863/i,"start_profile"],
 [/\u63d0\u4ea4\u4f53\u9a8c|Publish|Send experience/i,"submit_experience"]
];

function routeName(){
 const root=document.querySelector<HTMLElement>(".site-content");
 const match=Array.from(root?.classList||[]).find(x=>x.startsWith("page-"));
 return match?match.slice(5):"unknown";
}

export default function AnalyticsBootstrap():React.ReactElement|null{
 useEffect(()=>{
  let lastProductKey="";
  let lastRoute="";
  trackEventLater("session_start",{pageName:location.pathname,language:currentLanguage(),metadata:{timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||null}});
  const detectRoute=()=>{
   const route=routeName();
   if(route==="unknown"||route===lastRoute)return;
   lastRoute=route;
   trackEventLater("journey_page_view",{pageName:route,language:currentLanguage(),metadata:{route}});
  };
  const detectProductDetail=()=>{const buttons=Array.from(document.querySelectorAll("button"));const isDetail=buttons.some(b=>PRODUCT_BACK_RE.test((b.textContent||"").trim()));if(!isDetail){lastProductKey="";return}const h1=document.querySelector("h1");const productName=(h1?.textContent||"").trim();if(!productName)return;const key=`${currentLanguage()}:${productName}`;if(key===lastProductKey)return;lastProductKey=key;trackEventLater("product_detail_view",{pageName:"product_detail",language:currentLanguage(),metadata:{productName:productName.slice(0,180)}})};
  const onLanguage=(e:Event)=>{const detail=(e as CustomEvent<{language?:AppLanguage}>).detail;trackEventLater("language_changed",{pageName:routeName(),language:detail?.language||currentLanguage()});queueMicrotask(()=>{detectRoute();detectProductDetail()})};
  const onClick=(e:MouseEvent)=>{
   const element=e.target instanceof Element?e.target.closest("button,a"):null;
   const text=(element?.textContent||"").replace(/\s+/g," ").trim();
   if(text){const action=JOURNEY_ACTIONS.find(([pattern])=>pattern.test(text));if(action)trackEventLater("journey_action",{pageName:routeName(),language:currentLanguage(),metadata:{action:action[1],label:text.slice(0,120)}})}
   const target=e.target instanceof Element?e.target.closest("a[href]"):null;if(!(target instanceof HTMLAnchorElement))return;const href=target.href;if(!href||!isAffiliateHref(href))return;let host="";try{host=new URL(href).hostname}catch{}trackEventLater("affiliate_click",{pageName:routeName(),language:currentLanguage(),metadata:{host,href:href.slice(0,500)}})
  };
  let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;detectRoute();detectProductDetail()})});observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["class"]});
  detectRoute();detectProductDetail();
  window.addEventListener("skincare101:language",onLanguage as EventListener);
  document.addEventListener("click",onClick,true);
  return()=>{observer.disconnect();window.removeEventListener("skincare101:language",onLanguage as EventListener);document.removeEventListener("click",onClick,true)};
 },[]);
 return null;
}
