import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { analyzeFormulaDna, FORMULA_SYSTEM_ORDER } from "../intelligence/formulaDna";
import { approximatePriceGuide, getBrandProfile, priceTierForBrand } from "../data/brandProfiles";
import { loadProductDetail, loadPublicProductExperiences, savePublicProductExperience, type ProductDetailRecord, type PublicProductExperience, type SharedProductRecord } from "../lib/supabase";
import { summarizeSkinProfile, type SkinProfileRecord } from "../lib/skinProfile";
import { formulaDataLabel, matchRating, productAudience, productVerdict, personalizedScore, rankForProfile, type BrowseConcern } from "../lib/productPresentation";
import { loadProductExperience, saveProductExperience, type ProductReaction } from "../lib/productFeedback";
import { consumerAliases } from "../lib/productNames";
import BilingualIngredientList from "./BilingualIngredientList";
import { SketchPageAccent, SketchUnderline } from "./HandDrawnVisuals";

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
const confidenceFromCompleteness=(n:number)=>n>=85?"高":n>=65?"中":"较低";
const systemStrength=(n:number)=>n>=4?"重点体系":n>=2?"辅助体系":"轻度支持";

export default function V3ProductDetail({ product, products, profile, concern, onBack, onProduct }: { product: SharedProductRecord; products: SharedProductRecord[]; profile: SkinProfileRecord | null; concern?: BrowseConcern; onBack: () => void; onProduct: (product: SharedProductRecord, concern: BrowseConcern) => void }) {
  const [detail, setDetail] = useState<ProductDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reaction, setReaction] = useState<ProductReaction>("neutral");
  const [texture, setTexture] = useState<"love" | "okay" | "dislike">("okay");
  const [repurchase, setRepurchase] = useState<"yes" | "maybe" | "no">("maybe");
  const [note, setNote] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [experiences, setExperiences] = useState<PublicProductExperience[]>([]);

  useEffect(() => { let active = true; setLoading(true); loadProductDetail(product.id).then((row) => { if (active) setDetail(row); }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [product.id]);
  useEffect(() => { const experience = loadProductExperience(product.id); setReaction(experience?.reaction || "neutral"); setTexture(experience?.texture || "okay"); setRepurchase(experience?.repurchase || "maybe"); setNote(experience?.note || ""); setFeedbackStatus("idle"); }, [product.id]);
  useEffect(() => { let active = true; loadPublicProductExperiences(product.id).then((rows) => { if (active) setExperiences(rows); }).catch(() => { if (active) setExperiences([]); }); return () => { active = false; }; }, [product.id]);

  const current = detail || product;
  const dna = useMemo(() => analyzeFormulaDna(current), [current]);
  const audience = productAudience(current);
  const match = personalizedScore(product, profile, concern);
  const rating = matchRating(match);
  const formula = formulaDataLabel(current);
  const brand = getBrandProfile(product.brand);
  const fullIngredients = detail?.fullIngredients || product.ingredients;
  const visibleSystems = FORMULA_SYSTEM_ORDER.map((key) => dna.systems[key]).filter((system) => system.score > 0).sort((a, b) => b.score - a.score);
  const alternatives = useMemo(() => rankForProfile(products.filter((candidate) => candidate.id !== product.id && candidate.category === product.category), profile, concern).filter((candidate) => candidate.recommendationAvailable), [products, product.id, product.category, profile, concern]);
  const similar = alternatives[0];
  const budgetAlternative = alternatives.find((candidate) => priceTierForBrand(candidate.brand) === "budget");
  const premiumAlternative = alternatives.find((candidate) => priceTierForBrand(candidate.brand) === "premium");
  const profileSummary = summarizeSkinProfile(profile);
  const improvedCount = experiences.filter((item) => item.reaction === "better").length;
  const reactionLabel = { better: "皮肤有改善", neutral: "没有明显变化", irritated: "出现刺激/不适" } as const;
  const textureLabel = { love: "喜欢肤感", okay: "肤感一般", dislike: "不喜欢肤感" } as const;
  const repurchaseLabel = { yes: "会回购", maybe: "可能回购", no: "不会回购" } as const;
  const localName=product.productLocalName||product.name,englishName=product.productEnglishName||product.name,aliases=consumerAliases(product);

  async function submitExperience() {
    if (!profileSummary.isComplete) { setFeedbackStatus("error"); setFeedbackMessage("请先建立肤质档案，这样别人才能理解这条体验来自什么肤质。"); return; }
    setFeedbackStatus("saving"); setFeedbackMessage("");
    try { await savePublicProductExperience({ productKey: product.id, skinType: profileSummary.skinType, sensitivity: profileSummary.sensitivity, concerns: profileSummary.concerns, reaction, texture, repurchase, note }); saveProductExperience({ productId: product.id, reaction, texture, repurchase, note: note.trim() }); setExperiences(await loadPublicProductExperiences(product.id)); setFeedbackStatus("saved"); setFeedbackMessage("已匿名公开。别人只会看到肤质标签和使用感。"); }
    catch (submissionError) { setFeedbackStatus("error"); setFeedbackMessage(submissionError instanceof Error ? submissionError.message : "暂时无法提交，请稍后重试。"); }
  }

  return <div style={{ minHeight: "100vh", width:"100%", boxSizing:"border-box", background: PAPER, color: INK, padding: "22px 18px 54px", overflowX:"clip" }}><div style={{ width:"100%", maxWidth: 620, minWidth:0, boxSizing:"border-box", margin: "0 auto" }}>
    <button onClick={onBack} style={{ border: 0, background: "transparent", padding: 0, color: MUTE, fontSize: 12, cursor: "pointer", marginBottom: 24, display: "flex", gap: 6, alignItems: "center" }}><ArrowLeft size={14}/> Explore</button>
    <div style={{ fontSize: 10, color: SAGE, letterSpacing: ".08em", marginBottom: 7 }}>{product.brandLocalName||product.brand} · {product.brandEnglishName&&product.brandEnglishName!==product.brandLocalName?product.brandEnglishName:""} · {product.category}</div>
    <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 34, fontWeight: 500, lineHeight: 1.08, margin: 0 }}>{localName}</h1><SketchUnderline width={135}/>
    {englishName!==localName&&<div style={{fontSize:12,color:MUTE,lineHeight:1.5,marginTop:8}}>{englishName}</div>}
    {aliases.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",margin:"9px 0 4px"}}>{aliases.map(alias=><Badge key={alias} tone="sage">常用昵称 · {alias}</Badge>)}</div>}
    <p style={{ fontFamily: "'Newsreader', serif", fontSize: 19, lineHeight: 1.45, margin: "14px 0 2px", color: "#49443D" }}>{productVerdict(current, dna)}</p><SketchPageAccent kind="formula"/>

    {(audience.bestFor.length>0||audience.notIdealFor.length>0||audience.caveats.length>0)&&<section style={{width:"100%",boxSizing:"border-box",border:`1px solid ${LINE}`,borderRadius:17,padding:17,background:"rgba(255,255,255,.68)",marginBottom:12}}><div style={{fontSize:10,color:SAGE,letterSpacing:".08em",marginBottom:11}}>这款产品本身适合谁</div>{audience.bestFor.length>0&&<div style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:650,marginBottom:6}}>更适合</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{audience.bestFor.slice(0,6).map(item=><Badge key={`best-${item}`} tone="sage">✓ {item}</Badge>)}</div></div>}{audience.notIdealFor.length>0&&<div style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:650,marginBottom:6}}>不太适合</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{audience.notIdealFor.slice(0,6).map(item=><Badge key={`not-${item}`} tone="rose">× {item}</Badge>)}</div></div>}{audience.caveats.length>0&&<div><div style={{fontSize:11,fontWeight:650,marginBottom:5}}>使用提醒</div>{audience.caveats.slice(0,4).map(item=><div key={`caveat-${item}`} style={{fontSize:10.5,color:MUTE,lineHeight:1.55,marginTop:3}}>· {item}</div>)}</div>}</section>}

    <section style={{ width:"100%", minWidth:0, boxSizing:"border-box", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 10, marginBottom: 14 }}>
      <div style={{ minWidth:0, boxSizing:"border-box", border: `1px solid ${rating.suitable ? SAGE : rating.stars > 0 ? ROSE : LINE}`, borderRadius: 16, padding: 15, background: rating.suitable ? "#EDF1EA" : rating.stars > 0 ? "#F6ECE8" : "rgba(255,255,255,.65)" }}>
        <div style={{ fontSize: 9.5, color: rating.suitable ? SAGE : rating.stars > 0 ? ROSE : MUTE, letterSpacing: ".08em", marginBottom: 7 }}>MATCH FOR YOU</div>
        {profile && rating.stars > 0 ? <><div style={{ fontSize: 23, letterSpacing: ".04em", marginBottom: 3 }}>{rating.starsText}</div><div style={{ fontSize: 12.5, fontWeight: 600, color: rating.suitable ? "#4E6254" : "#8E665F", marginBottom: 5 }}>{rating.label}{rating.bonus ? " · Bonus" : ""}</div><div style={{ fontSize: 10.5, color: MUTE, lineHeight: 1.5, marginBottom: 5 }}>{rating.detail}</div><div style={{ fontSize: 9.5, color: MUTE, lineHeight: 1.45 }}>3 星及以上 = 可以使用。星级只表示与你当前肤质和需求的匹配程度。</div></> : <><div style={{ fontSize: 18, marginBottom: 5 }}>{profile ? "证据不足" : "先建立肤质档案"}</div><div style={{ fontSize: 10.5, color: MUTE, lineHeight: 1.5 }}>{profile ? "现有配方证据不足，暂不强行给星级。" : "建立 Skin Profile 后可查看个人适配星级。"}</div></>}
      </div>
      <div style={{ minWidth:0, boxSizing:"border-box", border: `1px solid ${formula.tone === "good" ? SAGE : ROSE}`, borderRadius: 16, padding: 15, background: formula.tone === "good" ? "#F2F4EF" : "#F6ECE8" }}><div style={{ fontSize: 9.5, color: formula.tone === "good" ? SAGE : ROSE, letterSpacing: ".08em", marginBottom: 7 }}>FORMULA DATA</div><div style={{ fontSize: 17, marginBottom: 5 }}>{formula.label}</div><div style={{ fontSize: 10.5, color: MUTE, lineHeight: 1.5 }}>{formula.detail}</div><div style={{fontSize:10.5,color:MUTE,marginTop:6}}>数据可信度 · {confidenceFromCompleteness(current.dataCompleteness)}</div></div>
    </section>

    {match?.recommendationAvailable && <section style={{ width:"100%", minWidth:0, boxSizing:"border-box", border: `1px solid ${LINE}`, borderRadius: 17, padding: 17, background: "rgba(255,255,255,.68)", marginBottom: 12 }}><div style={{ fontSize: 10, color: SAGE, letterSpacing: ".08em", marginBottom: 10 }}>为什么这样判断</div>{match.positiveEvidence.slice(0, 3).map((evidence) => <div key={evidence.name} style={{ fontSize: 12, color: "#40594A", lineHeight: 1.55, marginBottom: 5 }}>✓ {evidence.name} · 配料位置靠前</div>)}{match.systemEvidence.slice(0, 2).map((evidence) => <div key={evidence.key} style={{ fontSize: 12, color: "#40594A", lineHeight: 1.55, marginBottom: 5 }}>✓ {evidence.label} 与你的目标一致</div>)}{match.negativeEvidence.slice(0, 3).map((evidence) => <div key={evidence.name} style={{ fontSize: 12, color: "#8A5F58", lineHeight: 1.55, marginTop: 5 }}>△ {evidence.name} · 需要考虑耐受</div>)}{match.formulaPenalty < 0 && <div style={{ fontSize: 12, color: "#8A5F58", lineHeight: 1.55, marginTop: 5 }}>△ 高位挥发性酒精对当前敏感/屏障目标不够友好</div>}</section>}

    <section style={{ width:"100%", minWidth:0, boxSizing:"border-box", border: `1px solid ${LINE}`, borderRadius: 17, padding: 17, background: "rgba(255,255,255,.68)", marginBottom: 12 }}><div style={{ fontSize: 10, color: MUTE, letterSpacing: ".08em", marginBottom: 10 }}>配方重点</div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{visibleSystems.slice(0,6).map(system=><Badge key={system.key} tone={system.score>=3?"sage":"neutral"}>{system.label} · {systemStrength(system.score)}</Badge>)}</div><div style={{ marginTop: 13, paddingTop: 11, borderTop: `1px solid ${LINE}`, display: "flex", gap: 6, flexWrap: "wrap" }}><Badge>{dna.baseType}</Badge>{dna.sensory.labels.map((label) => <Badge key={label}>{label}</Badge>)}<Badge tone={dna.alcohol.level === "high" ? "rose" : "sage"}>酒精 {dna.alcohol.level}</Badge></div></section>

    <section style={{ width:"100%", minWidth:0, boxSizing:"border-box", border: `1px solid ${LINE}`, borderRadius: 17, padding: 17, background: "rgba(255,255,255,.68)", marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", marginBottom: 9 }}><div style={{ fontSize: 10, color: MUTE, letterSpacing: ".08em" }}>完整成分 · 中英对应</div><div style={{ fontSize: 10, color: MUTE }}>{fullIngredients.length} ingredients</div></div>{loading ? <div style={{ fontSize: 11.5, color: MUTE }}>Loading the full stored formula…</div> : error ? <div style={{ fontSize: 11.5, color: ROSE }}>无法加载详情，暂时显示分析用前 15 位。</div> : null}<BilingualIngredientList ingredients={fullIngredients}/><div style={{ fontSize: 10.5, color: MUTE, lineHeight: 1.55, marginTop: 10 }}>标准 INCI 是主键；中文名、常用名和作用来自 Ingredient Dictionary。尚未映射的成分仍显示原始 INCI，不会临时让 LLM 猜翻译。</div></section>

    <section style={{ width:"100%", minWidth:0, boxSizing:"border-box", borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}`, padding: "16px 0", margin: "18px 0" }}><div style={{ fontSize: 9.5, color: SAGE, letterSpacing: ".08em", marginBottom: 6 }}>{brand.country} · {brand.segment}</div><div style={{ fontFamily: "'Newsreader', serif", fontSize: 22, marginBottom: 6 }}>About {brand.name}</div><div style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.6 }}>{brand.description}</div><div style={{ fontSize: 11.5, marginTop: 9 }}><b>Known for:</b> {brand.knownFor}</div><div style={{ fontSize: 11.5, marginTop: 5 }}><b>Best for:</b> {brand.bestFor}</div><div style={{ fontSize: 11.5, marginTop: 5 }}><b>Price:</b> {approximatePriceGuide(brand, product.category)}</div><div style={{ fontSize: 9.5, color: MUTE, lineHeight: 1.5, marginTop: 4 }}>这是帮助筛选预算的估算区间，不是实时售价；促销、容量和零售渠道会造成差异。</div></section>

    {(similar || budgetAlternative || premiumAlternative) && <section style={{ width:"100%", minWidth:0, boxSizing:"border-box", border: `1px solid ${LINE}`, borderRadius: 17, padding: 17, background: "rgba(255,255,255,.68)", marginBottom: 12 }}><div style={{ fontSize: 10, color: MUTE, letterSpacing: ".08em", marginBottom: 10 }}>ALTERNATIVES</div>{[{ label: "Similar formula match", candidate: similar }, { label: "Budget alternative", candidate: budgetAlternative }, { label: "Premium alternative", candidate: premiumAlternative }].map(({ label, candidate }) => candidate && <button key={`${label}-${candidate.id}`} onClick={() => onProduct(candidate, concern || "all")} style={{ width: "100%", minWidth:0, boxSizing:"border-box", border: 0, borderTop: `1px solid ${LINE}`, background: "transparent", padding: "10px 0", textAlign: "left", cursor: "pointer" }}><div style={{ fontSize: 9.5, color: SAGE, marginBottom: 3 }}>{label}</div><div style={{ fontSize: 11.5, overflowWrap:"anywhere" }}>{candidate.brand} · {candidate.productLocalName||candidate.name}</div></button>)}</section>}

    <section style={{ width:"100%", minWidth:0, boxSizing:"border-box", border: `1px solid ${LINE}`, borderRadius: 17, padding: 17, background: "rgba(255,255,255,.68)", marginBottom: 12 }}><div style={{ fontSize: 10, color: SAGE, letterSpacing: ".08em", marginBottom: 5 }}>真实使用体验</div><div style={{ fontFamily: "'Newsreader', serif", fontSize: 21, marginBottom: 5 }}>{experiences.length ? `${experiences.length} 位用户分享` : "还没有人分享"}</div><div style={{ fontSize: 10.5, color: MUTE, lineHeight: 1.5, marginBottom: 13 }}>{experiences.length ? `${improvedCount} 人认为皮肤有改善；按肤质查看个体体验，不把它当作医疗证据。` : "成为第一个分享真实使用感的人。"}</div>{experiences.map((item) => <article key={item.id} style={{ borderTop: `1px solid ${LINE}`, padding: "12px 0" }}><div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}><Badge tone="sage">{item.skinType}</Badge><Badge>{item.sensitivity}</Badge>{item.concerns.slice(0, 3).map((entry) => <Badge key={entry}>{entry}</Badge>)}</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: 10.5, marginBottom: item.note ? 7 : 0 }}><span>✓ {reactionLabel[item.reaction]}</span><span>· {textureLabel[item.texture]}</span><span>· {repurchaseLabel[item.repurchase]}</span></div>{item.note && <div style={{ fontSize: 11.5, color: "#514D45", lineHeight: 1.55 }}>{item.note}</div>}</article>)}</section>

    <section style={{ width:"100%", minWidth:0, boxSizing:"border-box", border: `1px solid ${LINE}`, borderRadius: 17, padding: 17, background: "rgba(255,255,255,.68)", marginBottom: 12 }}><div style={{ fontSize: 10, color: SAGE, letterSpacing: ".08em", marginBottom: 5 }}>分享你的使用体验</div><div style={{ fontSize: 10.5, color: MUTE, lineHeight: 1.5, marginBottom: 11 }}>匿名显示为：{profileSummary.skinType} · {profileSummary.sensitivity}{profileSummary.concerns.length ? ` · ${profileSummary.concerns.slice(0, 3).join(" / ")}` : ""}</div><div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 7, marginBottom: 8 }}><select aria-label="使用后的皮肤变化" value={reaction} onChange={(event) => setReaction(event.target.value as ProductReaction)}><option value="better">皮肤有改善</option><option value="neutral">没有明显变化</option><option value="irritated">出现刺激或不适</option></select><select aria-label="产品肤感" value={texture} onChange={(event) => setTexture(event.target.value as typeof texture)}><option value="love">喜欢肤感</option><option value="okay">肤感一般</option><option value="dislike">不喜欢肤感</option></select><select aria-label="是否回购" value={repurchase} onChange={(event) => setRepurchase(event.target.value as typeof repurchase)}><option value="yes">会回购</option><option value="maybe">可能回购</option><option value="no">不会回购</option></select></div><textarea maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="例如：用了多久、什么天气、是否闷痘或刺痛……" style={{ width: "100%", boxSizing: "border-box", minHeight: 78, resize: "vertical", border: `1px solid ${LINE}`, borderRadius: 10, padding: 9, fontSize: 11, marginBottom: 8 }}/><button disabled={feedbackStatus === "saving"} onClick={submitExperience} style={{ width: "100%", border: 0, borderRadius: 999, padding: 10, background: SAGE, color: "white", fontSize: 11, cursor: feedbackStatus === "saving" ? "wait" : "pointer", opacity: feedbackStatus === "saving" ? .65 : 1 }}>{feedbackStatus === "saving" ? "正在提交…" : feedbackStatus === "saved" ? "已公开，可继续修改" : "匿名公开我的体验"}</button>{feedbackMessage && <div style={{ fontSize: 9.5, color: feedbackStatus === "error" ? ROSE : SAGE, marginTop: 7 }}>{feedbackMessage}</div>}<div style={{ fontSize: 9.5, color: MUTE, marginTop: 7 }}>需要登录才能提交；不会公开姓名、邮箱或账号信息。</div></section>

    <a href={current.sourceUrl} target="_blank" rel="noreferrer" style={{ width: "100%", boxSizing: "border-box", borderRadius: 999, padding: "11px 14px", background: INK, color: "white", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 12 }}>View formula source / purchase page <ExternalLink size={13}/></a>
  </div></div>;
}
