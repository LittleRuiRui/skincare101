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
}

export function normalizeIngredientKey(value:string):string{return value.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\u3400-\u9fff]+/g,"")}

export async function loadIngredientDictionary(names:string[]):Promise<Map<string,IngredientDictionaryEntry>>{
  const requested=Array.from(new Set(names.map(normalizeIngredientKey).filter(Boolean))).slice(0,250);
  if(!requested.length)return new Map();
  const{data,error}=await supabase.from("ingredient_dictionary_lookup").select("id,inci_name,normalized_name,name_zh_cn,common_names,functions,ingredient_family,plain_language_zh,plain_language_en,evidence_level,lookup_key").in("lookup_key",requested);
  if(error)throw error;
  const map=new Map<string,IngredientDictionaryEntry>();
  for(const row of data||[]){const entry={id:row.id,inciName:row.inci_name,normalizedName:row.normalized_name,nameZhCn:row.name_zh_cn||undefined,commonNames:row.common_names||[],functions:row.functions||[],ingredientFamily:row.ingredient_family||undefined,plainLanguageZh:row.plain_language_zh||undefined,plainLanguageEn:row.plain_language_en||undefined,evidenceLevel:row.evidence_level||undefined};map.set(row.lookup_key,entry);map.set(normalizeIngredientKey(row.inci_name),entry);if(row.name_zh_cn)map.set(normalizeIngredientKey(row.name_zh_cn),entry)}
  return map;
}
