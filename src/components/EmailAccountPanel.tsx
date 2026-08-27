import React, { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, LogOut, Mail, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { signInWithPassword, signUpWithPassword, supabase, type SkinProfileInput } from "../lib/supabase";
import { savePendingProfileDraft } from "../lib/profileDraft";
import { useLanguage } from "../lib/i18n";

const INK = "#211F1B";
const PAPER = "#F7F3EC";
const LINE = "#DDD6CA";
const SAGE = "#718276";
const MUTE = "#777065";
const RUST = "#A8503A";

export default function EmailAccountPanel({ profile, onBack, onReplayOnboarding }: { profile?: (SkinProfileInput & { name?: string }) | null; onBack: () => void; onReplayOnboarding?: () => void }) {
  const { t } = useLanguage();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [switchingAccount, setSwitchingAccount] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError) setError(authError.message);
      setSession(data.session);
      setSessionChecked(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setSessionChecked(true);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError("");
    setSent(false);
    try {
      if (profile && !switchingAccount) savePendingProfileDraft(profile, profile.name || t("我的肤质档案", "My skin profile"));
      if (mode === "register") await signUpWithPassword(email.trim(), password);
      else await signInWithPassword(email.trim(), password);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || t("处理失败，请稍后再试。", "Something went wrong. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError("");
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      window.location.reload();
    } catch (err: any) {
      setError(err?.message || t("退出失败，请稍后再试。", "Could not log out. Please try again."));
      setBusy(false);
    }
  }

  async function switchAccount() {
    setBusy(true);
    setError("");
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setSession(null);
      setSwitchingAccount(true);
      setMode("login");
      setEmail("");
      setPassword("");
      setSent(false);
    } catch (err: any) {
      setError(err?.message || t("无法切换账号，请稍后再试。", "Could not switch accounts. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    const confirmed = window.confirm(t("确定要永久注销这个账号吗？该账号下保存的肤质档案也会被删除，此操作无法撤销。", "Permanently delete this account? Saved skin profiles under this account will also be deleted. This cannot be undone."));
    if (!confirmed) return;
    setBusy(true);
    setError("");
    try {
      const { error: deleteError } = await supabase.functions.invoke("delete-account", { body: {} });
      if (deleteError) throw deleteError;
      await supabase.auth.signOut();
      window.location.reload();
    } catch (err: any) {
      setError(err?.message || t("注销失败，请稍后再试。", "Could not delete the account. Please try again."));
      setBusy(false);
    }
  }

  function handleBack() {
    if (switchingAccount) {
      window.location.reload();
      return;
    }
    onBack();
  }

  const signedInEmail = session?.user?.email || "";

  return <div style={{ minHeight: "100vh", background: PAPER, color: INK, padding: "22px 16px 48px" }}>
    <div style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
      <button onClick={handleBack} style={{ border: 0, padding: 0, background: "transparent", display: "inline-flex", alignItems: "center", gap: 6, color: MUTE, fontSize: 12, cursor: "pointer", marginBottom: 30 }}><ArrowLeft size={14} /> {t("返回首页", "Back to home")}</button>
      <div style={{ fontSize: 10, letterSpacing: ".1em", color: SAGE, marginBottom: 8 }}>EMAIL ACCOUNT</div>

      {!sessionChecked ? <div style={{ padding: "44px 0", color: MUTE, fontSize: 13 }}>{t("正在读取账号状态…", "Checking account status…")}</div> : session ? <>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, fontSize: 35, lineHeight: 1.05, margin: "0 0 10px" }}>{t("你的账号", "Your account")}</h1>
        <p style={{ color: MUTE, fontSize: 12.5, lineHeight: 1.65, marginBottom: 22 }}>{t("你的肌肤档案会同步到这个账号。", "Your skin profiles are synced to this account.")}</p>

        <section style={{ border: `1px solid ${LINE}`, borderRadius: 17, background: "white", padding: 17, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 15 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#EDF1EA", display: "grid", placeItems: "center" }}><CheckCircle2 size={18} color={SAGE} /></div>
            <div>
              <div style={{ fontSize: 11, color: SAGE, fontWeight: 600 }}>{t("已登录", "Signed in")}</div>
              <div style={{ fontSize: 13.5, color: INK, wordBreak: "break-all" }}>{signedInEmail}</div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 13, display: "grid", gap: 8 }}>
            {onReplayOnboarding && <button disabled={busy} onClick={onReplayOnboarding} style={{ border: `1px solid #C8D4C6`, borderRadius: 999, padding: "10px 13px", background: "#F4F7F1", color: "#31563C", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: busy ? "default" : "pointer", fontWeight: 600 }}><RotateCcw size={14} /> {t("重新体验新手引导", "Run onboarding again")}</button>}
            <button disabled={busy} onClick={switchAccount} style={{ border: `1px solid ${LINE}`, borderRadius: 999, padding: "10px 13px", background: "white", color: INK, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: busy ? "default" : "pointer" }}><RefreshCw size={14} /> {t("切换账号", "Switch account")}</button>
            <button disabled={busy} onClick={logout} style={{ border: `1px solid ${LINE}`, borderRadius: 999, padding: "10px 13px", background: "white", color: INK, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: busy ? "default" : "pointer" }}><LogOut size={14} /> {t("退出登录", "Log out")}</button>
          </div>
        </section>

        <section style={{ border: `1px solid #E6C9C1`, borderRadius: 17, background: "#FFFDFC", padding: 17 }}>
          <div style={{ fontSize: 11, color: RUST, fontWeight: 600, marginBottom: 5 }}>{t("账号管理", "Account management")}</div>
          <p style={{ margin: "0 0 12px", color: MUTE, fontSize: 11.5, lineHeight: 1.6 }}>{t("注销账号会永久删除登录账号及该账号下保存的肤质档案。", "Deleting your account permanently removes the login and skin profiles saved under it.")}</p>
          <button disabled={busy} onClick={deleteAccount} style={{ border: `1px solid #D7A99D`, borderRadius: 999, padding: "9px 13px", background: "transparent", color: RUST, display: "inline-flex", alignItems: "center", gap: 7, cursor: busy ? "default" : "pointer" }}><Trash2 size={14} /> {t("注销账号", "Delete account")}</button>
        </section>
      </> : <>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, fontSize: 35, lineHeight: 1.05, margin: "0 0 10px" }}>{t("用邮箱找回，", "Sign in to restore")}<br /><i>{t("我的肌肤档案", "your skin profiles")}</i></h1>
        <p style={{ color: MUTE, fontSize: 12.5, lineHeight: 1.65, marginBottom: 24 }}>{switchingAccount ? t("你已退出上一个账号。请输入另一个邮箱和密码继续。", "You have signed out of the previous account. Enter another email and password to continue.") : t("登录后系统会自动读取这个账号下保存的档案；如果当前设备有新档案，也会同步上传。", "After signing in, saved profiles for this account will load automatically. New profiles on this device can also be synced.")}</p>
        <form onSubmit={submit} style={{ border: `1px solid ${LINE}`, borderRadius: 17, background: "white", padding: 17 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}><button type="button" onClick={() => setMode("login")} style={{ border: `1px solid ${mode === "login" ? INK : LINE}`, borderRadius: 999, padding: 8, background: mode === "login" ? INK : "white", color: mode === "login" ? "white" : INK }}>{t("登录已有账号", "Sign in")}</button><button type="button" onClick={() => setMode("register")} style={{ border: `1px solid ${mode === "register" ? INK : LINE}`, borderRadius: 999, padding: 8, background: mode === "register" ? INK : "white", color: mode === "register" ? "white" : INK }}>{t("创建新账号", "Create account")}</button></div>
          <label style={{ display: "block", fontSize: 11, color: MUTE, marginBottom: 7 }}>{t("邮箱地址", "Email")}</label>
          <div style={{ position: "relative", marginBottom: 10 }}><Mail size={15} color={MUTE} style={{ position: "absolute", left: 12, top: 12 }} /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${LINE}`, borderRadius: 10, padding: "11px 12px 11px 36px", fontSize: 13 }} /></div>
          <label style={{ display: "block", fontSize: 11, color: MUTE, marginBottom: 7 }}>{t("密码", "Password")}</label>
          <input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "register" ? t("至少8位", "At least 8 characters") : t("输入密码", "Enter password")} minLength={8} style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${LINE}`, borderRadius: 10, padding: "11px 12px", fontSize: 13, marginBottom: 10 }} />
          <button disabled={busy || !email.trim() || password.length < 8} style={{ width: "100%", border: 0, borderRadius: 999, padding: "11px 14px", background: busy || !email.trim() || password.length < 8 ? MUTE : INK, color: "white", cursor: busy ? "default" : "pointer" }}>{busy ? t("正在处理…", "Working…") : mode === "register" ? t("创建账号并同步档案", "Create account & sync") : t("登录并读取档案", "Sign in & load profiles")}</button>
          {sent && <div style={{ marginTop: 11, borderRadius: 9, padding: "10px 11px", background: "#EDF1EA", color: SAGE, fontSize: 11.5, lineHeight: 1.55 }}>{t("登录成功，正在读取并同步你的肌肤档案。", "Signed in. Loading and syncing your skin profiles.")}</div>}
          {error && <div style={{ marginTop: 10, color: RUST, fontSize: 11.5 }}>{error}</div>}
        </form>
        <p style={{ color: MUTE, fontSize: 10.5, lineHeight: 1.55, marginTop: 13 }}>{t("邮箱＋密码用于跨设备同步和恢复。", "Email + password is used for cross-device sync and recovery.")}</p>
      </>}

      {session && error && <div style={{ marginTop: 12, color: RUST, fontSize: 11.5 }}>{error}</div>}
    </div>
  </div>;
}
