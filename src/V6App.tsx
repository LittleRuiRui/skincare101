import React,{useEffect,useState}from "react";
import V5App from "./V5App";
import LanguageConsistencyGuard from "./components/LanguageConsistencyGuard";
import AdminDashboard from "./components/AdminDashboard";

export default function V6App(){
 const[adminOpen,setAdminOpen]=useState(()=>new URLSearchParams(window.location.search).get("admin")==="1");
 useEffect(()=>{const onPop=()=>setAdminOpen(new URLSearchParams(window.location.search).get("admin")==="1");window.addEventListener("popstate",onPop);return()=>window.removeEventListener("popstate",onPop)},[]);
 function closeAdmin(){const url=new URL(window.location.href);url.searchParams.delete("admin");window.history.pushState({},"",url);setAdminOpen(false)}
 if(adminOpen)return <><AdminDashboard onBack={closeAdmin}/><LanguageConsistencyGuard/></>;
 return <><V5App/><LanguageConsistencyGuard/></>;
}
