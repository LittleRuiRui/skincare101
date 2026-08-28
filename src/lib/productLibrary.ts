export type TriedState="liked"|"disliked"|null;
export type ProductPreference={liked:boolean;watchlist:boolean;tried:TriedState};
export type ProductPreferenceMap=Record<string,ProductPreference>;

const PREF_KEY="skincare101-product-preferences-v2";
const LEGACY_PREF_KEY="skincare101-product-preferences-v1";
const HISTORY_KEY="skincare101-product-history-v1";
const MAX_HISTORY=40;

function safeParse<T>(raw:string|null,fallback:T):T{try{return raw?JSON.parse(raw) as T:fallback}catch{return fallback}}

export function readProductPreferences():ProductPreferenceMap{
 try{
  const current=safeParse<Record<string,Partial<ProductPreference>>>(localStorage.getItem(PREF_KEY),{});
  if(Object.keys(current).length)return Object.fromEntries(Object.entries(current).map(([id,p])=>[id,{liked:Boolean(p.liked),watchlist:Boolean(p.watchlist),tried:p.tried==="liked"||p.tried==="disliked"?p.tried:null}]));
  const legacy=safeParse<Record<string,{watchlist?:boolean;tried?:TriedState}>>(localStorage.getItem(LEGACY_PREF_KEY),{});
  const migrated:ProductPreferenceMap=Object.fromEntries(Object.entries(legacy).map(([id,p])=>[id,{liked:false,watchlist:Boolean(p.watchlist),tried:p.tried==="liked"||p.tried==="disliked"?p.tried:null}]));
  if(Object.keys(migrated).length)localStorage.setItem(PREF_KEY,JSON.stringify(migrated));
  return migrated;
 }catch{return{}}
}

export function writeProductPreferences(prefs:ProductPreferenceMap){try{localStorage.setItem(PREF_KEY,JSON.stringify(prefs));window.dispatchEvent(new Event("skincare101:product-preferences-changed"))}catch{}}

export function updateProductPreference(productId:string,patch:Partial<ProductPreference>){const prefs=readProductPreferences();const current=prefs[productId]||{liked:false,watchlist:false,tried:null};const next={...current,...patch};prefs[productId]=next;writeProductPreferences(prefs);return next}

export function readProductHistory():string[]{try{return safeParse<string[]>(localStorage.getItem(HISTORY_KEY),[]).filter(Boolean).slice(0,MAX_HISTORY)}catch{return[]}}

export function recordProductView(productId:string){try{const next=[productId,...readProductHistory().filter(id=>id!==productId)].slice(0,MAX_HISTORY);localStorage.setItem(HISTORY_KEY,JSON.stringify(next));window.dispatchEvent(new Event("skincare101:product-history-changed"))}catch{}}

export function clearProductHistory(){try{localStorage.removeItem(HISTORY_KEY);window.dispatchEvent(new Event("skincare101:product-history-changed"))}catch{}}
