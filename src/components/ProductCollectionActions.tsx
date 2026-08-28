import React,{useEffect,useMemo,useState}from"react";
import{Bookmark,Heart,ThumbsDown}from"lucide-react";
import{useLanguage}from"../lib/i18n";
import{useAppRuntime}from"../lib/appRuntime";
import{readProductPreferences,updateProductPreference,type ProductPreferenceMap}from"../lib/productLibrary";

export default function ProductCollectionActions(){
 const{t}=useLanguage();
 const{viewContext,currentProduct:current}=useAppRuntime();
 const[prefs,setPrefs]=useState<ProductPreferenceMap>(()=>readProductPreferences());
 useEffect(()=>{const sync=()=>setPrefs(readProductPreferences());window.addEventListener("storage",sync);window.addEventListener("skincare101:product-preferences-changed",sync);return()=>{window.removeEventListener("storage",sync);window.removeEventListener("skincare101:product-preferences-changed",sync)}},[]);
 const pref=useMemo(()=>current?prefs[current.id]||{liked:false,watchlist:false,tried:null}:{liked:false,watchlist:false,tried:null},[current,prefs]);
 if(viewContext!=="product"||!current)return null;
 function update(patch:Partial<typeof pref>){updateProductPreference(current.id,patch);setPrefs(readProductPreferences())}
 const btn=(active:boolean)=>({border:`1px solid ${active?"#2F5A40":"#D7CDB8"}`,borderRadius:999,padding:"9px 12px",background:active?"#EAF2E9":"rgba(255,255,255,.96)",color:active?"#244B35":"#6F6A5F",fontSize:12,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,whiteSpace:"nowrap" as const});
 return <div style={{position:"fixed",right:14,bottom:"calc(env(safe-area-inset-bottom, 0px) + 68px)",zIndex:125,display:"flex",gap:7,flexWrap:"wrap",justifyContent:"flex-end",maxWidth:"min(92vw,520px)"}}>
  <button onClick={()=>update({liked:!pref.liked})} style={btn(pref.liked)} aria-pressed={pref.liked}><Heart size={15} fill={pref.liked?"currentColor":"none"}/>{pref.liked?t("已喜欢","Liked"):t("喜欢","Like")}</button>
  <button onClick={()=>update({watchlist:!pref.watchlist})} style={btn(pref.watchlist)} aria-pressed={pref.watchlist}><Bookmark size={15} fill={pref.watchlist?"currentColor":"none"}/>{pref.watchlist?t("观察中","Watching"):t("观察单","Watchlist")}</button>
  <button onClick={()=>update({tried:pref.tried==="liked"?null:"liked"})} style={btn(pref.tried==="liked")} aria-pressed={pref.tried==="liked"}><Heart size={15} fill={pref.tried==="liked"?"currentColor":"none"}/>{pref.tried==="liked"?t("用过 · 喜欢","Tried · liked"):t("用过喜欢","Liked after trying")}</button>
  <button onClick={()=>update({tried:pref.tried==="disliked"?null:"disliked"})} style={btn(pref.tried==="disliked")} aria-pressed={pref.tried==="disliked"}><ThumbsDown size={15}/>{pref.tried==="disliked"?t("用过 · 不喜欢","Tried · disliked"):t("用过不喜欢","Disliked after trying")}</button>
 </div>;
}
