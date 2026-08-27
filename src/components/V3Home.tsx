import React from "react";
import { ChevronRight, Clock3, FlaskConical, ShieldCheck, Sparkles, UserRound, WandSparkles } from "lucide-react";
import type { SkinProfileRecord } from "../lib/skinProfile";

const INK = "#24231F";
const PAPER = "#F7F5F0";
const CARD = "#FCFBF8";
const LINE = "#E4E0D8";
const SAGE = "#66786E";
const MUTE = "#817D75";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";

function ProfileChooser({ profile, profiles, onChoose, onCreate }: { profile: SkinProfileRecord | null; profiles: SkinProfileRecord[]; onChoose: (id: string) => void; onCreate: () => void }) {
  return <section style={{ border: `1px solid ${LINE}`, borderRadius: 20, padding: 15, background: CARD, marginBottom: 24 }}>
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", color: SAGE, marginBottom: 9 }}>CURRENT SKIN PROFILE</div>
    {profiles.length ? <div style={{ display: "flex", gap: 8 }}>
      <select value={profile?.id || ""} onChange={(event) => onChoose(event.target.value)} aria-label="选择当前护肤档案" style={{ minWidth: 0, flex: 1, border: `1px solid ${LINE}`, borderRadius: 13, padding: "11px 12px", background: "#fff", color: INK, fontFamily: SANS, fontSize: 13 }}>
        {profiles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <button onClick={onCreate} style={{ border: 0, borderRadius: 13, padding: "10px 14px", background: INK, color: "white", fontFamily: SANS, fontSize: 12, cursor: "pointer" }}>＋ 新建</button>
    </div> : <div><div style={{ fontSize: 18, fontWeight: 600, marginBottom: 7 }}>先建立一份肤质档案</div><div style={{ fontSize: 13, color: MUTE, lineHeight: 1.55, marginBottom: 12 }}>推荐、成分判断和 Routine 都会使用同一份 Skin Profile。</div><button onClick={onCreate} style={{ border: 0, borderRadius: 13, padding: "10px 15px", background: INK, color: "white", fontFamily: SANS, fontSize: 12, cursor: "pointer" }}>建立第一份档案</button></div>}
  </section>;
}

function CoreCard({ icon, eyebrow, title, body, onClick, disabled = false }: any) {
  return <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{ width: "100%", textAlign: "left", border: `1px solid ${LINE}`, borderRadius: 22, padding: "19px 18px", background: CARD, cursor: disabled ? "default" : "pointer", opacity: disabled ? .48 : 1, boxShadow: "0 2px 12px rgba(40,38,32,.025)", fontFamily: SANS }}>
    <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
      <div style={{ width: 42, height: 42, borderRadius: 14, background: "#F0F2EE", display: "grid", placeItems: "center", color: SAGE, flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".1em", color: MUTE, marginBottom: 5 }}>{eyebrow}</div>
        <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-.02em", lineHeight: 1.2, color: INK, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: MUTE, lineHeight: 1.55 }}>{body}</div>
      </div>
      {!disabled && <ChevronRight size={18} color={MUTE} style={{ flexShrink: 0 }} />}
    </div>
  </button>;
}

export default function V3Home({ goTo, profile = null, profiles = [], onChooseProfile, onCreateProfile }: { goTo: (target: string) => void; profile: SkinProfileRecord | null; profiles: SkinProfileRecord[]; onChooseProfile: (id: string) => void; onCreateProfile: () => void }) {
  const hasProfile = Boolean(profile);
  return (
    <div style={{ padding: "16px 0 54px", fontFamily: SANS, color: INK, background: PAPER }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div><div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.035em" }}>Skincare101</div><div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: ".14em", color: MUTE, marginTop: 2 }}>YOUR SKIN, EXPLAINED</div></div>
        <button onClick={() => goTo("account")} style={{ border: `1px solid ${LINE}`, borderRadius: 14, width: 40, height: 40, background: CARD, display: "grid", placeItems: "center", cursor: "pointer", color: INK }} aria-label="Account"><UserRound size={17} /></button>
      </header>

      {!hasProfile && <button onClick={() => goTo("account")} style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 14, padding: "10px 13px", background: CARD, color: MUTE, fontFamily: SANS, fontSize: 12, cursor: "pointer", marginBottom: 18 }}>已经建过档？用邮箱找回 →</button>}
      {hasProfile && <ProfileChooser profile={profile} profiles={profiles} onChoose={onChooseProfile} onCreate={onCreateProfile} />}

      <section style={{ padding: "12px 2px 25px", marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 650, color: SAGE, letterSpacing: ".1em", marginBottom: 12 }}>PERSONAL SKINCARE, WITHOUT THE NOISE</div>
        <h1 style={{ fontSize: 34, fontWeight: 650, lineHeight: 1.13, letterSpacing: "-.045em", margin: "0 0 14px", maxWidth: 330 }}>看懂你的皮肤，<br />再决定用什么。</h1>
        <p style={{ fontSize: 14, color: MUTE, lineHeight: 1.65, margin: 0, maxWidth: 355 }}>一份肤质档案，贯穿产品匹配、成分判断和早晚 Routine。减少重复入口，也不让评分互相打架。</p>
      </section>

      <div style={{ display: "flex", gap: 18, color: MUTE, fontSize: 11.5, margin: "0 2px 27px", flexWrap: "wrap" }}><span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Clock3 size={13} /> 约3分钟建档</span><span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><ShieldCheck size={13} /> 不是医疗诊断</span></div>

      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", color: MUTE, margin: "0 2px 12px" }}>EXPLORE</div>
      <div style={{ display: "grid", gap: 11 }}>
        <CoreCard icon={<UserRound size={18}/>} eyebrow="01  MY SKIN" title="我的肤质" body={hasProfile ? "查看肤质档案、当前需求和分析结果" : "完成肤质分析，建立统一 Skin Profile"} onClick={hasProfile ? () => goTo("mySkin") : onCreateProfile} />
        <CoreCard icon={<Sparkles size={18}/>} eyebrow="02  FOR YOU" title="为你推荐" body={hasProfile ? "搜索产品，并按统一五星匹配度查看推荐" : "建立肤质档案后解锁个人推荐"} onClick={() => goTo("recommend")} disabled={!hasProfile} />
        <CoreCard icon={<FlaskConical size={18}/>} eyebrow="03  INGREDIENT CHECK" title="查成分 / 查产品" body="搜索单个成分，或拍摄配料表分析整瓶产品" onClick={() => goTo("upload")} />
        <CoreCard icon={<WandSparkles size={18}/>} eyebrow="04  ROUTINE" title="我的早晚 Routine" body={hasProfile ? "把适合你的产品整理成简单清晰的早晚流程" : "建立肤质档案后生成 Routine"} onClick={() => goTo("routine")} disabled={!hasProfile} />
      </div>
    </div>
  );
}
