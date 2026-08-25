#!/usr/bin/env python3
"""Build the 300-product Open Beauty Facts pilot catalog.

The source database is ODbL-licensed. This script keeps source identity,
barcode, popularity signal and quality flags so the UI never presents a
crowdsourced formula as brand-verified data.
"""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


API_URL = "https://world.openbeautyfacts.org/api/v2/search"
USER_AGENT = "Skincare101/0.1 (github.com/littleruirui/skincare101)"
FIELDS = ",".join(
    [
        "code",
        "product_name",
        "product_name_en",
        "brands",
        "ingredients_text",
        "ingredients_text_en",
        "categories_tags",
        "countries_tags",
        "popularity_key",
        "completeness",
        "last_modified_t",
        "url",
    ]
)

# Category endpoints are intentionally broad; classify_product applies a
# stricter face-skincare filter after retrieval.
SOURCE_TAGS = [
    "face-creams",
    "facial-creams",
    "moisturizers",
    "day-creams",
    "night-creams",
    "sunscreens",
    "cleansers",
    "micellar-water",
    "cleansing-waters",
    "face-scrubs",
    "face-masks",
    "serum",
]

QUOTAS = {
    "洁面": 65,
    "乳霜": 55,
    "防晒": 50,
    "焕肤": 15,
    "面膜": 8,
    "精华": 5,
    "眼部": 2,
}

YESSTYLE_SOURCE_URL = "https://www.yesstyle.com/blog/2026-06-30/yesstyles-skin-care-bestsellers-mid-year-2026/"
YESSTYLE_BESTSELLERS = {
    "洁面": [
        "SKIN 1004 | Madagascar Centella Light Cleansing Oil",
        "Anua | Heartleaf Pore Control Cleansing Oil",
        "mixsoon | Bean Cleansing Oil",
        "Dr. Althea | Pure Grinding Cleansing Balm",
        "haruharu wonder | Black Rice Moisture Deep Cleansing Oil",
        "Kose | Softymo Cleansing Oil (#Speedy)",
        "heimish | All Clean Balm",
        "ma:nyo | Pure Cleansing Oil",
        "beplain | Mung Bean Cleansing Oil",
        "Beauty of Joseon | Radiance Cleansing Balm",
        "SKIN 1004 | Madagascar Centella Ampoule Foam",
        "ROUND LAB | 1025 Dokdo Cleanser",
        "Arencia | Fresh Green Rice Mochi Cleanser",
        "Anua | Heartleaf Quercetinol Pore Deep Cleansing Foam",
        "celimax | The Real Noni Acne Bubble Cleanser",
        "SKIN 1004 | Madagascar Centella Poremizing Deep Cleansing Foam",
        "COSRX | Salicylic Acid Daily Gentle Cleanser",
        "haruharu wonder | Black Rice Moisture 5.5 Soft Cleansing Gel",
        "COSRX | Low pH Good Morning Gel Cleanser",
        "mixsoon | Centella Cleansing Foam",
    ],
    "焕肤": [
        "medicube | Zero Pore Pad 2.0",
        "celimax | JIWOOGAE Heartleaf BHA Peeling Pad",
        "APLB | Glutathione Niacinamide Toner Pad",
        "Anua | Heartleaf 77 Clear Pad",
        "COSRX | BHA Blackhead Power Liquid",
        "medicube | Kojic Acid Turmeric Pad",
        "ilso | Super Melting Sebum Softener Special Set",
        "medicube | Deep Vita C Pad",
        "Dr.Melaxin | Peel Shot Exfoliating Kojic Acid Turmeric Spray",
        "medicube | PDRN Pink Collagen Toning Gel Toner Pad",
    ],
    "化妆水": [
        "Dr. Althea | 345 Relief Cream Mist",
        "Anua | Rice 70 Glow Milky Toner",
        "numbuzin | No.9 NAD+ PDRN Glow Boosting Toner",
        "Anua | Heartleaf 77% Soothing Toner",
        "TIRTIR | Milk Skin Toner",
        "EQQUALBERRY | Swimming Pool Toner",
        "I'm from | Rice Toner",
        "SKIN 1004 | Madagascar Centella Toning Toner",
        "Anua | PDRN Hyaluronic Acid Hydrating Capsule Mist",
        "Beauty of Joseon | Glow Replenishing Rice Milk",
    ],
    "祛痘": [
        "COSRX | Acne Pimple Master Patch",
        "Kisocare | Azelaic Acid Cream 20%",
        "SOME BY MI | 30 Days Miracle Clear Spot Patch",
        "Dr.G | R.E.D Blemish Clear Soothing Cream",
        "SKIN 1004 | Spot Cover Patch",
        "COSRX | Clear Fit Master Patch",
        "SKIN1004 | Madagascar Centella Tea-Trica Spot Cream",
        "LION | Pair Acne Cream",
        "Kisocare | Azelaic Acid Cream 15%",
        "Anua | YesStyle Exclusive Breakout Care Duo Set",
    ],
    "精华": [
        "celimax | The Vita-A Retinal Shot Tightening Booster",
        "Anua | Azelaic Acid 10 Hyaluron Redness Soothing Serum",
        "SKIN 1004 | Madagascar Centella Asiatica 100 Ampoule",
        "Anua | Niacinamide 10% + TXA 4% Serum",
        "Arencia | Vitamin C Booster Shot",
        "SKIN 1004 | Madagascar Centella Tone Brightening Capsule Ampoule",
        "KSECRET | SEOUL 1988 Serum : Retinal Liposome 2% + Black Ginseng",
        "EQQUALBERRY | Vitamin Illuminating Serum",
        "medicube | PDRN Pink Peptide Serum",
        "iUNIK | Beta-Glucan Power Moisture Serum",
    ],
    "乳霜": [
        "Dr. Althea | 345 Relief Cream",
        "Purito SEOUL | Mighty Bamboo Panthenol Cream",
        "Purito SEOUL | Oat-In Calming Gel Cream",
        "SKIN 1004 | Madagascar Centella Probio-Cica Enrich Cream",
        "medicube | PDRN Pink Collagen Capsule Cream",
        "Anua | PDRN Hyaluronic Acid 100 Moisturizing Cream",
        "celimax | Pore+Dark Spot Brightening Cream",
        "Centellian24 | Madeca Cream Time Reverse",
        "SKIN 1004 | Madagascar Centella Poremizing Light Gel Cream",
        "SKIN 1004 | Madagascar Centella Soothing Cream",
    ],
    "眼部": [
        "Mary&May | Tranexamic Acid + Glutathione Eye Cream",
        "Beauty of Joseon | Revive Eye Serum",
        "KSECRET | SEOUL 1988 Eye Cream : Retinal Liposome 4% + Fermented Bean",
        "SKIN 1004 | Madagascar Centella Probio-Cica Bakuchiol Eye Cream",
        "numbuzin | No.9 NAD+ Retinol Volumetox Eye Cream",
        "VT | Reedle Shot Lifting Eye Cream",
        "AXIS-Y | Vegan Collagen Eye Serum",
        "Abib | PDRN Retinal Eye Patch Glow Jelly",
        "Abib | Collagen Eye Patch Jericho Rose Jelly",
        "ETUDE | My Lash Serum",
    ],
    "面膜": [
        "APLB | Glutathione Niacinamide Sheet Mask",
        "APLB | Collagen EGF Peptide Sheet Mask",
        "SKIN 1004 | Madagascar Centella Poremizing Quick Clay Stick Mask",
        "APLB | Retinol Vitamin C Vitamin E Sheet Mask",
        "LANEIGE | Lip Sleeping Mask EX",
        "medicube | Collagen Night Wrapping Mask",
        "APLB | Tranexamic Acid Niacinamide Sheet Mask",
        "medicube | PDRN Pink Vita Coating Mask",
        "medicube | PDRN Pink Collagen Gel Mask",
        "medicube | Collagen Lifting Mask",
    ],
    "防晒": [
        "Beauty of Joseon | Relief Sun: Rice + Probiotics",
        "SKIN 1004 | Madagascar Centella Hyalu-Cica Water-Fit Sun Serum",
        "Beauty of Joseon | Relief Sun Aqua-fresh",
        "ROUND LAB | Birch Juice Moisturizing Sunscreen",
        "House of Hur | Weightless Sun Fluid",
        "haruharu wonder | Black Rice Moisture Airyfit Sunscreen",
        "TOCOBO | Cotton Soft Sun Stick",
        "SKIN 1004 | Madagascar Centella Hyalu-Cica Silky-Fit Sun Stick",
        "Purito SEOUL | Daily Soft Touch Sunscreen",
        "SKIN1004 | Madagascar Centella Air Fit Suncream Light",
    ],
}


def normalize_identity(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def fetch_source(tag: str, cache_dir: Path) -> list[dict]:
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_path = cache_dir / f"{tag}.json"
    if not cache_path.exists():
        query = urllib.parse.urlencode(
            {
                "categories_tags_en": tag,
                "fields": FIELDS,
                "page_size": 100,
                "sort_by": "popularity_key",
            }
        )
        request = urllib.request.Request(f"{API_URL}?{query}", headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(request, timeout=60) as response:
            cache_path.write_bytes(response.read())
    return json.loads(cache_path.read_text(encoding="utf-8")).get("products", [])


def split_ingredients(raw: str) -> list[str]:
    raw = re.sub(r"\s+", " ", raw.replace("\r", " ").replace("\n", " ")).strip()
    raw = re.sub(r"^ingredients?\s*[:：]\s*", "", raw, flags=re.I)
    parts: list[str] = []
    current: list[str] = []
    depth = 0
    for character in raw:
        if character == "(":
            depth += 1
        elif character == ")" and depth:
            depth -= 1
        if character in ",;；，" and depth == 0:
            item = "".join(current).strip(" .")
            if 1 < len(item) <= 240:
                parts.append(item)
            current = []
        else:
            current.append(character)
    item = "".join(current).strip(" .")
    if 1 < len(item) <= 240:
        parts.append(item)

    cleaned: list[str] = []
    seen: set[str] = set()
    for item in parts:
        item = re.sub(r"^(?:ingredients?|active ingredients?)\s*[:：]\s*", "", item, flags=re.I)
        key = normalize_identity(item)
        if len(key) < 2 or key in seen:
            continue
        seen.add(key)
        cleaned.append(item)
    return cleaned[:120]


def classify_product(product: dict) -> str | None:
    name = product.get("product_name_en") or product.get("product_name") or ""
    tags = " ".join(product.get("categories_tags") or [])
    haystack = f"{name} {tags}".lower()

    excluded = r"hair|shampoo|conditioner|deodor|makeup|mascara|lip|hand|body|corps|baby|soap|shower|douche|feet|foot|intimate|tooth"
    facial = r"face|facial|visage|gezicht|skin|spf|sunscreen|solar|serum|cleanser|micellar|night cream|day cream"
    if re.search(excluded, haystack) and not re.search(facial, haystack):
        return None
    if re.search(r"sunscreen|sun.?screen|sun protection|suncare|spf\s*\d|solaire|zonnebrand", haystack):
        return "防晒"
    if re.search(r"cleanser|cleansing|micellar|face wash|facial clean|nettoy|reinig|eau micellaire", haystack):
        return "洁面"
    if re.search(r"face mask|facial mask|masque|sleeping pack", haystack):
        return "面膜"
    if re.search(r"eye|contour des yeux|göz çevresi", haystack):
        return "眼部"
    if re.search(r"scrub|exfol|peel|glycolic|salicylic|\bbha\b|\baha\b", haystack):
        return "焕肤"
    if re.search(r"serum|sérum|ampoule|essence", haystack):
        return "精华"
    if re.search(r"facial cream|face cream|day cream|night cream|moistur|hydrat|cr[eè]me|crema|baume|lotion|gel.?cream|gel cr[eè]me", haystack):
        return "乳霜"
    return None


def build_record(product: dict, category: str) -> dict | None:
    brand = (product.get("brands") or "").split(",")[0].strip()
    name = (product.get("product_name_en") or product.get("product_name") or "").strip()
    raw_ingredients = (product.get("ingredients_text_en") or product.get("ingredients_text") or "").strip()
    ingredients = split_ingredients(raw_ingredients)
    code = str(product.get("code") or "").strip()
    if not brand or not name or not code or len(ingredients) < 5:
        return None

    updated_t = product.get("last_modified_t")
    updated_at = None
    if isinstance(updated_t, (int, float)) and updated_t > 0:
        updated_at = datetime.fromtimestamp(updated_t, timezone.utc).isoformat()

    quality_flags: list[str] = []
    if len(ingredients) < 8:
        quality_flags.append("sparse_formula")
    if not product.get("countries_tags"):
        quality_flags.append("market_unspecified")
    if not updated_at or updated_t < 1672531200:
        quality_flags.append("source_stale_or_undated")
    popularity_score = int(product.get("popularity_key") or 0)
    if popularity_score <= 12:
        quality_flags.append("weak_popularity_signal")

    completeness = 92 if len(ingredients) >= 15 else 86 if len(ingredients) >= 10 else 72
    return {
        "sourceProductCode": code,
        "brand": brand[:120],
        "name": name[:180],
        "category": category,
        "market": "global",
        "ingredients": ingredients,
        "rawIngredients": raw_ingredients,
        "ingredientListType": "full" if len(ingredients) >= 8 else "partial",
        "dataCompleteness": completeness,
        "sourceUrl": product.get("url") or f"https://world.openbeautyfacts.org/product/{code}",
        "sourceLastModifiedAt": updated_at,
        "countries": product.get("countries_tags") or [],
        "popularityScore": popularity_score,
        "popularityBasis": "Open Beauty Facts popularity_key",
        "popularitySources": ["Open Beauty Facts"],
        "popularityTier": "open-data-popular",
        "asiaAvailabilityStatus": "unverified",
        "qualityFlags": quality_flags,
    }


def select_catalog(products: list[dict]) -> list[dict]:
    candidates: list[dict] = []
    identity_seen: set[str] = set()
    for product in sorted(products, key=lambda item: int(item.get("popularity_key") or 0), reverse=True):
        category = classify_product(product)
        if not category:
            continue
        record = build_record(product, category)
        if not record:
            continue
        identity = normalize_identity(record["brand"] + record["name"])
        if identity in identity_seen:
            continue
        identity_seen.add(identity)
        candidates.append(record)

    selected: list[dict] = []
    for category, quota in QUOTAS.items():
        selected.extend([row for row in candidates if row["category"] == category][:quota])

    target = sum(QUOTAS.values())
    selected_ids = {row["sourceProductCode"] for row in selected}
    if len(selected) < target:
        selected.extend(
            row for row in candidates if row["sourceProductCode"] not in selected_ids
        )
    selected = selected[:target]
    if len(selected) != target:
        counts = Counter(row["category"] for row in candidates)
        raise RuntimeError(f"Only {len(selected)} qualifying products; candidates by category: {dict(counts)}")

    selected.sort(key=lambda row: row["popularityScore"], reverse=True)
    for rank, row in enumerate(selected, 1):
        row["popularityRank"] = rank
    return selected


def build_yesstyle_records() -> list[dict]:
    records: list[dict] = []
    for category, products in YESSTYLE_BESTSELLERS.items():
        for category_rank, item in enumerate(products, 1):
            brand, name = [part.strip() for part in item.split("|", 1)]
            records.append(
                {
                    "sourceProductCode": f"yesstyle-2026-{normalize_identity(brand + '-' + name)[:80]}",
                    "brand": brand,
                    "name": name,
                    "category": category,
                    "market": "asia-cross-border",
                    "ingredients": [],
                    "rawIngredients": "",
                    "ingredientListType": "partial",
                    "dataCompleteness": 0,
                    "sourceUrl": YESSTYLE_SOURCE_URL,
                    "sourceLastModifiedAt": "2026-06-30T00:00:00+00:00",
                    "countries": ["en:singapore", "en:asia"],
                    "popularityScore": 11 - category_rank,
                    "popularityRank": category_rank,
                    "popularityBasis": "YesStyle H1 2026 category sales rank",
                    "popularitySources": ["YesStyle H1 2026"],
                    "popularityTier": "retailer-bestseller",
                    "asiaAvailabilityStatus": "cross_border_verified",
                    "qualityFlags": ["formula_pending_verification"],
                }
            )
    return records


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache-dir", type=Path, default=Path("/tmp/skincare101-obf-cache"))
    parser.add_argument("--output", type=Path, default=Path("data/pilot_products.json"))
    args = parser.parse_args()

    products: list[dict] = []
    for tag in SOURCE_TAGS:
        products.extend(fetch_source(tag, args.cache_dir))

    by_code: dict[str, dict] = {}
    for product in products:
        code = str(product.get("code") or "")
        if code and code not in by_code:
            by_code[code] = product

    obf_catalog = select_catalog(list(by_code.values()))
    obf_by_identity = {
        normalize_identity(row["brand"] + row["name"]): row for row in obf_catalog
    }
    used_obf_codes: set[str] = set()
    yesstyle_catalog: list[dict] = []
    for yesstyle_row in build_yesstyle_records():
        identity = normalize_identity(yesstyle_row["brand"] + yesstyle_row["name"])
        matched = obf_by_identity.get(identity)
        if matched:
            merged = dict(matched)
            merged["category"] = yesstyle_row["category"]
            merged["market"] = "asia-cross-border"
            merged["asiaAvailabilityStatus"] = "cross_border_verified"
            merged["popularitySources"] = ["YesStyle H1 2026", "Open Beauty Facts"]
            merged["popularityTier"] = "multi-source-popular"
            merged["popularityBasis"] = "YesStyle H1 2026 category sales rank + Open Beauty Facts popularity_key"
            merged["popularityRank"] = yesstyle_row["popularityRank"]
            yesstyle_catalog.append(merged)
            used_obf_codes.add(matched["sourceProductCode"])
        else:
            yesstyle_catalog.append(yesstyle_row)

    catalog = yesstyle_catalog + [
        row for row in obf_catalog if row["sourceProductCode"] not in used_obf_codes
    ]
    # A matched record replaces, rather than adds to, its OBF counterpart. Fill
    # back from the broader candidate pool if future source coverage increases.
    if len(catalog) < 300:
        selected_codes = {row["sourceProductCode"] for row in catalog}
        selected_identities = {normalize_identity(row["brand"] + row["name"]) for row in catalog}
        extra_candidates = []
        for product in sorted(by_code.values(), key=lambda item: int(item.get("popularity_key") or 0), reverse=True):
            category = classify_product(product)
            record = build_record(product, category) if category else None
            identity = normalize_identity(record["brand"] + record["name"]) if record else ""
            if record and record["sourceProductCode"] not in selected_codes and identity not in selected_identities:
                extra_candidates.append(record)
                selected_codes.add(record["sourceProductCode"])
                selected_identities.add(identity)
            if len(catalog) + len(extra_candidates) >= 300:
                break
        catalog.extend(extra_candidates)
    catalog = catalog[:300]
    if len(catalog) != 300:
        raise RuntimeError(f"Pilot catalog must contain 300 products, got {len(catalog)}")
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "license": "ODbL-1.0",
        "attribution": "Product data from Open Beauty Facts contributors",
        "selectionMethod": "100 YesStyle H1 2026 category bestsellers plus 200 Open Beauty Facts popularity candidates with quality filters",
        "products": catalog,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"rows": len(catalog), "categories": Counter(row["category"] for row in catalog)}, ensure_ascii=False, default=dict))


if __name__ == "__main__":
    main()
