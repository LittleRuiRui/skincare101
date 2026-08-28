import React from "react";
import{ArrowLeft}from"lucide-react";
import{useLanguage}from"../lib/i18n";

const LegacyQuestionnaire=React.lazy(()=>import("../App"));

export default function SkinProfileBuilder({onBack}:{onBack:()=>void;onSaved:()=>void;onNeedSignIn:()=>void}){
 const{t}=useLanguage();
 return <div style={{minHeight:"100vh",background:"#FAF9F6",position:"relative"}}>
  <button onClick={onBack} aria-label={t("返回护肤主页","Back to skincare home")} style={{position:"fixed",left:14,top:"calc(env(safe-area-inset-top, 0px) + 14px)",zIndex:180,border:"1px solid #D7CDB8",borderRadius:999,padding:"8px 11px",background:"rgba(251,246,234,.94)",color:"#2F5A40",fontSize:11.5,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5,cursor:"pointer",boxShadow:"0 6px 18px rgba(40,55,42,.08)",backdropFilter:"blur(10px)"}}><ArrowLeft size={13}/>{t("返回","Back")}</button>
  <React.Suspense fallback={<div style={{minHeight:"100vh",display:"grid",placeItems:"center",color:"#777065",fontSize:13}}>{t("正在打开完整肤质问卷…","Loading the full skin questionnaire…")}</div>}>
   <LegacyQuestionnaire initialScreen="skin"/>
  </React.Suspense>
 </div>;
}
