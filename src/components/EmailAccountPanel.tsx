import React, { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { signInWithPassword, signUpWithPassword, type SkinProfileInput } from "../lib/supabase";
import { savePendingProfileDraft } from "../lib/profileDraft";

const INK = "#211F1B";
const PAPER = "#F7F3EC";
const LINE = "#DDD6CA";
const SAGE = "#718276";
const MUTE = "#777065";
const RUST = "#A8503A";

export default function EmailAccountPanel({ profile, onBack }: { profile?: (SkinProfileInput & { name?: string }) | null; onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError("");
    try {
      if (profile) savePendingProfileDraft(profile, profile.name || "我的肤质档案");
      if (mode === "register") await signUpWithPassword(email.trim(), password);
      else await signInWithPassword(email.trim(), password);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "发送失败，请稍后再试。");
    } finally {
      setBusy(false);
    }
  }

  return <div style={{ minHeight: "100vh", background: PAPER, color: INK, padding: "22px 16px 48px" }}>
    <div style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
      <button onClick={onBack} style={{ border: 0, padding: 0, background: "transparent", display: "inline-flex", alignItems: "center", gap: 6, color: MUTE, fontSize: 12, cursor: "pointer", marginBottom: 30 }}><ArrowLeft size={14} /> 返回首页</button>
      <div style={{ fontSize: 10, letterSpacing: ".1em", color: SAGE, marginBottom: 8 }}>EMAIL ACCOUNT</div>
      <h1 style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, fontSize: 35, lineHeight: 1.05, margin: "0 0 10px" }}>用邮箱找回，<br /><i>我的肌肤档案</i></h1>
      <p style={{ color: MUTE, fontSize: 12.5, lineHeight: 1.65, marginBottom: 24 }}>登录后系统会自动读取这个账号下保存的档案；如果当前设备有新档案，也会同步上传。不再依赖邮件跳转。</p>
      <form onSubmit={submit} style={{ border: `1px solid ${LINE}`, borderRadius: 17, background: "white", padding: 17 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}><button type="button" onClick={() => setMode("login")} style={{ border: `1px solid ${mode === "login" ? INK : LINE}`, borderRadius: 999, padding: 8, background: mode === "login" ? INK : "white", color: mode === "login" ? "white" : INK }}>登录已有账号</button><button type="button" onClick={() => setMode("register")} style={{ border: `1px solid ${mode === "register" ? INK : LINE}`, borderRadius: 999, padding: 8, background: mode === "register" ? INK : "white", color: mode === "register" ? "white" : INK }}>创建新账号</button></div>
        <label style={{ display: "block", fontSize: 11, color: MUTE, marginBottom: 7 }}>邮箱地址</label>
        <div style={{ position: "relative", marginBottom: 10 }}><Mail size={15} color={MUTE} style={{ position: "absolute", left: 12, top: 12 }} /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${LINE}`, borderRadius: 10, padding: "11px 12px 11px 36px", fontSize: 13 }} /></div>
        <label style={{ display: "block", fontSize: 11, color: MUTE, marginBottom: 7 }}>密码</label>
        <input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "register" ? "至少8位" : "输入密码"} minLength={8} style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${LINE}`, borderRadius: 10, padding: "11px 12px", fontSize: 13, marginBottom: 10 }} />
        <button disabled={busy || !email.trim() || password.length < 8} style={{ width: "100%", border: 0, borderRadius: 999, padding: "11px 14px", background: busy || !email.trim() || password.length < 8 ? MUTE : INK, color: "white", cursor: busy ? "default" : "pointer" }}>{busy ? "正在处理…" : mode === "register" ? "创建账号并同步档案" : "登录并读取档案"}</button>
        {sent && <div style={{ marginTop: 11, borderRadius: 9, padding: "10px 11px", background: "#EDF1EA", color: SAGE, fontSize: 11.5, lineHeight: 1.55 }}>登录成功，正在读取并同步你的肌肤档案。</div>}
        {error && <div style={{ marginTop: 10, color: RUST, fontSize: 11.5 }}>{error}</div>}
      </form>
      <p style={{ color: MUTE, fontSize: 10.5, lineHeight: 1.55, marginTop: 13 }}>档案默认保存在当前设备；邮箱＋密码用于跨设备同步和恢复。</p>
    </div>
  </div>;
}
