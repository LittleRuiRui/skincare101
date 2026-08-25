#!/usr/bin/env python3
"""Generate reviewable SQL batches for the pilot catalog import."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


SQL_TEMPLATE = r"""do $import$
declare
  v jsonb;
  v_product_id uuid;
  v_existing_origin text;
begin
  for v in select value from jsonb_array_elements($catalog${payload}$catalog$::jsonb)
  loop
    v_product_id := null;
    v_existing_origin := null;
    select id, catalog_origin into v_product_id, v_existing_origin
    from public.products
    where archived_at is null and (
      source_product_code = v ->> 'sourceProductCode'
      or (
        lower(brand) = lower(v ->> 'brand')
        and lower(name) = lower(v ->> 'name')
        and market = v ->> 'market'
      )
    )
    order by case when source_product_code = v ->> 'sourceProductCode' then 0 else 1 end
    limit 1;

    if v_product_id is null then
      insert into public.products (
        brand, name, category, market, source_url, catalog_origin,
        source_product_code, popularity_score, popularity_rank,
        popularity_basis, popularity_sources, popularity_tier,
        asia_availability_status
      ) values (
        v ->> 'brand', v ->> 'name', v ->> 'category', v ->> 'market',
        v ->> 'sourceUrl', 'pilot-300', v ->> 'sourceProductCode',
        nullif(v ->> 'popularityScore', '')::bigint,
        nullif(v ->> 'popularityRank', '')::integer,
        v ->> 'popularityBasis',
        array(select jsonb_array_elements_text(v -> 'popularitySources')),
        v ->> 'popularityTier', v ->> 'asiaAvailabilityStatus'
      ) returning id into v_product_id;
      v_existing_origin := 'pilot-300';
    else
      update public.products set
        category = v ->> 'category',
        source_url = coalesce(v ->> 'sourceUrl', source_url),
        source_product_code = coalesce(source_product_code, v ->> 'sourceProductCode'),
        popularity_score = nullif(v ->> 'popularityScore', '')::bigint,
        popularity_rank = nullif(v ->> 'popularityRank', '')::integer,
        popularity_basis = v ->> 'popularityBasis',
        popularity_sources = array(select jsonb_array_elements_text(v -> 'popularitySources')),
        popularity_tier = v ->> 'popularityTier',
        asia_availability_status = v ->> 'asiaAvailabilityStatus',
        updated_at = now()
      where id = v_product_id;
    end if;

    -- Never replace a manually reviewed seed formula with crowdsourced pilot data.
    if v_existing_origin <> 'manual' then
      update public.product_formulas set is_current = false, updated_at = now()
      where product_id = v_product_id and market = v ->> 'market' and is_current;

      insert into public.product_formulas (
        product_id, market, raw_ingredients, ingredient_names,
        ingredient_list_type, data_completeness, source_url, verified_at,
        source_last_modified_at, quality_flags, is_current
      ) values (
        v_product_id, v ->> 'market', coalesce(v ->> 'rawIngredients', ''),
        array(select jsonb_array_elements_text(v -> 'ingredients')),
        v ->> 'ingredientListType', (v ->> 'dataCompleteness')::smallint,
        v ->> 'sourceUrl',
        coalesce((v ->> 'sourceLastModifiedAt')::timestamptz::date, current_date),
        (v ->> 'sourceLastModifiedAt')::timestamptz,
        array(select jsonb_array_elements_text(v -> 'qualityFlags')),
        true
      );
    end if;
  end loop;
end
$import$;
"""


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path("data/pilot_products.json"))
    parser.add_argument("--output-dir", type=Path, default=Path("/tmp/skincare101-pilot-sql"))
    parser.add_argument("--batch-size", type=int, default=50)
    args = parser.parse_args()

    products = json.loads(args.input.read_text(encoding="utf-8"))["products"]
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for index in range(0, len(products), args.batch_size):
        batch = products[index : index + args.batch_size]
        payload = json.dumps(batch, ensure_ascii=False, separators=(",", ":"))
        path = args.output_dir / f"batch_{index // args.batch_size + 1:02d}.sql"
        path.write_text(SQL_TEMPLATE.format(payload=payload), encoding="utf-8")
        print(path)


if __name__ == "__main__":
    main()
