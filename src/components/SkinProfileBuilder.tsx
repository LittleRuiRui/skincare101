import React,{useEffect,useRef}from"react";
import{ArrowLeft}from"lucide-react";
import{useLanguage}from"../lib/i18n";
import LegacyQuestionnaire from"../App";

export default function SkinProfileBuilder({onBack,onSaved}:{onBack:()=>void;onSaved:()=>void;onNeedSignIn:()=>void}):React.ReactElement{
 const{t}=useLanguage();
 const finishedRef=useRef(false);
 useEffect(()=>{
  const handleProfileCreated=()=>{
   if(finishedRef.current)return;
   finishedRef.current=true;
   window.setTimeout(()=>onSaved(),0);
  };
  window.addEventListener("skincare101:profiles-changed",handleProfileCreated);
  return()=>window.removeEventListener("skincare101:profiles-changed",handleProfileCreated);
 },[onSaved]);
 function handleQuestionnaireClick(event:React.MouseEvent<HTMLDivElement>){
  const button=(event.target as Element|null)?.closest("button") as HTMLButtonElement|null;
  const label=(button?.textContent||"").trim();
  if(!button||!(label==="继续后续测试"||label==="Continue skin test"))return;
  event.preventDefault();event.stopPropagation();
  const panel=button.closest('div[style*="padding-top"]')||button.parentElement;
  const back=panel?[...panel.querySelectorAll("button")].find(el=>["上一步","Back"].includes((el.textContent||"").trim())) as HTMLButtonElement|undefined:undefined;
  back?.click();
  window.setTimeout(()=>{
   const root=document.querySelector('[data-skin-test-root="true"]');
   const none=root?[...root.querySelectorAll("button")].find(el=>["都没有以上情况","None of these"].includes((el.textContent||"").trim())) as HTMLButtonElement|undefined:undefined;
   none?.click();
  },80);
 }
 return <div data-skin-test-root="true" onClickCapture={handleQuestionnaireClick} style={{minHeight:"100vh",background:"#FAF9F6",position:"relative"}}>
  <button onClick={onBack} aria-label={t("返回护肤主页","Back to skincare home")} style={{position:"fixed",left:14,top:"calc(env(safe-area-inset-top, 0px) + 14px)",zIndex:180,border:"1px solid #D7CDB8",borderRadius:999,padding:"8px 11px",background:"rgba(251,246,234,.94)",color:"#2F5A40",fontSize:11.5,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5,cursor:"pointer",boxShadow:"0 6px 18px rgba(40,55,42,.08)",backdropFilter:"blur(10px)"}}><ArrowLeft size={13}/>{t("返回","Back")}</button>
  <LegacyQuestionnaire initialScreen="skin"/>
 </div>;
}
