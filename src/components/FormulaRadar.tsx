import React from "react";
import type { FormulaDna } from "../intelligence/formulaDna";

const AXES = [
  ["hydration", "保湿"],
  ["barrier", "屏障"],
  ["soothing", "舒缓"],
  ["antiAging", "抗老"],
  ["oilControl", "控油"],
  ["lipid", "脂质"],
] as const;

export default function FormulaRadar({ dna }: { dna: FormulaDna }) {
  const cx=110,cy=105,r=68,n=AXES.length;
  const point=(i:number,scale:number)=>{const a=-Math.PI/2+i*Math.PI*2/n;return [cx+Math.cos(a)*r*scale,cy+Math.sin(a)*r*scale] as const};
  const ring=(s:number)=>AXES.map((_,i)=>point(i,s).join(",")).join(" ");
  const values=AXES.map(([key])=>Math.max(0,Math.min(5,dna.systems[key].score))/5);
  const polygon=values.map((v,i)=>point(i,v).join(",")).join(" ");
  return <div style={{width:"100%",maxWidth:320,margin:"4px auto 8px"}}>
    <svg viewBox="0 0 220 220" role="img" aria-label="配方功效雷达图" style={{width:"100%",display:"block",overflow:"visible"}}>
      {[.25,.5,.75,1].map(s=><polygon key={s} points={ring(s)} fill="none" stroke="#DDD6CA" strokeWidth="1"/>) }
      {AXES.map(([,label],i)=>{const [x,y]=point(i,1);const [tx,ty]=point(i,1.2);return <g key={label}><line x1={cx} y1={cy} x2={x} y2={y} stroke="#E4DED4" strokeWidth="1"/><text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#777065">{label}</text></g>})}
      <polygon points={polygon} fill="rgba(113,130,118,.18)" stroke="#718276" strokeWidth="2"/>
      {values.map((v,i)=>{const [x,y]=point(i,v);return <circle key={i} cx={x} cy={y} r="2.5" fill="#718276"/>})}
    </svg>
    <div style={{fontSize:9.5,color:"#777065",lineHeight:1.5,textAlign:"center"}}>0–5 表示配方结构中的相对支持强度，不代表临床功效百分比</div>
  </div>;
}
