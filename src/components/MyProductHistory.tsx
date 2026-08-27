import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, History, RefreshCw, ShieldAlert } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lib/i18n";

const INK = "#211F1B";
const LINE = "#DDD6CA";
const SAGE = "#718276";
const MUTE = "#777065";
const RUST = "#A8503A";

type HistoryFilter = "all" | "avoid" | "better" | "neutral";

type ExperienceRow = {
  id: string;
  product_key: string;
  brand: string;
  product_name: string;
  skin_type: string;
  sensitivity: string;
  concerns: string[];
  reaction: "better" | "neutral" | "irritated";
  texture: "love" | "okay" | "dislike";
  repurchase: "yes" | "maybe" | "no";
  note: string;
  updated_at: string;
};

function isAvoid(row: ExperienceRow) {
  return row.reaction === "irritated" || row.texture === "dislike" || row.repurchase === "no";
}

export default function MyProductHistory() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<ExperienceRow[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data, error: rpcError } = await supabase.rpc("load_my_product_experiences");
      if (rpcError) throw rpcError;
      setRows((data || []) as ExperienceRow[]);
    } catch (err: any) {
      setError(err?.message || t("暂时无法读取使用记录。", "Could not load your product history."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const avoidCount = useMemo(() => rows.filter(isAvoid).length, [rows]);
  const visible = useMemo(() => rows.filter((row) => {
    if (filter === "avoid") return isAvoid(row);
    if (filter === "better") return row.reaction === "better" && !isAvoid(row);
    if (filter === "neutral") return row.reaction === "neutral" && !isAvoid(row);
    return true;
  }), [rows, filter]);

  const filters: Array<{ key: HistoryFilter; zh: string; en: string }> = [
    { key: "all", zh: "全部记录", en: "All" },
    { key: "avoid", zh: `避雷 ${avoidCount ? `· ${avoidCount}` : ""}`, en: `Avoid ${avoidCount ? `· ${avoidCount}` : ""}` },
    { key: "better", zh: "用着不错", en: "Worked well" },
    { key: "neutral", zh: "感觉一般", en: "Neutral" },
  ];

  const reactionLabel = {
    better: t("皮肤有改善", "Skin improved"),
    neutral: t("没有明显变化", "No clear change"),
    irritated: t("出现刺激 / 不适", "Irritation / discomfort"),
  } as const;
  const textureLabel = {
    love: t("喜欢肤感", "Liked texture"),
    okay: t("肤感一般", "Texture was okay"),
    dislike: t("不喜欢肤感", "Disliked texture"),
  } as const;
  const repurchaseLabel = {
    yes: t("会回购", "Would repurchase"),
    maybe: t("可能回购", "Maybe repurchase"),
    no: t("不会回购", "Would not repurchase"),
  } as const;

  return <section style={{ border: `1px solid ${LINE}`, borderRadius: 17, background: "white", padding: 17, marginBottom: 14 }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, color: SAGE, fontSize: 11, fontWeight: 700, marginBottom: 5 }}><History size={15} /> {t("我的使用记录", "My product history")}</div>
        <div style={{ color: MUTE, fontSize: 11.5, lineHeight: 1.55 }}>{t("记住哪些产品适合你，也记住踩过的雷。避雷记录会继续影响你的产品推荐排序。", "Keep track of what worked and what did not. Avoid-list feedback continues to influence recommendation ranking.")}</div>
      </div>
      <button onClick={() => void load()} disabled={loading} aria-label={t("刷新", "Refresh")} style={{ border: `1px solid ${LINE}`, borderRadius: "50%", width: 32, height: 32, background: "white", display: "grid", placeItems: "center", color: MUTE, cursor: loading ? "default" : "pointer", flex: "0 0 auto" }}><RefreshCw size={14} /></button>
    </div>

    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
      {filters.map((item) => <button key={item.key} onClick={() => setFilter(item.key)} style={{ border: `1px solid ${filter === item.key ? (item.key === "avoid" ? "#D7A99D" : SAGE) : LINE}`, borderRadius: 999, padding: "7px 10px", background: filter === item.key ? (item.key === "avoid" ? "#FFF5F2" : "#EDF1EA") : "white", color: filter === item.key ? (item.key === "avoid" ? RUST : "#31563C") : MUTE, fontSize: 10.5, cursor: "pointer" }}>{t(item.zh, item.en)}</button>)}
    </div>

    {loading ? <div style={{ color: MUTE, fontSize: 11.5, padding: "10px 0" }}>{t("正在读取记录…", "Loading history…")}</div> : error ? <div style={{ color: RUST, fontSize: 11.5, lineHeight: 1.5 }}>{error}</div> : visible.length === 0 ? <div style={{ border: `1px dashed ${LINE}`, borderRadius: 12, padding: 14, color: MUTE, fontSize: 11.5, lineHeight: 1.55 }}>{filter === "avoid" ? t("目前没有避雷记录。以后你把产品标记为刺激、不喜欢肤感或不会回购，就会自动出现在这里。", "No avoid-list products yet. Products marked as irritating, disliked in texture, or not worth repurchasing will appear here.") : t("还没有产品使用记录。去产品详情页提交一次使用反馈后，这里会自动保存。", "No product history yet. Submit feedback on a product page and it will appear here automatically.")}</div> : <div style={{ display: "grid", gap: 9 }}>
      {visible.map((row) => {
        const avoid = isAvoid(row);
        return <article key={row.id} style={{ border: `1px solid ${avoid ? "#E7C8C0" : LINE}`, borderRadius: 13, padding: 13, background: avoid ? "#FFF9F7" : "#FFF" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: SAGE, marginBottom: 3 }}>{row.brand}</div>
              <div style={{ fontSize: 13, color: INK, fontWeight: 650, overflowWrap: "anywhere" }}>{row.product_name}</div>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, flex: "0 0 auto", color: avoid ? RUST : "#4E6254", fontSize: 10, fontWeight: 650 }}>{avoid ? <ShieldAlert size={14} /> : row.reaction === "better" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}{avoid ? t("避雷", "Avoid") : reactionLabel[row.reaction]}</div>
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 9 }}>
            {[reactionLabel[row.reaction], textureLabel[row.texture], repurchaseLabel[row.repurchase]].map((label) => <span key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 999, padding: "4px 7px", color: MUTE, fontSize: 9.5 }}>{label}</span>)}
          </div>
          {row.note && <div style={{ marginTop: 9, color: "#514C45", fontSize: 11, lineHeight: 1.55 }}>{row.note}</div>}
          <div style={{ marginTop: 8, color: "#9A9389", fontSize: 9.5 }}>{new Date(row.updated_at).toLocaleDateString()}</div>
        </article>;
      })}
    </div>}
  </section>;
}
