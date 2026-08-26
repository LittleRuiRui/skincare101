#!/usr/bin/env python3
"""Extract formula-distinct facial skincare from Dior Singapore official pages."""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import html
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path


SITEMAP = "https://www.dior.com/en_sg/beauty/sitemap.xml"
LINE_MARKERS = (
    "dior-prestige", "dior-capture", "capture-", "dior-snow", "diorsnow",
    "lor-de-vie", "one-essential", "hydra-life", "la-mousse-off",
)
EXCLUDED = (
    "refill", "ritual", "cushion", "teint", "foundation", "sponge", "petale",
    "quartz", "hand", "body", "hair", "sauvage", "miss-dior", "palette",
    "eyelash", "eyeliner", "brush", "set-", "gift", "discovery", "mains",
)


def request_text(url: str, timeout: int = 50) -> str:
    request = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 Skincare101CatalogResearch/1.0",
        "Accept-Language": "en-SG,en;q=0.9",
    })
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")


def product_urls() -> list[str]:
    root = ET.fromstring(request_text(SITEMAP))
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = []
    for node in root.findall(".//s:loc", namespace):
        url = node.text or ""
        lowered = url.casefold()
        if "/beauty/products/" not in lowered:
            continue
        if not any(marker in lowered for marker in LINE_MARKERS):
            continue
        if any(marker in lowered for marker in EXCLUDED):
            continue
        urls.append(url)
    return urls


def clean_html(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def category(name: str, url: str) -> str:
    value = f"{name} {url}".casefold()
    if any(term in value for term in ("cleanser", "mousse", "baume-demaquillant", "savon")):
        return "洁面"
    if "eye" in value or "yeux" in value:
        return "眼部"
    if any(term in value for term in ("spf", "uv-base", "uv-shield", "protecteur-uv")):
        return "防晒"
    if any(term in value for term in ("creme", "crème", "cream", "emulsion", "émulsion")):
        return "乳霜"
    if any(term in value for term in ("lotion", "brume", "mist", "essence")):
        return "化妆水"
    if "mask" in value or "masque" in value:
        return "面膜"
    if any(term in value for term in ("serum", "sérum", "shot", "nectar", "huile", "concentre")):
        return "精华"
    if any(term in value for term in ("gommage", "peel")):
        return "焕肤"
    return "乳霜"


def extract(url: str) -> dict | None:
    page = request_text(url)
    title_match = re.search(r'<h1[^>]*pdp-details__title[^>]*>(.*?)</h1>', page, re.I | re.S)
    code_match = re.search(r"-([CY]\d{7,10})\.html", url, re.I)
    if not title_match or not code_match:
        return None
    name = clean_html(title_match.group(1))
    candidates = re.findall(r"#(\d{4,8})\s+([^<]{80,})", page, re.I | re.S)
    formula_code = None
    formula_text = None
    for candidate_code, candidate_text in candidates:
        candidate_text = clean_html(candidate_text)
        if "•" in candidate_text and any(term in candidate_text.upper() for term in ("AQUA", "WATER", "GLYCERIN")):
            formula_code = candidate_code
            formula_text = candidate_text
            break
    if not formula_text:
        return None
    parts = [part.strip(" .") for part in formula_text.split("•") if part.strip(" .")]
    if len(parts) < 4:
        return None
    external_id = code_match.group(1).upper()
    return {
        "sourceProductCode": f"official-sg-dior-{external_id.lower()}-{formula_code}",
        "brand": "Dior",
        "name": name,
        "category": category(name, url),
        "market": "singapore",
        "sourceName": "Dior Singapore",
        "sourceType": "brand_official",
        "region": "SG",
        "externalProductId": external_id,
        "formulaVersion": formula_code,
        "sourceUrl": url,
        # Save the complete official formula. Formula DNA reads the top zone
        # later; truncating here would permanently destroy database evidence.
        "rawIngredients": "; ".join(parts),
        "ingredientListType": "full",
        "dataCompleteness": 100,
        "analysisIngredientCount": min(15, len(parts)),
        "formulaFingerprint": hashlib.sha256(
            "|".join(part.casefold() for part in parts).encode("utf-8")
        ).hexdigest(),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("data/dior_official_catalog.json"))
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    urls = product_urls()
    records = []
    errors = []
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(extract, url): url for url in urls}
        for future in as_completed(futures):
            try:
                record = future.result()
                if record:
                    records.append(record)
            except Exception as error:
                errors.append({"url": futures[future], "error": str(error)})

    records.sort(key=lambda item: (item["name"].casefold(), item["externalProductId"]))
    unique = []
    seen_formulas = set()
    seen_names = set()
    for record in records:
        if record["formulaFingerprint"] in seen_formulas or record["name"].casefold() in seen_names:
            continue
        seen_formulas.add(record["formulaFingerprint"])
        seen_names.add(record["name"].casefold())
        record.pop("formulaFingerprint")
        unique.append(record)

    payload = {
        "generatedAt": "2026-08-25",
        "scope": "Formula-distinct Dior Singapore facial skincare from official product pages.",
        "sourceProductPages": len(urls),
        "products": unique,
        "errors": errors,
    }
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"pages": len(urls), "products": len(unique), "errors": len(errors)}))


if __name__ == "__main__":
    main()
