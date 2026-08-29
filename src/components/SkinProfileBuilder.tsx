import React,{useEffect,useRef}from"react";
import{ArrowLeft}from"lucide-react";
import{useLanguage}from"../lib/i18n";
import LegacyQuestionnaire from"../App";
import LegacyQuestionnaireI18nBridge from"./LegacyQuestionnaireI18nBridge";
import LegacyReferralUxBridge from"./LegacyReferralUxBridge";
import LegacyResultsI18nBridge from"./LegacyResultsI18nBridge";

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
 return <div data-skin-test-root="true" style={{minHeight:"100vh",background:"#FAF9F6",position:"relative"}}>
  <LegacyQuestionnaireI18nBridge/>
  <LegacyReferralUxBridge/>
  <LegacyResultsI18nBridge/>
  <button onClick={onBack} aria-label={t("返回护肤主页","Back to skincare home")} style={{position:"fixed",left:14,top:"calc(env(safe-area-inset-top, 0px) + 14px)",zIndex:180,border:"1px solid #D7CDB8",borderRadius:999,padding:"8px 11px",background:"rgba(251,246,234,.94)",color:"#2F5A40",fontSize:11.5,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5,cursor:"pointer",boxShadow:"0 6px 18px rgba(40,55,42,.08)",backdropFilter:"blur(10px)"}}><ArrowLeft size={13}/>{t("返回","Back")}</button>
  <LegacyQuestionnaire initialScreen="skin"/>
 </div>;
}
