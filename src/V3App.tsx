import React, { useEffect, useState } from "react";
import V3Home from "./components/V3Home";
import V3MySkin from "./components/V3MySkin";
import V3Explore from "./components/V3Explore";
import V3RoutineBuilder from "./components/V3RoutineBuilder";
import V3ProductDetail from "./components/V3ProductDetail";
import { loadSharedProductCatalog, type SharedProductRecord } from "./lib/supabase";
import { loadMySkinProfile } from "./lib/mySkin";
import type { SkinProfileRecord } from "./lib/skinProfile";
import type { BrowseConcern } from "./lib/productPresentation";

const LegacyApp = React.lazy(() => import("./App"));

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
`;

type Route = "home" | "mySkin" | "explore" | "routine" | "product" | "legacy";

export default function V3App() {
  const [route, setRoute] = useState<Route>("home");
  const [profile, setProfile] = useState<SkinProfileRecord | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [products, setProducts] = useState<SharedProductRecord[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SharedProductRecord | null>(null);
  const [selectedConcern, setSelectedConcern] = useState<BrowseConcern>("all");

  useEffect(() => {
    let active = true;
    loadMySkinProfile()
      .then((result) => { if (active) setProfile(result); })
      .catch(() => { if (active) setProfile(null); })
      .finally(() => { if (active) setProfileChecked(true); });

    loadSharedProductCatalog()
      .then((result) => { if (active) setProducts(result); })
      .catch(() => {});

    return () => { active = false; };
  }, []);

  function openProduct(product: SharedProductRecord, concern: BrowseConcern = "all") {
    setSelectedProduct(product);
    setSelectedConcern(concern);
    setRoute("product");
  }

  function goTo(target: string) {
    if (target === "report" || target === "mySkin") return setRoute("mySkin");
    if (target === "recommend" || target === "quickRecommend") return setRoute("explore");
    if (target === "routine") return setRoute("routine");
    setRoute("legacy");
  }

  if (route === "legacy") {
    return (
      <>
        <style>{FONT_IMPORT}</style>
        <div style={{ position: "fixed", zIndex: 50, left: 12, top: 12 }}>
          <button onClick={() => setRoute("home")} style={{ border: "1px solid #DDD6CA", borderRadius: 999, padding: "7px 11px", background: "rgba(247,243,236,.94)", color: "#211F1B", fontSize: 11, cursor: "pointer", boxShadow: "0 3px 15px rgba(0,0,0,.06)" }}>← V3 Home</button>
        </div>
        <React.Suspense fallback={<div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F7F3EC", color: "#777065", fontSize: 12 }}>Loading the full analysis tools…</div>}><LegacyApp /></React.Suspense>
      </>
    );
  }

  if (route === "mySkin") {
    return <><style>{FONT_IMPORT}</style><V3MySkin profile={profile} onBack={() => setRoute("home")} onRetake={() => setRoute("legacy")} onFindProducts={() => setRoute("explore")} onBuildRoutine={() => setRoute("routine")} onOpenLegacyReport={() => setRoute("legacy")} /></>;
  }

  if (route === "explore") {
    return <><style>{FONT_IMPORT}</style><V3Explore products={products} profile={profile} onBack={() => setRoute("home")} onProduct={openProduct} /></>;
  }

  if (route === "routine") {
    return <><style>{FONT_IMPORT}</style><V3RoutineBuilder profile={profile} products={products} onBack={() => setRoute("home")} onExplore={() => setRoute("explore")} onProduct={openProduct} /></>;
  }

  if (route === "product" && selectedProduct) {
    return <><style>{FONT_IMPORT}</style><V3ProductDetail product={selectedProduct} profile={profile} concern={selectedConcern} onBack={() => setRoute("explore")} /></>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F3EC", color: "#211F1B", fontFamily: "'IBM Plex Sans', sans-serif", display: "flex", justifyContent: "center", padding: "26px 16px" }}>
      <style>{FONT_IMPORT}</style>
      <div style={{ width: "100%", maxWidth: 520 }}>
        {!profileChecked ? <div style={{ paddingTop: 80, textAlign: "center", color: "#777065", fontSize: 12 }}>Loading your skin context…</div> : <V3Home goTo={goTo} hasProfile={Boolean(profile)} productCount={products.length} />}
      </div>
    </div>
  );
}
