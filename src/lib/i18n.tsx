import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "zh" | "en";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (zh: string, en: string) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: "zh",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (zh) => zh,
});

const STORAGE_KEY = "skincare101-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window === "undefined") return "zh";
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "en" ? "en" : "zh";
  });

  function setLanguage(next: AppLanguage) {
    setLanguageState(next);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
  }

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    toggleLanguage: () => setLanguage(language === "zh" ? "en" : "zh"),
    t: (zh, en) => language === "zh" ? zh : en,
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return (
    <div style={{ display: "inline-flex", border: "1px solid #E4E0D8", borderRadius: 999, padding: 3, background: "rgba(252,251,248,.96)", boxShadow: "0 2px 10px rgba(40,38,32,.04)" }} aria-label="Language selector">
      {(["zh", "en"] as AppLanguage[]).map((item) => (
        <button key={item} onClick={() => setLanguage(item)} style={{ border: 0, borderRadius: 999, padding: "6px 9px", background: language === item ? "#66786E" : "transparent", color: language === item ? "#fff" : "#817D75", fontSize: 11, fontWeight: 650, cursor: "pointer" }}>
          {item === "zh" ? "中文" : "EN"}
        </button>
      ))}
    </div>
  );
}
