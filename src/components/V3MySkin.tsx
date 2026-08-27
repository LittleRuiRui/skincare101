import React from "react";
import { ArrowLeft, ChevronRight, FlaskConical, ListChecks, Search, Sparkles } from "lucide-react";
import type { SkinProfileRecord } from "../lib/skinProfile";
import { summarizeSkinProfile } from "../lib/skinProfile";

const INK = "#211F1B";
const PAPER = "#F7F3EC";
const LINE = "#DDD6CA";
const SAGE = "#718276";
const ROSE = "#C9958F";
const MUTE = "#777065";

function Chip({ children }: { children: React.ReactNode }) {
  return <span style={{ display: "inline-flex", border: `1px solid ${LINE}`, borderRadius: 999, padding: "6px 9px", background: "rgba(255,255,255,.6)", fontSize: 11.5, color: INK }}>{children}</span>;
}

export default function V3MySkin({ profile, onBack, onRetake, onFindProducts, onBuildRoutine, onOpenLegacyReport }: { profile: SkinProfileRecord | null; onBack: () => void; onRetake: () => void; onFindProducts: () => void; onBuildRoutine: () => void; onOpenLegacyReport: () => void; }) {
  const summary = summarizeSkinProfile(profile);

  return (
    <div style={{ minHeight: "100vh", background: PAPER, color: INK, padding: "22px 16px 48px" }}>
      <div style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
        <button onClick={onBack} style={{ border: 0, padding: 0, background: "transparent", display: "inline-flex", alignItems: "center", gap: 6, color: MUTE, fontSize: 12, cursor: "pointer", marginBottom: 24 }}><ArrowLeft size={14} /> 返回首页</button>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: ".1em", color: SAGE, marginBottom: 8 }}>MY SKIN</div>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, fontSize: 35, lineHeight: 1.04, margin: "0 0 8px" }}>我的肌肤，<br /><i>接下来怎么做</i></h1>
        <p style={{ margin: "0 0 25px", color: MUTE, fontSize: 12.5, lineHeight: 1.6 }}>这里是你的唯一主页面：先看档案，再看成分方向、产品推荐和日常步骤。</p>

        {!profile ? (
          <section style={{ border: `1px solid ${ROSE}`, background: "#F6ECE8", borderRadius: 18, padding: 19 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><Sparkles size={15} color={ROSE} /><b style={{ fontSize: 13 }}>还没有保存的 Skin Profile</b></div>
            <p style={{ fontSize: 12, color: MUTE, lineHeight: 1.6, margin: "0 0 14px" }}>完成肤质分析并登录保存后，这里会成为你的长期 My Skin 页面。</p>
            <button onClick={onRetake} style={{ border: 0, borderRadius: 999, padding: "9px 14px", background: INK, color: "white", fontSize: 12, cursor: "pointer" }}>Analyze my skin</button>
          </section>
        ) : (
          <>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: ".1em", color: SAGE, marginBottom: 8 }}>01 · 我的档案</div>
            <section style={{ borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}`, padding: "18px 0", marginBottom: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><div style={{ fontSize: 10, color: MUTE, marginBottom: 4 }}>SKIN TYPE</div><div style={{ fontFamily: "'Newsreader', serif", fontSize: 21 }}>{summary.skinType}</div></div>
                <div><div style={{ fontSize: 10, color: MUTE, marginBottom: 4 }}>SENSITIVITY</div><div style={{ fontFamily: "'Newsreader', serif", fontSize: 21 }}>{summary.sensitivity}</div></div>
              </div>
            </section>

            <section style={{ border: `1px solid ${LINE}`, borderRadius: 17, padding: 17, background: "rgba(255,255,255,.62)", marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: MUTE, letterSpacing: ".08em", marginBottom: 10 }}>CURRENT CONCERNS</div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {summary.concerns.length ? summary.concerns.map((item) => <Chip key={item}>{item}</Chip>) : <span style={{ fontSize: 12, color: MUTE }}>暂未记录主要问题</span>}
              </div>
              {summary.context.length > 0 && <div style={{ marginTop: 13, paddingTop: 12, borderTop: `1px solid ${LINE}`, fontSize: 11.5, color: "#795F55", lineHeight: 1.6 }}>{summary.context.join(" · ")}</div>}
            </section>

            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: ".1em", color: SAGE, margin: "25px 0 8px" }}>02 · 成分方向</div>
            <button onClick={onOpenLegacyReport} style={{ width: "100%", border: `1px solid ${SAGE}`, background: "#EDF1EA", borderRadius: 15, padding: "15px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left", cursor: "pointer", color: INK, marginBottom: 8 }}><span style={{ display: "flex", alignItems: "flex-start", gap: 10 }}><FlaskConical size={16} color={SAGE} /><span><b style={{ display: "block", fontSize: 13, marginBottom: 4 }}>我应该找什么成分、避开什么</b><span style={{ fontSize: 11.5, color: MUTE }}>按你的问题查看配方体系与判断依据</span></span></span><ChevronRight size={15} /></button>

            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: ".1em", color: SAGE, margin: "25px 0 8px" }}>03 · 产品推荐</div>
            <button onClick={onFindProducts} style={{ width: "100%", border: `1px solid ${ROSE}`, background: "#F4EAE7", borderRadius: 15, padding: "15px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left", cursor: "pointer", color: INK, marginBottom: 8 }}><span style={{ display: "flex", alignItems: "flex-start", gap: 10 }}><Search size={16} color={ROSE} /><span><b style={{ display: "block", fontSize: 13, marginBottom: 4 }}>查看为我排序的产品</b><span style={{ fontSize: 11.5, color: MUTE }}>先看最佳匹配，再看替代与不同预算</span></span></span><ChevronRight size={15} /></button>

            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: ".1em", color: SAGE, margin: "25px 0 8px" }}>04 · 我的 ROUTINE</div>
            <button onClick={onBuildRoutine} style={{ width: "100%", border: `1px solid ${LINE}`, background: "rgba(255,255,255,.65)", borderRadius: 15, padding: "15px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left", cursor: "pointer", color: INK, marginBottom: 8 }}><span style={{ display: "flex", alignItems: "flex-start", gap: 10 }}><ListChecks size={16} color={MUTE} /><span><b style={{ display: "block", fontSize: 13, marginBottom: 4 }}>组合早晚护肤步骤</b><span style={{ fontSize: 11.5, color: MUTE }}>把推荐放进真正可执行的顺序里</span></span></span><ChevronRight size={15} /></button>
            <button onClick={onRetake} style={{ width: "100%", border: 0, background: "transparent", color: MUTE, padding: 10, fontSize: 11.5, cursor: "pointer" }}>重新分析并更新档案</button>

            {profile.updatedAt && <div style={{ marginTop: 14, textAlign: "center", fontSize: 10, color: MUTE }}>Profile updated {new Date(profile.updatedAt).toLocaleDateString()}</div>}
          </>
        )}
      </div>
    </div>
  );
}
