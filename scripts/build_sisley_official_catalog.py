#!/usr/bin/env python3
"""Extract formula-distinct facial skincare from Sisley Singapore."""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
import hashlib
import html
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path


BASE = "https://www.sisley-paris.com"
GRID = BASE + "/on/demandware.store/Sites-Sisley_SG-Site/en_SG/Search-UpdateGrid"
EXCLUDED = (
    "15ml", "15-ml", "refill", "set-", "gift", "discovery", "duo", "body",
    "hand", "hair", "lip-balm", "lip-care", "neck", "bust", "deodorant",
)
NAME_EXCLUDED = ("coffret", "gift set", "discovery set", "duo")
OFFICIAL_FACE_CARE_COUNT = 83


def request_text(url: str, timeout: int = 45) -> str:
    request = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 Skincare101CatalogResearch/1.0",
        "Accept-Language": "en-SG,en;q=0.9",
    })
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value))).strip()


def product_urls(workers: int) -> list[str]:
    starts = range(0, 96, 16)
    urls = set()
    with ThreadPoolExecutor(max_workers=min(workers, 6)) as executor:
        futures = {
            executor.submit(request_text, f"{GRID}?cgid=10100&start={start}&sz=16"): start
            for start in starts
        }
        for future in as_completed(futures):
            page = future.result()
            for href in re.findall(r'href="([^"]+-\d{5,8}\.html)"', page, re.I):
                url = urllib.parse.urljoin(BASE, html.unescape(href))
                if "/en-SG/" in url and not any(term in url.casefold() for term in EXCLUDED):
                    urls.add(url)
    return sorted(urls)


def category(name: str, url: str) -> str:
    value = f"{name} {url}".casefold()
    if any(term in value for term in ("make-up-remover", "makeup-remover", "lyslait", "eau-efficace")):
        return "卸妆"
    if any(term in value for term in ("cleanser", "cleansing", "mousse")):
        return "洁面"
    if "eye" in value or "contour-des-yeux" in value:
        return "眼部"
    if any(term in value for term in ("spf", "sun-care", "sunscreen", "sunleya", "super-soin-solaire")):
        return "防晒"
    if any(term in value for term in ("lotion", "mist", "toning")):
        return "化妆水"
    if "mask" in value or "masque" in value:
        return "面膜"
    if any(term in value for term in ("serum", "concentrate", "concentre", "oil")):
        return "精华"
    if any(term in value for term in ("exfol", "peel", "buff-and-wash")):
        return "焕肤"
    return "乳霜"


def extract(url: str) -> dict | None:
    page = request_text(url)
    title = re.search(r'<h1[^>]*data-ui="product-name"[^>]*>(.*?)</h1>', page, re.I | re.S)
    ingredients = re.search(r'id="activeIngredientsDetails"[^>]*>(.*?)(?:</div>|pdpIngredientsRessurance)', page, re.I | re.S)
    code = re.search(r"-(\d{5,8})\.html", url)
    if not title or not ingredients or not code:
        return None
    name = clean(title.group(1))
    raw = clean(ingredients.group(1))
    raw = re.split(r"\bIL#|The lists of ingredients", raw, maxsplit=1, flags=re.I)[0].strip(" ,.;")
    # Sisley publishes comma-delimited INCI, while ingredient names such as
    # 1,2-HEXANEDIOL contain an internal comma without following whitespace.
    parts = [part.strip(" .") for part in re.split(r",\s+(?=[A-Z0-9])", raw) if part.strip(" .")]
    if len(parts) < 4:
        return None
    product_code = code.group(1)
    return {
        "sourceProductCode": f"official-sg-sisley-{product_code}",
        "brand": "Sisley",
        "name": name,
        "category": category(name, url),
        "market": "singapore",
        "sourceName": "Sisley Singapore",
        "sourceType": "brand_official",
        "region": "SG",
        "externalProductId": product_code,
        "sourceUrl": url,
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
    parser.add_argument("--output", type=Path, default=Path("data/sisley_official_catalog.json"))
    parser.add_argument("--workers", type=int, default=10)
    args = parser.parse_args()

    urls = product_urls(args.workers)
    records, errors = [], []
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(extract, url): url for url in urls}
        for future in as_completed(futures):
            try:
                record = future.result()
                if record:
                    records.append(record)
                else:
                    errors.append({"url": futures[future], "error": "missing title or complete INCI"})
            except Exception as error:
                errors.append({"url": futures[future], "error": str(error)})

    name_excluded = [record for record in records if any(term in record["name"].casefold() for term in NAME_EXCLUDED)]
    records = [record for record in records if record not in name_excluded]
    records.sort(key=lambda item: (item["name"].casefold(), item["externalProductId"]))
    unique, seen_names, seen_formulas = [], set(), set()
    for record in records:
        name_key = record["name"].casefold()
        if name_key in seen_names or record["formulaFingerprint"] in seen_formulas:
            continue
        seen_names.add(name_key)
        seen_formulas.add(record["formulaFingerprint"])
        record.pop("formulaFingerprint")
        unique.append(record)

    payload = {
        "generatedAt": date.today().isoformat(),
        "scope": "Formula-distinct facial skincare from Sisley Singapore face-care pages.",
        "officialListedCount": OFFICIAL_FACE_CARE_COUNT,
        "sourceProductPages": len(urls),
        "excludedBeforeFetchCount": OFFICIAL_FACE_CARE_COUNT - len(urls),
        "excludedAfterFetchCount": len(name_excluded),
        "products": unique,
        "errors": errors,
    }
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"pages": len(urls), "products": len(unique), "errors": len(errors)}))


if __name__ == "__main__":
    main()
