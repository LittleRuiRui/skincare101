import React, { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import type { SharedProductRecord } from "../lib/supabase";
import type { SkinProfileRecord } from "../lib/skinProfile";
import { summarizeSkinProfile } from "../lib/skinProfile";
import { getBrandProfile } from "../data/brandProfiles";
import { formulaDataLabel, matchesSkinType, oneLineVerdict, personalizedScore, profileConcern, type BrowseConcern, type BrowseSkinType } from "../lib/productPresentation";

const INK = "#211F1B";
const PAPER = "#F7F3EC";
const LINE = "#DDD6CA";
const SAGE = "#718276";
const ROSE = "#C9958F";
const MUTE = "#777065";

const LUXURY = new Set(["Chanel", "Dior", "La Mer", "La Prairie", "SK-II", "Shiseido", "Lancôme", "Estée Lauder", "Clarins", "Guerlain", "Sisley", "Clé de Peau Beauté", "Helena Rubinstein"]);
const NICHE = new Set(["Facetheory", "The Inkey List", "Purito SEOUL", "mixsoon", "celimax", "haruharu wonder", "Abib", "numbuzin"]);
const SKIN_TYPES: Array<[BrowseSkinType, string]> = [["all", "All skin types"], ["dry", "Dry"], ["oily", "Oily"], ["combination", "Combination"], ["sensitive", "Sensitive"], ["acne", "Acne-prone"]];
const CONCERNS: Array<[BrowseConcern, string]> = [["all", "All concerns"], ["hydration", "Dehydration"], ["barrier", "Barrier"], ["redness", "Redness"], ["pores", "Pores"], ["acne", "Acne"], ["pigmentation", "Pigmentation"], ["aging", "Anti-aging"]];

export default function V3Explore({ products, profile, onBack, onProduct }: { products: SharedProductRecord[]; profile: SkinProfileRecord | null; onBack: () => void; onProduct: (product: SharedProductRecord, concern: BrowseConcern) => void; }) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("All brands");
  const [category, setCategory] = useState("All categories");
  const [skinType, setSkinType] = useState<BrowseSkinType>("all");
  const [concern, setConcern] = useState<BrowseConcern>(profile ? profileConcern(profile) : "all");
  const [sort, setSort] = useState<"match" | "brand" | "quality">(profile ? "match" : "quality");
  const [edit, setEdit] = useState<"all" | "luxury" | "niche">("all");
  const [visible, setVisible] = useState(40);
  const summary = summarizeSkinProfile(profile);
  const brands = useMemo(() => ["All brands", ...Array.from(new Set(products.map((p) => p.brand))).sort()], [products]);
  const categories = useMemo(() => ["All categories", ...Array.from(new Set(products.map((p) => p.category))).sort()], [products]);
  const selectedBrand = brand === "All brands" ? null : getBrandProfile(brand);
  const selectedBrandCount = brand === "All brands" ? 0 : products.filter((product) => product.brand === brand).length;

  const filtered = useMemo(() => {
    const rows = products.filter((p) => {
      const q = query.trim().toLowerCase();
      if (q && !`${p.brand} ${p.name}`.toLowerCase().includes(q)) return false;
      if (brand !== "All brands" && p.brand !== brand) return false;
      if (category !== "All categories" && p.category !== category) return false;
      if (!matchesSkinType(p, skinType)) return false;
      if (edit === "luxury" && !LUXURY.has(p.brand)) return false;
      if (edit === "niche" && !NICHE.has(p.brand)) return false;
      return true;
    }).map((product) => ({ product, match: personalizedScore(product, profile, concern) }));
    return rows.sort((a, b) => {
      if (sort === "brand") return `${a.product.brand} ${a.product.name}`.localeCompare(`${b.product.brand} ${b.product.name}`);
      if (sort === "quality") return b.product.dataCompleteness - a.product.dataCompleteness;
      if (a.match?.recommendationAvailable !== b.match?.recommendationAvailable) return a.match?.recommendationAvailable ? -1 : 1;
      return (b.match?.score || 0) - (a.match?.score || 0) || b.product.dataCompleteness - a.product.dataCompleteness;
    });
  }, [products, query, brand, category, skinType, concern, sort, edit, profile]);

  const selectStyle = { minWidth: 0, border: `1px solid ${LINE}`, borderRadius: 11, padding: 10, background: "white", fontSize: 11.5 } as const;
  return <div style={{ minHeight: "100vh", background: PAPER, color: INK, padding: "22px 16px 50px" }}><div style={{ maxWidth: 680, margin: "0 auto" }}>
    <button onClick={onBack} style={{ border: 0, background: "transparent", padding: 0, color: MUTE, fontSize: 12, cursor: "pointer", marginBottom: 22, display: "flex", gap: 6, alignItems: "center" }}><ArrowLeft size={14}/> Home</button>
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: SAGE, fontSize: 9.5, letterSpacing: ".1em", marginBottom: 7 }}>EXPLORE SKINCARE</div>
    <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 35, fontWeight: 500, margin: "0 0 7px" }}>Find products.<br/><i>Keep the context.</i></h1>
    <p style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.6, margin: "0 0 19px" }}>{profile ? `For You 已连接：${summary.skinType} · ${summary.sensitivity}${summary.concerns.length ? ` · ${summary.concerns.join(" / ")}` : ""}` : "你可以按品牌、肤质、问题和类别浏览；建档后会增加个人匹配排序。"}</p>

    <div style={{ display: "flex", gap: 7, marginBottom: 12, overflowX: "auto" }}>{[["all","All"],["luxury","Luxury Edit"],["niche","Niche Finds"]].map(([key,label]) => <button key={key} onClick={() => setEdit(key as "all" | "luxury" | "niche")} style={{ border: `1px solid ${edit === key ? INK : LINE}`, borderRadius: 999, padding: "7px 10px", background: edit === key ? INK : "rgba(255,255,255,.55)", color: edit === key ? "white" : INK, fontSize: 11.5, cursor: "pointer", whiteSpace: "nowrap" }}>{label}</button>)}</div>
    <div style={{ position: "relative", marginBottom: 9 }}><Search size={15} color={MUTE} style={{ position: "absolute", left: 12, top: 12 }}/><input value={query} onChange={(e) => { setQuery(e.target.value); setVisible(40); }} placeholder="Search brand or product" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${LINE}`, borderRadius: 12, background: "rgba(255,255,255,.72)", padding: "11px 12px 11px 36px", fontSize: 12.5 }}/></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginBottom: 8 }}>
      <select aria-label="Brand" value={brand} onChange={(e) => { setBrand(e.target.value); setVisible(40); }} style={selectStyle}>{brands.map((x) => <option key={x}>{x}</option>)}</select>
      <select aria-label="Skin type" value={skinType} onChange={(e) => { setSkinType(e.target.value as BrowseSkinType); setVisible(40); }} style={selectStyle}>{SKIN_TYPES.map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select>
      <select aria-label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setVisible(40); }} style={selectStyle}>{categories.map((x) => <option key={x}>{x}</option>)}</select>
      <select aria-label="Concern" value={concern} onChange={(e) => { setConcern(e.target.value as BrowseConcern); setVisible(40); }} style={selectStyle}>{CONCERNS.map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 5 }}><div style={{ fontSize: 10.5, color: MUTE }}>{filtered.length} full-formula products</div><select aria-label="Sort products" value={sort} onChange={(e) => setSort(e.target.value as "match" | "brand" | "quality")} style={{ border: 0, background: "transparent", color: MUTE, fontSize: 10.5 }}><option value="match">Best for me</option><option value="quality">Best formula data</option><option value="brand">Brand A–Z</option></select></div>
    <div style={{ fontSize: 9.5, color: MUTE, lineHeight: 1.5, marginBottom: 13 }}>Only products with a complete stored INCI appear here. Formula analysis uses the first 10–15 ingredients; storage does not truncate the formula.</div>

    {selectedBrand && <section style={{ borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}`, padding: "15px 0", marginBottom: 13 }}><div style={{ fontSize: 9.5, color: SAGE, marginBottom: 5 }}>{selectedBrand.country} · {selectedBrand.segment} · {selectedBrandCount} full-formula products</div><div style={{ fontFamily: "'Newsreader', serif", fontSize: 22, marginBottom: 5 }}>{selectedBrand.name}</div><div style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.6 }}>{selectedBrand.description}</div><div style={{ display: "grid", gap: 5, fontSize: 11.5, marginTop: 9 }}><div><b>Known for:</b> {selectedBrand.knownFor}</div><div><b>适合：</b>{selectedBrand.bestFor}</div><div><b>定位：</b>{selectedBrand.pricePositioning}</div></div></section>}

    <div style={{ display: "grid", gap: 9 }}>{filtered.slice(0, visible).map(({ product: p, match }) => { const formula = formulaDataLabel(p); return <button key={p.id} onClick={() => onProduct(p, concern)} style={{ border: `1px solid ${LINE}`, borderRadius: 15, background: "rgba(255,255,255,.68)", padding: "14px 15px", textAlign: "left", cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><div style={{ minWidth: 0 }}><div style={{ fontSize: 10, color: LUXURY.has(p.brand) ? ROSE : SAGE, letterSpacing: ".06em", marginBottom: 4 }}>{p.brand}</div><div style={{ fontFamily: "'Newsreader', serif", fontSize: 18, lineHeight: 1.2, marginBottom: 6 }}>{p.name}</div></div>{match?.recommendationAvailable && <div style={{ flexShrink: 0, textAlign: "right" }}><div style={{ fontFamily: "'Newsreader', serif", fontSize: 22, color: SAGE }}>{match.score}%</div><div style={{ fontSize: 8.5, color: MUTE }}>MATCH FOR YOU</div></div>}</div>
      <div style={{ fontSize: 11.5, color: "#514D45", lineHeight: 1.55, marginBottom: 8 }}>{oneLineVerdict(p)}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}><span style={{ fontSize: 10.5, color: MUTE }}>{p.category}</span><span style={{ color: LINE }}>·</span><span style={{ fontSize: 10.5, color: formula.tone === "good" ? SAGE : ROSE }}>{formula.label}</span>{p.popularityTier === "retailer-bestseller" && <span style={{ fontSize: 9, color: MUTE }}>POPULAR</span>}</div>
    </button>; })}</div>
    {filtered.length > visible && <button onClick={() => setVisible((count) => count + 40)} style={{ width: "100%", marginTop: 12, border: `1px solid ${LINE}`, background: "rgba(255,255,255,.65)", borderRadius: 999, padding: 10, color: INK, fontSize: 11.5, cursor: "pointer" }}>Show 40 more</button>}
  </div></div>;
}
