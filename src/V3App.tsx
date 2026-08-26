import React, { useEffect, useRef, useState } from "react";
import V3Home from "./components/V3Home";
import V3MySkin from "./components/V3MySkin";
import V3Explore from "./components/V3Explore";
import type { ExploreEntry } from "./components/V3Explore";
import V3RoutineBuilder from "./components/V3RoutineBuilder";
import V3ProductDetail from "./components/V3ProductDetail";
import { loadSharedProductCatalog, saveMySkinProfile, supabase, type SharedProductRecord } from "./lib/supabase";
import { loadMySkinProfiles, setActiveSkinProfile } from "./lib/mySkin";
import type { SkinProfileRecord } from "./lib/skinProfile";
import type { BrowseConcern } from "./lib/productPresentation";
import { clearPendingProfileDraft, loadPendingProfileDraftRecord } from "./lib/profileDraft";

const LegacyApp = React.lazy(() => import("./App"));

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
`;

type Route = "home" | "mySkin" | "explore" | "routine" | "product" | "legacy";

export default function V3App() {
  const [route, setRoute] = useState<Route>("home");
  const [profile, setProfile] = useState<SkinProfileRecord | null>(null);
  const [profiles, setProfiles] = useState<SkinProfileRecord[]>([]);
  const [profileChecked, setProfileChecked] = useState(false);
  const [products, setProducts] = useState<SharedProductRecord[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SharedProductRecord | null>(null);
  const [selectedConcern, setSelectedConcern] = useState<BrowseConcern>("all");
  const [exploreEntry, setExploreEntry] = useState<ExploreEntry>("explore");
  const [legacyStart, setLegacyStart] = useState<string | undefined>();
  const pendingProfileSaveRef = useRef(false);

  async function refreshProfiles() {
    try {
      const result = await loadMySkinProfiles();
      setProfiles(result);
      setProfile(result.find((item) => item.isActive) || result[0] || null);
    } catch {
      setProfiles([]);
      setProfile(null);
    } finally {
      setProfileChecked(true);
    }
  }

  useEffect(() => {
    let active = true;
    loadMySkinProfiles()
      .then((result) => { if (active) { setProfiles(result); setProfile(result.find((item) => item.isActive) || result[0] || null); } })
      .catch(() => { if (active) { setProfiles([]); setProfile(null); } })
      .finally(() => { if (active) setProfileChecked(true); });

    loadSharedProductCatalog()
      .then((result) => { if (active) setProducts(result); })
      .catch(() => {});

    return () => { active = false; };
  }, []);

  useEffect(() => {
    async function savePendingProfileAfterAuth() {
      if (pendingProfileSaveRef.current) return;
      const pending = loadPendingProfileDraftRecord();
      if (!pending) return;

      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) return;

      pendingProfileSaveRef.current = true;
      try {
        await saveMySkinProfile(pending.profile, pending.name || "我的肤质档案");
        clearPendingProfileDraft();
        await refreshProfiles();
        setRoute("mySkin");
      } catch (error) {
        console.error("Could not autosave pending skin profile after authentication", error);
      } finally {
        pendingProfileSaveRef.current = false;
      }
    }

    void savePendingProfileAfterAuth();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        setTimeout(() => { void savePendingProfileAfterAuth(); }, 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function chooseProfile(profileId: string) {
    const selected = profiles.find((item) => item.id === profileId);
    if (!selected) return;
    setProfile(selected);
    setProfiles((items) => items.map((item) => ({ ...item, isActive: item.id === profileId })));
    await setActiveSkinProfile(profileId);
  }

  function openProduct(product: SharedProductRecord, concern: BrowseConcern = "all") {
    setSelectedProduct(product);
    setSelectedConcern(concern);
    setRoute("product");
  }

  function goTo(target: string) {
    if (target === "report" || target === "mySkin") return setRoute("mySkin");
    const exploreTargets: Record<string, ExploreEntry> = { recommend: "forYou", quickRecommend: "explore", explore: "explore", search: "search", brands: "brands", concerns: "concerns", luxury: "luxury", niche: "niche" };
    if (exploreTargets[target]) { setExploreEntry(exploreTargets[target]); return setRoute("explore"); }
    if (target === "routine") return setRoute("routine");
    if (target === "skin") return createProfile();
    if (target === "upload" || target === "quickIngredient") {
      setLegacyStart("upload");
      return setRoute("legacy");
    }
    setLegacyStart(undefined);
    setRoute("legacy");
  }

  function createProfile() {
    clearPendingProfileDraft();
    setLegacyStart("skin");
    setRoute("legacy");
  }

  if (route === "legacy") {
    return (
      <>
        <style>{FONT_IMPORT}</style>
        <div style={{ position: "fixed", zIndex: 50, left: 12, top: 12 }}>
          <button onClick={() => { void refreshProfiles().finally(() => { setLegacyStart(undefined); setRoute("home"); }); }} style={{ border: "1px solid #DDD6CA", borderRadius: 999, padding: "7px 11px", background: "rgba(247,243,236,.94)", color: "#211F1B", fontSize: 11, cursor: "pointer", boxShadow: "0 3px 15px rgba(0,0,0,.06)" }}>← 返回档案首页</button>
        </div>
        <React.Suspense fallback={<div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F7F3EC", color: "#777065", fontSize: 12 }}>Loading the full analysis tools…</div>}><LegacyApp initialScreen={legacyStart} /></React.Suspense>
      </>
    );
  }

  if (route === "mySkin") {
    return <><style>{FONT_IMPORT}</style><V3MySkin profile={profile} onBack={() => setRoute("home")} onRetake={createProfile} onFindProducts={() => goTo("recommend")} onBuildRoutine={() => setRoute("routine")} onOpenLegacyReport={() => { setLegacyStart("report"); setRoute("legacy"); }} /></>;
  }

  if (route === "explore") {
    return <><style>{FONT_IMPORT}</style><V3Explore products={products} profile={profile} entry={exploreEntry} onBack={() => setRoute("home")} onProduct={openProduct} /></>;
  }

  if (route === "routine") {
    return <><style>{FONT_IMPORT}</style><V3RoutineBuilder profile={profile} products={products} onBack={() => setRoute("home")} onExplore={() => setRoute("explore")} onProduct={openProduct} /></>;
  }

  if (route === "product" && selectedProduct) {
    return <><style>{FONT_IMPORT}</style><V3ProductDetail product={selectedProduct} products={products} profile={profile} concern={selectedConcern} onBack={() => setRoute("explore")} onProduct={openProduct} /></>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F3EC", color: "#211F1B", fontFamily: "'IBM Plex Sans', sans-serif", display: "flex", justifyContent: "center", padding: "26px 16px" }}>
      <style>{FONT_IMPORT}</style>
      <div style={{ width: "100%", maxWidth: 520 }}>
        {!profileChecked ? <div style={{ paddingTop: 80, textAlign: "center", color: "#777065", fontSize: 12 }}>Loading your skin context…</div> : <V3Home goTo={goTo} profile={profile} profiles={profiles} onChooseProfile={chooseProfile} onCreateProfile={createProfile} />}
      </div>
    </div>
  );
}
