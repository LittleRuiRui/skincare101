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
  v_should_replace_formula boolean;
begin
  for v in select value from jsonb_array_elements($payload${payload}$payload$::jsonb)
  loop
    v_formula_type := coalesce(v ->> 'ingredientListType', 'partial');
    v_completeness := coalesce((v ->> 'dataCompleteness')::smallint,
      case when v_formula_type = 'full' then 90 else 78 end);

    select id into v_product_id from public.products
    where archived_at is null and (
      source_product_code = v ->> 'sourceProductCode'
      or (lower(brand) = lower(v ->> 'brand') and lower(name) = lower(v ->> 'name')
        and market = v ->> 'market')
    ) order by (source_product_code = v ->> 'sourceProductCode') desc limit 1;

    if v_product_id is null then
      insert into public.products (
        brand, name, category, market, source_url, catalog_origin,
        source_product_code, popularity_sources, asia_availability_status
      ) values (
        trim(v ->> 'brand'), trim(v ->> 'name'), v ->> 'category', v ->> 'market',
        v ->> 'sourceUrl',
        case when v ->> 'sourceType' = 'brand_official' then 'official-expansion'
          else 'candidate-expansion' end,
        v ->> 'sourceProductCode', array[v ->> 'sourceName'],
        case when v ->> 'region' in ('SG', 'JP', 'KR', 'CN', 'HK', 'TW', 'MY', 'TH')
          then 'verified' else 'unverified' end
      ) returning id into v_product_id;
    else
      update public.products set
        category = v ->> 'category', source_url = v ->> 'sourceUrl',
        popularity_sources = array(select distinct value from unnest(
          popularity_sources || array[v ->> 'sourceName']) value),
        asia_availability_status = case
          when v ->> 'region' in ('SG', 'JP', 'KR', 'CN', 'HK', 'TW', 'MY', 'TH')
          then 'verified' else asia_availability_status end,
        updated_at = now()
      where id = v_product_id;
    end if;

    select not exists (
      select 1 from public.product_formulas
      where product_id = v_product_id and market = v ->> 'market'
        and is_current and data_completeness >= v_completeness
    ) into v_should_replace_formula;

    if v_should_replace_formula then
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
      case
        when v_formula_type = 'full' and v ->> 'sourceType' = 'brand_official'
          then array['full_formula_verified', 'brand_official_source']::text[]
        when v ->> 'sourceType' = 'brand_official'
          then array['top15_formula_verified', 'full_formula_not_stored', 'brand_official_source']::text[]
        else array['top15_candidate', 'official_verification_pending', v ->> 'sourceType']::text[]
      end
      );
    end if;

    insert into public.product_sources (
      product_id, source_type, source_name, region, source_url,
      external_product_id, formula_version, is_primary,
      formula_observed, availability_observed, last_checked_at
    ) values (
      v_product_id, v ->> 'sourceType', v ->> 'sourceName', v ->> 'region',
      v ->> 'sourceUrl', v ->> 'externalProductId', v ->> 'formulaVersion',
      true, true, (v ->> 'region') <> 'GLOBAL', current_date
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
        if item["sourceType"] not in {"brand_official", "authorized_retailer", "retailer", "open_data"}:
            raise ValueError(f"Unsupported source type for {code}")


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
