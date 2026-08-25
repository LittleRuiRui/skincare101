#!/usr/bin/env python3
"""Validate official-source products and generate reviewable SQL import batches."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


SQL_TEMPLATE = r"""do $official_expansion$
declare
  v jsonb;
  v_product_id uuid;
  v_formula_type text;
  v_completeness smallint;
begin
  for v in select value from jsonb_array_elements($payload${payload}$payload$::jsonb)
  loop
    v_formula_type := coalesce(v ->> 'ingredientListType', 'partial');
    v_completeness := coalesce((v ->> 'dataCompleteness')::smallint,
      case when v_formula_type = 'full' then 90 else 78 end);

    insert into public.products (
      brand, name, category, market, source_url, catalog_origin,
      source_product_code, popularity_sources, asia_availability_status
    ) values (
      trim(v ->> 'brand'), trim(v ->> 'name'), v ->> 'category', v ->> 'market',
      v ->> 'sourceUrl', 'official-expansion', v ->> 'sourceProductCode',
      array[v ->> 'sourceName'],
      case when v ->> 'region' in ('SG', 'JP', 'KR', 'CN', 'HK', 'TW', 'MY', 'TH')
        then 'verified' else 'unverified' end
    )
    on conflict (source_product_code) where source_product_code is not null and archived_at is null
    do update set
      brand = excluded.brand, name = excluded.name, category = excluded.category,
      market = excluded.market, source_url = excluded.source_url,
      popularity_sources = excluded.popularity_sources,
      asia_availability_status = excluded.asia_availability_status,
      updated_at = now()
    returning id into v_product_id;

    update public.product_formulas set is_current = false, updated_at = now()
    where product_id = v_product_id and market = v ->> 'market' and is_current;

    insert into public.product_formulas (
      product_id, market, raw_ingredients, ingredient_names,
      ingredient_list_type, data_completeness, source_url, verified_at,
      is_current, quality_flags
    ) values (
      v_product_id, v ->> 'market', v ->> 'rawIngredients',
      array(select trim(part) from unnest(string_to_array(v ->> 'rawIngredients', ';')) part
        where trim(part) <> ''),
      v_formula_type, v_completeness, v ->> 'sourceUrl', current_date, true,
      case when v_formula_type = 'full'
        then array['full_formula_verified', 'brand_official_source']::text[]
        else array['top15_formula_verified', 'full_formula_not_stored', 'brand_official_source']::text[] end
    );

    insert into public.product_sources (
      product_id, source_type, source_name, region, source_url,
      external_product_id, formula_version, is_primary,
      formula_observed, availability_observed, last_checked_at
    ) values (
      v_product_id, v ->> 'sourceType', v ->> 'sourceName', v ->> 'region',
      v ->> 'sourceUrl', v ->> 'externalProductId', v ->> 'formulaVersion',
      true, true, true, current_date
    ) on conflict (product_id, source_url) do update set
      source_type = excluded.source_type, source_name = excluded.source_name,
      region = excluded.region, external_product_id = excluded.external_product_id,
      formula_version = excluded.formula_version, is_primary = true,
      formula_observed = true, availability_observed = true,
      last_checked_at = current_date, updated_at = now();
  end loop;
end
$official_expansion$;
"""


def validate(products: list[dict]) -> None:
    required = {
        "sourceProductCode", "brand", "name", "category", "market",
        "sourceName", "sourceType", "region", "sourceUrl", "rawIngredients",
    }
    codes: set[str] = set()
    identities: set[tuple[str, str, str]] = set()
    for item in products:
        missing = required - item.keys()
        if missing:
            raise ValueError(f"Missing {sorted(missing)} in {item.get('sourceProductCode')}")
        code = item["sourceProductCode"]
        if code in codes:
            raise ValueError(f"Duplicate sourceProductCode: {code}")
        codes.add(code)
        identity = (item["brand"].casefold(), item["name"].casefold(), item["market"])
        if identity in identities:
            raise ValueError(f"Duplicate product identity: {identity}")
        identities.add(identity)
        ingredients = [part.strip() for part in item["rawIngredients"].split(";") if part.strip()]
        if not 4 <= len(ingredients) <= 15:
            raise ValueError(f"{code} has {len(ingredients)} retained ingredients")
        if not item["sourceUrl"].startswith("https://"):
            raise ValueError(f"Non-HTTPS source for {code}")
        if item["sourceType"] != "brand_official":
            raise ValueError(f"First batch must use official brand sources: {code}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path("data/official_formula_expansion.json"))
    parser.add_argument("--output-dir", type=Path, default=Path("/tmp/skincare101-official-sql"))
    parser.add_argument("--batch-size", type=int, default=10)
    args = parser.parse_args()

    products = json.loads(args.input.read_text(encoding="utf-8"))["products"]
    validate(products)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for index in range(0, len(products), args.batch_size):
        batch = products[index:index + args.batch_size]
        payload = json.dumps(batch, ensure_ascii=False, separators=(",", ":"))
        path = args.output_dir / f"batch_{index // args.batch_size + 1:02d}.sql"
        path.write_text(SQL_TEMPLATE.format(payload=payload), encoding="utf-8")
        print(path)


if __name__ == "__main__":
    main()
