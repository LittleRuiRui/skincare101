import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { analyzeFormulaDna, FORMULA_SYSTEM_ORDER } from "../intelligence/formulaDna";
import { approximatePriceGuide, getBrandProfile } from "../data/brandProfiles";
import { loadProductDetail, type ProductDetailRecord, type SharedProductRecord } from "../lib/supabase";
import type { SkinProfileRecord } from "../lib/skinProfile";
import { formulaDataLabel, oneLineVerdict, personalizedScore, type BrowseConcern } from "../lib/productPresentation";

const INK = "#211F1B";
const PAPER = "#F7F3EC";
const LINE = "#DDD6CA";
const SAGE = "#718276";
const ROSE = "#C9958F";
const MUTE = "#777065";

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "sage" | "rose" }) {
  const colors = tone === "sage" ? ["#EDF1EA", SAGE] : tone === "rose" ? ["#F6ECE8", "#8E665F"] : ["white", MUTE];
  return <span style={{ display: "inline-flex", border: `1px solid ${tone === "neutral" ? LINE : colors[1]}`, borderRadius: 999, padding: "5px 8px", background: colors[0], color: colors[1], fontSize: 10.5 }}>{children}</span>;
}

export default function V3ProductDetail({ product, profile, concern, onBack }: { product: SharedProductRecord; profile: SkinProfileRecord | null; concern?: BrowseConcern; onBack: () => void }) {
  const [detail, setDetail] = useState<ProductDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadProductDetail(product.id)
      .then((row) => { if (active) setDetail(row); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [product.id]);

  const current = detail || product;
  const dna = useMemo(() => analyzeFormulaDna(current), [current]);
  const match = personalizedScore(product, profile, concern);
  const formula = formulaDataLabel(current);
  const brand = getBrandProfile(product.brand);
  const fullIngredients = detail?.fullIngredients || product.ingredients;
  const visibleSystems = FORMULA_SYSTEM_ORDER.map((key) => dna.systems[key]).filter((system) => system.score > 0).sort((a, b) => b.score - a.score);

  return <div style={{ minHeight: "100vh", background: PAPER, color: INK, padding: "22px 16px 54px" }}><div style={{ maxWidth: 620, margin: "0 auto" }}>
    <button onClick={onBack} style={{ border: 0, background: "transparent", padding: 0, color: MUTE, fontSize: 12, cursor: "pointer", marginBottom: 24, display: "flex", gap: 6, alignItems: "center" }}><ArrowLeft size={14}/> Explore</button>

    <div style={{ fontSize: 10, color: SAGE, letterSpacing: ".08em", marginBottom: 7 }}>{product.brand} · {product.category}</div>
    <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 34, fontWeight: 500, lineHeight: 1.08, margin: "0 0 10px" }}>{product.name}</h1>
    <p style={{ fontFamily: "'Newsreader', serif", fontSize: 19, lineHeight: 1.45, margin: "0 0 18px", color: "#49443D" }}>{oneLineVerdict(current, dna)}</p>

    <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
      <div style={{ border: `1px solid ${match?.recommendationAvailable ? SAGE : LINE}`, borderRadius: 16, padding: 15, background: match?.recommendationAvailable ? "#EDF1EA" : "rgba(255,255,255,.65)" }}>
        <div style={{ fontSize: 9.5, color: SAGE, letterSpacing: ".08em", marginBottom: 7 }}>MATCH FOR YOU</div>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 25, marginBottom: 5 }}>{match?.score ? `${match.score}%` : profile ? "Evidence limited" : "Build Profile"}</div>
        <div style={{ fontSize: 10.5, color: MUTE, lineHeight: 1.5 }}>这是针对你的 Skin Profile 的适配度，不是产品绝对质量分。</div>
      </div>
      <div style={{ border: `1px solid ${formula.tone === "good" ? SAGE : ROSE}`, borderRadius: 16, padding: 15, background: formula.tone === "good" ? "#F2F4EF" : "#F6ECE8" }}>
        <div style={{ fontSize: 9.5, color: formula.tone === "good" ? SAGE : ROSE, letterSpacing: ".08em", marginBottom: 7 }}>FORMULA DATA</div>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 18, marginBottom: 5 }}>{formula.label}</div>
        <div style={{ fontSize: 10.5, color: MUTE, lineHeight: 1.5 }}>{formula.detail} 数据可信度 {current.dataCompleteness}%</div>
      </div>
    </section>

    {match?.recommendationAvailable && <section style={{ border: `1px solid ${LINE}`, borderRadius: 17, padding: 17, background: "rgba(255,255,255,.68)", marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: SAGE, letterSpacing: ".08em", marginBottom: 10 }}>WHY IT MATCHES YOU</div>
      {match.positiveEvidence.slice(0, 4).map((evidence) => <div key={evidence.name} style={{ fontSize: 12, color: "#40594A", lineHeight: 1.55, marginBottom: 5 }}>✓ {evidence.name} · 配料第 {evidence.ingredientPosition} 位</div>)}
      {match.systemEvidence.slice(0, 3).map((evidence) => <div key={evidence.key} style={{ fontSize: 12, color: "#40594A", lineHeight: 1.55, marginBottom: 5 }}>✓ {evidence.label} {evidence.score}/5 与你的目标一致</div>)}
      {match.negativeEvidence.slice(0, 3).map((evidence) => <div key={evidence.name} style={{ fontSize: 12, color: "#8A5F58", lineHeight: 1.55, marginTop: 5 }}>△ {evidence.name} · 可能降低适配度</div>)}
      {match.formulaPenalty < 0 && <div style={{ fontSize: 12, color: "#8A5F58", lineHeight: 1.55, marginTop: 5 }}>△ 高位挥发性酒精对当前敏感/屏障目标扣分</div>}
    </section>}

    <section style={{ border: `1px solid ${LINE}`, borderRadius: 17, padding: 17, background: "rgba(255,255,255,.68)", marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: MUTE, letterSpacing: ".08em", marginBottom: 10 }}>FORMULA PROFILE</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px" }}>{visibleSystems.map((system) => <div key={system.key}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 5 }}><span>{system.label}</span><span style={{ color: system.score >= 3 ? SAGE : MUTE }}>{system.score}/5</span></div><div style={{ height: 5, borderRadius: 5, background: LINE, overflow: "hidden" }}><div style={{ height: "100%", width: `${system.score * 20}%`, background: system.score >= 3 ? SAGE : ROSE }}/></div></div>)}</div>
      <div style={{ marginTop: 13, paddingTop: 11, borderTop: `1px solid ${LINE}`, display: "flex", gap: 6, flexWrap: "wrap" }}><Badge>{dna.baseType}</Badge>{dna.sensory.labels.map((label) => <Badge key={label}>{label}</Badge>)}<Badge tone={dna.alcohol.level === "high" ? "rose" : "sage"}>酒精 {dna.alcohol.level}</Badge></div>
    </section>

    <section style={{ border: `1px solid ${LINE}`, borderRadius: 17, padding: 17, background: "rgba(255,255,255,.68)", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", marginBottom: 9 }}><div style={{ fontSize: 10, color: MUTE, letterSpacing: ".08em" }}>INGREDIENT LIST</div><div style={{ fontSize: 10, color: MUTE }}>{fullIngredients.length} ingredients stored</div></div>
      {loading ? <div style={{ fontSize: 11.5, color: MUTE }}>Loading the full stored formula…</div> : error ? <div style={{ fontSize: 11.5, color: ROSE }}>无法加载详情，暂时显示分析用前 15 位。</div> : null}
      <div style={{ fontSize: 11.5, lineHeight: 1.75, color: "#514D45" }}>{fullIngredients.map((ingredient, index) => <span key={`${ingredient}-${index}`}><span style={{ color: index < 15 ? INK : MUTE }}>{index + 1}. {ingredient}</span>{index < fullIngredients.length - 1 ? " · " : ""}</span>)}</div>
      <div style={{ fontSize: 10.5, color: MUTE, lineHeight: 1.55, marginTop: 10 }}>数据库保存完整配方；Formula DNA 主要用前 10–15 位识别配方骨架，同时对低浓度高效活性单独识别。若这里标记 Partial formula，代表当前记录还未补齐，不能假装完整。</div>
    </section>

    <section style={{ borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}`, padding: "16px 0", margin: "18px 0" }}>
      <div style={{ fontSize: 9.5, color: SAGE, letterSpacing: ".08em", marginBottom: 6 }}>{brand.country} · {brand.segment}</div>
      <div style={{ fontFamily: "'Newsreader', serif", fontSize: 22, marginBottom: 6 }}>About {brand.name}</div>
      <div style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.6 }}>{brand.description}</div>
      <div style={{ fontSize: 11.5, marginTop: 9 }}><b>Known for:</b> {brand.knownFor}</div>
      <div style={{ fontSize: 11.5, marginTop: 5 }}><b>Best for:</b> {brand.bestFor}</div>
      <div style={{ fontSize: 11.5, marginTop: 5 }}><b>Price:</b> {approximatePriceGuide(brand, product.category)}</div>
      <div style={{ fontSize: 9.5, color: MUTE, lineHeight: 1.5, marginTop: 4 }}>这是帮助筛选预算的估算区间，不是实时售价；促销、容量和零售渠道会造成差异。</div>
    </section>

    <a href={current.sourceUrl} target="_blank" rel="noreferrer" style={{ width: "100%", boxSizing: "border-box", borderRadius: 999, padding: "11px 14px", background: INK, color: "white", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 12 }}>View formula source / purchase page <ExternalLink size={13}/></a>
  </div></div>;
}
