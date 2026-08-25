import React, { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import type { SharedProductRecord } from "../lib/supabase";
import type { SkinProfileRecord } from "../lib/skinProfile";
import { summarizeSkinProfile } from "../lib/skinProfile";

const INK = "#211F1B";
const PAPER = "#F7F3EC";
const LINE = "#DDD6CA";
const SAGE = "#718276";
const ROSE = "#C9958F";
const MUTE = "#777065";

const LUXURY = new Set(["Chanel", "Dior", "La Mer", "La Prairie", "SK-II", "Shiseido", "Lancôme", "Estée Lauder", "Clarins", "Guerlain", "Sisley", "Clé de Peau Beauté", "Helena Rubinstein"]);
const NICHE = new Set(["Facetheory", "The Inkey List", "Purito SEOUL", "mixsoon", "celimax", "haruharu wonder", "Abib", "numbuzin"]);

function confidenceLabel(product: SharedProductRecord) {
  if (product.ingredientListType === "full" && product.dataCompleteness >= 90) return "Full formula";
  if (product.ingredientListType === "full") return "Formula available";
  if (product.dataCompleteness > 0) return "Partial formula";
  return "Formula pending";
}

export default function V3Explore({ products, profile, onBack, onProduct }: { products: SharedProductRecord[]; profile: SkinProfileRecord | null; onBack: () => void; onProduct: (product: SharedProductRecord) => void; }) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("All brands");
  const [category, setCategory] = useState("All categories");
  const [edit, setEdit] = useState<"all" | "luxury" | "niche">("all");
  const summary = summarizeSkinProfile(profile);

  const brands = useMemo(() => ["All brands", ...Array.from(new Set(products.map((p) => p.brand))).sort()], [products]);
  const categories = useMemo(() => ["All categories", ...Array.from(new Set(products.map((p) => p.category))).sort()], [products]);

  const filtered = useMemo(() => products.filter((p) => {
    const q = query.trim().toLowerCase();
    if (q && !`${p.brand} ${p.name}`.toLowerCase().includes(q)) return false;
    if (brand !== "All brands" && p.brand !== brand) return false;
    if (category !== "All categories" && p.category !== category) return false;
    if (edit === "luxury" && !LUXURY.has(p.brand)) return false;
    if (edit === "niche" && !NICHE.has(p.brand)) return false;
    return true;
  }), [products, query, brand, category, edit]);

  return <div style={{ minHeight: "100vh", background: PAPER, color: INK, padding: "22px 16px 50px" }}><div style={{ maxWidth: 620, margin: "0 auto" }}>
    <button onClick={onBack} style={{ border: 0, background: "transparent", padding: 0, color: MUTE, fontSize: 12, cursor: "pointer", marginBottom: 22, display: "flex", gap: 6, alignItems: "center" }}><ArrowLeft size={14}/> Home</button>
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: SAGE, fontSize: 9.5, letterSpacing: ".1em", marginBottom: 7 }}>EXPLORE SKINCARE</div>
    <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 35, fontWeight: 500, margin: "0 0 7px" }}>Browse with context.</h1>
    <p style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.6, margin: "0 0 19px" }}>{profile ? `你的 Profile 已连接：${summary.skinType} · ${summary.sensitivity}${summary.concerns.length ? ` · ${summary.concerns.join(" / ")}` : ""}` : "你也可以先浏览；建立 Skin Profile 后会增加 For You 排序。"}</p>

    <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
      {[["all","All"],["luxury","Luxury Edit"],["niche","Niche Finds"]].map(([key,label]) => <button key={key} onClick={() => setEdit(key as any)} style={{ border: `1px solid ${edit === key ? INK : LINE}`, borderRadius: 999, padding: "7px 10px", background: edit === key ? INK : "rgba(255,255,255,.55)", color: edit === key ? "white" : INK, fontSize: 11.5, cursor: "pointer" }}>{label}</button>)}
    </div>

    <div style={{ position: "relative", marginBottom: 9 }}><Search size={15} color={MUTE} style={{ position: "absolute", left: 12, top: 12 }}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search brand or product" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${LINE}`, borderRadius: 12, background: "rgba(255,255,255,.72)", padding: "11px 12px 11px 36px", fontSize: 12.5 }}/></div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 15 }}>
      <select value={brand} onChange={(e) => setBrand(e.target.value)} style={{ minWidth: 0, border: `1px solid ${LINE}`, borderRadius: 11, padding: "10px", background: "white", fontSize: 11.5 }}>{brands.map((x) => <option key={x}>{x}</option>)}</select>
      <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ minWidth: 0, border: `1px solid ${LINE}`, borderRadius: 11, padding: "10px", background: "white", fontSize: 11.5 }}>{categories.map((x) => <option key={x}>{x}</option>)}</select>
    </div>
    <div style={{ fontSize: 10.5, color: MUTE, marginBottom: 10 }}>{filtered.length} products</div>

    <div style={{ display: "grid", gap: 9 }}>{filtered.slice(0,80).map((p) => <button key={p.id} onClick={() => onProduct(p)} style={{ border: `1px solid ${LINE}`, borderRadius: 15, background: "rgba(255,255,255,.66)", padding: "14px 15px", textAlign: "left", cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><div><div style={{ fontSize: 10, color: LUXURY.has(p.brand) ? ROSE : SAGE, letterSpacing: ".06em", marginBottom: 4 }}>{p.brand}</div><div style={{ fontFamily: "'Newsreader', serif", fontSize: 18, lineHeight: 1.2, marginBottom: 5 }}>{p.name}</div><div style={{ fontSize: 11, color: MUTE }}>{p.category} · {confidenceLabel(p)}</div></div><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: MUTE, whiteSpace: "nowrap" }}>{p.popularityTier === "retailer-bestseller" ? "POPULAR" : ""}</div></div>
    </button>)}</div>
    {filtered.length > 80 && <div style={{ textAlign: "center", color: MUTE, fontSize: 11, padding: 16 }}>Showing first 80 results · refine filters to narrow the library</div>}
  </div></div>;
}
