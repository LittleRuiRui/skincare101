import React, { useEffect, useRef, useState } from "react";
import V3Home from "./components/V3Home";
import V3MySkin from "./components/V3MySkin";
import V3Explore from "./components/V3Explore";
import type { ExploreEntry } from "./components/V3Explore";
import V3RoutineBuilder from "./components/V3RoutineBuilder";
import V3ProductDetail from "./components/V3ProductDetail";
import V3ProductScanner from "./components/V3ProductScanner";
import V3MatchHub from "./components/V3MatchHub";
import V3SkinGuidance from "./components/V3SkinGuidance";
import EmailAccountPanel from "./components/EmailAccountPanel";
import { loadSharedProductCatalog, saveMySkinProfile, supabase, type SharedProductRecord } from "./lib/supabase";
import { loadMySkinProfiles } from "./lib/mySkin";
import type { SkinProfileRecord } from "./lib/skinProfile";
import type { BrowseConcern } from "./lib/productPresentation";
import { clearPendingProfileDraft, loadPendingProfileDraftRecord } from "./lib/profileDraft";
import { LanguageProvider, LanguageSwitch, useLanguage } from "./lib/i18n";

const LegacyApp = React.lazy(() => import("./App"));
const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap');`;
type Route = "home" | "mySkin" | "skinGuidance" | "explore" | "routine" | "product" | "ingredientCheck" | "matchHub" | "legacy" | "account";
type ProductReturnRoute = "home" | "explore" | "matchHub";

function V3AppContent() {
  const { t } = useLanguage();
  const [route, setRoute] = useState<Route>("home");
  const [profile, setProfile] = useState<SkinProfileRecord | null>(null);
  const [profiles, setProfiles] = useState<SkinProfileRecord[]>([]);
  const [profileChecked, setProfileChecked] = useState(false);
  const [products, setProducts] = useState<SharedProductRecord[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SharedProductRecord | null>(null);
  const [selectedConcern, setSelectedConcern] = useState<BrowseConcern>("all");
  const [productReturnRoute, setProductReturnRoute] = useState<ProductReturnRoute>("explore");
  const [exploreEntry, setExploreEntry] = useState<ExploreEntry>("explore");
  const [legacyStart, setLegacyStart] = useState<string | undefined>();
  const pendingProfileSaveRef = useRef(false);

  async function refreshProfiles() { try { const result=await loadMySkinProfiles(); setProfiles(result); setProfile(result.find(i=>i.isActive)||result[0]||null); } catch { setProfiles([]); setProfile(null); } finally { setProfileChecked(true); } }
  useEffect(()=>{let active=true;loadMySkinProfiles().then(result=>{if(active){setProfiles(result);setProfile(result.find(i=>i.isActive)||result[0]||null)}}).catch(():void=>{}).finally(()=>{if(active)setProfileChecked(true)});loadSharedProductCatalog().then(result=>{if(active)setProducts(result)}).catch(():void=>{});return()=>{active=false}},[]);
  useEffect(()=>{async function savePending(){if(pendingProfileSaveRef.current)return;const pending=loadPendingProfileDraftRecord();if(!pending)return;const{data}=await supabase.auth.getSession();if(!data.session?.user)return;pendingProfileSaveRef.current=true;try{await saveMySkinProfile(pending.profile,pending.name||"");clearPendingProfileDraft();await refreshProfiles();setRoute("home")}catch(e){console.error(e)}finally{pendingProfileSaveRef.current=false}}void savePending();const{data}=supabase.auth.onAuthStateChange(event=>{if(event==="INITIAL_SESSION")setTimeout(():void=>{void savePending()},0);if(event==="SIGNED_IN")setTimeout(():void=>{void savePending().then(refreshProfiles).then(():void=>{setRoute("home")})},0)});return()=>data.subscription.unsubscribe()},[]);

  function openProduct(product:SharedProductRecord,concern:BrowseConcern="all",returnRoute:ProductReturnRoute="explore"){setSelectedProduct(product);setSelectedConcern(concern);setProductReturnRoute(returnRoute);setRoute("product")}
  function openRecommendations(){setExploreEntry("forYou");setRoute("explore")}
  function goTo(target:string){if(target==="report"||target==="mySkin")return setRoute("mySkin");if(target==="account")return setRoute("account");const exploreTargets:Record<string,ExploreEntry>={recommend:"forYou",quickRecommend:"explore",explore:"explore",search:"search",brands:"brands",concerns:"concerns",luxury:"luxury",niche:"niche"};if(exploreTargets[target]){setExploreEntry(exploreTargets[target]);return setRoute("explore")}if(target==="routine")return setRoute("routine");if(target==="skin")return createProfile();if(target==="upload")return setRoute("matchHub");if(target==="quickIngredient")return setRoute("ingredientCheck");setLegacyStart(undefined);setRoute("legacy")}
  function createProfile(){clearPendingProfileDraft();setLegacyStart("skin");setRoute("legacy")}
  function handleLegacyNavigation(event:React.MouseEvent<HTMLDivElement>){const target=event.target as HTMLElement|null,button=target?.closest("button"),text=button?.textContent?.replace(/\s+/g," ").trim()||"";if(text.includes("查看成分匹配分析")||text.includes("分析一瓶具体产品")||text.includes("Ingredient Match")){event.preventDefault();event.stopPropagation();setRoute("matchHub");return}if(text.includes("从产品数据库为我匹配")||text.includes("Match from product database")){event.preventDefault();event.stopPropagation();openRecommendations()}}

  const switcher=<div style={{position:"fixed",right:14,top:"calc(env(safe-area-inset-top, 0px) + 12px)",zIndex:100}}><LanguageSwitch/></div>;
  if(route==="legacy")return <><style>{FONT_IMPORT}</style>{switcher}<div style={{position:"fixed",zIndex:50,left:12,top:12}}><button onClick={()=>{void refreshProfiles().finally(()=>{setLegacyStart(undefined);setRoute("home")})}} style={{border:"1px solid #E4E0D8",borderRadius:999,padding:"7px 11px",background:"rgba(252,251,248,.95)",color:"#252724",fontSize:11,cursor:"pointer"}}>← {t("返回档案首页","Back to home")}</button></div><div onClickCapture={handleLegacyNavigation}><React.Suspense fallback={<div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#F6F4EF",color:"#777870",fontSize:12}}>{t("正在读取你的肌肤档案…","Loading your skin profile…")}</div>}><LegacyApp initialScreen={legacyStart} profileData={profile||undefined}/></React.Suspense></div></>;
  if(route==="account")return <><style>{FONT_IMPORT}</style>{switcher}<EmailAccountPanel profile={profile} onBack={()=>setRoute("home")}/></>;
  if(route==="mySkin")return <><style>{FONT_IMPORT}</style>{switcher}<V3MySkin profile={profile} onBack={()=>setRoute("home")} onRetake={createProfile} onFindProducts={()=>goTo("recommend")} onBuildRoutine={()=>setRoute("routine")} onOpenLegacyReport={()=>setRoute("skinGuidance")}/></>;
  if(route==="skinGuidance")return <><style>{FONT_IMPORT}</style>{switcher}<V3SkinGuidance profile={profile} onBack={()=>setRoute("mySkin")} onProducts={openRecommendations} onIngredientCheck={()=>setRoute("ingredientCheck")}/></>;
  if(route==="matchHub")return <><style>{FONT_IMPORT}</style>{switcher}<V3MatchHub profile={profile} products={products} onBack={()=>setRoute("home")} onScan={()=>setRoute("ingredientCheck")} onViewRecommendations={openRecommendations} onProduct={product=>openProduct(product,"all","matchHub")}/></>;
  if(route==="ingredientCheck")return <><style>{FONT_IMPORT}</style>{switcher}<V3ProductScanner profile={profile} products={products} onBack={()=>setRoute("matchHub")} onProduct={product=>openProduct(product,"all","matchHub")}/></>;
  if(route==="explore")return <><style>{FONT_IMPORT}</style>{switcher}<V3Explore products={products} profile={profile} entry={exploreEntry} onBack={()=>setRoute("home")} onProduct={(product,concern)=>openProduct(product,concern,"explore")}/></>;
  if(route==="routine")return <><style>{FONT_IMPORT}</style>{switcher}<V3RoutineBuilder profile={profile} products={products} onBack={()=>setRoute("home")} onExplore={()=>setRoute("explore")} onProduct={(product,concern)=>openProduct(product,concern,"explore")}/></>;
  if(route==="product"&&selectedProduct)return <><style>{FONT_IMPORT}</style>{switcher}<V3ProductDetail product={selectedProduct} products={products} profile={profile} concern={selectedConcern} onBack={()=>setRoute(productReturnRoute)} onProduct={(product,concern)=>openProduct(product,concern,productReturnRoute)}/></>;
  return <div style={{minHeight:"100vh",background:"#F7F5F0",color:"#252724",fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif",display:"flex",justifyContent:"center",padding:"26px 16px"}}><style>{FONT_IMPORT}</style>{switcher}<div style={{width:"100%",maxWidth:520}}>{!profileChecked?<div style={{paddingTop:80,textAlign:"center",color:"#777870",fontSize:12}}>{t("正在读取你的肤质档案…","Loading your skin profile…")}</div>:<V3Home goTo={goTo} profile={profile} products={products} onCreateProfile={createProfile} onProduct={product=>openProduct(product,"all","home")}/>}</div></div>;
}
export default function V3App(){return <LanguageProvider><V3AppContent/></LanguageProvider>}
