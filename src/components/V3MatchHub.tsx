import React, { useMemo, useState } from "react";
import { ArrowLeft, Camera, Search, Sparkles } from "lucide-react";
import type { SharedProductRecord } from "../lib/supabase";
import type { SkinProfileRecord } from "../lib/skinProfile";
import { matchRating, personalizedScore } from "../lib/productPresentation";

const INK="#252724", BG="#F6F4EF", CARD="#FCFBF8", LINE="#DEDCD5", SAGE="#667A6C", MUTE="#777870";
const sans="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";
const button={border:`1px solid ${LINE}`,borderRadius:16,padding:"13px 14px",background:CARD,color:INK,fontSize:13,fontWeight:600,fontFamily:sans,cursor:"pointer"} as const;

export default function V3MatchHub({profile,products,onBack,onScan,onViewRecommendations,onProduct}:{profile:SkinProfileRecord|null;products:SharedProductRecord[];onBack:()=>void;onScan:()=>void;onViewRecommendations:()=>void;onProduct:(product:SharedProductRecord)=>void;}){
 const[query,setQuery]=useState(""); const q=query.trim().toLowerCase();
 const results=useMemo(()=>!q?[]:products.filter(p=>`${p.brand} ${p.name} ${(p as any).brandLocal||""} ${(p as any).nameLocal||""}`.toLowerCase().includes(q)).slice(0,20),[products,q]);
 return <div style={{minHeight:"100vh",background:BG,color:INK,padding:"22px 18px 56px",fontFamily:sans}}><div style={{maxWidth:620,margin:"0 auto"}}>
  <button onClick={onBack} style={{border:0,background:"transparent",padding:0,color:MUTE,fontSize:13,cursor:"pointer",marginBottom:30,display:"flex",gap:7,alignItems:"center",fontFamily:sans}}><ArrowLeft size={15}/> 返回</button>
  <div style={{fontSize:11,letterSpacing:".12em",color:SAGE,fontWeight:700,marginBottom:10}}>FOR YOU · PRODUCT MATCH</div>
  <h1 style={{fontSize:32,fontWeight:650,lineHeight:1.2,letterSpacing:"-.035em",margin:"0 0 10px",fontFamily:sans}}>看看这瓶产品，适不适合你</h1>
  <p style={{fontSize:14,color:MUTE,lineHeight:1.7,margin:"0 0 24px"}}>搜索已有产品，或读取你手上的配料表。所有入口统一使用五星匹配；3 星及以上表示可以使用。</p>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:28}}><button onClick={onViewRecommendations} style={{...button,background:SAGE,color:"white",borderColor:SAGE,display:"flex",justifyContent:"center",gap:7,alignItems:"center"}}><Sparkles size={15}/> 为你推荐</button><button onClick={onScan} style={{...button,display:"flex",justifyContent:"center",gap:7,alignItems:"center"}}><Camera size={15}/> 查成分 / OCR</button></div>
  <div style={{fontSize:13,fontWeight:650,marginBottom:10}}>搜索已有产品</div>
  <div style={{position:"relative",marginBottom:12}}><Search size={17} color={MUTE} style={{position:"absolute",left:14,top:15}}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索品牌或产品名，例如 SK-II / 神仙水" style={{width:"100%",boxSizing:"border-box",border:`1px solid ${LINE}`,borderRadius:16,padding:"13px 14px 13px 42px",background:CARD,fontSize:14,fontFamily:sans,color:INK,outline:"none"}}/></div>
  {!q&&<div style={{fontSize:12.5,color:MUTE,lineHeight:1.6}}>数据库现有 {products.length} 款产品。输入关键词后再显示结果。</div>}
  {q&&results.length===0&&<div style={{border:`1px solid ${LINE}`,borderRadius:18,padding:16,background:CARD,fontSize:12.5,color:MUTE}}>没有找到。可以换品牌名、英文名，或直接读取配料表。</div>}
  <div style={{display:"grid",gap:10,marginTop:14}}>{results.map(product=>{const rating=matchRating(personalizedScore(product,profile,"all"));return <button key={product.id} onClick={()=>onProduct(product)} style={{width:"100%",textAlign:"left",border:`1px solid ${LINE}`,borderRadius:18,padding:"16px",background:CARD,cursor:"pointer",fontFamily:sans}}><div style={{display:"flex",justifyContent:"space-between",gap:14}}><div><div style={{fontSize:14,fontWeight:650,lineHeight:1.45,color:INK}}>{product.brand} · {product.name}</div><div style={{fontSize:11.5,color:MUTE,marginTop:5}}>{product.category} · {product.ingredientListType==="full"?"完整配方":"部分配方"}</div></div><div style={{textAlign:"right",whiteSpace:"nowrap"}}><div style={{color:rating.stars>=3?SAGE:"#8B6660",fontSize:16,letterSpacing:1}}>{rating.starsText}</div><div style={{fontSize:11,color:MUTE,marginTop:3}}>{rating.label}</div></div></div></button>})}</div>
 </div></div>;
}
