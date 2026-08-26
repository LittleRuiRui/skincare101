import React, { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  currentSession,
  saveMySkinProfile,
  sendSignInLink,
  supabase,
  type SkinProfileInput,
} from "../lib/supabase";
import {
  clearPendingProfileDraft,
  loadPendingProfileDraft,
  savePendingProfileDraft,
} from "../lib/profileDraft";

const INK = "#1C1B19";
const LINE = "#E4E1DA";
const TEAL = "#3D6B63";
const TEAL_SOFT = "#E8EEEC";
const MUTE = "#8A8579";
const RUST = "#A8503A";

interface Props {
  profile: SkinProfileInput;
}

export default function ProfileSavePanel({ profile }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [profileName, setProfileName] = useState("我的肤质档案");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const savingPendingRef = useRef(false);

  useEffect(() => {
    async function handleSession(nextSession: Session | null) {
      setSession(nextSession);
      const pending = nextSession ? loadPendingProfileDraft() : null;
      if (!pending || savingPendingRef.current) return;
      savingPendingRef.current = true;
      setBusy(true);
      try {
        await saveMySkinProfile(pending, profileName);
        clearPendingProfileDraft();
        setMessage("登录成功，本次问卷已自动保存为你的皮肤档案。");
      } catch (err: any) {
        setError(err?.message || "登录成功，但自动保存失败，请再点一次保存。");
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

  async function requestSignInLink() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      savePendingProfileDraft(profile);
      await sendSignInLink(email.trim());
      setMessage("登录链接已发送。完成登录后，本次问卷会自动保存；临时草稿会在两小时后失效。");
    } catch (err: any) {
      setError(err?.message || "发送登录邮件失败，请稍后再试。");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await saveMySkinProfile(profile, profileName);
      clearPendingProfileDraft();
      setMessage(`已保存并切换到“${profileName.trim() || "我的肤质档案"}”。`);
    } catch (err: any) {
      setError(err?.message || "保存失败，请稍后再试。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: "15px 14px", background: "#fff", marginTop: 10, marginBottom: 18 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: INK, marginBottom: 5 }}>保存到网页护肤档案</div>
      <p style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.6, margin: "0 0 12px" }}>
        保存本次肤质、基础信息、症状和问卷答案。你可以为自己或家人建立多份档案，档案只对当前账号可见。
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
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="邮箱地址"
            aria-label="用于登录的邮箱地址"
            style={{ minWidth: 0, flex: 1, border: `1px solid ${LINE}`, borderRadius: 9, padding: "10px 11px", fontSize: 13, color: INK }}
          />
          <button
            type="button"
            onClick={requestSignInLink}
            disabled={busy || !email.trim()}
            style={{ flexShrink: 0, border: 0, borderRadius: 9, padding: "0 13px", color: "#fff", background: busy || !email.trim() ? MUTE : TEAL, cursor: busy || !email.trim() ? "default" : "pointer" }}
          >
            {busy ? "发送中" : "发送验证邮件并自动保存"}
          </button>
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

