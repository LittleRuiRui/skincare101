import React,{useMemo,useRef,useState}from"react";
import{ArrowLeft,Camera,ChevronDown,ChevronUp,Image,Search,ScanText}from"lucide-react";
import type{SharedProductRecord}from"../lib/supabase";
import type{SkinProfileRecord}from"../lib/skinProfile";
import{useLanguage}from"../lib/i18n";
import BilingualProductName from"./BilingualProductName";
import V3IngredientCheck from"./V3IngredientCheck";
import{SketchUnderline}from"./HandDrawnVisuals";
import{rankProductMatches}from"../lib/productSearch";
import{logSearchEvent,logSearchSelection}from"../lib/searchAnalytics";

const INK="#263027",BG="#F6F0E3",CARD="#FBF5E8",LINE="#D8CEBA",SAGE="#2F5A40",MUSTARD="#D4AA37",MUTE="#6F6A5F",ROSE="#8B6660";
const sans="'IBM Plex Sans','PingFang SC','Hiragino Sans GB',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

export default function V3ProductScanner({profile,products,onBack,onProduct}:{profile:SkinProfileRecord|null;products:SharedProductRecord[];onBack:()=>void;onProduct:(product:SharedProductRecord)=>void}){
 const{t,language}=useLanguage();
 const[mode,setMode]=useState<"front"|"ingredients">("front"),[status,setStatus]=useState<"idle"|"reading"|"done"|"error">("idle"),[progress,setProgress]=useState(0),[ocrText,setOcrText]=useState(""),[manual,setManual]=useState(""),[preview,setPreview]=useState(""),[ocrOpen,setOcrOpen]=useState(false);
 const cameraRef=useRef<HTMLInputElement>(null),albumRef=useRef<HTMLInputElement>(null);
 const source=manual.trim()||ocrText.trim();
 const candidates=useMemo(()=>rankProductMatches(products,source,6),[products,source]);
 async function scan(file?:File){if(!file)return;setStatus("reading");setProgress(0);setOcrText("");const reader=new FileReader();reader.onload=()=>setPreview(String(reader.result||""));reader.readAsDataURL(file);try{const{createWorker}=await import("tesseract.js");const worker=await createWorker("eng+chi_sim",1,{logger:m=>{if(m.status==="recognizing text")setProgress(Math.round((m.progress||0)*100))}});const result=await worker.recognize(file);await worker.terminate();const text=result.data.text.trim();setOcrText(text);setStatus(text.length>1?"done":"error");if(text.length>1){const matches=rankProductMatches(products,text,6);void logSearchEvent(text,matches.length,"ocr_front",language).catch(()=>{})}}catch{setStatus("error")}}
 function choose(product:SharedProductRecord){if(source)void logSearchSelection(source,product.id,candidates.length,manual.trim()?"scanner_manual":"ocr_front",language).catch(()=>{});onProduct(product)}
 if(mode==="ingredients")return <V3IngredientCheck profile={profile} onBack={()=>setMode("front")}/>;
 return <div style={{minHeight:"100vh",background:BG,color:INK,padding:"24px 18px 60px",fontFamily:sans}}><div style={{maxWidth:640,margin:"0 auto"}}>
  <button onClick={onBack} style={back}><ArrowLeft size={15}/>{t("返回","Back")}</button>
  <div style={{fontSize:12,letterSpacing:".06em",color:SAGE,fontWeight:650,marginBottom:9}}>{t("查产品","PRODUCT SEARCH")}</div>
  <h1 style={{fontSize:34,fontWeight:650,lineHeight:1.18,letterSpacing:"-.03em",margin:"0",color:SAGE}}>{t("先搜产品名，最快也最准","Search the product name first")}</h1>
  <SketchUnderline width={150}/>
  <p style={{fontSize:15,color:MUTE,lineHeight:1.72,margin:"13px 0 18px",maxWidth:550}}>{t("输入品牌、中文名、英文名或常用昵称。数据库会做模糊匹配，再让你确认。","Type the brand, Chinese or English product name, or a common nickname. The database fuzzy-matches it and lets you confirm.")}</p>
  <div style={{position:"relative",marginBottom:15}}><Search size={18} color={SAGE} style={{position:"absolute",left:14,top:16}}/><input autoFocus value={manual} onChange={e=>{setManual(e.target.value);if(e.target.value.trim())setOcrText("")}} placeholder={t("例如：SK-II 神仙水 / 小黑瓶 / B5修复霜","e.g. SK-II essence / Advanced Night Repair / Cicaplast B5")} style={searchInput}/></div>
  {source&&candidates.length>0&&<section><div style={{fontSize:14,fontWeight:650,margin:"18px 0 10px",color:SAGE}}>{t("可能是这些产品，请确认","Possible matches — please confirm")}</div><div style={{display:"grid",gap:10}}>{candidates.map((p,index)=><button key={p.id} onClick={()=>choose(p)} style={{...candidateButton,borderColor:index===0?SAGE:LINE,boxShadow:index===0?"0 7px 20px rgba(47,90,64,.07)":"none"}}>{index===0&&<span style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:MUSTARD}}/>}<BilingualProductName product={p}/><div style={{fontSize:12,color:SAGE,marginTop:8}}>{index===0?t("最可能匹配","Top database match"):t("其他候选","Alternative match")}</div></button>)}</div></section>}
  {source&&candidates.length===0&&<div style={{border:`1px solid ${LINE}`,borderRadius:18,padding:16,background:CARD,marginTop:12}}><div style={{fontSize:15,fontWeight:650,marginBottom:7,color:SAGE}}>{t("没有找到可靠匹配","No reliable product match")}</div><div style={{fontSize:13,color:MUTE,lineHeight:1.65}}>{t("不会强行猜。可以换一个更短的产品名，或直接查成分。","We will not force a guess. Try a shorter product name, or go straight to ingredient search.")}</div><button onClick={()=>setMode("ingredients")} style={{...linkButton,marginTop:7}}><ScanText size={15}/>{t("直接查成分","Search ingredients")}</button></div>}
  <div style={{marginTop:25,borderTop:`1px solid ${LINE}`,paddingTop:12}}>
   <button onClick={()=>setOcrOpen(x=>!x)} style={ocrToggle}><span style={{display:"flex",alignItems:"center",gap:7}}><Camera size={15}/>{t("拍照识别 Beta","Photo recognition Beta")}</span>{ocrOpen?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</button>
   {ocrOpen&&<div style={{border:`1px solid ${LINE}`,borderRadius:18,padding:14,background:CARD,marginTop:8}}><div style={{fontSize:12,color:MUTE,lineHeight:1.65,marginBottom:11}}>{t("这是辅助功能，不是主搜索。反光、弧形包装和小字会降低识别率；识别后仍会让你确认产品。","This is an auxiliary feature, not the main search. Glare, curved packaging and small text reduce accuracy; you still confirm the product after recognition.")}</div><input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={e=>scan(e.target.files?.[0])} style={{display:"none"}}/><input ref={albumRef} type="file" accept="image/*" onChange={e=>scan(e.target.files?.[0])} style={{display:"none"}}/><div style={{display:"flex",gap:8}}><button onClick={()=>cameraRef.current?.click()} style={smallButton}><Camera size={14}/>{t("拍照","Photo")}</button><button onClick={()=>albumRef.current?.click()} style={smallButton}><Image size={14}/>{t("相册","Album")}</button></div>{status==="reading"&&<div style={{fontSize:12,color:SAGE,marginTop:10}}>{t("正在尝试识别","Trying recognition")} {progress}%</div>}{status==="error"&&<div style={{fontSize:12,color:ROSE,lineHeight:1.6,marginTop:10}}>{t("这张图没有识别出足够可靠的文字。建议直接输入产品名，不必继续反复拍。","This image did not yield reliable text. Type the product name instead of repeatedly retaking photos.")}</div>}{preview&&<img src={preview} alt="preview" style={{width:"100%",maxHeight:190,objectFit:"contain",borderRadius:14,border:`1px solid ${LINE}`,background:"#fff",marginTop:10}}/>}{status==="done"&&ocrText&&<div style={{marginTop:10,fontSize:11,color:MUTE,lineHeight:1.55}}>{t("识别到：","Recognized: ")}{ocrText.slice(0,220)}{ocrText.length>220?"…":""}</div>}</div>}
  </div>
  <button onClick={()=>setMode("ingredients")} style={linkButton}><ScanText size={15}/>{t("产品搜不到？直接查成分 →","Product not found? Search ingredients →")}</button>
 </div></div>
}

const back:React.CSSProperties={border:0,background:"transparent",padding:0,color:MUTE,fontSize:14,cursor:"pointer",marginBottom:26,display:"flex",gap:7,alignItems:"center",fontFamily:sans};
const searchInput:React.CSSProperties={width:"100%",boxSizing:"border-box",border:`1px solid ${LINE}`,borderRadius:18,padding:"14px 14px 14px 42px",background:CARD,fontSize:15,fontFamily:sans,color:INK,outline:"none",boxShadow:"0 4px 16px rgba(40,55,42,.035)"};
const candidateButton:React.CSSProperties={width:"100%",textAlign:"left",border:`1px solid ${LINE}`,borderRadius:20,padding:16,background:CARD,cursor:"pointer",fontFamily:sans,position:"relative",overflow:"hidden"};
const ocrToggle:React.CSSProperties={width:"100%",border:0,background:"transparent",padding:"8px 0",fontFamily:sans,color:SAGE,fontSize:13,fontWeight:650,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"};
const smallButton:React.CSSProperties={border:`1px solid ${LINE}`,borderRadius:12,padding:"9px 11px",background:"#FFF9EC",color:SAGE,fontWeight:650,cursor:"pointer",fontFamily:sans,display:"flex",gap:6,alignItems:"center",fontSize:12};
const linkButton:React.CSSProperties={marginTop:14,border:0,background:"transparent",color:SAGE,padding:"9px 0",fontSize:13,cursor:"pointer",fontFamily:sans,fontWeight:600,display:"flex",gap:7,alignItems:"center"};