import React from "react";
import { ChevronRight, FlaskConical, Search, Sparkles, UserRound } from "lucide-react";
import type { SkinProfileRecord } from "../lib/skinProfile";

const INK = "#211F1B";
const PAPER = "#F7F3EC";
const LINE = "#DDD6CA";
const SAGE = "#718276";
const ROSE = "#C9958F";
const MUTE = "#777065";

function DoodleFace() {
  return (
    <svg viewBox="0 0 180 150" aria-hidden="true" style={{ width: 155, maxWidth: "42vw" }}>
      <path d="M83 17c-29 5-48 30-47 61 1 33 22 58 49 60 27 2 51-24 54-59 3-34-22-68-56-62Z" fill="none" stroke={INK} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M65 68c6-4 12-4 18 0M101 68c6-4 12-4 18 0M91 73c-3 10-4 17 2 20M76 104c10 7 22 7 32-1" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M51 48c9-23 34-33 57-25M129 42c10 11 15 27 13 42" fill="none" stroke={SAGE} strokeWidth="3" strokeLinecap="round" />
      <path d="M45 93c-12-2-18-8-22-17M137 100c13-2 20-7 25-16" fill="none" stroke={ROSE} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="29" cy="70" r="3" fill={ROSE} /><circle cx="158" cy="78" r="3" fill={SAGE} />
      <path d="M23 58l-8-7M159 63l8-9M32 111l-7 9" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function NavPill({ children, onClick, active = false }: any) {
  return <button onClick={onClick} style={{ border: `1px solid ${active ? INK : LINE}`, borderRadius: 999, padding: "7px 11px", background: active ? INK : "rgba(255,255,255,.55)", color: active ? "#fff" : INK, fontSize: 11.5, cursor: "pointer", whiteSpace: "nowrap" }}>{children}</button>;
}

function FeatureCard({ eyebrow, title, body, onClick, accent = SAGE }: any) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", border: `1px solid ${LINE}`, borderRadius: 18, padding: "18px 18px 17px", background: "rgba(255,255,255,.72)", cursor: "pointer", boxShadow: "0 10px 30px rgba(60,50,35,.035)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: ".1em", color: accent, textTransform: "uppercase", marginBottom: 7 }}>{eyebrow}</div>
          <div style={{ fontFamily: "'Newsreader', serif", fontSize: 20, lineHeight: 1.15, color: INK, marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: 12, lineHeight: 1.55, color: MUTE }}>{body}</div>
        </div>
        <ChevronRight size={17} color={accent} style={{ marginTop: 3, flexShrink: 0 }} />
      </div>
    </button>
  );
}

function ProfileChooser({ profile, profiles, onChoose, onCreate }: { profile: SkinProfileRecord | null; profiles: SkinProfileRecord[]; onChoose: (id: string) => void; onCreate: () => void }) {
  return <section style={{ border: `1px solid ${profile ? SAGE : ROSE}`, borderRadius: 15, padding: 14, background: profile ? "#EEF1EB" : "#F6ECE8", marginBottom: 22 }}>
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: ".1em", color: profile ? SAGE : ROSE, marginBottom: 7 }}>CURRENT SKIN PROFILE</div>
    {profiles.length ? <div style={{ display: "flex", gap: 8 }}>
      <select value={profile?.id || ""} onChange={(event) => onChoose(event.target.value)} aria-label="选择当前护肤档案" style={{ minWidth: 0, flex: 1, border: `1px solid ${LINE}`, borderRadius: 10, padding: "10px 11px", background: "white", color: INK, fontSize: 12 }}>
        {profiles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <button onClick={onCreate} style={{ border: `1px solid ${INK}`, borderRadius: 999, padding: "9px 13px", background: INK, color: "white", fontSize: 11, cursor: "pointer" }}>＋ 新建</button>
    </div> : <div><div style={{ fontFamily: "'Newsreader', serif", fontSize: 20, marginBottom: 8 }}>先选择服务对象</div><div style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.5, marginBottom: 11 }}>产品匹配和 Routine 都会使用当前档案，不会混用不同人的肤质。</div><button onClick={onCreate} style={{ border: 0, borderRadius: 999, padding: "9px 14px", background: INK, color: "white", fontSize: 11.5, cursor: "pointer" }}>建立第一份档案</button></div>}
  </section>;
}

export default function V3Home({ goTo, profile = null, profiles = [], onChooseProfile, onCreateProfile, productCount = 0 }: { goTo: (target: string) => void; profile: SkinProfileRecord | null; profiles: SkinProfileRecord[]; onChooseProfile: (id: string) => void; onCreateProfile: () => void; productCount?: number }) {
  const hasProfile = Boolean(profile);
  return (
    <div style={{ padding: "10px 0 46px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <div><div style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600, letterSpacing: "-.02em" }}>Skincare101</div><div style={{ fontSize: 9.5, letterSpacing: ".12em", color: MUTE }}>YOUR SKIN, EXPLAINED</div></div>
        <button onClick={() => goTo("mySkin")} style={{ border: `1px solid ${LINE}`, borderRadius: 999, width: 36, height: 36, background: "rgba(255,255,255,.7)", display: "grid", placeItems: "center", cursor: "pointer" }} aria-label="My Skin"><UserRound size={16} /></button>
      </header>

      <ProfileChooser profile={profile} profiles={profiles} onChoose={onChooseProfile} onCreate={onCreateProfile} />

      <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 5, marginBottom: 28, scrollbarWidth: "none" }}>
        <NavPill active onClick={() => {}}>For You</NavPill><NavPill onClick={() => goTo("quickRecommend")}>Explore</NavPill><NavPill onClick={() => goTo("quickRecommend")}>Brands</NavPill><NavPill onClick={() => goTo("quickRecommend")}>Concerns</NavPill><NavPill onClick={() => goTo("quickRecommend")}>Luxury Edit</NavPill><NavPill onClick={() => goTo("quickRecommend")}>Niche Finds</NavPill>
      </div>

      <section style={{ position: "relative", borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}`, padding: "25px 0 24px", marginBottom: 26, minHeight: 175 }}>
        <div style={{ width: "65%" }}><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: SAGE, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 9 }}>Personal skincare intelligence</div><h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 34, fontWeight: 500, lineHeight: 1.03, letterSpacing: "-.025em", margin: "0 0 12px" }}>Understand your skin.<br /><i>Then choose better.</i></h1><p style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.55, margin: 0 }}>不是给产品一个万能分数，而是告诉你：它适不适合你的皮肤，以及为什么。</p></div>
        <div style={{ position: "absolute", right: -8, bottom: 5 }}><DoodleFace /></div>
      </section>

      {hasProfile ? <section style={{ border: `1px solid ${SAGE}`, borderRadius: 18, padding: 18, background: "#EEF1EB", marginBottom: 14 }}><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: ".1em", color: SAGE, marginBottom: 7 }}>MY SKIN PROFILE</div><div style={{ fontFamily: "'Newsreader', serif", fontSize: 22, marginBottom: 7 }}>Your skin profile is connected.</div><div style={{ fontSize: 12, lineHeight: 1.55, color: "#59645B", marginBottom: 13 }}>接下来的产品匹配、成分分析和护理建议都会优先读取这份 Profile。</div><button onClick={() => goTo("mySkin")} style={{ border: 0, padding: 0, background: "transparent", color: INK, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View My Skin →</button></section> : <section style={{ border: `1px solid ${ROSE}`, borderRadius: 18, padding: 18, background: "#F6ECE8", marginBottom: 14 }}><div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}><Sparkles size={15} color={ROSE} /><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: ".1em", color: "#9B6E68" }}>START HERE</span></div><div style={{ fontFamily: "'Newsreader', serif", fontSize: 23, marginBottom: 7 }}>Build your Skin Profile</div><div style={{ fontSize: 12, lineHeight: 1.55, color: MUTE, marginBottom: 14 }}>先建立肤质、敏感度和主要问题。完成后，这份档案会成为后续推荐的共同起点。</div><button onClick={() => goTo("skin")} style={{ border: `1px solid ${INK}`, borderRadius: 999, padding: "9px 14px", background: INK, color: "#fff", fontSize: 12, cursor: "pointer" }}>Analyze my skin</button></section>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        <FeatureCard eyebrow="For you" title="Find my products" body="根据 Skin Profile 或你的目标筛选，而不是固定展示三款。" onClick={() => goTo("recommend")} />
        <FeatureCard eyebrow="Routine" title="Build my routine" body="从问题出发，组合 AM / PM 护肤步骤。" onClick={() => goTo("routine")} accent={ROSE} />
        <FeatureCard eyebrow="Formula" title="Analyze a product" body="拍配料表或从数据库选择，解释适合与风险。" onClick={() => goTo(hasProfile ? "upload" : "quickIngredient")} accent="#9B805A" />
        <FeatureCard eyebrow="Explore" title="Browse the library" body={`${productCount || "持续扩充"} 款产品 · 品牌 / 肤质 / 问题 / 类型`} onClick={() => goTo("quickRecommend")} accent="#6D7588" />
      </div>

      <section style={{ borderTop: `1px solid ${LINE}`, paddingTop: 18 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}><div><div style={{ fontFamily: "'Newsreader', serif", fontSize: 21 }}>Explore the edit</div><div style={{ fontSize: 11.5, color: MUTE }}>不把所有品牌混成一锅</div></div><Search size={16} color={MUTE} /></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>{[['Luxury Edit','高端护肤到底贵在哪里？','#EEE7DE'],['Niche Finds','小众，但要有值得被发现的理由','#E8EDE7'],['By Concern','毛孔 · 泛红 · 屏障 · 抗老','#EFE9E8'],['By Brand','从品牌进入完整产品线','#E9EBEF']].map(([title, body, bg]) => <button key={title} onClick={() => goTo("quickRecommend")} style={{ minHeight: 105, textAlign: "left", border: `1px solid ${LINE}`, borderRadius: 15, padding: 14, background: bg, cursor: "pointer" }}><div style={{ fontFamily: "'Newsreader', serif", fontSize: 17, marginBottom: 5 }}>{title}</div><div style={{ fontSize: 11, color: MUTE, lineHeight: 1.45 }}>{body}</div></button>)}</div></section>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 22, paddingTop: 15, borderTop: `1px solid ${LINE}`, color: MUTE, fontSize: 10.5, lineHeight: 1.45 }}><FlaskConical size={13} /> Product data supports decisions; your Skin Profile provides the context.</div>
    </div>
  );
}

