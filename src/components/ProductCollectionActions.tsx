import React,{useEffect,useMemo,useState}from"react";
import{Bookmark,Heart,ThumbsDown}from"lucide-react";
import{loadSharedProductCatalog,type SharedProductRecord}from"../lib/supabase";
import{useLanguage}from"../lib/i18n";

type TriedState="liked"|"disliked"|null;
type Preference={watchlist:boolean;tried:TriedState};
type PreferenceMap=Record<string,Preference>;
const STORAGE_KEY="skincare101-product-preferences-v1";

function readPrefs():PreferenceMap{
 try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}") as PreferenceMap}catch{return{}}
}
function writePrefs(prefs:PreferenceMap){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(prefs));window.dispatchEvent(new Event("skincare101:product-preferences-changed"))}catch{}
}
function norm(v:string){return v.toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g,"").trim()}

export default function ProductCollectionActions(){
 const{t}=useLanguage();
 const[products,setProducts]=useState<SharedProductRecord[]>([]);
 const[current,setCurrent]=useState<SharedProductRecord|null>(null);
 const[prefs,setPrefs]=useState<PreferenceMap>(()=>readPrefs());

 useEffect(()=>{let active=true;loadSharedProductCatalog().then(rows=>{if(active)setProducts(rows)}).catch(()=>{});return()=>{active=false}},[]);
 useEffect(()=>{const sync=()=>setPrefs(readPrefs());window.addEventListener("storage",sync);window.addEventListener("skincare101:product-preferences-changed",sync);return()=>{window.removeEventListener("storage",sync);window.removeEventListener("skincare101:product-preferences-changed",sync)}},[]);
 useEffect(()=>{const scan=()=>{const page=document.querySelector<HTMLElement>(".site-content");if(!page||!page.className.includes("page-product")){setCurrent(null);return}const h1=page.querySelector("h1")?.textContent||"";const eyebrow=page.querySelector("h1")?.previousElementSibling?.textContent||"";const h=norm(h1),e=norm(eyebrow);const match=products.find(p=>norm(p.productLocalName||p.name)===h||norm(p.productEnglishName||p.name)===h)||products.find(p=>h&&norm(`${p.brand}${p.name}${p.productLocalName||""}${p.productEnglishName||""}`).includes(h)&&(!e||e.includes(norm(p.brand))));setCurrent(match||null)};scan();const obs=new MutationObserver(scan);obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});return()=>obs.disconnect()},[products]);

 const pref=useMemo<Preference>(()=>current?prefs[current.id]||{watchlist:false,tried:null}:{watchlist:false,tried:null},[current,prefs]);
 if(!current)return null;
 function update(next:Preference){if(!current)return;const map={...prefs,[current.id]:next};setPrefs(map);writePrefs(map)}
 const btn=(active:boolean)=>({border:`1px solid ${active?"#2F5A40":"#D7CDB8"}`,borderRadius:999,padding:"9px 12px",background:active?"#EAF2E9":"rgba(255,255,255,.96)",color:active?"#244B35":"#6F6A5F",fontSize:12,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,whiteSpace:"nowrap" as const});
 return <div style={{position:"fixed",right:14,bottom:"calc(env(safe-area-inset-bottom, 0px) + 68px)",zIndex:125,display:"flex",gap:7,flexWrap:"wrap",justifyContent:"flex-end",maxWidth:"min(92vw,520px)"}}>
  <button onClick={()=>update({...pref,watchlist:!pref.watchlist})} style={btn(pref.watchlist)} aria-pressed={pref.watchlist}><Bookmark size={15} fill={pref.watchlist?"currentColor":"none"}/>{pref.watchlist?t("已收藏","Saved"):t("观察单","Watchlist")}</button>
  <button onClick={()=>update({...pref,tried:pref.tried==="liked"?null:"liked"})} style={btn(pref.tried==="liked")} aria-pressed={pref.tried==="liked"}><Heart size={15} fill={pref.tried==="liked"?"currentColor":"none"}/>{pref.tried==="liked"?t("喜欢","Liked"):t("用过喜欢","Liked after trying")}</button>
  <button onClick={()=>update({...pref,tried:pref.tried==="disliked"?null:"disliked"})} style={btn(pref.tried==="disliked")} aria-pressed={pref.tried==="disliked"}><ThumbsDown size={15}/>{pref.tried==="disliked"?t("不喜欢","Disliked"):t("用过不喜欢","Disliked after trying")}</button>
 </div>
}
