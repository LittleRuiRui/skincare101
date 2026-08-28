import React,{useEffect,useState}from "react";
import V5App from "./V5App";
import LanguageConsistencyGuard from "./components/LanguageConsistencyGuard";
import AdminDashboard from "./components/AdminDashboard";
import AdminAnalyticsPanel from "./components/AdminAnalyticsPanel";
import AnalyticsBootstrap from "./components/AnalyticsBootstrap";
import PasswordRecoveryPanel from "./components/PasswordRecoveryPanel";
import ProductCollectionActions from "./components/ProductCollectionActions";
import{supabase}from"./lib/supabase";
import{LanguageProvider}from"./lib/i18n";
import{AppRuntimeProvider}from"./lib/appRuntime";

export default function V6App(){
 const readAdmin=()=>new URLSearchParams(window.location.search).get("admin");
 const[adminMode,setAdminMode]=useState<string|null>(()=>readAdmin());
 const[recovering,setRecovering]=useState(false);
 useEffect(()=>{const onPop=()=>setAdminMode(readAdmin());window.addEventListener("popstate",onPop);const{data}=supabase.auth.onAuthStateChange((event)=>{if(event==="PASSWORD_RECOVERY")setRecovering(true)});return()=>{window.removeEventListener("popstate",onPop);data.subscription.unsubscribe()}},[]);
 function setAdmin(mode:string|null){const url=new URL(window.location.href);if(mode)url.searchParams.set("admin",mode);else url.searchParams.delete("admin");window.history.pushState({},"",url);setAdminMode(mode)}
 function closeAdmin(){setAdmin(null)}
 function finishRecovery(){setRecovering(false);const url=new URL(window.location.href);url.hash="";window.history.replaceState({},"",url)}
 const common=<><LanguageConsistencyGuard/><AnalyticsBootstrap/></>;
 if(recovering)return <><PasswordRecoveryPanel onDone={finishRecovery}/>{common}</>;
 if(adminMode==="analytics")return <><AdminAnalyticsPanel onBack={()=>setAdmin("1")}/>{common}</>;
 if(adminMode==="1")return <><AdminDashboard onBack={closeAdmin}/>{common}</>;
 return <AppRuntimeProvider><V5App/><LanguageProvider><ProductCollectionActions/></LanguageProvider>{common}</AppRuntimeProvider>;
}
