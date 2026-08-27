import React, { useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, Image, Search, ScanText } from "lucide-react";
import type { SharedProductRecord } from "../lib/supabase";
import type { SkinProfileRecord } from "../lib/skinProfile";
import { useLanguage } from "../lib/i18n";
import BilingualProductName from "./BilingualProductName";
import V3IngredientCheck from "./V3IngredientCheck";

const INK="#252724", BG="#F6F4EF", CARD="#FCFBF8", LINE="#DEDCD5", SAGE="#667A6C", MUTE="#777870";
const sans="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif";

function normalize(value:string){return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\u3400-\u9fff]+/g," ").replace(/\s+/g," ").trim()}
function productText(p:SharedProductRecord){return normalize([p.brand,p.name,(p as any).brandLocalName,(p as any).brandEnglishName,(p as any).productLocalName,(p as any).productEnglishName].filter(Boolean).join(" "))}
function candidateScore(text:string,p:SharedProductRecord){const ocr=normalize(text);if(!ocr)return 0;const hay=productText(p);let score=0;const brandTerms=normalize([p.brand,(p as any).brandLocalName,(p as any).brandEnglishName].filter(Boolean).join(" ")).split(" ").filter(x=>x.length>1);const nameTerms=normalize([p.name,(p as any).productLocalName,(p as any).productEnglishName].filter(Boolean).join(" ")).split(" ").filter(x=>x.length>2);for(const term of new Set(brandTerms)){if(ocr.includes(term))score+=5}for(const term of new Set(nameTerms)){if(ocr.includes(term))score+=2}if(hay && ocr.includes(hay))score+=15;return score}

export default function V3ProductScanner({profile,products,onBack,onProduct}:{profile:SkinProfileRecord|null;products:SharedProductRecord[];onBack:()=>void;onProduct:(product:SharedProductRecord)=>void}){
 const {t}=useLanguage();
 const [mode,setMode]=useState<"front"|"ingredients">("front");
 const [status,setStatus]=useState<"idle"|"reading"|"done"|"error">("idle");
 const [progress,setProgress]=useState(0);
 const [ocrText,setOcrText]=useState("");
 const [manual,setManual]=useState("");
 const [preview,setPreview]=useState("");
 const cameraRef=useRef<HTMLInputElement>(null), albumRef=useRef<HTMLInputElement>(null);
 const candidates=useMemo(()=>{
   const source=(ocrText+" "+manual).trim();
   if(!source)return [];
   return products.map(p=>({p,score:candidateScore(source,p)})).filter(x=>x.score>=4).sort((a,b)=>b.score-a.score).slice(0,6);
 },[ocrText,manual,products]);
 async function scan(file?:File){if(!file)return;setStatus("reading");setProgress(0);setOcrText("");const reader=new FileReader();reader.onload=()=>setPreview(String(reader.result||""));reader.readAsDataURL(file);try{const{createWorker}=await import("tesseract.js");const worker=await createWorker("eng+chi_sim",1,{logger:m=>{if(m.status==="recognizing text")setProgress(Math.round((m.progress||0)*100))}});const result=await worker.recognize(file);await worker.terminate();setOcrText(result.data.text.trim());setStatus("done")}catch{setStatus("error")}}
 if(mode==="ingredients")return <V3IngredientCheck profile={profile} onBack={()=>setMode("front")}/>;
 return <div style={{minHeight:"100vh",background:BG,color:INK,padding:"22px 18px 56px",fontFamily:sans}}><div style={{maxWidth:620,margin:"0 auto"}}>
   <button onClick={onBack} style={{border:0,background:"transparent",padding:0,color:MUTE,fontSize:13,cursor:"pointer",marginBottom:30,display:"flex",gap:7,alignItems:"center",fontFamily:sans}}><ArrowLeft size={15}/>{t("返回","Back")}</button>
   <div style={{fontSize:11,letterSpacing:".12em",color:SAGE,fontWeight:700,marginBottom:10}}>PRODUCT SCAN</div>
   <h1 style={{fontSize:31,fontWeight:650,lineHeight:1.2,letterSpacing:"-.035em",margin:"0 0 10px"}}>{t("先拍产品正面","Scan the product front first")}</h1>
   <p style={{fontSize:14,color:MUTE,lineHeight:1.7,margin:"0 0 22px"}}>{t("先识别品牌和产品名，并优先匹配数据库里的已验证产品。只有找不到时，再拍成分表。","We first read the brand and product name and match against verified products in the database. Only scan the ingredient list if no product match is found.")}</p>
   <div style={{border:`1px solid ${LINE}`,borderRadius:20,padding:16,background:CARD,marginBottom:14}}>
     <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={e=>scan(e.target.files?.[0])} style={{display:"none"}}/>
     <input ref={albumRef} type="file" accept="image/*" onChange={e=>scan(e.target.files?.[0])} style={{display:"none"}}/>
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={()=>cameraRef.current?.click()} style={{border:0,borderRadius:15,padding:"13px",background:SAGE,color:"white",fontWeight:650,cursor:"pointer",fontFamily:sans,display:"flex",justifyContent:"center",gap:7,alignItems:"center"}}><Camera size={16}/>{t("拍正面","Take photo")}</button><button onClick={()=>albumRef.current?.click()} style={{border:`1px solid ${LINE}`,borderRadius:15,padding:"13px",background:CARD,color:INK,fontWeight:650,cursor:"pointer",fontFamily:sans,display:"flex",justifyContent:"center",gap:7,alignItems:"center"}}><Image size={16}/>{t("从相册选择","Choose photo")}</button></div>
     <div style={{fontSize:11.5,color:MUTE,lineHeight:1.6,marginTop:12}}>{t("拍摄建议：正面朝向镜头，品牌名和产品名尽量清楚、无强反光。照片只在本机用于识别，不保存原图。","Tip: keep the front label facing the camera with the brand and product name clearly visible and minimal glare. The original image is used locally for recognition and is not stored.")}</div>
   </div>
   {preview&&<img src={preview} alt="preview" style={{width:"100%",maxHeight:260,objectFit:"contain",borderRadius:16,border:`1px solid ${LINE}`,background:CARD,marginBottom:12}}/>}
   {status==="reading"&&<div style={{fontSize:12,color:MUTE,marginBottom:14}}>{t("正在识别正面文字…","Reading front label…")} {progress}%</div>}
   {status==="error"&&<div style={{fontSize:12,color:"#8B6660",marginBottom:14}}>{t("识别失败，可以重新拍摄或直接搜索产品名。","Recognition failed. Retake the photo or search by product name.")}</div>}
   <div style={{position:"relative",marginBottom:14}}><Search size={17} color={MUTE} style={{position:"absolute",left:14,top:15}}/><input value={manual} onChange={e=>setManual(e.target.value)} placeholder={t("也可以输入品牌或产品名","Or type the brand / product name")} style={{width:"100%",boxSizing:"border-box",border:`1px solid ${LINE}`,borderRadius:16,padding:"13px 14px 13px 42px",background:CARD,fontSize:14,fontFamily:sans,color:INK,outline:"none"}}/></div>
   {candidates.length>0&&<section><div style={{fontSize:12,fontWeight:700,margin:"18px 0 9px"}}>{t("可能是这些产品","Possible matches")}</div><div style={{display:"grid",gap:9}}>{candidates.map(({p,score})=><button key={p.id} onClick={()=>onProduct(p)} style={{width:"100%",textAlign:"left",border:`1px solid ${LINE}`,borderRadius:18,padding:15,background:CARD,cursor:"pointer",fontFamily:sans}}><BilingualProductName product={p}/><div style={{fontSize:10.5,color:SAGE,marginTop:7}}>{t("数据库匹配","Database match")} · {score>=10?t("高","High"):t("可能","Possible")}</div></button>)}</div></section>}
   {(status==="done"||manual.trim())&&candidates.length===0&&<div style={{border:`1px solid ${LINE}`,borderRadius:18,padding:16,background:CARD,marginTop:14}}><div style={{fontSize:13,fontWeight:650,marginBottom:6}}>{t("没有找到可靠匹配","No reliable product match")}</div><div style={{fontSize:12,color:MUTE,lineHeight:1.6,marginBottom:12}}>{t("不要继续猜产品。下一步只拍包装上的 Ingredients / 全成分区域，再确认识别结果。","We won't guess the product. Next, scan only the Ingredients / full ingredient-list area and review the OCR result before analysis.")}</div><button onClick={()=>setMode("ingredients")} style={{border:0,borderRadius:14,padding:"11px 14px",background:SAGE,color:"white",fontWeight:650,cursor:"pointer",fontFamily:sans,display:"flex",gap:7,alignItems:"center"}}><ScanText size={15}/>{t("扫描成分表","Scan ingredient list")}</button></div>}
   {status==="idle"&&!manual.trim()&&<button onClick={()=>setMode("ingredients")} style={{marginTop:8,border:0,background:"transparent",color:MUTE,padding:"10px 0",fontSize:12,cursor:"pointer",fontFamily:sans}}>{t("我已经知道数据库里没有这个产品 → 直接拍成分表","I know this product isn't in the database → scan ingredients")}</button>}
 </div></div>;
}
