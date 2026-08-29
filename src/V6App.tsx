import React,{useEffect,useState}from"react";
import AppShell from"./AppShell";
import"./floating-actions.css";
import LanguageConsistencyGuard from"./components/LanguageConsistencyGuard";
import EnglishDynamicContentGuard from"./components/EnglishDynamicContentGuard";
import AnalyticsBootstrap from"./components/AnalyticsBootstrap";
import ProductCollectionActions from"./components/ProductCollectionActions";
import FloatingContextActions from"./components/FloatingContextActions";
import PregnancySafetyLayer from"./components/PregnancySafetyLayer";
import{supabase}from"./lib/supabase";
import{LanguageProvider,useLanguage}from"./lib/i18n";
import{AppRuntimeProvider}from"./lib/appRuntime";

const AdminDashboard=React.lazy(()=>import("./components/AdminDashboard"));
const AdminAnalyticsPanel=React.lazy(()=>import("./components/AdminAnalyticsPanel"));
const PasswordRecoveryPanel=React.lazy(()=>import("./components/PasswordRecoveryPanel"));

function UtilityEntries({isAdmin,onAnalytics}:{isAdmin:boolean;onAnalytics:()=>void}){
 const{t}=useLanguage();
 const btn:React.CSSProperties={border:"1px solid #D9D0BC",borderRadius:999,padding:"8px 11px",background:"rgba(251,246,234,.96)",color:"#2F5A40",fontSize:11,fontWeight:700,boxShadow:"0 5px 16px rgba(39,53,41,.10)",cursor:"pointer",backdropFilter:"blur(10px)",whiteSpace:"nowrap"};
 return <div style={{position:"fixed",right:14,top:"calc(env(safe-area-inset-top, 0px) + 58px)",zIndex:115,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:7}}>
  <button onClick={()=>{window.location.href="/play/niuma/"}} style={btn}>{t("玩一下 · 牛马测试","Play · Niuma Test")}</button>
  {isAdmin?<button onClick={onAnalytics} style={btn}>Analytics</button>:null}
 </div>
}

function LazyFallback():React.ReactElement{
 const{t}=useLanguage();
 return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",color:"#777065",fontSize:12}}>{t("正在加载…","Loading…")}</div>;
}

export default function V6App(){
 const readAdmin=()=>new URLSearchParams(window.location.search).get("admin");
 const[adminMode,setAdminMode]=useState<string|null>(()=>readAdmin());
 const[recovering,setRecovering]=useState(false);
 const[isAdmin,setIsAdmin]=useState(false);
 useEffect(()=>{
  let alive=true;
  const checkAdmin=async()=>{try{const{data:session}=await supabase.auth.getSession();if(!session.session){if(alive)setIsAdmin(false);return}const{data,error}=await supabase.rpc("is_admin");if(!error&&alive)setIsAdmin(Boolean(data))}catch{if(alive)setIsAdmin(false)}};
  void checkAdmin();
  const onPop=()=>setAdminMode(readAdmin());window.addEventListener("popstate",onPop);
  const{data}=supabase.auth.onAuthStateChange((event)=>{if(event==="PASSWORD_RECOVERY")setRecovering(true);void checkAdmin()});
  return()=>{alive=false;window.removeEventListener("popstate",onPop);data.subscription.unsubscribe()}
 },[]);
 function setAdmin(mode:string|null){const url=new URL(window.location.href);if(mode)url.searchParams.set("admin",mode);else url.searchParams.delete("admin");window.history.pushState({},"",url);setAdminMode(mode)}
 function closeAdmin(){setAdmin(null)}
 function finishRecovery(){setRecovering(false);const url=new URL(window.location.href);url.hash="";window.history.replaceState({},"",url)}
 const common=<><LanguageConsistencyGuard/><EnglishDynamicContentGuard/><AnalyticsBootstrap/></>;
 if(recovering)return <LanguageProvider><React.Suspense fallback={<LazyFallback/>}><PasswordRecoveryPanel onDone={finishRecovery}/></React.Suspense>{common}</LanguageProvider>;
 if(adminMode==="analytics")return <LanguageProvider><React.Suspense fallback={<LazyFallback/>}><AdminAnalyticsPanel onBack={()=>setAdmin("1")}/></React.Suspense>{common}</LanguageProvider>;
 if(adminMode==="1")return <LanguageProvider><React.Suspense fallback={<LazyFallback/>}><AdminDashboard onBack={closeAdmin}/></React.Suspense>{common}</LanguageProvider>;
 return <LanguageProvider><AppRuntimeProvider><AppShell/><FloatingContextActions/><ProductCollectionActions/><PregnancySafetyLayer/><UtilityEntries isAdmin={isAdmin} onAnalytics={()=>setAdmin("analytics")}/>{common}</AppRuntimeProvider></LanguageProvider>;
}
