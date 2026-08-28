import React,{useEffect,useState}from "react";
import V5App from "./V5App";
import LanguageConsistencyGuard from "./components/LanguageConsistencyGuard";
import AdminDashboard from "./components/AdminDashboard";
import PasswordRecoveryPanel from "./components/PasswordRecoveryPanel";
import{supabase}from"./lib/supabase";

export default function V6App(){
 const[adminOpen,setAdminOpen]=useState(()=>new URLSearchParams(window.location.search).get("admin")==="1");
 const[recovering,setRecovering]=useState(false);
 useEffect(()=>{const onPop=()=>setAdminOpen(new URLSearchParams(window.location.search).get("admin")==="1");window.addEventListener("popstate",onPop);const{data}=supabase.auth.onAuthStateChange((event)=>{if(event==="PASSWORD_RECOVERY")setRecovering(true)});return()=>{window.removeEventListener("popstate",onPop);data.subscription.unsubscribe()}},[]);
 function closeAdmin(){const url=new URL(window.location.href);url.searchParams.delete("admin");window.history.pushState({},"",url);setAdminOpen(false)}
 function finishRecovery(){setRecovering(false);const url=new URL(window.location.href);url.hash="";window.history.replaceState({},"",url)}
 if(recovering)return <><PasswordRecoveryPanel onDone={finishRecovery}/><LanguageConsistencyGuard/></>;
 if(adminOpen)return <><AdminDashboard onBack={closeAdmin}/><LanguageConsistencyGuard/></>;
 return <><V5App/><LanguageConsistencyGuard/></>;
}
