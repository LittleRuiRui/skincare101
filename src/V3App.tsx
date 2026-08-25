import React, { useEffect, useState } from "react";
import LegacyApp from "./App";
import V3Home from "./components/V3Home";
import V3MySkin from "./components/V3MySkin";
import { loadSharedProductCatalog } from "./lib/supabase";
import { loadMySkinProfile } from "./lib/mySkin";
import type { SkinProfileRecord } from "./lib/skinProfile";

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
`;

export default function V3App() {
  const [route, setRoute] = useState<"home" | "mySkin" | "legacy">("home");
  const [profile, setProfile] = useState<SkinProfileRecord | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    let active = true;
    loadMySkinProfile()
      .then((result) => { if (active) setProfile(result); })
      .catch(() => { if (active) setProfile(null); })
      .finally(() => { if (active) setProfileChecked(true); });

    loadSharedProductCatalog()
      .then((products) => { if (active) setProductCount(products.length); })
      .catch(() => {});

    return () => { active = false; };
  }, [route]);

  function goTo(target: string) {
    if (target === "report" || target === "mySkin") {
      setRoute("mySkin");
      return;
    }
    // During the V3 migration, existing diagnosis / OCR / recommendation tools
    // remain intact inside the legacy application. We progressively replace
    // these destinations without breaking the working prototype.
    setRoute("legacy");
  }

  if (route === "legacy") {
    return (
      <>
        <style>{FONT_IMPORT}</style>
        <div style={{ position: "fixed", zIndex: 50, left: 12, top: 12 }}>
          <button onClick={() => setRoute("home")} style={{ border: "1px solid #DDD6CA", borderRadius: 999, padding: "7px 11px", background: "rgba(247,243,236,.94)", color: "#211F1B", fontSize: 11, cursor: "pointer", boxShadow: "0 3px 15px rgba(0,0,0,.06)" }}>← V3 Home</button>
        </div>
        <LegacyApp />
      </>
    );
  }

  if (route === "mySkin") {
    return (
      <>
        <style>{FONT_IMPORT}</style>
        <V3MySkin
          profile={profile}
          onBack={() => setRoute("home")}
          onRetake={() => setRoute("legacy")}
          onFindProducts={() => setRoute("legacy")}
          onBuildRoutine={() => setRoute("legacy")}
          onOpenLegacyReport={() => setRoute("legacy")}
        />
      </>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F3EC", color: "#211F1B", fontFamily: "'IBM Plex Sans', sans-serif", display: "flex", justifyContent: "center", padding: "26px 16px" }}>
      <style>{FONT_IMPORT}</style>
      <div style={{ width: "100%", maxWidth: 520 }}>
        {!profileChecked ? (
          <div style={{ paddingTop: 80, textAlign: "center", color: "#777065", fontSize: 12 }}>Loading your skin context…</div>
        ) : (
          <V3Home goTo={goTo} hasProfile={Boolean(profile)} productCount={productCount} />
        )}
      </div>
    </div>
  );
}
