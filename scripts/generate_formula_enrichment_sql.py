#!/usr/bin/env python3
"""Validate and generate reviewable SQL batches for formula enrichments."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


SQL_TEMPLATE = r"""do $enrichment$
declare
  v jsonb;
  v_product_id uuid;
  v_formula_type text;
  v_completeness smallint;
begin
  for v in select value from jsonb_array_elements($payload${payload}$payload$::jsonb)
  loop
    select id into strict v_product_id
    from public.products
    where source_product_code = v ->> 'sourceProductCode'
      and archived_at is null;

    v_formula_type := coalesce(v ->> 'ingredientListType', 'partial');
    v_completeness := coalesce((v ->> 'dataCompleteness')::smallint, 78);

    update public.products
    set source_url = v ->> 'sourceUrl', updated_at = now()
    where id = v_product_id;

    update public.product_formulas
    set raw_ingredients = v ->> 'rawIngredients',
        ingredient_names = array(
          select trim(part)
          from unnest(string_to_array(v ->> 'rawIngredients', ';')) as part
          where trim(part) <> ''
        ),
        ingredient_list_type = v_formula_type,
        data_completeness = v_completeness,
        source_url = v ->> 'sourceUrl',
        verified_at = current_date,
        source_last_modified_at = null,
        quality_flags = case
          when v_formula_type = 'full' then array['full_formula_verified']::text[]
          else array['top15_formula_verified', 'full_formula_not_stored']::text[]
        end,
        formula_dna = '{{}}'::jsonb,
        formula_analysis_version = null,
        formula_analyzed_at = null,
        updated_at = now()
    where product_id = v_product_id and is_current;

    if not found then
      raise exception 'No current formula for product code %', v ->> 'sourceProductCode';
    end if;
  end loop;
end
$enrichment$;
"""


def validate(products: list[dict]) -> None:
    if len(products) != 50:
        raise ValueError(f"Expected 50 enrichments, found {len(products)}")
    codes = [item["sourceProductCode"] for item in products]
    if len(codes) != len(set(codes)):
        raise ValueError("Duplicate sourceProductCode in enrichment data")
    for item in products:
        ingredients = [part.strip() for part in item["rawIngredients"].split(";") if part.strip()]
        if not 4 <= len(ingredients) <= 15:
            raise ValueError(f"{item['sourceProductCode']} has {len(ingredients)} retained ingredients")
        if not item["sourceUrl"].startswith("https://"):
            raise ValueError(f"Non-HTTPS source for {item['sourceProductCode']}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path("data/pilot_formula_enrichments.json"))
    parser.add_argument("--output-dir", type=Path, default=Path("/tmp/skincare101-enrichment-sql"))
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
