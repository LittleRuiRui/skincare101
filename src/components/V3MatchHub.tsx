import React, { useMemo, useState } from "react";
import { ArrowLeft, Camera, Database, Search, Sparkles } from "lucide-react";
import type { SharedProductRecord } from "../lib/supabase";
import type { SkinProfileRecord } from "../lib/skinProfile";
import { matchRating, personalizedScore } from "../lib/productPresentation";

const INK="#211F1B", PAPER="#F7F3EC", LINE="#DDD6CA", SAGE="#718276", MUTE="#777065";

export default function V3MatchHub({
  profile,
  products,
  onBack,
  onScan,
  onViewRecommendations,
  onProduct,
}:{
  profile:SkinProfileRecord|null;
  products:SharedProductRecord[];
  onBack:()=>void;
  onScan:()=>void;
  onViewRecommendations:()=>void;
  onProduct:(product:SharedProductRecord)=>void;
}){
  const [query,setQuery]=useState("");
  const q=query.trim().toLowerCase();
  const results=useMemo(()=>{
    if(!q)return [];
    return products
      .filter(p=>`${p.brand} ${p.name} ${(p as any).brandLocal||""} ${(p as any).nameLocal||""}`.toLowerCase().includes(q))
      .slice(0,20);
  },[products,q]);

  return <div style={{minHeight:"100vh",background:PAPER,color:INK,padding:"22px 16px 54px"}}><div style={{maxWidth:620,margin:"0 auto"}}>
    <button onClick={onBack} style={{border:0,background:"transparent",padding:0,color:MUTE,fontSize:12,cursor:"pointer",marginBottom:22,display:"flex",gap:6,alignItems:"center"}}><ArrowLeft size={14}/> 返回</button>
    <div style={{color:SAGE,fontSize:10,letterSpacing:".08em",marginBottom:7}}>PRODUCT MATCH</div>
    <h1 style={{fontFamily:"'Newsreader', serif",fontSize:34,fontWeight:500,lineHeight:1.08,margin:"0 0 8px"}}>看看这瓶产品，<br/><i>适不适合你。</i></h1>
    <p style={{fontSize:12.5,color:MUTE,lineHeight:1.6,marginBottom:18}}>搜索数据库里的现有产品，或扫描你手上的配料表。所有入口使用同一套五星匹配规则；★★★☆☆ 及以上 = 可以使用。</p>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18}}>
      <button onClick={onViewRecommendations} style={{border:`1px solid ${SAGE}`,borderRadius:12,padding:13,background:"#EDF1EA",color:"#4E6254",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:7,cursor:"pointer"}}><Sparkles size={15}/> 查看为你推荐</button>
      <button onClick={onScan} style={{border:`1px solid ${LINE}`,borderRadius:12,padding:13,background:"white",color:INK,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:7,cursor:"pointer"}}><Camera size={15}/> 拍照 / 查成分</button>
    </div>

    <div style={{borderTop:`1px solid ${LINE}`,paddingTop:18}}>
      <div style={{display:"flex",alignItems:"center",gap:7,fontSize:11.5,fontWeight:600,marginBottom:8}}><Database size={14} color={SAGE}/> 搜索已有产品</div>
      <div style={{position:"relative",marginBottom:10}}><Search size={15} color={MUTE} style={{position:"absolute",left:12,top:13}}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索品牌或产品名，例如 SK-II / 神仙水" style={{width:"100%",boxSizing:"border-box",border:`1px solid ${LINE}`,borderRadius:12,padding:"11px 12px 11px 36px",background:"white",fontSize:12.5}}/></div>
      {!q&&<div style={{fontSize:11.5,color:MUTE,lineHeight:1.55}}>数据库当前有 {products.length} 款产品。输入品牌或产品名后，只显示匹配结果，不再一次铺开全部产品。</div>}
      {q&&results.length===0&&<div style={{border:`1px solid ${LINE}`,borderRadius:12,padding:13,background:"white",fontSize:11.5,color:MUTE}}>没有找到这个产品。可以换品牌名/英文名搜索，或者直接扫描手上的配料表。</div>}
      {results.map(product=>{
        const rating=matchRating(personalizedScore(product,profile,"all"));
        return <button key={product.id} onClick={()=>onProduct(product)} style={{width:"100%",textAlign:"left",border:`1px solid ${LINE}`,borderRadius:12,padding:"13px 14px",background:"white",marginBottom:8,cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start"}}>
            <div><div style={{fontSize:13,fontWeight:600,lineHeight:1.4}}>{product.brand} · {product.name}</div><div style={{fontSize:10.5,color:MUTE,marginTop:4}}>{product.category} · {product.ingredientListType==="full"?"完整配方":"部分配方"}</div></div>
            <div style={{textAlign:"right",whiteSpace:"nowrap"}}><div style={{color:rating.stars>=3?SAGE:"#8E665F",fontSize:15}}>{rating.starsText}</div><div style={{fontSize:10.5,color:MUTE,marginTop:2}}>{rating.label}</div></div>
          </div>
        </button>;
      })}
    </div>
  </div></div>;
}
