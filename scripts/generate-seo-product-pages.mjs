import {productHtml,directoryHtml,normalize} from "./product-pages.mjs";
import {productRoute,directoryRoute} from "./static-languages.mjs";
import fs from "node:fs/promises";
import {selectAllProducts} from "./product-selection.mjs";
import path from "node:path";

const SITE_URL = (process.env.SITE_URL || "https://peacedskin.com").replace(/\/$/, "");
const PROJECT_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://tepiqcwytynhrjhtvnws.supabase.co"
).replace(/\/$/, "");
const PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_J9GjGc-hNTEvpl-MTyRAiw__JuISs-T";
const OUT_DIR = path.resolve("dist");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function fetchCatalog() {
  const rows = [];
  const pageSize = 1000;
  let expectedCount;
  for (let offset = 0; ; ) {
    const params = new URLSearchParams({
      select: "*",
      order: "id.asc",
      limit: String(pageSize),
      offset: String(offset)
    });
    const response = await fetch(`${PROJECT_URL}/rest/v1/approved_product_catalog?${params}`, {
      headers: {
        apikey: PUBLISHABLE_KEY,
        Authorization: `Bearer ${PUBLISHABLE_KEY}`,
        Accept: "application/json",
        Prefer: "count=exact"
      },
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) throw new Error(`Catalog fetch failed: ${response.status} ${response.statusText}`);
    const total=Number(response.headers.get("content-range")?.split("/")[1]);
    if(!Number.isInteger(total)||total<0)throw new Error("Missing exact catalog count.");
    if(expectedCount!==undefined&&expectedCount!==total)throw new Error("Catalog changed during export; retry a clean build.");
    expectedCount=total;
    const page = await response.json();
    if(!Array.isArray(page))throw new Error("Invalid public catalog response.");
    rows.push(...page);
    offset+=page.length;
    if(offset===expectedCount)break;
    if(!page.length||offset>expectedCount)throw new Error("Incomplete catalog pagination.");
  }
  if(new Set(rows.map(r=>r.id)).size!==rows.length)throw new Error("Duplicate catalog rows across pages.");
  return rows;
}

async function fetchDictionary(products) {
  const keys=[...new Set(products.flatMap(p=>(p.ingredient_names||[]).map(normalize)))];
  const map=new Map();
  for(let i=0;i<keys.length;i+=100){
    const params=new URLSearchParams({select:"canonical_inci,name_zh_cn,lookup_key",lookup_key:`in.(${keys.slice(i,i+100).join(",")})`,limit:"1000"});
    const response=await fetch(`${PROJECT_URL}/rest/v1/ingredient_master_lookup?${params}`,{headers:{apikey:PUBLISHABLE_KEY,Authorization:`Bearer ${PUBLISHABLE_KEY}`},signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw new Error(`Ingredient dictionary fetch failed: ${response.status}`);
    for(const row of await response.json())map.set(row.lookup_key,row);
  }
  console.log(`Loaded ${map.size} ingredient translations from the public dictionary.`);
  return map;
}
async function writePages(products) {
  const dictionary=await fetchDictionary(products);
  const urls=[SITE_URL+"/"];
  for(const en of [false,true]){
    for(const product of products){
      const route=productRoute(product.__slug,en);
      const dir=path.join(OUT_DIR,route);
      await fs.mkdir(dir,{recursive:true});
      await fs.writeFile(path.join(dir,"index.html"),productHtml(product,dictionary,en),"utf8");
      if(product.ingredient_names?.filter(Boolean).length)urls.push(SITE_URL+route);
    }
    const route=directoryRoute(en),dir=path.join(OUT_DIR,route);
    await fs.mkdir(dir,{recursive:true});
    await fs.writeFile(path.join(dir,"index.html"),directoryHtml(products,en),"utf8");
    urls.push(SITE_URL+route);
  }
  await fs.writeFile(path.join(OUT_DIR,"sitemap.xml"),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url=>`<url><loc>${escapeHtml(url)}</loc></url>`).join("\n")}\n</urlset>\n`);
  const manifest=products.map(({id,brand,name,category,__slug,market,ingredient_names,ingredient_list_type,data_completeness})=>({id,brand,name,category,slug:__slug,market,ingredientCount:ingredient_names?.filter(Boolean).length||0,indexable:Boolean(ingredient_names?.filter(Boolean).length),listType:ingredient_list_type,completeness:data_completeness}));
  await fs.writeFile(path.join(OUT_DIR,"seo-products.json"),JSON.stringify(manifest),"utf8");
  await fs.writeFile(path.join(OUT_DIR,"seo-product-coverage.json"),JSON.stringify({catalogCount:products.length,productCount:products.length,languagePages:products.length*2,brands:new Set(products.map(p=>p.brand)).size,missingIngredients:products.filter(p=>!p.ingredient_names?.filter(Boolean).length).length,partialLists:products.filter(p=>p.ingredient_list_type==="partial").length}),"utf8");
  // Compatibility for cached clients that still request the original manifest URL.
  await fs.writeFile(path.join(OUT_DIR,"seo-pilot-products.json"),JSON.stringify(manifest,null,2),"utf8");
}

async function main() {
  const rows = await fetchCatalog();
  const products = selectAllProducts(rows);
  if (!products.length) throw new Error("No public products found; refusing to publish an empty directory.");
  await writePages(products);
  console.log(`Generated ${products.length} static SEO product pages from ${rows.length} approved catalog rows.`);
  console.log(`Coverage: ${products.length*2} language pages; ${new Set(products.map(p=>p.brand)).size} brands.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
