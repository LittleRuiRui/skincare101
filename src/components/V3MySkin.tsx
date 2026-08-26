import React from "react";
import { ArrowLeft, ChevronRight, FileDown, Sparkles } from "lucide-react";
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
        <button onClick={onBack} style={{ border: 0, padding: 0, background: "transparent", display: "inline-flex", alignItems: "center", gap: 6, color: MUTE, fontSize: 12, cursor: "pointer", marginBottom: 24 }}><ArrowLeft size={14} /> Back</button>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: ".1em", color: SAGE, marginBottom: 8 }}>MY SKIN</div>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, fontSize: 35, lineHeight: 1.04, margin: "0 0 8px" }}>Your skin profile,<br /><i>not another quiz result.</i></h1>
        <p style={{ margin: "0 0 25px", color: MUTE, fontSize: 12.5, lineHeight: 1.6 }}>这份档案是后续产品推荐、Routine 和成分判断的共同上下文。你更新它，后面的建议也应该一起变化。</p>

        {!profile ? (
          <section style={{ border: `1px solid ${ROSE}`, background: "#F6ECE8", borderRadius: 18, padding: 19 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><Sparkles size={15} color={ROSE} /><b style={{ fontSize: 13 }}>还没有保存的 Skin Profile</b></div>
            <p style={{ fontSize: 12, color: MUTE, lineHeight: 1.6, margin: "0 0 14px" }}>完成肤质分析并登录保存后，这里会成为你的长期 My Skin 页面。</p>
            <button onClick={onRetake} style={{ border: 0, borderRadius: 999, padding: "9px 14px", background: INK, color: "white", fontSize: 12, cursor: "pointer" }}>Analyze my skin</button>
          </section>
        ) : (
          <>
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

            <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
              <button onClick={onFindProducts} style={{ border: `1px solid ${SAGE}`, borderRadius: 16, background: "#EDF1EA", padding: 15, textAlign: "left", cursor: "pointer" }}><div style={{ fontSize: 10, color: SAGE, marginBottom: 6 }}>FOR YOU</div><div style={{ fontFamily: "'Newsreader', serif", fontSize: 18, marginBottom: 5 }}>Find my products</div><div style={{ display: "flex", justifyContent: "space-between", color: MUTE, fontSize: 11 }}>用这份 Profile 匹配 <ChevronRight size={14} /></div></button>
              <button onClick={onBuildRoutine} style={{ border: `1px solid ${ROSE}`, borderRadius: 16, background: "#F4EAE7", padding: 15, textAlign: "left", cursor: "pointer" }}><div style={{ fontSize: 10, color: ROSE, marginBottom: 6 }}>ROUTINE</div><div style={{ fontFamily: "'Newsreader', serif", fontSize: 18, marginBottom: 5 }}>Build my routine</div><div style={{ display: "flex", justifyContent: "space-between", color: MUTE, fontSize: 11 }}>从问题和耐受出发 <ChevronRight size={14} /></div></button>
            </section>

            <button onClick={onOpenLegacyReport} style={{ width: "100%", border: `1px solid ${LINE}`, background: "rgba(255,255,255,.6)", borderRadius: 13, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", color: INK, marginBottom: 8 }}><span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}><FileDown size={14} /> 查看完整分析 / 导出 PDF</span><ChevronRight size={14} /></button>
            <button onClick={onRetake} style={{ width: "100%", border: 0, background: "transparent", color: MUTE, padding: 10, fontSize: 11.5, cursor: "pointer" }}>重新分析并更新档案</button>

            {profile.updatedAt && <div style={{ marginTop: 14, textAlign: "center", fontSize: 10, color: MUTE }}>Profile updated {new Date(profile.updatedAt).toLocaleDateString()}</div>}
          </>
        )}
      </div>
    </div>
  );
}
