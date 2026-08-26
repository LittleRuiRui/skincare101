import React, { useMemo, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import type { SkinProfileRecord } from "../lib/skinProfile";
import { summarizeSkinProfile } from "../lib/skinProfile";
import type { SharedProductRecord } from "../lib/supabase";
import { rankForProfile, type BrowseConcern } from "../lib/productPresentation";
import { priceTierForBrand, type ProductPriceTier } from "../data/brandProfiles";
import { buildRoutine, categoryForRoutineStep, routineGuardrails, ROUTINE_GOALS, ROUTINE_TEMPLATES, type ActiveTolerance, type RoutineComplexity, type RoutineGoal } from "../intelligence/routineEngine";

const INK = "#211F1B", PAPER = "#F7F3EC", LINE = "#DDD6CA", SAGE = "#718276", ROSE = "#C9958F", MUTE = "#777065";

export default function V3RoutineBuilder({ profile, products, onBack, onExplore, onProduct }: { profile: SkinProfileRecord | null; products: SharedProductRecord[]; onBack: () => void; onExplore: () => void; onProduct: (product: SharedProductRecord, concern: BrowseConcern) => void; }) {
  const [goal, setGoal] = useState<RoutineGoal>("Barrier");
  const [complexity, setComplexity] = useState<RoutineComplexity>("standard");
  const [tolerance, setTolerance] = useState<ActiveTolerance>("beginner");
  const [budget, setBudget] = useState<ProductPriceTier | "all">("all");
  const summary = summarizeSkinProfile(profile);
  const routine = useMemo(() => buildRoutine(goal, complexity), [goal, complexity]);
  const concern = ROUTINE_TEMPLATES[goal].concern;
  const guardrails = routineGuardrails(profile, goal, tolerance);
  const ranked = useMemo(() => rankForProfile(products, profile, concern).filter((product) => product.recommendationAvailable), [products, profile, concern]);

  function recommendationsFor(step: string) {
    const candidates = ranked.filter((product) => product.category === categoryForRoutineStep(step));
    const preferred = budget === "all" ? candidates : candidates.filter((product) => priceTierForBrand(product.brand) === budget);
    const pool = preferred.length ? preferred : candidates;
    return { best: pool[0], alternative: pool.find((product) => product.brand !== pool[0]?.brand), budget: candidates.find((product) => priceTierForBrand(product.brand) === "budget"), premium: candidates.find((product) => priceTierForBrand(product.brand) === "premium") };
  }

  const chip = (selected: boolean) => ({ border: `1px solid ${selected ? INK : LINE}`, borderRadius: 999, padding: "7px 10px", background: selected ? INK : "rgba(255,255,255,.55)", color: selected ? "white" : INK, fontSize: 11.5, cursor: "pointer" }) as const;
  const selectStyle = { border: `1px solid ${LINE}`, borderRadius: 11, padding: 10, background: "white", fontSize: 11 } as const;

  return <div style={{ minHeight: "100vh", background: PAPER, color: INK, padding: "22px 16px 50px" }}><div style={{ maxWidth: 560, margin: "0 auto" }}>
    <button onClick={onBack} style={{ border: 0, background: "transparent", padding: 0, color: MUTE, fontSize: 12, cursor: "pointer", marginBottom: 22, display: "flex", gap: 6, alignItems: "center" }}><ArrowLeft size={14}/> Home</button>
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: ROSE, fontSize: 9.5, letterSpacing: ".1em", marginBottom: 7 }}>BUILD MY ROUTINE</div>
    <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 35, fontWeight: 500, margin: "0 0 7px" }}>Start with the problem.<br/><i>Keep your skin as the constraint.</i></h1>
    <p style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.6, margin: "0 0 20px" }}>{profile ? `Using your profile: ${summary.skinType} · ${summary.sensitivity}` : "没有 Skin Profile 时可以先 DIY；建档后系统会增加耐受和敏感限制。"}</p>
    <div style={{ fontSize: 10, color: MUTE, marginBottom: 8 }}>WHAT DO YOU WANT TO IMPROVE?</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18 }}>{ROUTINE_GOALS.map((item) => <button key={item} onClick={() => setGoal(item)} style={chip(goal === item)}>{item}</button>)}</div>
    <div style={{ display: "flex", gap: 7, marginBottom: 10 }}><button onClick={() => setComplexity("minimal")} style={{ ...chip(complexity === "minimal"), flex: 1, borderRadius: 12 }}>Minimal routine</button><button onClick={() => setComplexity("standard")} style={{ ...chip(complexity === "standard"), flex: 1, borderRadius: 12 }}>Standard routine</button></div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}><select aria-label="Active tolerance" value={tolerance} onChange={(event) => setTolerance(event.target.value as ActiveTolerance)} style={selectStyle}><option value="none">No active tolerance</option><option value="beginner">Active beginner</option><option value="experienced">Experienced with actives</option></select><select aria-label="Budget" value={budget} onChange={(event) => setBudget(event.target.value as ProductPriceTier | "all")} style={selectStyle}><option value="all">Any budget</option><option value="budget">Budget</option><option value="mid">Mid-range</option><option value="premium">Premium</option></select></div>
    {profile?.skinAnswers?.sensitive === "yes" && <div style={{ border: `1px solid ${ROSE}`, background: "#F6ECE8", borderRadius: 14, padding: "11px 13px", fontSize: 11.5, color: "#775D59", lineHeight: 1.55, marginBottom: 13 }}>Your sensitivity profile is active. Strong acids and retinoids are introduced conservatively rather than simply maximizing efficacy.</div>}
    {[["AM", routine.am], ["PM", routine.pm]].map(([period, steps]) => <section key={period as string} style={{ border: `1px solid ${LINE}`, borderRadius: 17, padding: 17, background: "rgba(255,255,255,.65)", marginBottom: 10 }}><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: ".08em", color: period === "AM" ? SAGE : ROSE, marginBottom: 11 }}>{period as string} ROUTINE</div>{(steps as string[]).map((step, index) => { const choices = recommendationsFor(step); return <div key={step} style={{ padding: "10px 0", borderTop: index ? `1px solid ${LINE}` : "none" }}><div style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ width: 21, height: 21, border: `1px solid ${LINE}`, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 9.5, color: MUTE }}>{index + 1}</span><span style={{ fontSize: 12.5 }}>{step}</span></div>{choices.best && <div style={{ margin: "8px 0 0 31px", display: "grid", gap: 4 }}><button onClick={() => onProduct(choices.best, concern)} style={{ border: 0, padding: 0, background: "transparent", color: SAGE, textAlign: "left", fontSize: 10.8, cursor: "pointer" }}>Best match: {choices.best.brand} · {choices.best.name} ({choices.best.score}%) →</button>{choices.alternative && <button onClick={() => onProduct(choices.alternative!, concern)} style={{ border: 0, padding: 0, background: "transparent", color: MUTE, textAlign: "left", fontSize: 10.2, cursor: "pointer" }}>Alternative: {choices.alternative.brand} · {choices.alternative.name}</button>}<div style={{ display: "flex", gap: 10 }}>{choices.budget && <button onClick={() => onProduct(choices.budget!, concern)} style={{ border: 0, padding: 0, background: "transparent", color: MUTE, fontSize: 9.8, cursor: "pointer" }}>Budget option</button>}{choices.premium && <button onClick={() => onProduct(choices.premium!, concern)} style={{ border: 0, padding: 0, background: "transparent", color: MUTE, fontSize: 9.8, cursor: "pointer" }}>Premium option</button>}</div></div>}</div>; })}</section>)}
    <div style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.6, margin: "13px 0 10px" }}>{routine.note}</div>
    <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 11, marginBottom: 16 }}>{guardrails.map((note) => <div key={note} style={{ fontSize: 10.5, color: MUTE, lineHeight: 1.55, marginBottom: 5 }}>△ {note}</div>)}</div>
    <button onClick={onExplore} style={{ width: "100%", border: 0, borderRadius: 999, padding: "11px 14px", background: INK, color: "white", fontSize: 12, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 7 }}><Check size={14}/> Find products for these steps</button>
  </div></div>;
}
