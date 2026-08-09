import React, { useEffect, useState } from "react";
import { approveSubmission, loadPendingReviewQueue, rejectSubmission } from "../lib/supabase";

const LINE = "#E4E1DA";
const TEAL = "#3D6B63";
const TEAL_SOFT = "#E8EEEC";
const INK = "#1C1B19";
const MUTE = "#8A8579";
const RUST = "#A8503A";

export default function ReviewerQueue() {
  const [items, setItems] = useState<any[]>([]);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setItems(await loadPendingReviewQueue());
      setError("");
    } catch (err: any) {
      setError(err?.message || "无法读取审核队列。");
    }
  }

  useEffect(() => { refresh(); }, []);

  async function approve(item: any) {
    const sourceUrl = window.prompt("可选：填写品牌官方来源网址", "") || "";
    setBusyId(item.id);
    try {
      await approveSubmission(item.id, sourceUrl);
      await refresh();
    } catch (err: any) {
      setError(err?.message || "批准投稿失败。");
    } finally {
      setBusyId("");
    }
  }

  async function reject(item: any) {
    const reason = window.prompt("请填写需要用户修改的原因");
    if (!reason) return;
    setBusyId(item.id);
    try {
      await rejectSubmission(item.id, reason);
      await refresh();
    } catch (err: any) {
      setError(err?.message || "退回投稿失败。");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section style={{ border: `1px solid ${TEAL}`, borderRadius: 12, padding: "15px 14px", background: TEAL_SOFT, marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ color: INK, fontSize: 14, fontWeight: 600 }}>审核队列 · {items.length} 条</div>
        <button onClick={refresh} style={{ border: 0, background: "transparent", color: TEAL, cursor: "pointer" }}>刷新</button>
      </div>
      {items.length === 0 && <div style={{ fontSize: 11.5, color: MUTE }}>目前没有等待审核的投稿。</div>}
      {items.map((item) => (
        <article key={item.id} style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 12, background: "#fff", marginTop: 9 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{item.brand} · {item.product_name}</div>
          <div style={{ fontSize: 11, color: MUTE, margin: "4px 0 8px" }}>{item.category} · {item.market} · 覆盖率 {item.data_completeness}%</div>
          {item.imageUrl && <img src={item.imageUrl} alt="投稿配料表" style={{ display: "block", width: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 8, marginBottom: 8 }} />}
          <div style={{ maxHeight: 100, overflow: "auto", fontSize: 10.5, lineHeight: 1.5, color: MUTE, whiteSpace: "pre-wrap", marginBottom: 9 }}>{item.raw_ingredients}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button disabled={busyId === item.id} onClick={() => approve(item)} style={{ flex: 1, border: 0, borderRadius: 8, padding: 9, color: "#fff", background: TEAL, cursor: "pointer" }}>批准并收录</button>
            <button disabled={busyId === item.id} onClick={() => reject(item)} style={{ flex: 1, border: `1px solid ${RUST}`, borderRadius: 8, padding: 9, color: RUST, background: "#fff", cursor: "pointer" }}>退回修改</button>
          </div>
        </article>
      ))}
      {error && <div style={{ color: RUST, fontSize: 11.5, marginTop: 9 }}>{error}</div>}
    </section>
  );
}
