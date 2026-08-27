import React from "react";
import { ChevronRight, Clock3, FlaskConical, Search, ShieldCheck, Sparkles, UserRound, WandSparkles } from "lucide-react";
import type { SkinProfileRecord } from "../lib/skinProfile";

const INK = "#211F1B";
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
    </svg>
  );
}

function ProfileChooser({ profile, profiles, onChoose, onCreate }: { profile: SkinProfileRecord | null; profiles: SkinProfileRecord[]; onChoose: (id: string) => void; onCreate: () => void }) {
  return <section style={{ border: `1px solid ${profile ? SAGE : ROSE}`, borderRadius: 15, padding: 14, background: profile ? "#EEF1EB" : "#F6ECE8", marginBottom: 20 }}>
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: ".1em", color: profile ? SAGE : ROSE, marginBottom: 7 }}>CURRENT SKIN PROFILE</div>
    {profiles.length ? <div style={{ display: "flex", gap: 8 }}>
      <select value={profile?.id || ""} onChange={(event) => onChoose(event.target.value)} aria-label="选择当前护肤档案" style={{ minWidth: 0, flex: 1, border: `1px solid ${LINE}`, borderRadius: 10, padding: "10px 11px", background: "white", color: INK, fontSize: 12 }}>
        {profiles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <button onClick={onCreate} style={{ border: `1px solid ${INK}`, borderRadius: 999, padding: "9px 13px", background: INK, color: "white", fontSize: 11, cursor: "pointer" }}>＋ 新建</button>
    </div> : <div><div style={{ fontFamily: "'Newsreader', serif", fontSize: 20, marginBottom: 8 }}>先建立一份肤质档案</div><div style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.5, marginBottom: 11 }}>推荐、成分判断和 Routine 都会使用同一份 Skin Profile。</div><button onClick={onCreate} style={{ border: 0, borderRadius: 999, padding: "9px 14px", background: INK, color: "white", fontSize: 11.5, cursor: "pointer" }}>建立第一份档案</button></div>}
  </section>;
}

function CoreCard({ icon, eyebrow, title, body, onClick, accent = SAGE, disabled = false }: any) {
  return <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{ width: "100%", textAlign: "left", border: `1px solid ${LINE}`, borderRadius: 16, padding: "16px", background: "rgba(255,255,255,.72)", cursor: disabled ? "default" : "pointer", opacity: disabled ? .55 : 1 }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 12, border: `1px solid ${accent}`, display: "grid", placeItems: "center", color: accent, flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: ".1em", color: accent, marginBottom: 5 }}>{eyebrow}</div>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 19, lineHeight: 1.15, marginBottom: 5 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.5 }}>{body}</div>
      </div>
      {!disabled && <ChevronRight size={16} color={accent} style={{ marginTop: 7, flexShrink: 0 }} />}
    </div>
  </button>;
}

export default function V3Home({ goTo, profile = null, profiles = [], onChooseProfile, onCreateProfile }: { goTo: (target: string) => void; profile: SkinProfileRecord | null; profiles: SkinProfileRecord[]; onChooseProfile: (id: string) => void; onCreateProfile: () => void }) {
  const hasProfile = Boolean(profile);
  return (
    <div style={{ padding: "10px 0 46px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <div><div style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600, letterSpacing: "-.02em" }}>Skincare101</div><div style={{ fontSize: 9.5, letterSpacing: ".12em", color: MUTE }}>YOUR SKIN, EXPLAINED</div></div>
        <button onClick={() => goTo("account")} style={{ border: `1px solid ${LINE}`, borderRadius: 999, width: 36, height: 36, background: "rgba(255,255,255,.7)", display: "grid", placeItems: "center", cursor: "pointer" }} aria-label="Account"><UserRound size={16} /></button>
      </header>

      {!hasProfile && <button onClick={() => goTo("account")} style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 999, padding: "9px 13px", background: "rgba(255,255,255,.58)", color: MUTE, fontSize: 11.5, cursor: "pointer", marginBottom: 18 }}>已经建过档？用邮箱找回 →</button>}
      {hasProfile && <ProfileChooser profile={profile} profiles={profiles} onChoose={onChooseProfile} onCreate={onCreateProfile} />}

      <section style={{ position: "relative", borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}`, padding: "25px 0", marginBottom: 22, minHeight: 190 }}>
        <div style={{ width: "68%" }}><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: SAGE, letterSpacing: ".1em", marginBottom: 9 }}>ONE SKIN PROFILE · ONE MATCHING SYSTEM</div><h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 34, fontWeight: 500, lineHeight: 1.04, margin: "0 0 12px" }}>Tell us your skin.<br/><i>We do the matching.</i></h1><p style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.58, margin: 0 }}>看懂肤质 → 检查正在用的产品 → 找到更适合你的选择 → 建立早晚 Routine。</p></div>
        <div style={{ position: "absolute", right: -8, bottom: 3 }}><DoodleFace /></div>
      </section>

      <div style={{ display: "flex", gap: 16, color: MUTE, fontSize: 10.5, marginBottom: 18, flexWrap: "wrap" }}><span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><Clock3 size={12} /> 约3分钟建档</span><span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><ShieldCheck size={12} /> 不是医疗诊断</span></div>

      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: ".1em", color: MUTE, marginBottom: 10 }}>四个核心入口</div>
      <div style={{ display: "grid", gap: 9 }}>
        <CoreCard icon={<UserRound size={16}/>} eyebrow="01 · MY SKIN" title="我的肤质" body={hasProfile ? "查看当前肤质档案、主要需求与分析结果。" : "先完成肤质分析，建立之后所有功能共用的 Skin Profile。"} onClick={hasProfile ? () => goTo("mySkin") : onCreateProfile} />
        <CoreCard icon={<Sparkles size={16}/>} eyebrow="02 · FOR YOU" title="为你推荐" body={hasProfile ? "搜索产品或浏览个人推荐；统一显示五星匹配度。" : "建立肤质档案后解锁个人推荐。"} onClick={() => goTo("recommend")} disabled={!hasProfile} accent="#9B805A" />
        <CoreCard icon={<FlaskConical size={16}/>} eyebrow="03 · INGREDIENT CHECK" title="查成分 / 查一瓶产品" body="搜单个成分，或拍照 / 从相册读取整瓶配料表。" onClick={() => goTo("upload")} accent="#8A6A74" />
        <CoreCard icon={<WandSparkles size={16}/>} eyebrow="04 · ROUTINE" title="我的早晚 Routine" body={hasProfile ? "把适合你的产品组合成清晰的早晚护肤流程。" : "建立肤质档案后再生成 Routine。"} onClick={() => goTo("routine")} disabled={!hasProfile} accent="#637D77" />
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 20, paddingTop: 15, borderTop: `1px solid ${LINE}`, color: MUTE, fontSize: 10.5, lineHeight: 1.45 }}><Search size={13} /> 品牌、Luxury、Trending 等浏览都收进「为你推荐」，不再占首页入口。</div>
    </div>
  );
}
