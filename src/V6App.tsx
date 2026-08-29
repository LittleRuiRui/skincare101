import React,{useEffect,useState}from"react";
import AppShell from"./AppShell";
import"./floating-actions.css";
import LanguageConsistencyGuard from"./components/LanguageConsistencyGuard";
import AdminDashboard from"./components/AdminDashboard";
import AdminAnalyticsPanel from"./components/AdminAnalyticsPanel";
import AnalyticsBootstrap from"./components/AnalyticsBootstrap";
import PasswordRecoveryPanel from"./components/PasswordRecoveryPanel";
import ProductCollectionActions from"./components/ProductCollectionActions";
import FloatingContextActions from"./components/FloatingContextActions";
import PregnancySafetyLayer from"./components/PregnancySafetyLayer";
import{supabase}from"./lib/supabase";
import{LanguageProvider}from"./lib/i18n";
import{AppRuntimeProvider}from"./lib/appRuntime";

const ENTRY_STYLE=`.peaced-brand::after{content:".  by Rae";font-family:"IBM Plex Sans","PingFang SC","Microsoft YaHei",system-ui,sans-serif;font-size:.34em;font-weight:500;letter-spacing:.02em;color:#6F6A5F;vertical-align:.18em;margin-left:.08em}.play-entry,.admin-analytics-entry{position:fixed;z-index:180;border:1px solid #D9D0BC;border-radius:999px;background:rgba(251,246,234,.96);color:#2F5A40;padding:8px 12px;font:600 11px/1.2 "IBM Plex Sans",system-ui,sans-serif;box-shadow:0 6px 18px rgba(39,53,41,.1);text-decoration:none;cursor:pointer}.play-entry{left:14px;bottom:calc(env(safe-area-inset-bottom,0px) + 82px)}.admin-analytics-entry{left:14px;top:calc(env(safe-area-inset-top,0px) + 14px)}`;

export default function V6App(){
 const readAdmin=()=>new URLSearchParams(window.location.search).get("admin");
 const[adminMode,setAdminMode]=useState<string|null>(()=>readAdmin());
 const[recovering,setRecovering]=useState(false);
 const[isAdmin,setIsAdmin]=useState(false);
 useEffect(()=>{let active=true;const refreshAdmin=async()=>{const{data:{user}}=await supabase.auth.getUser();if(!active)return;if(!user){setIsAdmin(false);return}const{data,error}=await supabase.rpc("is_admin");if(active)setIsAdmin(!error&&data===true)};void refreshAdmin();const onPop=()=>setAdminMode(readAdmin());window.addEventListener("popstate",onPop);const{data}=supabase.auth.onAuthStateChange((event)=>{if(event==="PASSWORD_RECOVERY")setRecovering(true);void refreshAdmin()});return()=>{active=false;window.removeEventListener("popstate",onPop);data.subscription.unsubscribe()}},[]);
 function setAdmin(mode:string|null){const url=new URL(window.location.href);if(mode)url.searchParams.set("admin",mode);else url.searchParams.delete("admin");window.history.pushState({},"",url);setAdminMode(mode)}
 function closeAdmin(){setAdmin(null)}
 function finishRecovery(){setRecovering(false);const url=new URL(window.location.href);url.hash="";window.history.replaceState({},"",url)}
 const common=<><style>{ENTRY_STYLE}</style><LanguageConsistencyGuard/><AnalyticsBootstrap/></>;
 if(recovering)return <><PasswordRecoveryPanel onDone={finishRecovery}/>{common}</>;
 if(adminMode==="analytics")return <><AdminAnalyticsPanel onBack={()=>setAdmin("1")}/>{common}</>;
 if(adminMode==="1")return <><AdminDashboard onBack={closeAdmin}/>{common}</>;
 return <LanguageProvider><AppRuntimeProvider><AppShell/><a className="play-entry" href="/play/">Play</a>{isAdmin?<button className="admin-analytics-entry" onClick={()=>setAdmin("analytics")}>Analytics</button>:null}<FloatingContextActions/><ProductCollectionActions/><PregnancySafetyLayer/>{common}</AppRuntimeProvider></LanguageProvider>;
}
