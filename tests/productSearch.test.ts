import test from "node:test";
import assert from "node:assert/strict";
import { rankProductMatches } from "../src/lib/productSearch.ts";
import type { SharedProductRecord } from "../src/lib/supabase.ts";

const base=(id:string,brand:string,name:string,extra:Partial<SharedProductRecord>={}):SharedProductRecord=>({id,brand,name,category:"Serum",ingredients:[],ingredientListType:"full",dataCompleteness:90,sourceUrl:"",verifiedAt:"",source:"shared",...extra});
const products:SharedProductRecord[]=[
 base("1","SK-II","Facial Treatment Essence",{brandLocalName:"SK-II",productLocalName:"护肤精华露",productEnglishName:"Facial Treatment Essence",searchAliases:["神仙水"]}),
 base("2","Shiseido","Ultimune Power Infusing Concentrate",{brandLocalName:"资生堂",productLocalName:"红妍肌活精华露",searchAliases:["红腰子"]}),
 base("3","CHANEL","SUBLIMAGE L’EXTRAIT DE NUIT Eye",{brandLocalName:"香奈儿",productLocalName:"奢华精萃眼部护理",searchAliases:["黑金眼霜"]}),
 base("4","Dior","Prestige La Micro-Lotion de Rose",{brandLocalName:"迪奥",productLocalName:"花秘瑰萃精华水",searchAliases:["花蜜水"]}),
 base("5","La Roche-Posay","Cicaplast Baume B5+",{brandLocalName:"理肤泉",productLocalName:"B5多效修复霜"}),
];

const top=(q:string)=>rankProductMatches(products,q,3)[0]?.id;
test("consumer alias resolves to formal product",()=>assert.equal(top("神仙水"),"1"));
test("brand abbreviation normalization handles SK2",()=>assert.equal(top("sk2 essence"),"1"));
test("Chinese brand plus nickname works",()=>assert.equal(top("资生堂 红腰子"),"2"));
test("luxury Chinese nickname works",()=>assert.equal(top("黑金眼霜"),"3"));
test("multi token Chinese query tolerates spaces",()=>assert.equal(top("dior 花蜜 水"),"4"));
test("bilingual query resolves",()=>assert.equal(top("理肤泉 b5"),"5"));
test("one-character typo remains recoverable",()=>assert.equal(top("la roche posai b5"),"5"));
