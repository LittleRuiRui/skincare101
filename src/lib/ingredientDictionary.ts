import { supabase } from "./supabase";

export interface IngredientDictionaryEntry {
  id:number;
  inciName:string;
  normalizedName:string;
  nameZhCn?:string;
  commonNames:string[];
  functions:string[];
  ingredientFamily?:string;
  plainLanguageZh?:string;
  plainLanguageEn?:string;
  evidenceLevel?:string;
  mappingStatus?:string;
}

export function normalizeIngredientKey(value:string):string{return value.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\u3400-\u9fff]+/g,"")}

type MasterRow={id:number;canonical_inci:string;canonical_key?:string|null;name_zh_cn?:string|null;aliases?:string[]|null;functions?:string[]|null;ingredient_family?:string|null;plain_language_zh?:string|null;plain_language_en?:string|null;evidence_level?:string|null;mapping_status?:string|null;lookup_key?:string|null};

function entryFromRow(row:MasterRow):IngredientDictionaryEntry{return{id:row.id,inciName:row.canonical_inci,normalizedName:normalizeIngredientKey(row.canonical_inci),nameZhCn:row.name_zh_cn||undefined,commonNames:row.aliases||[],functions:row.functions||[],ingredientFamily:row.ingredient_family||undefined,plainLanguageZh:row.plain_language_zh||undefined,plainLanguageEn:row.plain_language_en||undefined,evidenceLevel:row.evidence_level||undefined,mappingStatus:row.mapping_status||undefined}}

function addRow(map:Map<string,IngredientDictionaryEntry>,row:MasterRow,extraKeys:string[]=[]){const entry=entryFromRow(row);const keys=[row.lookup_key||"",row.canonical_key||"",normalizeIngredientKey(row.canonical_inci),row.name_zh_cn?normalizeIngredientKey(row.name_zh_cn):"",...(row.aliases||[]).map(normalizeIngredientKey),...extraKeys].filter(Boolean);for(const key of keys)map.set(key,entry)}

export async function loadIngredientDictionary(names:string[]):Promise<Map<string,IngredientDictionaryEntry>>{
  const requested=Array.from(new Set(names.map(normalizeIngredientKey).filter(Boolean))).slice(0,500);
  if(!requested.length)return new Map();
  const map=new Map<string,IngredientDictionaryEntry>();

  // Primary path: alias-aware lookup view.
  const primary=await supabase.from("ingredient_master_lookup").select("id,canonical_inci,name_zh_cn,aliases,functions,ingredient_family,plain_language_zh,plain_language_en,evidence_level,mapping_status,lookup_key").in("lookup_key",requested);
  if(!primary.error)for(const row of primary.data||[])addRow(map,row as MasterRow);

  // Fallback 1: query canonical master rows directly. This prevents a stale/missing
  // lookup-view row from making an already-mapped ingredient appear untranslated.
  let missing=requested.filter(key=>!map.has(key));
  if(missing.length){const direct=await supabase.from("ingredient_master").select("id,canonical_key,canonical_inci,name_zh_cn,aliases,functions,ingredient_family,plain_language_zh,plain_language_en,evidence_level,mapping_status").in("canonical_key",missing);if(!direct.error)for(const row of direct.data||[])addRow(map,row as MasterRow)}

  // Fallback 2: resolve any remaining raw aliases through the alias table, then load
  // the corresponding master rows. This also covers synonym spellings/local variants.
  missing=requested.filter(key=>!map.has(key));
  if(missing.length){const aliases=await supabase.from("ingredient_master_aliases").select("ingredient_master_id,normalized_alias").in("normalized_alias",missing);if(!aliases.error&&aliases.data?.length){const ids=Array.from(new Set(aliases.data.map(row=>row.ingredient_master_id)));const masters=await supabase.from("ingredient_master").select("id,canonical_key,canonical_inci,name_zh_cn,aliases,functions,ingredient_family,plain_language_zh,plain_language_en,evidence_level,mapping_status").in("id",ids);if(!masters.error){const byId=new Map<number,MasterRow>((masters.data||[]).map(row=>[row.id,row as MasterRow]));for(const alias of aliases.data){const row=byId.get(alias.ingredient_master_id);if(row)addRow(map,row,[alias.normalized_alias])}}}}

  if(primary.error&&map.size===0)throw primary.error;
  return map;
}
