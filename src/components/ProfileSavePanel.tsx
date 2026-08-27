import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  currentSession,
  saveMySkinProfile,
  signInWithPassword,
  signUpWithPassword,
  supabase,
  type SkinProfileInput,
} from "../lib/supabase";
import {
  clearPendingProfileDraft,
  loadPendingProfileDraftRecord,
  savePendingProfileDraft,
} from "../lib/profileDraft";
import { saveLocalSkinProfile } from "../lib/mySkin";

const INK = "#1C1B19";
const LINE = "#E4E1DA";
const TEAL = "#3D6B63";
const TEAL_SOFT = "#E8EEEC";
const MUTE = "#8A8579";
const RUST = "#A8503A";
const EMAIL_COOLDOWN_KEY = "skincare101.auth-email-cooldown-until";

const SPECIAL_STATES = [
  { key: "acid", label: "正在刷酸 / 去角质", detail: "AHA、BHA、PHA、磨砂或焕肤类产品" },
  { key: "retinoid", label: "正在使用 A 醇 / 维A类", detail: "Retinol、Retinal 或其他维A类护理" },
  { key: "sensitive_flare", label: "最近明显敏感 / 屏障不稳定", detail: "刺痛、紧绷、脱皮或异常泛红" },
  { key: "procedure_recovery", label: "近期做过医美 / 焕肤项目", detail: "激光、光子、微针、化学焕肤等恢复期" },
  { key: "breakout", label: "目前处于爆痘期", detail: "比平时明显更多的粉刺、丘疹或炎症痘" },
  { key: "environment_change", label: "最近环境明显变化", detail: "换季、旅行、搬家、温湿度或空调环境改变" },
  { key: "pregnancy_breastfeeding", label: "孕期 / 哺乳期", detail: "推荐会采用更保守的成分筛选" },
] as const;

type SpecialStateKey = typeof SPECIAL_STATES[number]["key"];

function storedCooldown(): number {
  try { return Number(localStorage.getItem(EMAIL_COOLDOWN_KEY) || 0); } catch { return 0; }
}

function timestampLabel(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function suggestedProfileName(states: SpecialStateKey[], acidFrequency: string, retinoidStage: string, environmentDirection: string): string {
  let prefix = "肤质档案";
  if (states.includes("sensitive_flare")) prefix = "敏感恢复期";
  else if (states.includes("procedure_recovery")) prefix = "医美恢复期";
  else if (states.includes("acid")) prefix = acidFrequency === "high" ? "高频刷酸期" : "刷酸期";
  else if (states.includes("retinoid")) prefix = retinoidStage === "starting" || retinoidStage === "increased" ? "A醇适应期" : "A醇使用期";
  else if (states.includes("breakout")) prefix = "爆痘期";
  else if (states.includes("environment_change")) prefix = environmentDirection === "hot_humid" ? "闷热潮湿期" : environmentDirection === "cold_dry" ? "干冷环境期" : "环境变化期";
  else if (states.includes("pregnancy_breastfeeding")) prefix = "孕哺期";
  return `${prefix} · ${timestampLabel()}`;
}

interface Props {
  profile: SkinProfileInput;
}

export default function ProfileSavePanel({ profile }: Props) {
  const initialStates = (profile.profileAnswers?.special_states || "").split(",").filter(Boolean) as SpecialStateKey[];
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [specialStates, setSpecialStates] = useState<SpecialStateKey[]>(initialStates);
  const [acidFrequency, setAcidFrequency] = useState(profile.profileAnswers?.acid_frequency || "regular");
  const [retinoidStage, setRetinoidStage] = useState(profile.profileAnswers?.retinoid_stage || "stable");
  const [environmentDirection, setEnvironmentDirection] = useState(profile.profileAnswers?.environment_direction || "other");
  const [profileName, setProfileName] = useState(() => suggestedProfileName(initialStates, profile.profileAnswers?.acid_frequency || "regular", profile.profileAnswers?.retinoid_stage || "stable", profile.profileAnswers?.environment_direction || "other"));
  const [nameEdited, setNameEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldownUntil] = useState(storedCooldown);
  const [clock, setClock] = useState(Date.now());
  const savingPendingRef = useRef(false);
  const localSavedRef = useRef(false);

  const cooldownMs = Math.max(0, cooldownUntil - clock);
  const enrichedProfile = useMemo<SkinProfileInput>(() => ({
    ...profile,
    profileAnswers: {
      ...(profile.profileAnswers || {}),
      special_states: specialStates.join(","),
      acid_frequency: specialStates.includes("acid") ? acidFrequency : "",
      retinoid_stage: specialStates.includes("retinoid") ? retinoidStage : "",
      environment_direction: specialStates.includes("environment_change") ? environmentDirection : "",
      pregnancy: specialStates.includes("pregnancy_breastfeeding") ? "yes" : profile.profileAnswers?.pregnancy || "",
    },
  }), [profile, specialStates, acidFrequency, retinoidStage, environmentDirection]);

  useEffect(() => {
    if (!nameEdited) setProfileName(suggestedProfileName(specialStates, acidFrequency, retinoidStage, environmentDirection));
  }, [specialStates, acidFrequency, retinoidStage, environmentDirection, nameEdited]);

  useEffect(() => {
    if (!cooldownMs) return;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [cooldownMs > 0]);

  useEffect(() => {
    async function handleSession(nextSession: Session | null) {
      setSession(nextSession);
      const pending = nextSession ? loadPendingProfileDraftRecord() : null;
      if (!pending || savingPendingRef.current) return;
      savingPendingRef.current = true;
      setBusy(true);
      try {
        await saveMySkinProfile(pending.profile, pending.name || suggestedProfileName([], "regular", "stable", "other"));
        clearPendingProfileDraft();
        setMessage("账号已登录，本次问卷也已自动同步为你的皮肤档案。");
      } catch (err: any) {
        setError(err?.message || "账号已登录，但自动建立档案失败，请再点一次保存。");
      } finally {
        savingPendingRef.current = false;
        setBusy(false);
      }
    }

    currentSession().then(handleSession).catch(() => setSession(null));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setTimeout(() => handleSession(nextSession), 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (localSavedRef.current) return;
    localSavedRef.current = true;
    saveLocalSkinProfile(enrichedProfile, profileName);
    setMessage("已自动保存在此设备。你可以补充当前特殊状态，再保存更新。 ");
  }, [profile]);

  function toggleState(key: SpecialStateKey) {
    setSpecialStates(items => items.includes(key) ? items.filter(item => item !== key) : [...items, key]);
  }

  async function authenticateAccount() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      saveLocalSkinProfile(enrichedProfile, profileName);
      savePendingProfileDraft(enrichedProfile, profileName);
      if (authMode === "register") await signUpWithPassword(email.trim(), password);
      else await signInWithPassword(email.trim(), password);
      setMessage("账号已登录，正在把当前档案同步到数据库。");
    } catch (err: any) {
      setError(err?.message || "登录失败，请检查邮箱和密码。");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile() {
    setBusy(true);
    setMessage("");
    setError("");
    const finalName = profileName.trim() || suggestedProfileName(specialStates, acidFrequency, retinoidStage, environmentDirection);
    try {
      saveLocalSkinProfile(enrichedProfile, finalName);
      if (session) await saveMySkinProfile(enrichedProfile, finalName);
      clearPendingProfileDraft();
      setProfileName(finalName);
      setMessage(`已保存并切换到“${finalName}”。特殊状态只影响当前护理策略，不会改写你的基础肤质。`);
    } catch (err: any) {
      setError(err?.message || "保存失败，请稍后再试。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: "15px 14px", background: "#fff", marginTop: 10, marginBottom: 18 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 5 }}>保存你的肤质档案</div>
      <p style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.6, margin: "0 0 14px" }}>
        基础肤质相对稳定，但刷酸、A醇、敏感期、医美恢复和环境变化会暂时改变护理策略。这里记录的是“当前状态”，不会把油皮因为脱皮就永久判成干皮。
      </p>

      <div style={{ border: `1px solid ${LINE}`, borderRadius: 11, padding: 12, marginBottom: 13, background: "#FCFBF8" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: INK, marginBottom: 4 }}>你目前是否处于特殊护肤阶段？</div>
        <div style={{ fontSize: 10.5, color: MUTE, lineHeight: 1.5, marginBottom: 10 }}>可多选。没有特殊状态可以全部不选。</div>
        <div style={{ display: "grid", gap: 7 }}>
          {SPECIAL_STATES.map(item => {
            const selected = specialStates.includes(item.key);
            return <button key={item.key} type="button" onClick={() => toggleState(item.key)} style={{ textAlign: "left", border: `1px solid ${selected ? TEAL : LINE}`, borderRadius: 9, padding: "9px 10px", background: selected ? TEAL_SOFT : "white", cursor: "pointer" }}><div style={{ fontSize: 12, color: selected ? TEAL : INK, fontWeight: 600 }}>{selected ? "✓ " : ""}{item.label}</div><div style={{ fontSize: 10.5, color: MUTE, marginTop: 2, lineHeight: 1.4 }}>{item.detail}</div></button>;
          })}
        </div>

        {specialStates.includes("acid") && <div style={{ marginTop: 10 }}><div style={{ fontSize: 11, color: INK, marginBottom: 5 }}>最近刷酸 / 去角质频率</div><select value={acidFrequency} onChange={e => setAcidFrequency(e.target.value)} style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 8, padding: "9px 10px", background: "white" }}><option value="occasional">偶尔 · 每周不超过1次</option><option value="regular">规律 · 每周2–3次</option><option value="high">高频 · 每周4次或以上</option></select></div>}
        {specialStates.includes("retinoid") && <div style={{ marginTop: 10 }}><div style={{ fontSize: 11, color: INK, marginBottom: 5 }}>A醇 / 维A类使用阶段</div><select value={retinoidStage} onChange={e => setRetinoidStage(e.target.value)} style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 8, padding: "9px 10px", background: "white" }}><option value="starting">刚开始建立耐受</option><option value="stable">已经稳定使用</option><option value="increased">最近刚提高浓度或频率</option></select></div>}
        {specialStates.includes("environment_change") && <div style={{ marginTop: 10 }}><div style={{ fontSize: 11, color: INK, marginBottom: 5 }}>环境主要发生了什么变化</div><select value={environmentDirection} onChange={e => setEnvironmentDirection(e.target.value)} style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 8, padding: "9px 10px", background: "white" }}><option value="cold_dry">更冷 / 更干燥</option><option value="hot_humid">更热 / 更潮湿</option><option value="aircon">长期空调环境</option><option value="other">旅行 / 搬家 / 其他变化</option></select></div>}
      </div>

      <input
        value={profileName}
        onChange={(event) => { setProfileName(event.target.value); setNameEdited(true); }}
        placeholder={`不填写则自动命名，例如：${suggestedProfileName(specialStates, acidFrequency, retinoidStage, environmentDirection)}`}
        aria-label="档案名称"
        maxLength={60}
        style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${LINE}`, borderRadius: 9, padding: "10px 11px", fontSize: 13, color: INK, marginBottom: 6 }}
      />
      <div style={{ fontSize: 10.5, color: MUTE, lineHeight: 1.45, marginBottom: 11 }}>你也可以自己命名，例如「夏季稳定期」「旅行期间」「妈妈」。</div>

      {!session ? (
        <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 12, marginTop: 4 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: INK, marginBottom: 5 }}>保存到账号，换设备也能找回</div>
        <div style={{ fontSize: 11, color: MUTE, lineHeight: 1.5, marginBottom: 10 }}>无需登录也会保存在此设备；登录后可以跨设备同步多个档案。</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 9 }}><button type="button" onClick={() => setAuthMode("register")} style={{ border: `1px solid ${authMode === "register" ? TEAL : LINE}`, borderRadius: 999, padding: 7, background: authMode === "register" ? TEAL_SOFT : "white", color: TEAL }}>创建账号</button><button type="button" onClick={() => setAuthMode("login")} style={{ border: `1px solid ${authMode === "login" ? TEAL : LINE}`, borderRadius: 999, padding: 7, background: authMode === "login" ? TEAL_SOFT : "white", color: TEAL }}>登录已有账号</button></div>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="邮箱地址" aria-label="用于注册或登录的邮箱地址" style={{ minWidth: 0, flex: 1, border: `1px solid ${LINE}`, borderRadius: 9, padding: "10px 11px", fontSize: 13, color: INK }} />
          <input type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={authMode === "register" ? "设置密码（至少8位）" : "输入密码"} minLength={8} style={{ minWidth: 0, border: `1px solid ${LINE}`, borderRadius: 9, padding: "10px 11px", fontSize: 13, color: INK }} />
          <button type="button" onClick={authenticateAccount} disabled={busy || !email.trim() || password.length < 8} style={{ border: 0, borderRadius: 9, padding: "10px 13px", color: "#fff", background: busy || !email.trim() || password.length < 8 ? MUTE : TEAL, cursor: busy || !email.trim() || password.length < 8 ? "default" : "pointer" }}>{busy ? "处理中" : authMode === "register" ? "创建账号并同步" : "登录并同步"}</button>
        </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11.5, color: MUTE, marginBottom: 10 }}>当前账号：{session.user.email}</div>
          <button type="button" onClick={saveProfile} disabled={busy} style={{ width: "100%", border: 0, borderRadius: 9, padding: "11px 12px", color: "#fff", background: busy ? MUTE : TEAL, cursor: busy ? "default" : "pointer", fontWeight: 600 }}>{busy ? "正在保存…" : "保存为新档案并使用"}</button>
        </>
      )}

      {!session && <button type="button" onClick={saveProfile} disabled={busy} style={{ width: "100%", marginTop: 10, border: `1px solid ${TEAL}`, borderRadius: 9, padding: "10px 12px", color: TEAL, background: "white", cursor: busy ? "default" : "pointer", fontWeight: 600 }}>{busy ? "正在保存…" : "仅保存到此设备"}</button>}
      {message && <div style={{ marginTop: 10, padding: "9px 10px", borderRadius: 8, background: TEAL_SOFT, color: TEAL, fontSize: 11.5, lineHeight: 1.5 }}>{message}</div>}
      {error && <div style={{ marginTop: 10, color: RUST, fontSize: 11.5, lineHeight: 1.5 }}>{error}</div>}
    </section>
  );
}