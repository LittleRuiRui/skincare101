import React,{createContext,useCallback,useContext,useEffect,useMemo,useRef,useState}from"react";
import{currentSession,loadSharedProductCatalog,saveMySkinProfile,supabase,type SharedProductRecord}from"./supabase";
import{deleteSkinProfile,loadMySkinProfiles,renameSkinProfile,setActiveSkinProfile}from"./mySkin";
import type{SkinProfileRecord}from"./skinProfile";
import{loadShelf,loadShelfSynced,type ShelfEntry}from"./myShelf";
import{clearPendingProfileDraft,loadPendingProfileDraftRecord}from"./profileDraft";

export type AppViewContext="home"|"mySkin"|"skinGuidance"|"explore"|"routine"|"product"|"ingredientCheck"|"matchHub"|"profileBuilder"|"account"|"onboardingComplete"|"onboardingReplay"|"other";

type RuntimeValue={
 products:SharedProductRecord[];
 profiles:SkinProfileRecord[];
 profile:SkinProfileRecord|null;
 profileChecked:boolean;
 shelfEntries:ShelfEntry[];
 viewContext:AppViewContext;
 currentProduct:SharedProductRecord|null;
 setViewContext:(view:AppViewContext,product?:SharedProductRecord|null)=>void;
 refreshProfiles:()=>Promise<SkinProfileRecord[]>;
 refreshShelf:()=>Promise<ShelfEntry[]>;
 persistPendingProfile:()=>Promise<boolean>;
 chooseProfile:(id:string)=>Promise<void>;
 renameProfile:(id:string,name:string)=>Promise<void>;
 removeProfile:(id:string)=>Promise<void>;
};

const AppRuntimeContext=createContext<RuntimeValue|null>(null);

export function AppRuntimeProvider({children}:{children:React.ReactNode}){
 const[products,setProducts]=useState<SharedProductRecord[]>([]);
 const[profiles,setProfiles]=useState<SkinProfileRecord[]>([]);
 const[profile,setProfile]=useState<SkinProfileRecord|null>(null);
 const[profileChecked,setProfileChecked]=useState(false);
 const[shelfEntries,setShelfEntries]=useState<ShelfEntry[]>(()=>loadShelf());
 const[viewContext,setView]=useState<AppViewContext>("home");
 const[currentProduct,setCurrentProduct]=useState<SharedProductRecord|null>(null);
 const pendingSaveRef=useRef(false);

 const refreshProfiles=useCallback(async()=>{
  try{
   const rows=await loadMySkinProfiles();
   setProfiles(rows);
   setProfile(rows.find(x=>x.isActive)||rows[0]||null);
   return rows;
  }catch{
   setProfiles([]);setProfile(null);return[];
  }finally{setProfileChecked(true)}
 },[]);
 const refreshShelf=useCallback(async()=>{
  try{const rows=await loadShelfSynced();setShelfEntries(rows);return rows}
  catch{const rows=loadShelf();setShelfEntries(rows);return rows}
 },[]);
 const persistPendingProfile=useCallback(async()=>{
  if(pendingSaveRef.current)return false;
  const pending=loadPendingProfileDraftRecord();
  if(!pending)return false;
  const session=await currentSession();
  if(!session?.user)return false;
  pendingSaveRef.current=true;
  try{
   await saveMySkinProfile(pending.profile,pending.name||"");
   clearPendingProfileDraft();
   await refreshProfiles();
   return true;
  }finally{pendingSaveRef.current=false}
 },[refreshProfiles]);
 const setViewContext=useCallback((view:AppViewContext,product:SharedProductRecord|null=null)=>{
  setView(view);setCurrentProduct(view==="product"?product:null);
 },[]);

 useEffect(()=>{
  let active=true;
  void loadSharedProductCatalog().then(rows=>{if(active)setProducts(rows)}).catch(()=>{});
  void refreshProfiles();
  void refreshShelf();
  void persistPendingProfile().catch(()=>{});
  const shelfChanged=()=>{void refreshShelf()};
  window.addEventListener("skincare101:shelf-changed",shelfChanged);
  const{data}=supabase.auth.onAuthStateChange(()=>{setTimeout(()=>{void persistPendingProfile().catch(()=>{});void refreshProfiles();void refreshShelf()},0)});
  return()=>{active=false;window.removeEventListener("skincare101:shelf-changed",shelfChanged);data.subscription.unsubscribe()};
 },[persistPendingProfile,refreshProfiles,refreshShelf]);

 const chooseProfile=useCallback(async(id:string)=>{
  const selected=profiles.find(x=>x.id===id);if(!selected)return;
  setProfile(selected);setProfiles(rows=>rows.map(x=>({...x,isActive:x.id===id})));
  await setActiveSkinProfile(id);
 },[profiles]);
 const renameProfileAction=useCallback(async(id:string,name:string)=>{await renameSkinProfile(id,name);await refreshProfiles()},[refreshProfiles]);
 const removeProfile=useCallback(async(id:string)=>{await deleteSkinProfile(id);await refreshProfiles()},[refreshProfiles]);
 const value=useMemo<RuntimeValue>(()=>({products,profiles,profile,profileChecked,shelfEntries,viewContext,currentProduct,setViewContext,refreshProfiles,refreshShelf,persistPendingProfile,chooseProfile,renameProfile:renameProfileAction,removeProfile}),[products,profiles,profile,profileChecked,shelfEntries,viewContext,currentProduct,setViewContext,refreshProfiles,refreshShelf,persistPendingProfile,chooseProfile,renameProfileAction,removeProfile]);
 return <AppRuntimeContext.Provider value={value}>{children}</AppRuntimeContext.Provider>;
}

export function useAppRuntime(){const value=useContext(AppRuntimeContext);if(!value)throw new Error("useAppRuntime must be used inside AppRuntimeProvider");return value}
