#!/usr/bin/env python3
"""Build a formula-distinct facial skincare catalog from five official sites."""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import html
import json
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path


SOURCES = {
    "avene": {
        "brand": "Avène",
        "source": "Avène Singapore",
        "region": "SG",
        "market": "singapore",
        "sitemap": "https://www.eau-thermale-avene.sg/product.xml",
    },
    "bioderma": {
        "brand": "Bioderma",
        "source": "Bioderma Singapore",
        "region": "SG",
        "market": "singapore",
        "sitemap": "https://www.bioderma.sg/sitemap.xml",
    },
    "cerave": {
        "brand": "CeraVe",
        "source": "CeraVe Singapore",
        "region": "SG",
        "market": "singapore",
        "listing": "https://www.cerave.com.sg/skincare",
    },
    "cetaphil": {
        "brand": "Cetaphil",
        "source": "Cetaphil Singapore",
        "region": "SG",
        "market": "singapore",
        "listings": (
            "https://www.cetaphil.com.sg/products",
            "https://www.cetaphil.com.sg/products/face",
            "https://www.cetaphil.com.sg/cleansers/facial-cleansers",
            "https://www.cetaphil.com.sg/moisturizers/facial-moisturisers-serums",
            "https://www.cetaphil.com.sg/sunscreens",
        ),
    },
    "lrp": {
        "brand": "La Roche-Posay",
        "source": "La Roche-Posay Singapore",
        "region": "SG",
        "market": "singapore",
        "sitemap": "https://www.laroche-posay.sg/sitemap.xml",
    },
}

EXCLUDED = (
    "baby", "bébé", "body", "corps", "hand", "mains", "lip", "lips", "levres",
    "lèvres", "shampoo", "hair", "scalp", "deodorant", "shower", "bath", "soap bar",
    "cleansing bar", "intimate", "foot", "feet", "set", "kit", "bundle", "duo", "trio",
    "refill", "recharge", "child", "children", "pediatric", "paediatric",
    "spray d'eau thermale", "thermal spring water spray",
)

LRP_LINES = (
    "anthelios", "cicaplast", "effaclar", "hyalu-b5", "mela-b3", "toleriane",
    "uvidea", "pure-vitamin-c", "retinol", "redemic", "pigmentclar", "subsstiane",
)


def request_text(url: str, timeout: int = 55) -> str:
    error: Exception | None = None
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 Skincare101CatalogResearch/1.0",
                "Accept-Language": "en-SG,en;q=0.9",
            })
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return response.read().decode("utf-8", errors="replace")
        except Exception as caught:
            error = caught
            time.sleep(0.8 * (attempt + 1))
    raise RuntimeError(f"Failed after 3 attempts: {url}: {error}")


def clean_html(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def sitemap_urls(url: str) -> list[str]:
    root = ET.fromstring(request_text(url))
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [node.text for node in root.findall(".//s:loc", namespace) if node.text]


def links_from_listings(urls: tuple[str, ...] | list[str], pattern: str) -> list[str]:
    links: set[str] = set()
    for listing in urls:
        page = request_text(listing)
        for href in re.findall(r'href=["\']([^"\']+)', page, re.I):
            absolute = urllib.parse.urljoin(listing, html.unescape(href).split("?")[0])
            if re.search(pattern, absolute, re.I):
                links.add(absolute)
    return sorted(links)


def product_urls(site: str) -> list[str]:
    source = SOURCES[site]
    if site == "avene":
        return [url for url in sitemap_urls(source["sitemap"]) if "/p/" in url]
    if site == "bioderma":
        return [url for url in sitemap_urls(source["sitemap"]) if "/our-products/" in url]
    if site == "cerave":
        return links_from_listings((source["listing"],), r"cerave\.com\.sg/skincare/.+")
    if site == "cetaphil":
        return links_from_listings(
            source["listings"],
            r"cetaphil\.com\.sg/(?:cleansers|moisturizers|sunscreens)/.+\.html$",
        )
    if site == "lrp":
        urls = sitemap_urls(source["sitemap"])
        return [
            url for url in urls
            if any(f"/{line}/" in url.casefold() for line in LRP_LINES)
        ]
    raise ValueError(site)


def category(name: str, url: str) -> str:
    value = f"{name} {url}".casefold()
    if any(term in value for term in ("eye", "eyes", "eyelid", "regard", "yeux")):
        return "眼部"
    if any(term in value for term in (
        "cleanser", "cleansing", "micellar", "mousse", "make-up remov", "makeup remov",
        "face wash", "caring wash", "foaming gel", "foaming foam", "h2o", "huile micellaire",
    )):
        return "洁面"
    if any(term in value for term in ("spf", "sunscreen", "sun fluid", "uv ", "anthelios")):
        return "防晒"
    if any(term in value for term in ("mask", "masque")):
        return "面膜"
    if any(term in value for term in ("serum", "sérum", "concentrate", "ampoule", "booster", "oil")):
        return "精华"
    if any(term in value for term in ("exfol", "peel", "scrub")):
        return "焕肤"
    if any(term in value for term in ("toner", "toning lotion", "tonique", "astringent lotion", "mist", "essence", "/lotion")):
        return "化妆水"
    if any(term in value for term in ("moisturis", "moisturiz", "hydrating lotion", "hydra lotion")):
        return "乳霜"
    return "乳霜"


def split_formula(value: str, separator: str = ",") -> list[str]:
    value = clean_html(value)
    value = re.split(
        r"Please (?:be aware|note)|The consumer is advised|Always check|The ingredients listed here",
        value,
        maxsplit=1,
        flags=re.I,
    )[0]
    if separator == ".":
        parts = re.split(r"\.\s+(?=[A-Z0-9\[])|\.\s*$", value)
    elif separator == "•":
        parts = re.split(r"\s*[•·]\s*", value)
    else:
        parts = value.split(separator)
    return [re.sub(r"\s+", " ", part).strip(" .;•") for part in parts if part.strip(" .;•")]


def excluded(name: str, url: str) -> bool:
    value = f"{name} {url}".casefold()
    return any(term in value for term in EXCLUDED)


def extract_avene(page: str, url: str) -> tuple[str, str, str | None, list[str]] | None:
    title = re.search(r'<meta property="og:title" content="([^"]+)', page, re.I)
    ingredients = re.search(
        r'id="composition_inci-panel".*?<div class="c-accordion__panel-wrapper"[^>]*>.*?<div><p>(.*?)</p>',
        page, re.I | re.S,
    )
    gtin = re.search(r'"gtin"\s*:\s*"?(\d{8,14})', page, re.I)
    revision = re.search(r'"PR_R"\s*:\s*"([^"]+)', page, re.I)
    if not title or not ingredients or not gtin:
        return None
    name = re.sub(r"\s*\|\s*Eau Thermale Avène.*$", "", clean_html(title.group(1)), flags=re.I)
    name = re.sub(r"\s+\d+\s*ml\b", "", name, flags=re.I).strip()
    return name, gtin.group(1), revision.group(1) if revision else None, split_formula(ingredients.group(1), ".")


def extract_bioderma(page: str, url: str) -> tuple[str, str, str | None, list[str]] | None:
    title = re.search(r'"productName"\s*:\s*"([^"]+)', page, re.I)
    code = re.search(r'"item_id"\s*:\s*"([^"]+)', page, re.I)
    target = re.search(r'"item_category3"\s*:\s*"([^"]+)', page, re.I)
    block = re.search(r'productingredientslist[^>]*>(.*?)</span>', page, re.I | re.S)
    if not title or not code or not block:
        return None
    target_text = target.group(1).casefold() if target else ""
    if target_text and not any(term in target_text for term in ("face", "eye", "eyelid")):
        return None
    parts = [clean_html(value) for value in re.findall(r"<li>(.*?)</li>", block.group(1), re.I | re.S)]
    return clean_html(title.group(1)), clean_html(code.group(1)), None, parts


def extract_cerave(page: str, url: str) -> tuple[str, str, str | None, list[str]] | None:
    title = re.search(r'data-tag-product-name="([^"]+)"', page, re.I)
    code = re.search(r'data-tag-product-id="([^"]+)"', page, re.I)
    block = re.search(r'<accordion[^>]+title="Ingredients"(.*?)</accordion>', page, re.I | re.S)
    if not title or not code or not block:
        return None
    paragraphs = re.findall(r"<p[^>]*>(.*?)</p>", block.group(1), re.I | re.S)
    formula_parts: list[str] = []
    for paragraph in paragraphs:
        value = clean_html(paragraph)
        if re.search(r"Please be aware|For refilled products", value, re.I):
            continue
        value = re.sub(r"^(?:Active|Inactive) Ingredients\s*:\s*", "", value, flags=re.I)
        formula_parts.extend(split_formula(value))
    return clean_html(title.group(1)), clean_html(code.group(1)), None, formula_parts


def extract_cetaphil(page: str, url: str) -> tuple[str, str, str | None, list[str]] | None:
    title = re.search(r'<title>(.*?)</title>', page, re.I | re.S)
    code = re.search(r'/([^/]+)\.html(?:$|[?#])', url)
    block = re.search(r'<h2>\s*(?:ALL )?INGREDIENTS\s*</h2>(.*?)(?:<h2|</div>\s*<!-- End content-asset)', page, re.I | re.S)
    if not title or not code or not block:
        return None
    paragraph = re.search(r"<p[^>]*>(.*?)</p>", block.group(1), re.I | re.S)
    if not paragraph:
        return None
    name = clean_html(title.group(1)).split("|")[0].strip()
    name = re.sub(r"\s*[-–]\s*(?:Face|Body|Daily|Gentle|Healthy).*$", "", name, flags=re.I)
    name = re.sub(r"^Cetaphil\s+", "", name, flags=re.I)
    return name, code.group(1), None, split_formula(paragraph.group(1))


def extract_lrp(page: str, url: str) -> tuple[str, str, str | None, list[str]] | None:
    component = re.search(r'<key-ingredients-v2\b(.*?)</key-ingredients-v2>', page, re.I | re.S)
    if not component:
        return None
    attrs = component.group(1)
    name = re.search(r'pfd-title="([^"]+)', page, re.I | re.S)
    if not name:
        name = re.search(r'product-name="([^"]+)', attrs, re.I)
    code = re.search(r'product-ean="(\d{8,14})', page, re.I)
    ingredients = re.search(r'other-ingredient="([^"]+)', attrs, re.I | re.S)
    version = re.search(r'file-code="([^"]+)', attrs, re.I)
    if not name or not code or not ingredients:
        return None
    value = html.unescape(html.unescape(ingredients.group(1))).replace("&bull;", "•")
    product_name = clean_html(name.group(1)).title()
    external_id = clean_html(code.group(1)) if code else url.rstrip("/").rsplit("/", 1)[-1]
    return product_name, external_id, version.group(1) if version else None, split_formula(value, "•")


EXTRACTORS = {
    "avene": extract_avene,
    "bioderma": extract_bioderma,
    "cerave": extract_cerave,
    "cetaphil": extract_cetaphil,
    "lrp": extract_lrp,
}


def extract(site: str, url: str) -> dict | None:
    lowered_url = url.casefold()
    if site == "avene" and any(term in lowered_url for term in ("/xeracalm-", "/spray-spf-", "/spf-50-lotion-")):
        return None
    if site == "bioderma":
        if "/abcderm/" in lowered_url or "photoderm-lait-ultra" in lowered_url or "/cicabio/restor" in lowered_url:
            return None
        if "/atoderm/" in lowered_url and "/atoderm/intensive-eye" not in lowered_url:
            return None
    if site == "lrp" and "anthelios-invisible-spray" in lowered_url:
        return None
    parsed = EXTRACTORS[site](request_text(url), url)
    if not parsed:
        return None
    name, external_id, formula_version, ingredients = parsed
    if excluded(name, url) or len(ingredients) < 4:
        return None
    source = SOURCES[site]
    retained = ingredients[:15]
    stable_code = url.rstrip("/").rsplit("/", 1)[-1] if site == "lrp" else external_id
    result = {
        "sourceProductCode": f"official-{source['region'].lower()}-{site}-{stable_code.casefold()}",
        "brand": source["brand"],
        "name": name,
        "category": category(name, url),
        "market": source["market"],
        "sourceName": source["source"],
        "sourceType": "brand_official",
        "region": source["region"],
        "externalProductId": external_id,
        "sourceUrl": url,
        "rawIngredients": "; ".join(retained),
        "ingredientListType": "full" if len(ingredients) <= 15 else "partial",
        "dataCompleteness": 90 if len(ingredients) <= 15 else 78,
        "formulaFingerprint": hashlib.sha256(
            "|".join(part.casefold() for part in retained).encode("utf-8")
        ).hexdigest(),
    }
    if formula_version:
        result["formulaVersion"] = formula_version
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("data/derm_official_catalog.json"))
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    site_urls = {site: product_urls(site) for site in SOURCES}
    records: list[dict] = []
    errors: list[dict] = []
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(extract, site, url): (site, url)
            for site, urls in site_urls.items() for url in urls
        }
        for future in as_completed(futures):
            site, url = futures[future]
            try:
                record = future.result()
                if record:
                    records.append(record)
            except Exception as error:
                errors.append({"site": site, "url": url, "error": str(error)})

    records.sort(key=lambda item: (item["brand"].casefold(), item["name"].casefold()))
    unique: list[dict] = []
    seen_names: set[tuple[str, str]] = set()
    seen_formulas: set[tuple[str, str]] = set()
    for record in records:
        name_key = (record["brand"].casefold(), record["name"].casefold())
        formula_key = (record["brand"].casefold(), record["formulaFingerprint"])
        if name_key in seen_names or formula_key in seen_formulas:
            continue
        seen_names.add(name_key)
        seen_formulas.add(formula_key)
        record.pop("formulaFingerprint")
        unique.append(record)

    payload = {
        "generatedAt": "2026-08-25",
        "scope": "Formula-distinct facial skincare from five brand-official Singapore sites.",
        "sourceProductPages": {site: len(urls) for site, urls in site_urls.items()},
        "products": unique,
        "errors": errors,
    }
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    counts = {site: sum(item["sourceName"] == SOURCES[site]["source"] for item in unique) for site in SOURCES}
    print(json.dumps({"pages": payload["sourceProductPages"], "products": counts, "errors": len(errors)}))


if __name__ == "__main__":
    main()
