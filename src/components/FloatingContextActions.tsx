import React,{useEffect,useMemo,useState}from"react";
import MyShelf from"./MyShelf";
import{doINeedThis}from"../lib/myShelf";
import{useAppRuntime}from"../lib/appRuntime";
import{useLanguage}from"../lib/i18n";

const REPORT_TYPES=[
 ["ingredient-missing","成分缺失","Missing ingredient"],
 ["ingredient-order","成分顺序错误","Wrong order"],
 ["ingredient-name","成分名称错误","Wrong ingredient name"],
 ["formula-updated","配方已更新","Formula changed"],
 ["wrong-version","版本/地区不对","Wrong version / market"],
 ["source","来源有问题","Source issue"],
 ["other","其他","Other"]
]as const;
const bi=(zh:string,en:string)=>`${zh} · ${en}`;

export default function FloatingContextActions(){
 const{t}=useLanguage();
 const{products,profile,shelfEntries,viewContext,currentProduct}=useAppRuntime();
 const[shelfOpen,setShelfOpen]=useState(false),[needOpen,setNeedOpen]=useState(false),[reportOpen,setReportOpen]=useState(false);
 const[reportType,setReportType]=useState<(typeof REPORT_TYPES)[number][0]>("ingredient-missing"),[reportNote,setReportNote]=useState("");
 useEffect(()=>{const open=()=>setShelfOpen(true);window.addEventListener("skincare101:open-shelf",open as EventListener);return()=>window.removeEventListener("skincare101:open-shelf",open as EventListener)},[]);
 const owned=useMemo(()=>{const ids=new Set(shelfEntries.map(e=>e.productId));return products.filter(p=>ids.has(p.id))},[products,shelfEntries]);
 const verdict=currentProduct?doINeedThis(currentProduct,owned,profile,products,shelfEntries):null;
 if(shelfOpen)return <div role="dialog" aria-modal="true" style={{position:"fixed",inset:0,zIndex:210,overflowY:"auto",background:"#F6F0E3"}}><MyShelf products={products} profile={profile} onBack={()=>setShelfOpen(false)}/></div>;
 const isPrimary=viewContext==="home"||viewContext==="mySkin"||viewContext==="explore"||viewContext==="routine"||viewContext==="account";
 const showProductNeed=viewContext==="product"&&currentProduct;
 const reportLabel=bi("发现数据有误？","Report an error");
 function openNeed(){if(currentProduct)setNeedOpen(true)}
 function submitReport(){
  if(!currentProduct)return;
  const row=REPORT_TYPES.find(x=>x[0]===reportType);const typeLabel=row?bi(row[1],row[2]):reportType;
  const title=`[Data correction] ${currentProduct.brand} - ${currentProduct.productLocalName||currentProduct.productEnglishName||currentProduct.name}`;
  const body=["## Product data correction","",`- **Brand:** ${currentProduct.brand}`,`- **Product:** ${currentProduct.productLocalName||currentProduct.name}${currentProduct.productEnglishName&&currentProduct.productEnglishName!==(currentProduct.productLocalName||currentProduct.name)?` / ${currentProduct.productEnglishName}`:""}`,`- **Product ID:** ${currentProduct.id}`,`- **Issue type:** ${typeLabel}`,`- **Current data type:** ${currentProduct.ingredientListType}`,`- **Current source:** ${currentProduct.sourceUrl||"Not listed"}`,`- **Page:** ${window.location.href}`,"","## What looks wrong?",reportNote.trim()||"Please describe the correction here.","","## Suggested source / correct INCI","Please paste a source link, package text, or corrected ingredient list if available.","","---","Submitted from the Skincare101 product feedback form."].join("\n");
  const url=`https://github.com/LittleRuiRui/skincare101/issues/new?${new URLSearchParams({title,body,labels:"data-correction"}).toString()}`;
  window.open(url,"_blank","noopener,noreferrer");setReportOpen(false);setReportNote("");setReportType("ingredient-missing");
 }
 const shelfPill:React.CSSProperties={position:"fixed",left:20,bottom:"calc(env(safe-area-inset-bottom, 0px) + 82px)",zIndex:121,width:"min(42vw,240px)",border:"1px solid #D7CDB8",borderRadius:999,padding:"10px 14px",background:"rgba(255,255,255,.97)",color:"#2F5A40",fontSize:12,fontWeight:800,boxShadow:"0 10px 28px rgba(40,55,42,.12)",cursor:"pointer",backdropFilter:"blur(10px)",minHeight:48};
 return <>
  {isPrimary&&<button onClick={()=>setShelfOpen(true)} style={shelfPill}>{t("我的护肤柜","My Shelf")}</button>}
  {showProductNeed&&<button onClick={openNeed} aria-label={bi("我需要买吗？","Do I need this?")} style={{position:"fixed",left:14,bottom:"calc(env(safe-area-inset-bottom, 0px) + 16px)",zIndex:120,border:"1px solid #E3C978",borderRadius:999,padding:"10px 13px",background:"rgba(255,249,231,.98)",color:"#9B741A",fontSize:12,fontWeight:800,boxShadow:"0 8px 24px rgba(40,55,42,.12)",cursor:"pointer"}}>{bi("我需要买吗？","Do I need this?")}</button>}
  {viewContext==="product"&&currentProduct&&<button onClick={()=>setReportOpen(true)} aria-label={reportLabel} style={{position:"fixed",right:14,bottom:"calc(env(safe-area-inset-bottom, 0px) + 16px)",zIndex:120,border:"1px solid #D7CDB8",borderRadius:999,padding:"10px 13px",background:"rgba(255,255,255,.96)",color:"#6F6A5F",fontSize:12,fontWeight:700,boxShadow:"0 8px 24px rgba(40,55,42,.10)",cursor:"pointer"}}>{reportLabel}</button>}
  {needOpen&&currentProduct&&verdict&&<div onClick={()=>setNeedOpen(false)} style={{position:"fixed",inset:0,zIndex:160,background:"rgba(27,34,28,.32)",display:"grid",placeItems:"end center",padding:"20px 14px"}}><div onClick={e=>e.stopPropagation()} style={{width:"min(560px,100%)",boxSizing:"border-box",border:"1px solid #D7CDB8",borderRadius:22,padding:18,background:"#FBF6EA",boxShadow:"0 20px 50px rgba(30,40,31,.2)"}}><div style={{fontSize:10.5,fontWeight:700,letterSpacing:".1em",color:"#2F5A40",marginBottom:8}}>DO I NEED THIS?</div><div style={{fontSize:13,color:"#6F6A5F",marginBottom:5}}>{currentProduct.brand} · {currentProduct.productLocalName||currentProduct.name}</div><div style={{fontSize:23,fontWeight:700,color:verdict.level==="not-recommended"?"#A96F68":"#283027",marginBottom:7}}>{verdict.labelZh} · {verdict.labelEn}</div><div style={{fontSize:13,lineHeight:1.65,color:"#6F6A5F"}}>{verdict.reasonZh}</div><div style={{marginTop:12,borderTop:"1px solid #D7CDB8",paddingTop:10}}>{verdict.evidenceZh.map((x,i)=><div key={i} style={{fontSize:11.5,lineHeight:1.55,color:"#6F6A5F",marginTop:4}}>· {x}</div>)}</div><button onClick={()=>setNeedOpen(false)} style={{width:"100%",marginTop:15,border:0,borderRadius:13,padding:"11px 12px",background:"#2F5A40",color:"white",fontWeight:700,cursor:"pointer"}}>{t("知道了","Got it")}</button></div></div>}
  {reportOpen&&currentProduct&&<div onClick={()=>setReportOpen(false)} style={{position:"fixed",inset:0,zIndex:180,background:"rgba(27,34,28,.34)",display:"grid",placeItems:"end center",padding:"20px 14px"}}><div onClick={e=>e.stopPropagation()} style={{width:"min(580px,100%)",boxSizing:"border-box",border:"1px solid #D7CDB8",borderRadius:22,padding:18,background:"#FBF6EA",boxShadow:"0 20px 50px rgba(30,40,31,.22)"}}><div style={{fontSize:10.5,fontWeight:800,letterSpacing:".1em",color:"#2F5A40",marginBottom:7}}>DATA CORRECTION</div><div style={{fontSize:22,fontWeight:700,color:"#283027",marginBottom:5}}>{t("发现成分表有问题？","Found a data problem?")}</div><div style={{fontSize:12.5,lineHeight:1.6,color:"#6F6A5F",marginBottom:14}}>{t("告诉我哪里不对。产品信息会自动带上，提交后会创建 GitHub 数据纠错记录。","Tell us what looks wrong. Product details are attached automatically and a GitHub correction record will be created.")}</div><label style={{display:"block",fontSize:11.5,fontWeight:700,color:"#4D594F",marginBottom:5}}>{t("问题类型","Issue type")}</label><select value={reportType} onChange={e=>setReportType(e.target.value as typeof reportType)} style={{width:"100%",boxSizing:"border-box",border:"1px solid #D7CDB8",borderRadius:12,padding:"10px 11px",background:"#fff",color:"#283027",fontSize:13,marginBottom:11}}>{REPORT_TYPES.map(([value,zh,en])=><option key={value} value={value}>{t(zh,en)}</option>)}</select><label style={{display:"block",fontSize:11.5,fontWeight:700,color:"#4D594F",marginBottom:5}}>{t("哪里不对？","What looks wrong?")}</label><textarea value={reportNote} onChange={e=>setReportNote(e.target.value)} rows={5} maxLength={1600} placeholder={t("例如：官网新版成分表已经没有酒精；或贴上正确 INCI / 官方来源链接……","For example: the current official formula no longer lists alcohol, or paste the correct INCI / source link…")} style={{width:"100%",boxSizing:"border-box",resize:"vertical",border:"1px solid #D7CDB8",borderRadius:12,padding:"10px 11px",background:"#fff",color:"#283027",fontSize:13,lineHeight:1.55}}/><div style={{display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:8,marginTop:13}}><button onClick={()=>setReportOpen(false)} style={{border:"1px solid #D7CDB8",borderRadius:13,padding:"10px 11px",background:"white",color:"#6F6A5F",fontWeight:700,cursor:"pointer"}}>{t("取消","Cancel")}</button><button onClick={submitReport} style={{border:0,borderRadius:13,padding:"10px 11px",background:"#2F5A40",color:"white",fontWeight:700,cursor:"pointer"}}>{t("提交纠错","Send report")}</button></div></div></div>}
 </>;
}
