import React,{useEffect}from"react";
import{trackEventLater}from"../lib/analytics";
import type{AppLanguage}from"../lib/i18n";

function currentLanguage():AppLanguage{return document.documentElement.lang.toLowerCase().startsWith("en")?"en":"zh"}
function isAffiliateHref(href:string){try{const u=new URL(href,window.location.href);const host=u.hostname.toLowerCase();const q=u.search.toLowerCase();return /taobao|tmall|sephora|shopee|lazada|amazon|lookfantastic|yesstyle|stylevana/.test(host)||/(^|[?&])(aff|affiliate|ref|tag|utm_source)=/.test(q)}catch{return false}}
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

type NavigationDetail={view?:string;productId?:string|null;productName?:string|null};
function routeFromUrl(){return new URLSearchParams(window.location.search).get("view")||"home"}

export default function AnalyticsBootstrap():React.ReactElement|null{
 useEffect(()=>{
  let lastRoute=routeFromUrl();
  let lastProductKey="";
  const trackRoute=(route:string,productId?:string|null,productName?:string|null)=>{
   if(route!==lastRoute){lastRoute=route;trackEventLater("journey_page_view",{pageName:route,language:currentLanguage(),metadata:{route}})}
   if(route!=="product"){lastProductKey="";return}
   const key=productId||productName||"";if(!key||key===lastProductKey)return;lastProductKey=key;
   trackEventLater("product_detail_view",{pageName:"product_detail",language:currentLanguage(),metadata:{productId:productId||null,productName:productName?.slice(0,180)||null}});
  };
  trackEventLater("session_start",{pageName:location.pathname,language:currentLanguage(),metadata:{timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||null}});
  trackEventLater("journey_page_view",{pageName:lastRoute,language:currentLanguage(),metadata:{route:lastRoute}});
  const initialProduct=new URLSearchParams(window.location.search).get("product");if(lastRoute==="product"&&initialProduct)trackRoute("product",initialProduct,null);
  const onNavigation=(e:Event)=>{const detail=(e as CustomEvent<NavigationDetail>).detail||{};trackRoute(detail.view||routeFromUrl(),detail.productId,detail.productName)};
  const onPop=()=>trackRoute(routeFromUrl(),new URLSearchParams(window.location.search).get("product"),null);
  const onLanguage=(e:Event)=>{const detail=(e as CustomEvent<{language?:AppLanguage}>).detail;trackEventLater("language_changed",{pageName:lastRoute,language:detail?.language||currentLanguage()})};
  const onClick=(e:MouseEvent)=>{
   const element=e.target instanceof Element?e.target.closest("button,a"):null;
   const text=(element?.textContent||"").replace(/\s+/g," ").trim();
   if(text){const action=JOURNEY_ACTIONS.find(([pattern])=>pattern.test(text));if(action)trackEventLater("journey_action",{pageName:lastRoute,language:currentLanguage(),metadata:{action:action[1],label:text.slice(0,120)}})}
   const target=e.target instanceof Element?e.target.closest("a[href]"):null;if(!(target instanceof HTMLAnchorElement))return;const href=target.href;if(!href||!isAffiliateHref(href))return;let host="";try{host=new URL(href).hostname}catch{}trackEventLater("affiliate_click",{pageName:lastRoute,language:currentLanguage(),metadata:{host,href:href.slice(0,500)}})
  };
  window.addEventListener("skincare101:navigation",onNavigation as EventListener);window.addEventListener("popstate",onPop);window.addEventListener("skincare101:language",onLanguage as EventListener);document.addEventListener("click",onClick,true);
  return()=>{window.removeEventListener("skincare101:navigation",onNavigation as EventListener);window.removeEventListener("popstate",onPop);window.removeEventListener("skincare101:language",onLanguage as EventListener);document.removeEventListener("click",onClick,true)};
 },[]);
 return null;
}
