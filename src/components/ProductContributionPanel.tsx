import React, { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  currentSession,
  loadMySubmissions,
  sendSignInLink,
  submitProductContribution,
  supabase,
  type ParsedSubmission,
} from "../lib/supabase";
import ReviewerQueue from "./ReviewerQueue";

const INK = "#1C1B19";
const LINE = "#E4E1DA";
const TEAL = "#3D6B63";
const TEAL_SOFT = "#E8EEEC";
const MUTE = "#8A8579";
const RUST = "#A8503A";

const fieldStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${LINE}`,
  borderRadius: 9,
  padding: "10px 11px",
  fontSize: 13,
  color: INK,
  background: "#fff",
};

const statusLabel: Record<string, string> = {
  draft: "草稿",
  pending: "等待审核",
  reviewing: "审核中",
  approved: "已收录",
  rejected: "需要修改",
};

interface Props {
  rawIngredients: string;
  parseResult: ParsedSubmission | null;
  photoFile: File | null;
}

export default function ProductContributionPanel({ rawIngredients, parseResult, photoFile }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [brand, setBrand] = useState("");
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("面霜");
  const [market, setMarket] = useState("SG");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);

  async function refreshSubmissions() {
    try {
      setSubmissions(await loadMySubmissions());
    } catch {
      setSubmissions([]);
    }
  }

  useEffect(() => {
    currentSession().then((next) => {
      setSession(next);
      if (next) refreshSubmissions();
    }).catch(() => setSession(null));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) setTimeout(refreshSubmissions, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function requestLink() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await sendSignInLink(email.trim());
      setMessage("登录链接已发送，请打开邮件完成登录后回到本页。");
    } catch (err: any) {
      setError(err?.message || "发送登录邮件失败，请稍后再试。");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!parseResult || !rawIngredients.trim()) {
      setError("请先拍摄或粘贴配料表，并校对识别结果。");
      return;
    }
    if (!brand.trim() || !productName.trim()) {
      setError("请填写品牌和产品名称。");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const id = await submitProductContribution({
        brand,
        productName,
        category,
        market,
        rawIngredients,
        parseResult,
        ingredientsPhoto: photoFile,
      });
      setMessage(`投稿成功（${id.slice(0, 8)}）。审核通过后会自动进入共享推荐库。`);
      setBrand("");
      setProductName("");
      await refreshSubmissions();
    } catch (err: any) {
      setError(err?.message || "投稿失败，请稍后再试。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: "16px 14px", background: "#fff", marginTop: 22, marginBottom: 22 }}>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: INK, marginBottom: 5 }}>提交到共享产品数据库</div>
      <p style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.6, margin: "0 0 14px" }}>
        填写包装上的品牌和产品名。照片会存入私有空间，仅投稿者和审核员可查看；审核通过后只公开产品与配方数据。
      </p>

      {!session ? (
        <div>
          <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, marginBottom: 6 }}>邮箱登录</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" style={fieldStyle} />
            <button onClick={requestLink} disabled={busy || !email.trim()} style={{ flexShrink: 0, border: 0, borderRadius: 9, padding: "0 13px", color: "#fff", background: TEAL, cursor: "pointer" }}>
              {busy ? "发送中" : "发送登录链接"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 13 }}>
            <span style={{ fontSize: 11.5, color: MUTE }}>已登录：{session.user.email}</span>
            <button onClick={() => supabase.auth.signOut()} style={{ border: 0, background: "transparent", color: TEAL, cursor: "pointer", fontSize: 11.5 }}>退出</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 9 }}>
            <input value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="品牌名称 *" style={fieldStyle} />
            <input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="产品名称 *" style={fieldStyle} />
            <select value={category} onChange={(event) => setCategory(event.target.value)} style={fieldStyle}>
              {['洁面', '精华', '面霜', '防晒', '去角质', '其他'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={market} onChange={(event) => setMarket(event.target.value)} style={fieldStyle}>
              <option value="SG">新加坡版</option>
              <option value="CN">中国大陆版</option>
              <option value="US">美国版</option>
              <option value="EU">欧洲版</option>
              <option value="global">全球/不确定</option>
            </select>
          </div>
          <button onClick={submit} disabled={busy || !parseResult} style={{ width: "100%", border: 0, borderRadius: 9, padding: "11px 12px", color: "#fff", background: parseResult ? TEAL : MUTE, cursor: parseResult ? "pointer" : "default", fontWeight: 600 }}>
            {busy ? "正在安全上传…" : "提交审核"}
          </button>

          {submissions.length > 0 && (
            <div style={{ marginTop: 15, paddingTop: 12, borderTop: `1px solid ${LINE}` }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 7 }}>我的最近投稿</div>
              {submissions.slice(0, 3).map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11.5, color: MUTE, marginBottom: 5 }}>
                  <span>{item.brand} · {item.product_name}</span>
                  <span style={{ color: item.status === "approved" ? TEAL : INK }}>{statusLabel[item.status] || item.status}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {message && <div style={{ marginTop: 10, padding: "9px 10px", borderRadius: 8, background: TEAL_SOFT, color: TEAL, fontSize: 11.5, lineHeight: 1.5 }}>{message}</div>}
      {error && <div style={{ marginTop: 10, color: RUST, fontSize: 11.5, lineHeight: 1.5 }}>{error}</div>}
      {session?.user.app_metadata?.role === "reviewer" && <ReviewerQueue />}
    </section>
  );
}
