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

function visibleFacts(row) {
  const ingredients = Array.isArray(row.ingredient_names) ? row.ingredient_names.filter(Boolean) : [];
  const ingredientPreview = ingredients.slice(0, 12);
  const completeness = Number(row.data_completeness || 0);
  return { ingredients, ingredientPreview, completeness };
}

function productHtml(row) {
  const { ingredients, ingredientPreview, completeness } = visibleFacts(row);
  const title = `${row.brand} ${row.name}: Ingredients & Formula Facts | PEACED SKIN`;
  const description = `${row.brand} ${row.name} ingredient list and formula facts from PEACED SKIN. Category: ${row.category || "skincare"}. ${ingredients.length ? `${ingredients.length} ingredients indexed.` : "Formula data indexed."}`;
  const canonical = `${SITE_URL}/product/${row.__slug}/`;
  const topIngredients = ingredientPreview.length
    ? `<ol>${ingredientPreview.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`
    : `<p>Ingredient list is being verified.</p>`;
  const fullIngredients = ingredients.length
    ? `<p class="inci">${ingredients.map(escapeHtml).join(", ")}</p>`
    : `<p>Ingredient list is being verified.</p>`;
  const verified = row.verified_at ? new Date(row.verified_at).toISOString().slice(0, 10) : null;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: row.name,
    brand: { "@type": "Brand", name: row.brand },
    category: row.category || "Skincare",
    url: canonical,
    description,
    additionalProperty: [
      { "@type": "PropertyValue", name: "Market", value: row.market || "global" },
      { "@type": "PropertyValue", name: "Formula completeness", value: `${completeness}%` },
      { "@type": "PropertyValue", name: "Ingredient list type", value: row.ingredient_list_type || "unknown" }
    ]
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is ${row.brand} ${row.name}?`,
        acceptedAnswer: { "@type": "Answer", text: `${row.name} is listed in PEACED SKIN as ${row.category || "a skincare product"}.` }
      },
      {
        "@type": "Question",
        name: `What ingredients are in ${row.brand} ${row.name}?`,
        acceptedAnswer: { "@type": "Answer", text: ingredientPreview.length ? `The indexed formula begins with: ${ingredientPreview.join(", ")}.` : "The ingredient list is currently being verified." }
      }
    ]
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta name="twitter:card" content="summary" />
  <script type="application/ld+json">${JSON.stringify(productJsonLd).replaceAll("<", "\\u003c")}</script>
  <script type="application/ld+json">${JSON.stringify(faqJsonLd).replaceAll("<", "\\u003c")}</script>
  <style>
    :root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#171717;background:#fbfaf7}
    body{margin:0}.wrap{max-width:820px;margin:auto;padding:32px 20px 72px}a{color:inherit}.brand{letter-spacing:.12em;font-size:12px;text-transform:uppercase}.crumb{font-size:13px;opacity:.65;margin-bottom:34px}h1{font-size:clamp(32px,6vw,56px);line-height:1.05;margin:8px 0 18px}.meta{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0 34px}.pill{border:1px solid #d9d5cc;border-radius:999px;padding:7px 11px;font-size:13px;background:#fff}section{border-top:1px solid #dedbd3;padding:28px 0}h2{font-size:22px;margin:0 0 14px}.inci{line-height:1.7}.note{font-size:14px;line-height:1.6;opacity:.72}.cta{display:inline-block;margin-top:20px;padding:12px 18px;border-radius:999px;background:#171717;color:#fff;text-decoration:none}
  </style>
</head>
<body>
<main class="wrap">
  <nav class="crumb"><a href="/">PEACED SKIN</a> / <a href="/products">Products</a> / ${escapeHtml(row.name)}</nav>
  <div class="brand">${escapeHtml(row.brand)}</div>
  <h1>${escapeHtml(row.name)}</h1>
  <p>${escapeHtml(row.category || "Skincare")} formula facts and ingredient index.</p>
  <div class="meta">
    <span class="pill">${escapeHtml(row.category || "Skincare")}</span>
    <span class="pill">${escapeHtml(row.market || "Global")}</span>
    <span class="pill">Formula data ${completeness}% complete</span>
  </div>

  <section>
    <h2>Formula at a glance</h2>
    ${topIngredients}
  </section>

  <section>
    <h2>Full indexed ingredient list</h2>
    ${fullIngredients}
    <p class="note">Ingredient lists can differ by market and reformulation. PEACED SKIN separates verified formula data from brand marketing claims.${verified ? ` Last catalog verification: ${verified}.` : ""}</p>
  </section>

  <section>
    <h2>What is ${escapeHtml(row.name)}?</h2>
    <p>PEACED SKIN currently classifies this product as <strong>${escapeHtml(row.category || "skincare")}</strong>. The page is generated from the approved public catalog so search engines and AI answer systems can read the same product facts shown in the database.</p>
  </section>

  <section>
    <h2>How should this page be interpreted?</h2>
    <p>Formula facts describe the indexed ingredient list. They are not the same as advertising claims or individual user outcomes. Skin suitability can depend on skin type, sensitivity, climate, routine and formula version.</p>
    <a class="cta" href="/products">Explore PEACED SKIN product database</a>
  </section>
</main>
</body>
</html>`;
}

async function writePages(products) {
  await fs.mkdir(path.join(OUT_DIR, "product"), { recursive: true });
  for (const product of products) {
    const dir = path.join(OUT_DIR, "product", product.__slug);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "index.html"), productHtml(product), "utf8");
  }

  const urls = [
    `${SITE_URL}/`,
    `${SITE_URL}/products`,
    ...products.map((product) => `${SITE_URL}/product/${product.__slug}/`)
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`)
    .join("\n")}\n</urlset>\n`;
  await fs.writeFile(path.join(OUT_DIR, "sitemap.xml"), sitemap, "utf8");

  const manifest = products.map(({ id, brand, name, category, __slug, __score }) => ({
    id, brand, name, category, slug: __slug, score: Math.round(__score * 10) / 10
  }));
  await fs.writeFile(path.join(OUT_DIR, "seo-pilot-products.json"), JSON.stringify(manifest, null, 2), "utf8");
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
