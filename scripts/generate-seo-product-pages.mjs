import {productHtml,directoryHtml,normalize} from "./product-pages.mjs";
import {productRoute,directoryRoute} from "./static-languages.mjs";
import fs from "node:fs/promises";
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
const PILOT_LIMIT = Number(process.env.SEO_PRODUCT_LIMIT || 50);
const OUT_DIR = path.resolve("dist");

const BRAND_PRIORITY = new Map(
  [
    "SK-II", "La Mer", "Estée Lauder", "Lancôme", "Shiseido",
    "La Roche-Posay", "Avène", "Bioderma", "CeraVe", "The Ordinary",
    "Paula's Choice", "SkinCeuticals", "Chanel", "Dior", "Clarins",
    "Kiehl's", "Clinique", "Olay", "L'Oréal Paris", "Neutrogena",
    "Eucerin", "Vichy", "Hada Labo", "COSRX", "Beauty of Joseon",
    "Anua", "Round Lab", "Laneige", "Dr. Jart+", "Sulwhasoo",
    "Innisfree", "Aesop"
  ].map((brand, i) => [brand.toLowerCase(), i < 20 ? 100 - i : 70 - (i - 20)])
);

const PRODUCT_KEYWORDS = [
  ["facial treatment essence", 55], ["神仙水", 55], ["advanced night repair", 55],
  ["crème de la mer", 55], ["creme de la mer", 55], ["cicaplast", 50],
  ["anthelios", 45], ["moisturizing cream", 40], ["niacinamide 10", 45],
  ["2% bha", 50], ["ce ferulic", 50], ["c e ferulic", 50],
  ["sensibio h2o", 45], ["cicalfate", 45], ["ultimune", 45],
  ["snail 96", 35], ["relief sun", 35], ["cream skin", 30],
  ["gokujyun", 30], ["double repair", 30], ["toleriane", 35],
  ["genifique", 45], ["génifique", 45], ["capture totale", 35]
];

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110);
}

function scoreProduct(row) {
  const brand = String(row.brand || "").toLowerCase();
  const name = String(row.name || "").toLowerCase();
  let score = BRAND_PRIORITY.get(brand) || 0;
  for (const [keyword, bonus] of PRODUCT_KEYWORDS) {
    if (name.includes(keyword)) score += bonus;
  }
  const completeness = Number(row.data_completeness || 0);
  score += Math.min(20, completeness / 5);
  if ((row.ingredient_names || []).length >= 10) score += 8;
  if (String(row.ingredient_list_type || "").toLowerCase() === "full") score += 10;
  if (row.verified_at) score += 3;
  return score;
}

async function fetchCatalog() {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; offset < 5000; offset += pageSize) {
    const params = new URLSearchParams({
      select: "*",
      order: "brand.asc,name.asc",
      limit: String(pageSize),
      offset: String(offset)
    });
    const response = await fetch(`${PROJECT_URL}/rest/v1/approved_product_catalog?${params}`, {
      headers: {
        apikey: PUBLISHABLE_KEY,
        Authorization: `Bearer ${PUBLISHABLE_KEY}`,
        Accept: "application/json"
      }
    });
    if (!response.ok) throw new Error(`Catalog fetch failed: ${response.status} ${response.statusText}`);
    const page = await response.json();
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

function selectPilot(rows) {
  const ranked = rows
    .filter((row) => row?.id && row?.brand && row?.name)
    .map((row) => ({ ...row, __score: scoreProduct(row) }))
    .sort((a, b) => b.__score - a.__score || String(a.brand).localeCompare(String(b.brand)));

  const selected = [];
  const perBrand = new Map();
  const seenSlugs = new Set();
  for (const row of ranked) {
    if (row.__score <= 0) continue;
    const brandKey = String(row.brand).toLowerCase();
    if ((perBrand.get(brandKey) || 0) >= 3) continue;
    const slug = slugify(`${row.brand}-${row.name}`);
    if (!slug || seenSlugs.has(slug)) continue;
    selected.push({ ...row, __slug: slug });
    seenSlugs.add(slug);
    perBrand.set(brandKey, (perBrand.get(brandKey) || 0) + 1);
    if (selected.length >= PILOT_LIMIT) break;
  }
  return selected;
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
      urls.push(SITE_URL+route);
    }
    const route=directoryRoute(en),dir=path.join(OUT_DIR,route);
    await fs.mkdir(dir,{recursive:true});
    await fs.writeFile(path.join(dir,"index.html"),directoryHtml(products,en),"utf8");
    urls.push(SITE_URL+route);
  }
  await fs.writeFile(path.join(OUT_DIR,"sitemap.xml"),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url=>`<url><loc>${escapeHtml(url)}</loc></url>`).join("\n")}\n</urlset>\n`);
  const manifest=products.map(({id,brand,name,category,__slug,__score})=>({id,brand,name,category,slug:__slug,score:Math.round(__score*10)/10}));
  await fs.writeFile(path.join(OUT_DIR,"seo-pilot-products.json"),JSON.stringify(manifest,null,2),"utf8");
}

async function main() {
  const rows = await fetchCatalog();
  const products = selectPilot(rows);
  if (!products.length) throw new Error("No eligible products found for SEO pilot.");
  await writePages(products);
  console.log(`Generated ${products.length} static SEO product pages from ${rows.length} approved catalog rows.`);
  console.log(products.map((p) => `${p.brand} — ${p.name}`).join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
