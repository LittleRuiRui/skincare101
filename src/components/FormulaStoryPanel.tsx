import React from "react";
import type { FormulaDna, FormulaSystemKey } from "../intelligence/formulaDna";
import type { SharedProductRecord } from "../lib/supabase";
import skincareStillLife from "../assets/watercolor-skincare-still-life.webp";

const INK = "#292820", MUTE = "#716B61", SAGE = "#526F5B", LINE = "#D8D0C1";
const AXES: Array<{ key: FormulaSystemKey; label: string }> = [
  { key: "hydration", label: "保湿" }, { key: "barrier", label: "屏障" },
  { key: "lipid", label: "脂质" }, { key: "soothing", label: "舒缓" },
  { key: "oilControl", label: "控油" }, { key: "antiAging", label: "抗老" },
];
const point = (index: number, radius: number) => { const angle = -Math.PI / 2 + index * (Math.PI * 2 / AXES.length); return { x: 130 + Math.cos(angle) * radius, y: 124 + Math.sin(angle) * radius }; };

export function radarPolygonPoints(dna: FormulaDna) {
  return AXES.map(({ key }, index) => { const p = point(index, 76 * Math.max(0, Math.min(5, dna.systems[key].score)) / 5); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ");
}

function FormulaRadar({ dna }: { dna: FormulaDna }) {
  return <svg viewBox="0 0 260 248" width="100%" role="img" aria-label="配方六维雷达图：保湿、屏障、脂质、舒缓、控油与抗老，满分五分">
    {[1, 2, 3, 4, 5].map(level => <polygon key={level} points={AXES.map((_, i) => { const p = point(i, 76 * level / 5); return `${p.x},${p.y}`; }).join(" ")} fill={level === 5 ? "#FAF7EF" : "none"} stroke="#D9D4C8" strokeWidth={level === 5 ? 1.2 : .7}/>)}
    {AXES.map((axis, i) => { const end = point(i, 76), label = point(i, 96); return <g key={axis.key}><line x1="130" y1="124" x2={end.x} y2={end.y} stroke="#D9D4C8" strokeWidth=".8"/><text x={label.x} y={label.y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill={SAGE}>{axis.label}</text><text x={label.x} y={label.y + 17} textAnchor="middle" fontSize="9" fill={MUTE}>{dna.systems[axis.key].score}/5</text></g>; })}
    <polygon points={radarPolygonPoints(dna)} fill="rgba(117,145,125,.30)" stroke={SAGE} strokeWidth="2" strokeLinejoin="round"/>
    {AXES.map(({ key }, i) => { const p = point(i, 76 * dna.systems[key].score / 5); return <circle key={key} cx={p.x} cy={p.y} r="3.1" fill="#FBF4E7" stroke={SAGE} strokeWidth="1.7"/>; })}
  </svg>;
}

export default function FormulaStoryPanel({ product, dna }: { product: SharedProductRecord; dna: FormulaDna }) {
  const marketing = product.marketingPositioning?.trim();
  const reality = product.formulaSummary?.trim() || product.formulaVerdict?.trim();
  return <section style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${LINE}`, borderRadius: 22, overflow: "hidden", background: "#FBF7EE", marginBottom: 12, boxShadow: "0 8px 24px rgba(62,72,58,.055)" }}>
    <div style={{ position: "relative", height: 150, overflow: "hidden", borderBottom: `1px solid ${LINE}` }}><img src={skincareStillLife} alt="水彩护肤品与植物静物插画" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 56%", display: "block" }}/><div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(248,243,231,.95),rgba(248,243,231,.25) 72%)" }}/><div style={{ position: "absolute", left: 17, top: 17, maxWidth: 260 }}><div style={{ fontSize: 10, color: SAGE, letterSpacing: ".09em", marginBottom: 7 }}>MARKETING × FORMULA</div><div style={{ fontFamily: "'Newsreader',serif", color: INK, fontSize: 25, lineHeight: 1.16 }}>品牌说法，和配方实际方向</div></div></div>
    <div style={{ padding: 17 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10, marginBottom: 16 }}>
      <div style={{ border: `1px dashed ${LINE}`, borderRadius: 15, padding: 13, background: "rgba(255,255,255,.62)" }}><div style={{ fontSize: 10, color: "#967062", marginBottom: 7, letterSpacing: ".05em" }}>品牌怎么说 · MARKETING</div><div style={{ fontSize: 12, color: INK, lineHeight: 1.65 }}>{marketing || "品牌定位资料暂未收录；不根据产品名替品牌补写宣传功效。"}</div></div>
      <div style={{ border: "1px solid #CBD8CA", borderRadius: 15, padding: 13, background: "#EFF4EC" }}><div style={{ fontSize: 10, color: SAGE, marginBottom: 7, letterSpacing: ".05em" }}>成分在做什么 · FORMULA REALITY</div><div style={{ fontSize: 12, color: INK, lineHeight: 1.65 }}>{reality || "暂未形成可靠的配方总结；请结合下方完整成分与数据完整度阅读。"}</div></div>
    </div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", alignItems: "center", gap: 8 }}><div><div style={{ fontFamily: "'Newsreader',serif", fontSize: 21, color: INK, marginBottom: 7 }}>配方侧向雷达图</div><div style={{ fontSize: 11, color: MUTE, lineHeight: 1.6 }}>根据已收录 INCI 的体系信号绘制，表示配方更偏向哪里，不等于临床功效强度。防腐体系属于稳定性设计，因此不放进功效雷达。</div></div><FormulaRadar dna={dna}/></div></div>
  </section>;
}
