import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SkinProfileSummary } from "./skinProfile";

export type AppLanguage = "zh" | "en";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (zh: string, en: string) => string;
};

const LanguageContext = createContext<LanguageContextValue>({ language: "zh", setLanguage: () => {}, toggleLanguage: () => {}, t: (zh) => zh });
const STORAGE_KEY = "skincare101-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window === "undefined") return "zh";
    return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "zh";
  });
  function setLanguage(next: AppLanguage) {
    setLanguageState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent("skincare101:language", { detail: { language: next } }));
    }
  }
  useEffect(() => { if (typeof document !== "undefined") document.documentElement.lang = language === "zh" ? "zh-CN" : "en"; }, [language]);
  const value = useMemo<LanguageContextValue>(() => ({ language, setLanguage, toggleLanguage: () => setLanguage(language === "zh" ? "en" : "zh"), t: (zh, en) => language === "zh" ? zh : en }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage() { return useContext(LanguageContext); }

const DYNAMIC_EN: Record<string,string> = {
  "暗沉": "Dullness",
  "粗糙 / 肤质不平": "Roughness / uneven texture",
  "刷酸 / 去角质期": "Exfoliation phase",
  "A醇 / 维A类使用期": "Retinoid phase",
  "敏感 / 屏障不稳定期": "Sensitive / unstable barrier",
  "医美 / 焕肤恢复期": "Post-procedure recovery",
  "爆痘期": "Breakout phase",
  "环境变化期": "Environmental change",
  "孕期 / 哺乳期": "Pregnancy / breastfeeding",
  "刷酸频率较高": "Frequent exfoliation",
  "规律刷酸": "Regular exfoliation",
  "正在建立 A 醇耐受": "Building retinol tolerance",
  "近期提高 A 醇浓度 / 频率": "Recently increased retinol strength / frequency",
  "环境更冷 / 更干": "Colder / drier environment",
  "环境更热 / 更潮湿": "Hotter / more humid environment",
  "长期空调环境": "Prolonged air-conditioned environment",
  "偏干":"Dry-leaning","偏油":"Oily-leaning","中性 / 平衡":"Balanced","混合":"Combination","混合偏油 / 缺水":"Combination / dehydrated","已建档":"Profile saved","尚未建档":"No profile yet",
  "敏感倾向":"Sensitivity-prone","耐受相对稳定":"Relatively resilient","未确认":"Not confirmed","未知":"Unknown",
  "泛红":"Redness","痘痘":"Acne","毛孔":"Pores","色沉":"Pigmentation","干燥":"Dryness","敏感":"Sensitivity","细纹 / 抗老":"Fine lines / aging",
  "孕期 / 哺乳期安全优先":"Pregnancy / breastfeeding safety first","存在需要优先就医评估的信号":"A symptom may need medical evaluation first",
  "乳液 / 面霜":"Lotion / Cream","精华":"Serum","洁面":"Cleanser","卸妆":"Makeup remover","化妆水/精华水":"Toner / Essence","眼霜":"Eye care","面膜":"Mask","防晒":"Sunscreen","焕肤":"Exfoliation","祛痘":"Acne treatment","精华油":"Face oil"
};
export function localizeDynamic(value: string, language: AppLanguage) { return language === "en" ? (DYNAMIC_EN[value] || value) : value; }
export function localizeSkinSummary(summary: SkinProfileSummary, language: AppLanguage): SkinProfileSummary {
  if (language === "zh") return summary;
  return { ...summary, skinType: localizeDynamic(summary.skinType, language), sensitivity: localizeDynamic(summary.sensitivity, language), concerns: summary.concerns.map(x=>localizeDynamic(x,language)), context: summary.context.map(x=>localizeDynamic(x,language)) };
}

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return <div style={{display:"inline-flex",border:"1px solid #E4E0D8",borderRadius:999,padding:3,background:"rgba(252,251,248,.96)",boxShadow:"0 2px 10px rgba(40,38,32,.04)"}} aria-label={language === "zh" ? "语言选择" : "Language selector"}>{(["zh","en"] as AppLanguage[]).map(item=><button key={item} onClick={()=>setLanguage(item)} style={{border:0,borderRadius:999,padding:"6px 9px",background:language===item?"#66786E":"transparent",color:language===item?"#fff":"#817D75",fontSize:11,fontWeight:650,cursor:"pointer"}}>{item==="zh"?"中文":"EN"}</button>)}</div>;
}
