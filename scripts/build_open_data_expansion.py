#!/usr/bin/env python3
"""Build a deduplicated, formula-bearing candidate batch from Open Beauty Facts."""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from difflib import SequenceMatcher
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path


BRANDS = [
    ("avene", "Avène"),
    ("bioderma", "Bioderma"),
    ("cetaphil", "Cetaphil"),
    ("cerave", "CeraVe"),
    ("la-roche-posay", "La Roche-Posay"),
    ("eucerin", "Eucerin"),
    ("chanel", "Chanel"),
    ("dior", "Dior"),
]

COUNTRY_MARKETS = {
    "en:singapore": ("singapore", "SG"),
    "en:japan": ("japan", "JP"),
    "en:south-korea": ("south_korea", "KR"),
    "en:china": ("china", "CN"),
    "en:hong-kong": ("hong_kong", "HK"),
    "en:malaysia": ("malaysia", "MY"),
    "en:thailand": ("thailand", "TH"),
    "en:australia": ("australia", "AU"),
    "en:united-states": ("united_states", "US"),
    "en:united-kingdom": ("united_kingdom", "GB"),
    "en:france": ("france", "FR"),
    "en:germany": ("germany", "DE"),
    "en:spain": ("spain", "ES"),
}


def fetch_brand(tag: str) -> list[dict]:
    query = urllib.parse.urlencode({
        "brands_tags_en": tag,
        "fields": "code,brands,product_name,ingredients_text,categories_tags,countries_tags",
        "page_size": 100,
    })
    request = urllib.request.Request(
        f"https://world.openbeautyfacts.org/api/v2/search?{query}",
        headers={"User-Agent": "Skincare101CatalogResearch/1.0"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response).get("products", [])


def ingredients(raw: str) -> list[str]:
    raw = re.sub(r"\s+", " ", raw or "").strip()
    if not raw:
        return []
    parts = re.split(r"\s*[,;•]\s*", raw)
    clean = []
    for part in parts:
        value = re.sub(r"^[\-*]+|[.]+$", "", part).strip()
        if 2 <= len(value) <= 180 and value not in clean:
            clean.append(value)
    return clean


def category(name: str, tags: list[str]) -> str:
    text = f"{name} {' '.join(tags)}".lower()
    if any(word in text for word in ("eye", "contour des yeux")):
        return "眼部"
    if any(word in text for word in ("sunscreen", "sun cream", "spf", "solar", "solaire")):
        return "防晒"
    if any(word in text for word in ("mask", "masque")):
        return "面膜"
    if any(word in text for word in ("cleanser", "cleansing", "wash", "gel moussant", "micellar", "soap")):
        return "洁面"
    if any(word in text for word in ("toner", "lotion tonique", "mist", "essence")):
        return "化妆水"
    if any(word in text for word in ("serum", "sérum", "ampoule", "concentrate")):
        return "精华"
    if any(word in text for word in ("acne", "blemish", "imperfection")):
        return "祛痘"
    if any(word in text for word in ("peel", "exfol", "scrub")):
        return "焕肤"
    return "乳霜"


def normalized_name(name: str, canonical_brand: str) -> str:
    value = re.sub(r"\b\d+(?:[.,]\d+)?\s*(?:ml|mL|g|oz|fl\.?\s*oz)\b", "", name, flags=re.I)
    value = re.sub(rf"^{re.escape(canonical_brand)}\s*[-:–—]?\s*", "", value, flags=re.I)
    if canonical_brand == "La Roche-Posay":
        value = re.sub(r"^La Roche Posay\s*[-:–—]?\s*", "", value, flags=re.I)
    value = re.sub(r"\s+", " ", value).strip(" -–—,/")
    return value


def usable_name(name: str, canonical_brand: str) -> bool:
    lowered = name.casefold()
    excluded = (
        "shampoo", "shampoing", "hair", "lèvre", "lip", "corpo", "body",
        "crème corps", "baby", "pédiatril", "www.", "&quot;", "t20ml",
        "eau de parfum", "eau de toilette", "gel douche", "vernis", "capillaire",
        "shower gel", "deodorant", "déodorant", "nail", "sauvage", "j'adore",
        "fahrenheit", "coco mademoiselle", "chance eau tendre", "gabrielle",
        "miss dior", "node ds", "nodé ds", "herbal essences",
    )
    if lowered == canonical_brand.casefold() or any(term in lowered for term in excluded):
        return False
    if sum(character.isalpha() for character in name) < 4:
        return False
    return True


def market(countries: list[str]) -> tuple[str, str]:
    for country in countries:
        if country in COUNTRY_MARKETS:
            return COUNTRY_MARKETS[country]
    return "global", "GLOBAL"


def build(limit: int) -> list[dict]:
    results_by_brand: dict[str, list[dict]] = {brand: [] for _, brand in BRANDS}
    identities = set()
    with ThreadPoolExecutor(max_workers=len(BRANDS)) as executor:
        fetched = list(executor.map(lambda pair: fetch_brand(pair[0]), BRANDS))
    for (_, canonical_brand), products in zip(BRANDS, fetched):
        for product in products:
            code = str(product.get("code") or "").strip()
            name = normalized_name(str(product.get("product_name") or "").strip(), canonical_brand)
            inci = ingredients(str(product.get("ingredients_text") or ""))
            if not code or len(name) < 3 or len(inci) < 10 or not usable_name(name, canonical_brand):
                continue
            product_market, region = market(product.get("countries_tags") or [])
            identity = (canonical_brand.casefold(), name.casefold(), product_market)
            if identity in identities:
                continue
            if any(
                brand == identity[0] and existing_market == product_market
                and SequenceMatcher(None, existing_name, identity[1]).ratio() >= 0.91
                for brand, existing_name, existing_market in identities
            ):
                continue
            identities.add(identity)
            results_by_brand[canonical_brand].append({
                "sourceProductCode": f"obf-{code}",
                "brand": canonical_brand,
                "name": name,
                "category": category(name, product.get("categories_tags") or []),
                "market": product_market,
                "sourceName": "Open Beauty Facts",
                "sourceType": "open_data",
                "region": region,
                "externalProductId": code,
                "sourceUrl": f"https://world.openbeautyfacts.org/product/{code}",
                "rawIngredients": "; ".join(inci[:15]),
                "ingredientListType": "partial",
                "dataCompleteness": 59,
            })
    results = []
    while len(results) < limit:
        added = False
        for _, canonical_brand in BRANDS:
            candidates = results_by_brand[canonical_brand]
            if candidates and len(results) < limit:
                results.append(candidates.pop(0))
                added = True
        if not added:
            break
    return results


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=88)
    parser.add_argument("--output", type=Path, default=Path("data/open_data_expansion_batch02.json"))
    args = parser.parse_args()
    products = build(args.limit)
    if len(products) != args.limit:
        raise RuntimeError(f"Expected {args.limit} products, found {len(products)}")
    payload = {
        "generatedAt": "2026-08-25",
        "scope": "Open-data candidate layer pending official or retailer formula verification.",
        "products": products,
    }
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(args.output)


if __name__ == "__main__":
    main()
