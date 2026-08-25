import React, { useMemo, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import type { SkinProfileRecord } from "../lib/skinProfile";
import { summarizeSkinProfile } from "../lib/skinProfile";
import type { SharedProductRecord } from "../lib/supabase";
import { rankForProfile, type BrowseConcern } from "../lib/productPresentation";

const INK = "#211F1B";
const PAPER = "#F7F3EC";
const LINE = "#DDD6CA";
const SAGE = "#718276";
const ROSE = "#C9958F";
const MUTE = "#777065";

const GOALS = ["Acne", "Blackheads", "Pores", "Redness", "Barrier", "Dehydration", "Pigmentation", "Dullness", "Fine lines", "Firmness", "Oil control"];

const TEMPLATES: Record<string, { am: string[]; pm: string[]; note: string }> = {
  Acne: { am: ["Gentle cleanser", "Light moisturizer", "Broad-spectrum SPF"], pm: ["Cleanser", "BHA or acne treatment", "Barrier-support moisturizer"], note: "先控制刺激总量，不把所有祛痘活性叠在同一晚。" },
  Pores: { am: ["Gentle cleanser", "Niacinamide / lightweight serum", "SPF"], pm: ["Cleanser", "BHA 2–3× weekly", "Light moisturizer"], note: "毛孔外观更依赖油脂、角栓和光损伤管理，而不是‘收缩毛孔’。" },
  Redness: { am: ["Low-irritation cleanser", "Soothing serum", "Barrier moisturizer", "SPF"], pm: ["Gentle cleanse", "Barrier serum", "Moisturizer"], note: "泛红优先稳定屏障和触发因素，再考虑更积极的功效。" },
  Barrier: { am: ["Rinse / gentle cleanser", "Humectant serum", "Ceramide moisturizer", "SPF"], pm: ["Gentle cleanser", "Barrier serum", "Ceramide-rich moisturizer"], note: "屏障期减少酸、A醇和频繁更换产品。" },
  Dehydration: { am: ["Gentle cleanser", "Humectant serum", "Moisturizer", "SPF"], pm: ["Cleanser", "Hydrating essence / serum", "Moisturizer"], note: "缺水不等于缺油；油皮也可以脱水。" },
  Pigmentation: { am: ["Gentle cleanser", "Vitamin C / brightening serum", "SPF"], pm: ["Cleanser", "Tranexamic acid / retinoid depending on tolerance", "Moisturizer"], note: "色沉方案里防晒是主步骤，不是最后补的一步。" },
  "Fine lines": { am: ["Hydrating serum", "Antioxidant serum", "Moisturizer", "SPF"], pm: ["Cleanser", "Retinoid if tolerated", "Moisturizer"], note: "先把缺水细纹和真正的结构性细纹分开。" },
};

const GOAL_CONCERN: Record<string, BrowseConcern> = { Acne: "acne", Blackheads: "pores", Pores: "pores", Redness: "redness", Barrier: "barrier", Dehydration: "hydration", Pigmentation: "pigmentation", Dullness: "pigmentation", "Fine lines": "aging", Firmness: "aging", "Oil control": "pores" };

function categoryForStep(step: string) {
  const value = step.toLowerCase();
  if (value.includes("clean")) return "洁面";
  if (value.includes("spf")) return "防晒";
  if (value.includes("moistur")) return "乳霜";
  if (value.includes("bha") || value.includes("treatment") || value.includes("retinoid")) return "祛痘";
  return "精华";
}

export default function V3RoutineBuilder({ profile, products, onBack, onExplore, onProduct }: { profile: SkinProfileRecord | null; products: SharedProductRecord[]; onBack: () => void; onExplore: () => void; onProduct: (product: SharedProductRecord, concern: BrowseConcern) => void; }) {
  const [goal, setGoal] = useState("Barrier");
  const [complexity, setComplexity] = useState<"minimal" | "standard">("standard");
  const summary = summarizeSkinProfile(profile);
  const base = TEMPLATES[goal] || { am: ["Gentle cleanser", "Targeted serum", "Moisturizer", "SPF"], pm: ["Cleanser", "Targeted treatment", "Moisturizer"], note: "根据耐受度逐步增加功效步骤。" };

  const routine = useMemo(() => {
    if (complexity === "standard") return base;
    return { ...base, am: base.am.filter((x) => !x.toLowerCase().includes("serum") && !x.toLowerCase().includes("essence")), pm: base.pm.filter((x) => !x.toLowerCase().includes("serum") && !x.toLowerCase().includes("essence")) };
  }, [base, complexity]);

  const sensitiveConstraint = profile?.skinAnswers?.sensitive === "yes";
  const selectedConcern = GOAL_CONCERN[goal] || "barrier";
  const rankedProducts = useMemo(() => rankForProfile(
    products.filter((product) => product.ingredientListType === "full" && product.dataCompleteness >= 85),
    profile,
    selectedConcern,
  ).filter((product) => product.recommendationAvailable), [products, profile, selectedConcern]);
  const productForStep = (step: string) => rankedProducts.find((product) => product.category === categoryForStep(step));

  return <div style={{ minHeight: "100vh", background: PAPER, color: INK, padding: "22px 16px 50px" }}><div style={{ maxWidth: 560, margin: "0 auto" }}>
    <button onClick={onBack} style={{ border: 0, background: "transparent", padding: 0, color: MUTE, fontSize: 12, cursor: "pointer", marginBottom: 22, display: "flex", gap: 6, alignItems: "center" }}><ArrowLeft size={14}/> Home</button>
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: ROSE, fontSize: 9.5, letterSpacing: ".1em", marginBottom: 7 }}>BUILD MY ROUTINE</div>
    <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 35, fontWeight: 500, margin: "0 0 7px" }}>Start with the problem.<br/><i>Keep your skin as the constraint.</i></h1>
    <p style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.6, margin: "0 0 20px" }}>{profile ? `Using your profile: ${summary.skinType} · ${summary.sensitivity}` : "没有 Skin Profile 时可以先 DIY；建档后系统会增加耐受和敏感限制。"}</p>

    <div style={{ fontSize: 10, color: MUTE, marginBottom: 8 }}>WHAT DO YOU WANT TO IMPROVE?</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18 }}>{GOALS.map((x) => <button key={x} onClick={() => setGoal(x)} style={{ border: `1px solid ${goal === x ? INK : LINE}`, borderRadius: 999, padding: "7px 10px", background: goal === x ? INK : "rgba(255,255,255,.55)", color: goal === x ? "white" : INK, fontSize: 11.5, cursor: "pointer" }}>{x}</button>)}</div>

    <div style={{ display: "flex", gap: 7, marginBottom: 18 }}><button onClick={() => setComplexity("minimal")} style={{ flex: 1, border: `1px solid ${complexity === "minimal" ? SAGE : LINE}`, borderRadius: 12, padding: 10, background: complexity === "minimal" ? "#EDF1EA" : "white", fontSize: 11.5, cursor: "pointer" }}>Minimal routine</button><button onClick={() => setComplexity("standard")} style={{ flex: 1, border: `1px solid ${complexity === "standard" ? SAGE : LINE}`, borderRadius: 12, padding: 10, background: complexity === "standard" ? "#EDF1EA" : "white", fontSize: 11.5, cursor: "pointer" }}>Standard routine</button></div>

    {sensitiveConstraint && <div style={{ border: `1px solid ${ROSE}`, background: "#F6ECE8", borderRadius: 14, padding: "11px 13px", fontSize: 11.5, color: "#775D59", lineHeight: 1.55, marginBottom: 13 }}>Your sensitivity profile is active. Strong acids / retinoids should be introduced more conservatively rather than simply maximizing efficacy.</div>}

    {[["AM", routine.am],["PM", routine.pm]].map(([period, steps]: any) => <section key={period} style={{ border: `1px solid ${LINE}`, borderRadius: 17, padding: 17, background: "rgba(255,255,255,.65)", marginBottom: 10 }}><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: ".08em", color: period === "AM" ? SAGE : ROSE, marginBottom: 11 }}>{period} ROUTINE</div>{steps.map((step: string, i: number) => { const recommendation = productForStep(step); return <div key={step} style={{ padding: "10px 0", borderTop: i ? `1px solid ${LINE}` : "none" }}><div style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ width: 21, height: 21, border: `1px solid ${LINE}`, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 9.5, color: MUTE }}>{i+1}</span><span style={{ fontSize: 12.5 }}>{step}</span></div>{recommendation && <button onClick={() => onProduct(recommendation, selectedConcern)} style={{ margin: "8px 0 0 31px", border: 0, padding: 0, background: "transparent", color: SAGE, textAlign: "left", fontSize: 10.8, lineHeight: 1.45, cursor: "pointer" }}>Best verified match: {recommendation.brand} · {recommendation.name} ({recommendation.score}%) →</button>}</div>; })}</section>)}

    <div style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.6, margin: "13px 0 16px" }}>{routine.note}</div>
    <button onClick={onExplore} style={{ width: "100%", border: 0, borderRadius: 999, padding: "11px 14px", background: INK, color: "white", fontSize: 12, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 7 }}><Check size={14}/> Find products for these steps</button>
  </div></div>;
}
