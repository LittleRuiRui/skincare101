#!/usr/bin/env python3
"""Extract formula-distinct skincare products from Chanel Singapore official pages."""

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


SITEMAP = "https://www.chanel.com/sg/sitemap.xml"
EXCLUDED_NAME_PARTS = (
    "refill", "recharge", "trio", "duo", "body", "hand", "lip", "lèvres",
    "massage oil", "travel", "set ", "discovery", "coffret", "crème main",
    "creme main", "fragrance mist",
)


def request_text(url: str, timeout: int = 45) -> str:
    request = urllib.request.Request(url, headers={
        "User-Agent": "Skincare101CatalogResearch/1.0 (+formula provenance research)",
        "Accept-Language": "en-SG,en;q=0.9",
    })
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")


def product_urls() -> list[str]:
    root = ET.fromstring(request_text(SITEMAP))
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [
        node.text for node in root.findall(".//s:loc", namespace)
        if node.text and "/sg/skincare/p/" in node.text
    ]


def clean_html(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def category(name: str, url: str) -> str:
    value = f"{name} {url}".casefold()
    if any(term in value for term in ("clean", "micellaire", "mousse", "demaquillant", "savon")):
        return "洁面"
    if "eye" in value or "yeux" in value or "regard" in value:
        return "眼部"
    if any(term in value for term in ("spf", "uv essentiel", "protection-uv", "cc cream")):
        return "防晒"
    if any(term in value for term in ("lotion", "mist", "essence")):
        return "化妆水"
    if "mask" in value or "masque" in value:
        return "面膜"
    if any(term in value for term in ("serum", "sérum", "concentrate", "concentré", "corrector")):
        return "精华"
    if any(term in value for term in ("exfol", "peel")):
        return "焕肤"
    return "乳霜"


def extract(url: str) -> dict | None:
    page = request_text(url)
    title_match = re.search(
        r'<span[^>]+data-test="lblProductTitle"[^>]*>(.*?)</span>', page, re.I | re.S
    )
    ingredient_match = re.search(
        r'List of Ingredients</h4>\s*<p[^>]*>(.*?)</p>', page, re.I | re.S
    )
    code_match = re.search(r"/p/(\d+)/", url)
    if not title_match or not ingredient_match or not code_match:
        return None
    name = clean_html(title_match.group(1))
    excluded_text = f"{name} {url}".casefold()
    if any(term in excluded_text for term in EXCLUDED_NAME_PARTS):
        return None
    raw = clean_html(ingredient_match.group(1))
    raw = re.split(r"\bIL\d+[A-Z0-9./-]*\b", raw, maxsplit=1)[0].strip(" .|")
    parts = [part.strip(" .") for part in raw.split("|") if part.strip(" .")]
    if len(parts) < 4:
        return None
    code = code_match.group(1)
    return {
        "sourceProductCode": f"official-sg-chanel-{code}",
        "brand": "Chanel",
        "name": name.title(),
        "category": category(name, url),
        "market": "singapore",
        "sourceName": "Chanel Singapore",
        "sourceType": "brand_official",
        "region": "SG",
        "externalProductId": code,
        "sourceUrl": url,
        "rawIngredients": "; ".join(parts[:15]),
        "ingredientListType": "full" if len(parts) <= 15 else "partial",
        "dataCompleteness": 90 if len(parts) <= 15 else 78,
        "formulaFingerprint": hashlib.sha256(
            "|".join(part.casefold() for part in parts[:15]).encode("utf-8")
        ).hexdigest(),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("data/chanel_official_catalog.json"))
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    records = []
    errors = []
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(extract, url): url for url in product_urls()}
        for future in as_completed(futures):
            try:
                record = future.result()
                if record:
                    records.append(record)
            except Exception as error:  # retain failures for review without stopping the batch
                errors.append({"url": futures[future], "error": str(error)})

    records.sort(key=lambda item: (item["name"].casefold(), item["externalProductId"]))
    unique = []
    seen_formulas = set()
    seen_names = set()
    for record in records:
        identity = record["name"].casefold()
        if record["formulaFingerprint"] in seen_formulas or identity in seen_names:
            continue
        seen_formulas.add(record["formulaFingerprint"])
        seen_names.add(identity)
        record.pop("formulaFingerprint")
        unique.append(record)

    payload = {
        "generatedAt": "2026-08-25",
        "scope": "Formula-distinct Chanel Singapore skincare products from official product pages.",
        "sourceProductPages": len(product_urls()),
        "products": unique,
        "errors": errors,
    }
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"pages": payload["sourceProductPages"], "products": len(unique), "errors": len(errors)}))


if __name__ == "__main__":
    main()
