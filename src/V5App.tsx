import React,{useEffect,useMemo,useState}from"react";
import V4App from"./V4App";
import MyShelf from"./components/MyShelf";
import{loadSharedProductCatalog,supabase,type SharedProductRecord}from"./lib/supabase";
import{doINeedThis,loadShelf,loadShelfSynced,type ShelfEntry}from"./lib/myShelf";
import{loadMySkinProfiles}from"./lib/mySkin";
import type{SkinProfileRecord}from"./lib/skinProfile";
import{LanguageProvider}from"./lib/i18n";

function norm(v:string){return v.toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g,"").trim()}

const REPORT_TYPES=[
 ["ingredient-missing","成分缺失 · Missing ingredient"],
 ["ingredient-order","成分顺序错误 · Wrong order"],
 ["ingredient-name","成分名称错误 · Wrong ingredient name"],
 ["formula-updated","配方已更新 · Formula changed"],
 ["wrong-version","版本/地区不对 · Wrong version / market"],
 ["source","来源有问题 · Source issue"],
 ["other","其他 · Other"]
] as const;

export default function V5App(){
 const[shelfOpen,setShelfOpen]=useState(false);
 const[products,setProducts]=useState<SharedProductRecord[]>([]);
 const[shelfEntries,setShelfEntries]=useState<ShelfEntry[]>(()=>loadShelf());
 const[profile,setProfile]=useState<SkinProfileRecord|null>(null);
 const[context,setContext]=useState<"home"|"routine"|"product"|"other">("home");
 const[currentProduct,setCurrentProduct]=useState<SharedProductRecord|null>(null);
 const[needOpen,setNeedOpen]=useState(false);
 const[reportOpen,setReportOpen]=useState(false);
 const[reportType,setReportType]=useState<(typeof REPORT_TYPES)[number][0]>("ingredient-missing");
 const[reportNote,setReportNote]=useState("");
 useEffect(()=>{let active=true;loadSharedProductCatalog().then(rows=>{if(active)setProducts(rows)}).catch(()=>{});loadMySkinProfiles().then(rows=>{if(active)setProfile(rows.find(x=>x.isActive)||rows[0]||null)}).catch(()=>{});loadShelfSynced().then(rows=>{if(active)setShelfEntries(rows)}).catch(()=>{});const shelfChanged=()=>setShelfEntries(loadShelf());window.addEventListener("skincare101:shelf-changed",shelfChanged);const{data}=supabase.auth.onAuthStateChange(()=>{setTimeout(()=>{void loadShelfSynced().then(setShelfEntries).catch(()=>{});void loadMySkinProfiles().then(rows=>setProfile(rows.find(x=>x.isActive)||rows[0]||null)).catch(()=>{})},0)});return()=>{active=false;window.removeEventListener("skincare101:shelf-changed",shelfChanged);data.subscription.unsubscribe()}},[]);
 useEffect(()=>{const scan=()=>{const page=document.querySelector<HTMLElement>(".site-content");if(!page)return;const cls=page.className;if(cls.includes("page-routine")){setContext("routine");setCurrentProduct(null);return}if(cls.includes("page-product")){setContext("product");const h1=page.querySelector("h1")?.textContent||"";const eyebrow=page.querySelector("h1")?.previousElementSibling?.textContent||"";const h=norm(h1),e=norm(eyebrow);const match=products.find(p=>norm(p.productLocalName||p.name)===h||norm(p.productEnglishName||p.name)===h)||products.find(p=>h&&norm(`${p.brand}${p.name}${p.productLocalName||""}${p.productEnglishName||""}`).includes(h)&&(!e||e.includes(norm(p.brand))));setCurrentProduct(match||null);return}if(cls.includes("page-home")){setContext("home");setCurrentProduct(null);return}setContext("other");setCurrentProduct(null)};scan();const obs=new MutationObserver(scan);obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});return()=>obs.disconnect()},[products]);
 useEffect(()=>{const open=()=>setShelfOpen(true);window.addEventListener("skincare101:open-shelf",open as EventListener);return()=>window.removeEventListener("skincare101:open-shelf",open as EventListener)},[]);
 const owned=useMemo(()=>{const ids=new Set(shelfEntries.map(e=>e.productId));return products.filter(p=>ids.has(p.id))},[products,shelfEntries]);
 const verdict=currentProduct?doINeedThis(currentProduct,owned,profile,products,shelfEntries):null;
 if(shelfOpen)return <LanguageProvider><MyShelf products={products} profile={profile} onBack={()=>setShelfOpen(false)}/></LanguageProvider>;
 const label=context==="product"?"我需要买吗？ · Do I need this?":context==="routine"?"用我的护肤柜搭配 · Use My Shelf":"我的护肤柜 · My Shelf";
 function action(){if(context==="product"&&currentProduct){setNeedOpen(true);return}setShelfOpen(true)}
 function submitReport(){
  if(!currentProduct)return;
  const typeLabel=REPORT_TYPES.find(x=>x[0]===reportType)?.[1]||reportType;
  const title=`[Data correction] ${currentProduct.brand} - ${currentProduct.productLocalName||currentProduct.productEnglishName||currentProduct.name}`;
  const body=[
   "## Product data correction",
   "",
   `- **Brand:** ${currentProduct.brand}`,
   `- **Product:** ${currentProduct.productLocalName||currentProduct.name}${currentProduct.productEnglishName&&currentProduct.productEnglishName!==(currentProduct.productLocalName||currentProduct.name)?` / ${currentProduct.productEnglishName}`:""}`,
   `- **Product ID:** ${currentProduct.id}`,
   `- **Issue type:** ${typeLabel}`,
   `- **Current data type:** ${currentProduct.ingredientListType}`,
   `- **Current source:** ${currentProduct.sourceUrl||"Not listed"}`,
   `- **Page:** ${window.location.href}`,
   "",
   "## What looks wrong?",
   reportNote.trim()||"Please describe the correction here.",
   "",
   "## Suggested source / correct INCI",
   "Please paste a source link, package text, or corrected ingredient list if available.",
   "",
   "---",
   "Submitted from the Skincare101 product feedback form."
  ].join("\n");
  const url=`https://github.com/LittleRuiRui/skincare101/issues/new?${new URLSearchParams({title,body,labels:"data-correction"}).toString()}`;
  window.open(url,"_blank","noopener,noreferrer");
  setReportOpen(false);setReportNote("");setReportType("ingredient-missing");
 }
 return <><V4App/><button onClick={action} aria-label={label} style={{position:"fixed",left:14,bottom:"calc(env(safe-area-inset-bottom, 0px) + 16px)",zIndex:120,border:"1px solid #D7CDB8",borderRadius:999,padding:"10px 13px",background:"rgba(251,246,234,.96)",color:"#2F5A40",fontSize:12,fontWeight:700,boxShadow:"0 8px 24px rgba(40,55,42,.12)",cursor:"pointer",backdropFilter:"blur(8px)"}}>{label}</button>{context==="product"&&currentProduct&&<button onClick={()=>setReportOpen(true)} aria-label="报告成分或产品数据错误" style={{position:"fixed",right:14,bottom:"calc(env(safe-area-inset-bottom, 0px) + 16px)",zIndex:120,border:"1px solid #D7CDB8",borderRadius:999,padding:"10px 13px",background:"rgba(255,255,255,.96)",color:"#6F6A5F",fontSize:12,fontWeight:700,boxShadow:"0 8px 24px rgba(40,55,42,.10)",cursor:"pointer",backdropFilter:"blur(8px)"}}>发现数据有误？ · Report</button>}{needOpen&&currentProduct&&verdict&&<div onClick={()=>setNeedOpen(false)} style={{position:"fixed",inset:0,zIndex:160,background:"rgba(27,34,28,.32)",display:"grid",placeItems:"end center",padding:"20px 14px"}}><div onClick={e=>e.stopPropagation()} style={{width:"min(560px,100%)",boxSizing:"border-box",border:"1px solid #D7CDB8",borderRadius:22,padding:18,background:"#FBF6EA",boxShadow:"0 20px 50px rgba(30,40,31,.2)"}}><div style={{fontSize:10.5,fontWeight:700,letterSpacing:".1em",color:"#2F5A40",marginBottom:8}}>DO I NEED THIS?</div><div style={{fontSize:13,color:"#6F6A5F",marginBottom:5}}>{currentProduct.brand} · {currentProduct.productLocalName||currentProduct.name}</div><div style={{fontSize:23,fontWeight:700,color:verdict.level==="not-recommended"?"#A96F68":"#283027",marginBottom:7}}>{verdict.labelZh} · {verdict.labelEn}</div><div style={{fontSize:13,lineHeight:1.65,color:"#6F6A5F"}}>{verdict.reasonZh}</div><div style={{marginTop:12,borderTop:"1px solid #D7CDB8",paddingTop:10}}>{verdict.evidenceZh.map((x,i)=><div key={i} style={{fontSize:11.5,lineHeight:1.55,color:"#6F6A5F",marginTop:4}}>· {x}</div>)}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:15}}><button onClick={()=>{setNeedOpen(false);setShelfOpen(true)}} style={{border:"1px solid #D7CDB8",borderRadius:13,padding:"10px 11px",background:"white",color:"#2F5A40",fontWeight:700,cursor:"pointer"}}>查看我的护肤柜</button><button onClick={()=>setNeedOpen(false)} style={{border:0,borderRadius:13,padding:"10px 11px",background:"#2F5A40",color:"white",fontWeight:700,cursor:"pointer"}}>知道了</button></div></div></div>}{reportOpen&&currentProduct&&<div onClick={()=>setReportOpen(false)} style={{position:"fixed",inset:0,zIndex:180,background:"rgba(27,34,28,.34)",display:"grid",placeItems:"end center",padding:"20px 14px"}}><div onClick={e=>e.stopPropagation()} style={{width:"min(580px,100%)",boxSizing:"border-box",border:"1px solid #D7CDB8",borderRadius:22,padding:18,background:"#FBF6EA",boxShadow:"0 20px 50px rgba(30,40,31,.22)"}}><div style={{fontSize:10.5,fontWeight:800,letterSpacing:".1em",color:"#2F5A40",marginBottom:7}}>DATA CORRECTION</div><div style={{fontSize:22,fontWeight:700,color:"#283027",marginBottom:5}}>发现成分表有问题？</div><div style={{fontSize:12.5,lineHeight:1.6,color:"#6F6A5F",marginBottom:14}}>告诉我哪里不对。产品信息会自动带上，你不需要重新填写。提交后会创建一个 GitHub 数据纠错记录，方便后续核查和修正。</div><div style={{fontSize:12,color:"#6F6A5F",marginBottom:10}}><b style={{color:"#283027"}}>{currentProduct.brand}</b> · {currentProduct.productLocalName||currentProduct.productEnglishName||currentProduct.name}</div><label style={{display:"block",fontSize:11.5,fontWeight:700,color:"#4D594F",marginBottom:5}}>问题类型 · Issue type</label><select value={reportType} onChange={e=>setReportType(e.target.value as typeof reportType)} style={{width:"100%",boxSizing:"border-box",border:"1px solid #D7CDB8",borderRadius:12,padding:"10px 11px",background:"#fff",color:"#283027",fontSize:13,marginBottom:11}}>{REPORT_TYPES.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select><label style={{display:"block",fontSize:11.5,fontWeight:700,color:"#4D594F",marginBottom:5}}>哪里不对？· What looks wrong?</label><textarea value={reportNote} onChange={e=>setReportNote(e.target.value)} rows={5} maxLength={1600} placeholder="例如：官网新版成分表已经没有酒精；或贴上正确 INCI / 官方来源链接……" style={{width:"100%",boxSizing:"border-box",resize:"vertical",border:"1px solid #D7CDB8",borderRadius:12,padding:"10px 11px",background:"#fff",color:"#283027",fontSize:13,lineHeight:1.55}}/><div style={{fontSize:10.5,color:"#8A857B",marginTop:5,textAlign:"right"}}>{reportNote.length}/1600</div><div style={{display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:8,marginTop:13}}><button onClick={()=>setReportOpen(false)} style={{border:"1px solid #D7CDB8",borderRadius:13,padding:"10px 11px",background:"white",color:"#6F6A5F",fontWeight:700,cursor:"pointer"}}>取消</button><button onClick={submitReport} style={{border:0,borderRadius:13,padding:"10px 11px",background:"#2F5A40",color:"white",fontWeight:700,cursor:"pointer"}}>提交纠错 · Send report</button></div><div style={{fontSize:10.5,lineHeight:1.5,color:"#8A857B",marginTop:10}}>建议附官方品牌页、零售商成分页或包装照片来源。请不要提交姓名、电话等个人敏感信息。</div></div></div>}</>}
