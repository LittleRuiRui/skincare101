import { supabase } from "./supabase";
import { normalizeSearchText } from "./productSearch";

const VISITOR_KEY="skincare101-analytics-visitor";

function getVisitorId():string|null{
  try{
    const existing=window.localStorage.getItem(VISITOR_KEY);
    if(existing)return existing;
    const id=typeof crypto!=="undefined"&&"randomUUID" in crypto?crypto.randomUUID():null;
    if(id)window.localStorage.setItem(VISITOR_KEY,id);
    return id;
  }catch{return null;}
}

export async function logSearchEvent(query:string,resultCount:number,source="product_search",locale?:string):Promise<void>{
  const trimmed=query.trim().slice(0,200);
  if(trimmed.length<2)return;
  const normalized=normalizeSearchText(trimmed).slice(0,200);
  if(!normalized)return;
  await supabase.from("search_events").insert({query:trimmed,normalized_query:normalized,result_count:Math.max(0,Math.min(resultCount,1000)),source,locale:locale||null,visitor_id:getVisitorId()});
}

export async function logSearchSelection(query:string,productId:string,resultCount:number,source="product_search",locale?:string):Promise<void>{
  const trimmed=query.trim().slice(0,200);
  const normalized=normalizeSearchText(trimmed).slice(0,200);
  const selectedProductId=productId.replace(/^shared-/,"");
  if(!normalized)return;
  await supabase.from("search_events").insert({query:trimmed,normalized_query:normalized,result_count:Math.max(0,Math.min(resultCount,1000)),selected_product_id:selectedProductId,source,locale:locale||null,visitor_id:getVisitorId()});
}
