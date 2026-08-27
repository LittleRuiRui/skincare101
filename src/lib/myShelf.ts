import { supabase, type SharedProductRecord } from "./supabase";
import type { SkinProfileRecord } from "./skinProfile";
import { matchRating, personalizedScore } from "./productPresentation";

export type ShelfPeriod = "AM" | "PM";
export interface ShelfEntry { productId:string; addedAt:string; openedAt?:string; paoMonths?:number; periods:ShelfPeriod[]; }
export interface ShelfFinding { kind:"overlap"|"irritation"|"gap"|"sequence"; tone:"good"|"watch"|"neutral"; titleZh:string; titleEn:string; detailZh:string; detailEn:string; }
export interface NeedVerdict { level:"good-addition"|"optional"|"mostly-duplicate"|"not-recommended"; labelZh:string; labelEn:string; reasonZh:string; reasonEn:string; evidenceZh:string[]; evidenceEn:string[]; alternativeProductId?:string; }

const KEY="skincare101-my-shelf-v1";
export function loadShelf():ShelfEntry[]{try{const raw=localStorage.getItem(KEY);const parsed=raw?JSON.parse(raw):[];return Array.isArray(parsed)?parsed:[]}catch{return[]}}
function writeLocal(entries:ShelfEntry[]){try{localStorage.setItem(KEY,JSON.stringify(entries));window.dispatchEvent(new CustomEvent("skincare101:shelf-changed"))}catch{}}
export function saveShelf(entries:ShelfEntry[]){writeLocal(entries)}

export async function loadShelfSynced():Promise<ShelfEntry[]>{
 const local=loadShelf();
 const{data:userData}=await supabase.auth.getUser();
 if(!userData.user)return local;
 const{data,error}=await supabase.from("user_shelf_items").select("product_id,periods,opened_at,pao_months,created_at").eq("user_id",userData.user.id).order("created_at",{ascending:true});
 if(error)throw error;
 const remote=(data||[]).map(row=>({productId:row.product_id,periods:(row.periods||[]).filter((x:string)=>x==="AM"||x==="PM") as ShelfPeriod[],openedAt:row.opened_at||undefined,paoMonths:row.pao_months||undefined,addedAt:row.created_at||new Date().toISOString()}));
 if(remote.length===0&&local.length){await saveShelfSynced(local);return local}
 writeLocal(remote);return remote;
}

export async function saveShelfSynced(entries:ShelfEntry[]):Promise<void>{
 writeLocal(entries);
 const{data:userData}=await supabase.auth.getUser();
 if(!userData.user)return;
 const userId=userData.user.id;
 if(entries.length){
  const rows=entries.map(e=>({user_id:userId,product_id:e.productId,periods:e.periods,opened_at:e.openedAt||null,pao_months:e.paoMonths||null,updated_at:new Date().toISOString()}));
  const{error:upsertError}=await supabase.from("user_shelf_items").upsert(rows,{onConflict:"user_id,product_id"});if(upsertError)throw upsertError;
 }
 const{data:remote,error:readError}=await supabase.from("user_shelf_items").select("product_id").eq("user_id",userId);if(readError)throw readError;
 const keep=new Set(entries.map(e=>e.productId)),stale=(remote||[]).map(r=>r.product_id).filter((id:string)=>!keep.has(id));
 if(stale.length){const{error:deleteError}=await supabase.from("user_shelf_items").delete().eq("user_id",userId).in("product_id",stale);if(deleteError)throw deleteError}
 if(!entries.length){const{error:deleteAllError}=await supabase.from("user_shelf_items").delete().eq("user_id",userId);if(deleteAllError)throw deleteAllError}
}

export function addToShelf(entries:ShelfEntry[],productId:string):ShelfEntry[]{if(entries.some(x=>x.productId===productId))return entries;return [...entries,{productId,addedAt:new Date().toISOString(),periods:[]}]}
export function removeFromShelf(entries:ShelfEntry[],productId:string){return entries.filter(x=>x.productId!==productId)}

const norm=(s:string)=>s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g," ");
const text=(p:SharedProductRecord)=>norm([p.category,p.mainCategory,p.productSubtype,...(p.productFunctions||[]),...(p.formulaBestFor||[]),...(p.formulaAlsoWorksFor||[]),p.formulaSummary||"",p.formulaVerdict||""].join(" "));
function features(p:SharedProductRecord){const t=text(p),out=new Set<string>();const map:[string,RegExp][]=[
 ["cleanse",/clean|洁面|卸妆/],["hydrate",/hydrat|moist|保湿|补水|humect/],["barrier",/barrier|屏障|ceramide|脂质/],["bright",/bright|pigment|whiten|焕白|美白|色沉/],["acne",/acne|blemish|控油|痘|salicyl/],["antiage",/anti.?age|wrinkle|retinol|retinal|抗老|皱/],["soothe",/sooth|calm|舒缓|敏感|centella/],["spf",/sunscreen|spf|防晒/]
 ];for(const[k,r]of map)if(r.test(t))out.add(k);return out}
function irritationSignals(p:SharedProductRecord){const t=norm([...(p.ingredients||[]),p.formulaSummary||"",...(p.formulaCaveats||[])].join(" "));const s=new Set<string>();if(/retinol|retinal|维a|视黄/.test(t))s.add("retinoid");if(/glycolic|lactic|mandelic|salicylic|aha|bha|果酸|水杨酸|乳酸|杏仁酸/.test(t))s.add("acid");if(/benzoyl peroxide|过氧化苯甲酰/.test(t))s.add("bpo");if(/ascorbic acid|左旋维c|抗坏血酸/.test(t))s.add("ascorbic");return s}
export function analyzeShelfRoutine(products:SharedProductRecord[],entries:ShelfEntry[],period:ShelfPeriod):ShelfFinding[]{const selected=entries.filter(e=>e.periods.includes(period)).map(e=>products.find(p=>p.id===e.productId)).filter(Boolean) as SharedProductRecord[];const findings:ShelfFinding[]=[];if(!selected.length)return findings;
 const byFeature=new Map<string,SharedProductRecord[]>();for(const p of selected)for(const f of features(p)){const a=byFeature.get(f)||[];a.push(p);byFeature.set(f,a)}
 for(const[f,ps]of byFeature)if(ps.length>=2&&!["hydrate","soothe"].includes(f)){findings.push({kind:"overlap",tone:"neutral",titleZh:"功能有明显重叠",titleEn:"Meaningful functional overlap",detailZh:`${ps.slice(0,3).map(p=>p.brand+" "+p.name).join("、")} 都主要覆盖 ${f}。不是不能一起用，但通常没必要层层叠加。`,detailEn:`${ps.slice(0,3).map(p=>p.brand+" "+p.name).join(", ")} substantially overlap on ${f}. They can coexist, but stacking them is usually unnecessary.`})}
 const sig=new Map<string,number>();for(const p of selected)for(const s of irritationSignals(p))sig.set(s,(sig.get(s)||0)+1);const strong=[...sig.entries()].reduce((n,[k,v])=>n+((k==="retinoid"||k==="acid"||k==="bpo")?v:0),0);if(strong>=2)findings.push({kind:"irritation",tone:"watch",titleZh:"这一套的刺激负荷偏高",titleEn:"This routine has a higher irritation load",detailZh:"同一时段叠加多个强活性并不等于“成分相克”，但对耐受要求更高。建议错开频率或分不同晚使用。",detailEn:"This is not a simplistic ingredient-conflict rule. Multiple strong actives in one session raise tolerance demands; consider alternating nights or lowering frequency."});
 const all=new Set(selected.flatMap(p=>[...features(p)]));if(period==="AM"&&!all.has("spf"))findings.push({kind:"gap",tone:"watch",titleZh:"早间缺少明确防晒",titleEn:"AM routine is missing clear sunscreen",detailZh:"如果这些是你完整的早间步骤，防晒是比再加一瓶精华更优先的缺口。",detailEn:"If this is your full AM routine, sunscreen is a higher-priority gap than adding another serum."});if(!all.has("hydrate")&&!all.has("barrier"))findings.push({kind:"gap",tone:"neutral",titleZh:"基础保湿/屏障支持偏少",titleEn:"Limited hydration/barrier support",detailZh:"活性成分很多时，先补基础支持通常比继续加功效型产品更有价值。",detailEn:"When actives dominate, basic hydration/barrier support is usually more useful than another treatment."});return findings}

function overlapScore(a:SharedProductRecord,b:SharedProductRecord){const af=features(a),bf=features(b);if(!af.size)return 0;return[...af].filter(x=>bf.has(x)).length/af.size}
function candidateFillsGap(candidate:SharedProductRecord,products:SharedProductRecord[],entries:ShelfEntry[]){const cf=features(candidate),am=analyzeShelfRoutine(products,entries,"AM"),pm=analyzeShelfRoutine(products,entries,"PM");const gaps=[...am,...pm].filter(x=>x.kind==="gap").map(x=>x.titleEn.toLowerCase());return(cf.has("spf")&&gaps.some(x=>x.includes("sunscreen")))||((cf.has("hydrate")||cf.has("barrier"))&&gaps.some(x=>x.includes("hydration")||x.includes("barrier")))}

export function doINeedThis(candidate:SharedProductRecord,owned:SharedProductRecord[],profile?:SkinProfileRecord|null,products:SharedProductRecord[]=owned,entries:ShelfEntry[]=[]):NeedVerdict{
 const cf=features(candidate),sameCategory=owned.filter(p=>norm(p.category)===norm(candidate.category));let best=0,bestProduct:SharedProductRecord|undefined;for(const p of owned){const score=overlapScore(candidate,p);if(score>best){best=score;bestProduct=p}}
 const rating=matchRating(personalizedScore(candidate,profile,"all")),fillsGap=candidateFillsGap(candidate,products,entries),candidateStrong=irritationSignals(candidate),ownedStrong=new Set(owned.flatMap(p=>[...irritationSignals(p)])),sameStrong=candidateStrong.size&&[...candidateStrong].some(x=>ownedStrong.has(x));
 const altZh=bestProduct?`你已有的 ${bestProduct.brand} ${bestProduct.productLocalName||bestProduct.name} 与它最接近。`:"",altEn=bestProduct?`${bestProduct.brand} ${bestProduct.productEnglishName||bestProduct.name} is the closest product you already own.`:"";
 const evidenceZh:string[]=[rating.stars?`与你当前肤质匹配：${rating.stars}/5 星。`:"当前没有足够肤质信息参与判断。",fillsGap?"它能补上当前 Routine 的明确缺口。":"它没有补上当前 Routine 的明显硬缺口。",best>=.75?"与现有产品功能高度重叠。":best>=.35?"与现有产品存在部分功能重叠。":"与现有产品功能重叠较低。"].filter(Boolean),evidenceEn:string[]=[rating.stars?`Skin/profile match: ${rating.stars}/5 stars.`:"Not enough profile information to score skin fit.",fillsGap?"It fills a clear gap in the current routine.":"It does not fill a clear hard gap in the current routine.",best>=.75?"High functional overlap with products you own.":best>=.35?"Partial functional overlap with products you own.":"Low functional overlap with products you own."].filter(Boolean);
 if(rating.stars>0&&rating.stars<3)return{level:"not-recommended",labelZh:"暂不建议买",labelEn:"Not recommended",reasonZh:`它和你当前肤质/需求的匹配度不足。即使产品本身不错，也不是现在最优先的购买。${altZh}`,reasonEn:`Its fit with your current skin profile is weak, so it is not a priority purchase right now. ${altEn}`,evidenceZh,evidenceEn,alternativeProductId:bestProduct?.id};
 if(sameStrong&&best>=.5&&!fillsGap)return{level:"not-recommended",labelZh:"暂不建议买",labelEn:"Not recommended",reasonZh:`你已经有功能高度相近的强活性产品；新增更可能增加刺激负荷，而不是补足缺口。${altZh}`,reasonEn:`You already own a closely overlapping strong active. This is more likely to add irritation load than fill a gap. ${altEn}`,evidenceZh,evidenceEn,alternativeProductId:bestProduct?.id};
 if(fillsGap&&rating.stars>=3&&best<.75)return{level:"good-addition",labelZh:"有明确补位价值",labelEn:"Good addition",reasonZh:`它能补上你当前 Routine 的真实缺口，同时与你已有产品不是高度重复。${altZh}`,reasonEn:`It fills a real routine gap without heavily duplicating what you already own. ${altEn}`,evidenceZh,evidenceEn,alternativeProductId:bestProduct?.id};
 if(best>=.75||sameCategory.length>=2)return{level:"mostly-duplicate",labelZh:"大概率重复",labelEn:"Mostly duplicate",reasonZh:`你现有产品已经覆盖这款的主要角色。除非你明确想替换肤感、价格或耐受，否则没有明显必要。${altZh}`,reasonEn:`Your shelf already covers most of this product's role. Unless you want a texture, price or tolerance replacement, it adds little. ${altEn}`,evidenceZh,evidenceEn,alternativeProductId:bestProduct?.id};
 if(best>=.35||rating.stars===3)return{level:"optional",labelZh:"可有可无",labelEn:"Optional",reasonZh:`它有一定新价值，但不是当前最明显的缺口。先把现有组合用顺，再决定更合理。${altZh}`,reasonEn:`It adds some value, but it is not the clearest gap right now. Use your current routine consistently before deciding. ${altEn}`,evidenceZh,evidenceEn,alternativeProductId:bestProduct?.id};
 return{level:"good-addition",labelZh:"有补位价值",labelEn:"Good addition",reasonZh:`它和现有护肤柜重叠较低，而且与你当前肤质没有明显不匹配，更像补一个新角色。${altZh}`,reasonEn:`It has low overlap with your shelf and no obvious profile mismatch, so it is more likely to add a new role than duplicate one. ${altEn}`,evidenceZh,evidenceEn,alternativeProductId:bestProduct?.id};
}
