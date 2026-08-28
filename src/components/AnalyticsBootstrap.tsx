import React,{useEffect}from"react";
import{trackEventLater}from"../lib/analytics";
import type{AppLanguage}from"../lib/i18n";

function currentLanguage():AppLanguage{return document.documentElement.lang.toLowerCase().startsWith("en")?"en":"zh"}
function isAffiliateHref(href:string){try{const u=new URL(href,window.location.href);const host=u.hostname.toLowerCase();const q=u.search.toLowerCase();return /taobao|tmall|sephora|shopee|lazada|amazon|lookfantastic|yesstyle|stylevana/.test(host)||/(^|[?&])(aff|affiliate|ref|tag|utm_source)=/.test(q)}catch{return false}}
const PRODUCT_BACK_RE=/\u8fd4\u56de\u4ea7\u54c1\u5e93|Back to products/i;

export default function AnalyticsBootstrap():React.ReactElement|null{
 useEffect(()=>{
  let lastProductKey="";
  trackEventLater("session_start",{pageName:location.pathname,language:currentLanguage(),metadata:{timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||null}});
  const detectProductDetail=()=>{const buttons=Array.from(document.querySelectorAll("button"));const isDetail=buttons.some(b=>PRODUCT_BACK_RE.test((b.textContent||"").trim()));if(!isDetail){lastProductKey="";return}const h1=document.querySelector("h1");const productName=(h1?.textContent||"").trim();if(!productName)return;const key=`${currentLanguage()}:${productName}`;if(key===lastProductKey)return;lastProductKey=key;trackEventLater("product_detail_view",{pageName:"product_detail",language:currentLanguage(),metadata:{productName:productName.slice(0,180)}})};
  const onLanguage=(e:Event)=>{const detail=(e as CustomEvent<{language?:AppLanguage}>).detail;trackEventLater("language_changed",{pageName:location.pathname,language:detail?.language||currentLanguage()});queueMicrotask(detectProductDetail)};
  const onClick=(e:MouseEvent)=>{const target=e.target instanceof Element?e.target.closest("a[href]"):null;if(!(target instanceof HTMLAnchorElement))return;const href=target.href;if(!href||!isAffiliateHref(href))return;let host="";try{host=new URL(href).hostname}catch{}trackEventLater("affiliate_click",{pageName:location.pathname,language:currentLanguage(),metadata:{host,href:href.slice(0,500)}})};
  let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;detectProductDetail()})});observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  detectProductDetail();
  window.addEventListener("skincare101:language",onLanguage as EventListener);
  document.addEventListener("click",onClick,true);
  return()=>{observer.disconnect();window.removeEventListener("skincare101:language",onLanguage as EventListener);document.removeEventListener("click",onClick,true)};
 },[]);
 return null;
}
