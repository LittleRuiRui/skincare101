import React, { useEffect, useRef, useState } from "react";
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

function storedCooldown(): number {
  try { return Number(localStorage.getItem(EMAIL_COOLDOWN_KEY) || 0); } catch { return 0; }
}

interface Props {
  profile: SkinProfileInput;
}

export default function ProfileSavePanel({ profile }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [profileName, setProfileName] = useState("我的肤质档案");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState(storedCooldown);
  const [clock, setClock] = useState(Date.now());
  const savingPendingRef = useRef(false);
  const localSavedRef = useRef(false);

  const cooldownMs = Math.max(0, cooldownUntil - clock);
  const cooldownLabel = cooldownMs > 60_000 ? `约 ${Math.ceil(cooldownMs / 60_000)} 分钟后可重试` : cooldownMs > 0 ? `${Math.ceil(cooldownMs / 1000)} 秒后可重试` : "";

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
        await saveMySkinProfile(pending.profile, pending.name || "我的肤质档案");
        clearPendingProfileDraft();
        setMessage("邮箱确认成功。账号已建立，本次问卷也已自动保存为你的皮肤档案。");
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
    saveLocalSkinProfile(profile, profileName);
    setMessage("已自动保存在此设备。下次打开 Skincare101 会直接读取这份档案。");
  }, [profile]);

  async function authenticateAccount() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      saveLocalSkinProfile(profile, profileName);
      savePendingProfileDraft(profile, profileName);
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
    try {
      saveLocalSkinProfile(profile, profileName);
      if (session) await saveMySkinProfile(profile, profileName);
      clearPendingProfileDraft();
      setMessage(`已在此设备保存并切换到“${profileName.trim() || "我的肤质档案"}”。`);
    } catch (err: any) {
      setError(err?.message || "保存失败，请稍后再试。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: "15px 14px", background: "#fff", marginTop: 10, marginBottom: 18 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 5 }}>已保存到此设备</div>
      <p style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.6, margin: "0 0 12px" }}>
        无需登录，下次用这个浏览器打开会自动读取。邮箱登录只是可选的跨设备同步。
      </p>

      <input
        value={profileName}
        onChange={(event) => setProfileName(event.target.value)}
        placeholder="档案名称，例如：我 / 妈妈"
        aria-label="档案名称"
        maxLength={40}
        style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${LINE}`, borderRadius: 9, padding: "10px 11px", fontSize: 13, color: INK, marginBottom: 10 }}
      />

      {!session ? (
        <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 12, marginTop: 4 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: INK, marginBottom: 5 }}>保存到账号，换设备也能找回</div>
        <div style={{ fontSize: 11, color: MUTE, lineHeight: 1.5, marginBottom: 10 }}>选择创建账号或登录已有账号，档案会自动同步到私人数据库。</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 9 }}><button type="button" onClick={() => setAuthMode("register")} style={{ border: `1px solid ${authMode === "register" ? TEAL : LINE}`, borderRadius: 999, padding: 7, background: authMode === "register" ? TEAL_SOFT : "white", color: TEAL }}>创建账号</button><button type="button" onClick={() => setAuthMode("login")} style={{ border: `1px solid ${authMode === "login" ? TEAL : LINE}`, borderRadius: 999, padding: 7, background: authMode === "login" ? TEAL_SOFT : "white", color: TEAL }}>登录已有账号</button></div>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="邮箱地址"
            aria-label="用于注册或登录的邮箱地址"
            style={{ minWidth: 0, flex: 1, border: `1px solid ${LINE}`, borderRadius: 9, padding: "10px 11px", fontSize: 13, color: INK }}
          />
          <input type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={authMode === "register" ? "设置密码（至少8位）" : "输入密码"} minLength={8} style={{ minWidth: 0, border: `1px solid ${LINE}`, borderRadius: 9, padding: "10px 11px", fontSize: 13, color: INK }} />
          <button
            type="button"
            onClick={authenticateAccount}
            disabled={busy || !email.trim() || password.length < 8}
            style={{ border: 0, borderRadius: 9, padding: "10px 13px", color: "#fff", background: busy || !email.trim() || password.length < 8 ? MUTE : TEAL, cursor: busy || !email.trim() || password.length < 8 ? "default" : "pointer" }}
          >
            {busy ? "处理中" : authMode === "register" ? "创建账号并同步" : "登录并同步"}
          </button>
        </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11.5, color: MUTE, marginBottom: 10 }}>当前账号：{session.user.email}</div>
          <button
            type="button"
            onClick={saveProfile}
            disabled={busy}
            style={{ width: "100%", border: 0, borderRadius: 9, padding: "11px 12px", color: "#fff", background: busy ? MUTE : TEAL, cursor: busy ? "default" : "pointer", fontWeight: 600 }}
          >
            {busy ? "正在保存…" : "保存为新档案并使用"}
          </button>
        </>
      )}

      {message && <div style={{ marginTop: 10, padding: "9px 10px", borderRadius: 8, background: TEAL_SOFT, color: TEAL, fontSize: 11.5, lineHeight: 1.5 }}>{message}</div>}
      {error && <div style={{ marginTop: 10, color: RUST, fontSize: 11.5, lineHeight: 1.5 }}>{error}</div>}
    </section>
  );
}
