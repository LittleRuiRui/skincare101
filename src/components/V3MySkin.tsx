import React from "react";
import {
  ArrowLeft,
  ChevronRight,
  ListChecks,
  Search,
  Sparkles,
} from "lucide-react";
import type { SkinProfileRecord } from "../lib/skinProfile";
import type { SharedProductRecord } from "../lib/supabase";
import type { BrowseConcern } from "../lib/productPresentation";
import { summarizeSkinProfile } from "../lib/skinProfile";
import { buildProfileDecisionModel } from "../intelligence/profileDecisionModel";
import { localizeSkinSummary, useLanguage } from "../lib/i18n";
import { ConcernWatercolorRich } from "./WatercolorConcernPreview";
import SkinAnalysisReport from "./SkinAnalysisReportV2";
const INK = "#252724",
  BG = "#F6F4EF",
  CARD = "#FCFBF8",
  LINE = "#DEDCD5",
  SAGE = "#667A6C",
  MUTE = "#777870",
  AMBER = "#9B7440";
const sans =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";
function Chip({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        border: `1px solid ${LINE}`,
        borderRadius: 16,
        padding: "5px 10px 5px 5px",
        background: "#FBF7ED",
        fontSize: 12,
        color: INK,
        minHeight: 46,
      }}
    >
      <ConcernWatercolorRich label={label} size={42} />
      {children}
    </span>
  );
}
function Action({
  icon,
  title,
  body,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        border: `1px solid ${LINE}`,
        background: CARD,
        borderRadius: 18,
        padding: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        textAlign: "left",
        cursor: "pointer",
        color: INK,
        fontFamily: sans,
        marginBottom: 10,
      }}
    >
      <span style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            background: "#E9EEE9",
            display: "grid",
            placeItems: "center",
            color: SAGE,
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <span>
          <b style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
            {title}
          </b>
          <span style={{ fontSize: 12, color: MUTE, lineHeight: 1.55 }}>
            {body}
          </span>
        </span>
      </span>
      <ChevronRight size={16} color={MUTE} />
    </button>
  );
}
const STATE_GUIDANCE: Record<
  string,
  {
    zh: string;
    en: string;
    priorityZh: string;
    priorityEn: string;
    impactZh: string;
    impactEn: string;
  }
> = {
  acid: {
    zh: "刷酸 / 去角质期",
    en: "Exfoliation phase",
    priorityZh: "控制去角质负荷",
    priorityEn: "Control exfoliation load",
    impactZh: "不要叠加多种酸或磨砂；出现刺痛、脱皮时先暂停，恢复保湿与防晒。",
    impactEn:
      "Do not stack acids or scrubs. Pause if stinging or peeling appears, then restore hydration and sunscreen.",
  },
  retinoid: {
    zh: "A醇 / 维A类使用期",
    en: "Retinoid phase",
    priorityZh: "稳定维A耐受",
    priorityEn: "Stabilize retinoid tolerance",
    impactZh: "避免同晚叠加强酸；先固定低频率，连续稳定后再逐步增加。",
    impactEn:
      "Avoid strong acids on the same night. Keep a low, consistent frequency before increasing gradually.",
  },
  sensitive_flare: {
    zh: "敏感 / 屏障不稳定期",
    en: "Sensitive / unstable barrier",
    priorityZh: "屏障恢复与降刺激",
    priorityEn: "Barrier recovery and irritation reduction",
    impactZh:
      "暂停近期新增和刺激性活性成分；只保留温和清洁、保湿与白天防晒，稳定后再逐一恢复。",
    impactEn:
      "Pause recent additions and irritating actives. Keep gentle cleansing, moisturizer and daytime sunscreen, then reintroduce one at a time.",
  },
  procedure_recovery: {
    zh: "医美 / 焕肤恢复期",
    en: "Post-procedure recovery",
    priorityZh: "恢复期安全优先",
    priorityEn: "Post-procedure safety first",
    impactZh:
      "按医生给出的恢复窗口护理，暂缓去角质、维A和高刺激产品，不自行加速焕肤。",
    impactEn:
      "Follow the clinician's recovery window. Hold exfoliants, retinoids and high-irritation products.",
  },
  breakout: {
    zh: "爆痘期",
    en: "Active breakout",
    priorityZh: "减少炎症与闷堵",
    priorityEn: "Reduce inflammation and congestion",
    impactZh: "避免过度清洁和同时叠加多种祛痘活性；一次只调整一个变量并观察。",
    impactEn:
      "Avoid over-cleansing and stacking acne actives. Change one variable at a time and observe.",
  },
  environment_change: {
    zh: "环境变化期",
    en: "Environmental change",
    priorityZh: "按环境调整保湿",
    priorityEn: "Adapt hydration to the environment",
    impactZh:
      "干冷或空调环境加强保湿封闭；闷热潮湿环境减少厚重叠加，保持基础步骤稳定。",
    impactEn:
      "Increase barrier support in dry or air-conditioned settings; reduce heavy layering in hot, humid conditions.",
  },
  pregnancy_breastfeeding: {
    zh: "孕期 / 哺乳期",
    en: "Pregnancy / breastfeeding",
    priorityZh: "安全筛选优先",
    priorityEn: "Safety screening first",
    impactZh: "维A类从候选中排除；药物或高活性成分先与产科或皮肤科医生确认。",
    impactEn:
      "Retinoids are excluded. Confirm medicines and strong actives with an obstetrician or dermatologist.",
  },
};
export default function V3MySkin({
  profile,
  products,
  onBack,
  onRetake,
  onFindProducts,
  onBuildRoutine,
  onProduct,
}: {
  profile: SkinProfileRecord | null;
  products: SharedProductRecord[];
  onBack: () => void;
  onRetake: () => void;
  onFindProducts: () => void;
  onBuildRoutine: () => void;
  onProduct: (p: SharedProductRecord, c: BrowseConcern) => void;
}) {
  const { t, language } = useLanguage();
  const summary = localizeSkinSummary(summarizeSkinProfile(profile), language);
  const decision = profile ? buildProfileDecisionModel(profile) : null;
  const findings = decision?.diagnosticFindings.slice(0, 4) || [];
  const stateKeys = (profile?.profileAnswers?.special_states || "")
    .split(",")
    .filter((key) => STATE_GUIDANCE[key]);
  const activeState = stateKeys.map((key) => STATE_GUIDANCE[key])[0];
  const priority = activeState
    ? language === "zh"
      ? activeState.priorityZh
      : activeState.priorityEn
    : summary.concerns[0] || t("基础护理稳定", "Baseline stability");
  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        color: INK,
        padding: "22px 18px 52px",
        fontFamily: sans,
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <button
          onClick={onBack}
          style={{
            border: 0,
            padding: 0,
            background: "transparent",
            display: "flex",
            alignItems: "center",
            gap: 7,
            color: MUTE,
            fontSize: 13,
            cursor: "pointer",
            marginBottom: 30,
            fontFamily: sans,
          }}
        >
          <ArrowLeft size={15} />
          {t("返回首页", "Back to home")}
        </button>
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".12em",
            color: SAGE,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          {t("肤质档案", "MY SKIN")}
        </div>
        <h1
          style={{
            fontWeight: 650,
            fontSize: 32,
            lineHeight: 1.2,
            letterSpacing: "-.035em",
            margin: "0 0 10px",
          }}
        >
          {t("我的肤质", "My Skin")}
        </h1>
        <p
          style={{
            margin: "0 0 26px",
            color: MUTE,
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {t(
            "先区分你看到的皮肤表现、可能机制和护理方向，再决定下一件产品。",
            "Separate visible concerns, possible mechanisms, and care priorities before choosing the next product.",
          )}
        </p>
        {!profile ? (
          <section
            style={{
              border: `1px solid ${LINE}`,
              background: CARD,
              borderRadius: 20,
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Sparkles size={16} color={SAGE} />
              <b style={{ fontSize: 14 }}>
                {t("还没有保存的肤质档案", "No saved skin profile yet")}
              </b>
            </div>
            <p
              style={{
                fontSize: 13,
                color: MUTE,
                lineHeight: 1.65,
                margin: "0 0 15px",
              }}
            >
              {t(
                "先完成肤质分析，之后推荐、产品判断和早晚护肤都会使用同一份档案。",
                "Complete your skin analysis first. Recommendations, product checks, and routines will all use the same profile.",
              )}
            </p>
            <button
              onClick={onRetake}
              style={{
                border: 0,
                borderRadius: 999,
                padding: "10px 15px",
                background: SAGE,
                color: "white",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {t("开始肤质分析", "Analyze my skin")}
            </button>
          </section>
        ) : (
          <>
            <section
              style={{
                border: `1px solid ${LINE}`,
                borderRadius: 20,
                padding: 18,
                background: CARD,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ fontSize: 10.5, color: MUTE, marginBottom: 5 }}>
                    {t("肤质类型", "SKIN TYPE")}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 650 }}>
                    {summary.skinType}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: MUTE, marginBottom: 5 }}>
                    {t("敏感程度", "SENSITIVITY")}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 650 }}>
                    {summary.sensitivity}
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: 17,
                  paddingTop: 15,
                  borderTop: `1px solid ${LINE}`,
                }}
              >
                <div style={{ fontSize: 11, color: MUTE, marginBottom: 9 }}>
                  {t("你选择的皮肤表现", "REPORTED CONCERNS")}
                </div>
                <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                  {summary.concerns.length ? (
                    summary.concerns.map((item) => (
                      <Chip key={item} label={item}>
                        {item}
                      </Chip>
                    ))
                  ) : (
                    <span style={{ fontSize: 12, color: MUTE }}>
                      {t("暂未记录主要问题", "No major concern recorded")}
                    </span>
                  )}
                </div>
              </div>
            </section>
            {stateKeys.length > 0 && (
              <section
                style={{
                  border: `1px solid ${AMBER}`,
                  borderRadius: 20,
                  padding: 18,
                  background: "#FFF8E8",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: AMBER,
                    fontWeight: 800,
                    letterSpacing: ".08em",
                    marginBottom: 8,
                  }}
                >
                  {t(
                    "当前状态正在改变护理策略",
                    "CURRENT STATE CHANGES YOUR PLAN",
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginBottom: 10,
                  }}
                >
                  {stateKeys.map((key) => (
                    <span
                      key={key}
                      style={{
                        border: "1px solid #D8C293",
                        borderRadius: 999,
                        padding: "5px 9px",
                        background: "white",
                        fontSize: 11.5,
                        color: "#76592F",
                        fontWeight: 700,
                      }}
                    >
                      {language === "zh"
                        ? STATE_GUIDANCE[key].zh
                        : STATE_GUIDANCE[key].en}
                    </span>
                  ))}
                </div>
                {activeState && (
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "#665846",
                      lineHeight: 1.65,
                    }}
                  >
                    <b>{t("这会改变什么：", "What changes: ")}</b>
                    {language === "zh"
                      ? activeState.impactZh
                      : activeState.impactEn}
                  </div>
                )}
              </section>
            )}
            {findings.length > 0 && (
              <section
                style={{
                  border: `1px solid ${LINE}`,
                  borderRadius: 20,
                  padding: 18,
                  background: CARD,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: SAGE,
                    fontWeight: 800,
                    letterSpacing: ".08em",
                    marginBottom: 6,
                  }}
                >
                  {t(
                    "可能机制与需要鉴别",
                    "POSSIBLE MECHANISMS & DIFFERENTIAL",
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: MUTE,
                    lineHeight: 1.65,
                    marginBottom: 12,
                  }}
                >
                  {t(
                    "这里不是医学确诊。系统根据你实际回答的分支，对不同解释做加减分，并保留支持与削弱证据。",
                    "This is not a medical diagnosis. The system scores competing explanations from the branches you actually answered and retains supporting and contradicting evidence.",
                  )}
                </div>
                {findings.map((item, index) => (
                  <div
                    key={`${item.key}-${index}`}
                    style={{
                      padding: "11px 0",
                      borderTop: index ? `1px solid ${LINE}` : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "baseline",
                      }}
                    >
                      <b style={{ fontSize: 14 }}>
                        {language === "zh" ? item.labelZh : item.labelEn}
                      </b>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: item.level === "high" ? AMBER : SAGE,
                        }}
                      >
                        {item.score}% ·{" "}
                        {item.level === "high"
                          ? t("较高", "HIGHER")
                          : item.level === "moderate"
                            ? t("中等", "MODERATE")
                            : t("较低", "LOW")}
                      </span>
                    </div>
                    {item.supporting.length > 0 && (
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "#596158",
                          lineHeight: 1.6,
                          marginTop: 5,
                        }}
                      >
                        {t("支持：", "Supports: ")}
                        {item.supporting.slice(0, 2).join(t("；", "; "))}
                      </div>
                    )}
                    {item.contradicting.length > 0 && (
                      <div
                        style={{
                          fontSize: 11,
                          color: MUTE,
                          lineHeight: 1.55,
                          marginTop: 3,
                        }}
                      >
                        {t("削弱：", "Against: ")}
                        {item.contradicting.slice(0, 1).join(t("；", "; "))}
                      </div>
                    )}
                    {item.risk.length > 0 && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#8A5A42",
                          lineHeight: 1.55,
                          marginTop: 4,
                        }}
                      >
                        {item.risk[0]}
                      </div>
                    )}
                  </div>
                ))}
              </section>
            )}
            {decision?.pregnancySafetyOverride && (
              <section
                style={{
                  border: "1px solid #C8AD7A",
                  borderRadius: 20,
                  padding: 16,
                  background: "#FFF8E8",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#8A6536",
                    letterSpacing: ".07em",
                    marginBottom: 5,
                  }}
                >
                  {t(
                    "孕期 / 哺乳期安全优先",
                    "PREGNANCY / BREASTFEEDING SAFETY OVERRIDE",
                  )}
                </div>
                <div
                  style={{ fontSize: 12, color: "#665846", lineHeight: 1.65 }}
                >
                  {t(
                    "安全规则优先于普通功效目标；维A类会从推荐候选中硬性排除，而不是只做轻微扣分。",
                    "Safety rules override ordinary efficacy goals. Retinoids are hard-excluded from recommendation candidates rather than receiving a small penalty.",
                  )}
                </div>
              </section>
            )}
            <section
              style={{
                border: `1px solid ${SAGE}`,
                borderRadius: 20,
                padding: 17,
                background: "#F1F2E9",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: SAGE,
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  marginBottom: 6,
                }}
              >
                {t("当前护理优先级", "CURRENT CARE PRIORITY")}
              </div>
              <div style={{ fontSize: 21, fontWeight: 700, marginBottom: 14 }}>
                {priority}
              </div>
              {[
                [
                  t("先简化", "Simplify first"),
                  t(
                    "暂停近期新增、明显刺激或与你当前方向冲突的产品。",
                    "Pause recently added, clearly irritating, or conflicting products.",
                  ),
                ],
                [
                  t("保留基础", "Keep the basics"),
                  t(
                    "温和清洁、合适保湿和白天防晒先保持稳定。",
                    "Keep gentle cleansing, suitable moisturization, and daytime sunscreen stable.",
                  ),
                ],
                [
                  t("再做选择", "Choose next"),
                  t(
                    "先看产品匹配，再决定下一件真正值得加入的产品。",
                    "Check product fit before deciding what is actually worth adding next.",
                  ),
                ],
              ].map(([a, b]) => (
                <div
                  key={a}
                  style={{ padding: "10px 0", borderTop: `1px solid ${LINE}` }}
                >
                  <div
                    style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}
                  >
                    {a}
                  </div>
                  <div style={{ fontSize: 12, color: MUTE, lineHeight: 1.6 }}>
                    {b}
                  </div>
                </div>
              ))}
            </section>
            <SkinAnalysisReport
              profile={profile}
              products={products}
              onProduct={onProduct}
            />
            <div
              style={{
                fontSize: 11,
                letterSpacing: ".1em",
                color: MUTE,
                fontWeight: 700,
                margin: "24px 0 10px",
              }}
            >
              {t("下一步", "NEXT")}
            </div>
            <Action
              icon={<Search size={16} />}
              title={t(
                "查看更多为我排序的产品",
                "Browse more products ranked for me",
              )}
              body={t(
                "完整报告先给你最匹配的五款产品，这里可以继续查看全部匹配结果。",
                "Your report shows the Top 5; continue here for the full ranked list.",
              )}
              onClick={onFindProducts}
            />
            <Action
              icon={<ListChecks size={16} />}
              title={t("建立早晚护肤", "Build an AM/PM routine")}
              body={t(
                "把适合你的产品组合成清晰步骤。",
                "Turn suitable products into clear steps.",
              )}
              onClick={onBuildRoutine}
            />
            <button
              onClick={onRetake}
              style={{
                width: "100%",
                border: 0,
                background: "transparent",
                color: MUTE,
                padding: 12,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: sans,
              }}
            >
              {t("重新分析并更新档案", "Retake analysis and update profile")}
            </button>
            {profile.updatedAt && (
              <div
                style={{
                  marginTop: 10,
                  textAlign: "center",
                  fontSize: 10.5,
                  color: MUTE,
                }}
              >
                {t("更新于", "Updated")}{" "}
                {new Date(profile.updatedAt).toLocaleDateString(
                  language === "zh" ? "zh-CN" : "en-US",
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
