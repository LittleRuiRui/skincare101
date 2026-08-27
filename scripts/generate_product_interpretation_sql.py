#!/usr/bin/env python3
"""Generate reviewable SQL batches for precomputed product interpretation.

The input is intentionally product-level only. It must never contain a user profile or
personalized recommendation. Personal fit is computed at runtime by the app.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

SQL_TEMPLATE = r"""do $interpretation$
declare
  v jsonb;
  v_product_id uuid;
begin
  for v in select value from jsonb_array_elements($payload${payload}$payload$::jsonb)
  loop
    select id into strict v_product_id
    from public.products
    where source_product_code = v ->> 'sourceProductCode'
      and archived_at is null;

    update public.products
    set marketing_positioning = nullif(v ->> 'marketingPositioning', ''),
        intended_skin_types = array(select jsonb_array_elements_text(coalesce(v -> 'intendedSkinTypes', '[]'::jsonb))),
        intended_concerns = array(select jsonb_array_elements_text(coalesce(v -> 'intendedConcerns', '[]'::jsonb))),
        intended_use_context = array(select jsonb_array_elements_text(coalesce(v -> 'intendedUseContext', '[]'::jsonb))),
        updated_at = now()
    where id = v_product_id;

    update public.product_formulas
    set formula_function_summary = nullif(v ->> 'formulaFunctionSummary', ''),
        primary_formula_functions = array(select jsonb_array_elements_text(coalesce(v -> 'primaryFormulaFunctions', '[]'::jsonb))),
        secondary_formula_functions = array(select jsonb_array_elements_text(coalesce(v -> 'secondaryFormulaFunctions', '[]'::jsonb))),
        formula_best_for = array(select jsonb_array_elements_text(coalesce(v -> 'formulaBestFor', '[]'::jsonb))),
        formula_also_works_for = array(select jsonb_array_elements_text(coalesce(v -> 'formulaAlsoWorksFor', '[]'::jsonb))),
        formula_less_ideal_for = array(select jsonb_array_elements_text(coalesce(v -> 'formulaLessIdealFor', '[]'::jsonb))),
        formula_caveats = array(select jsonb_array_elements_text(coalesce(v -> 'formulaCaveats', '[]'::jsonb))),
        formula_verdict = nullif(v ->> 'formulaVerdict', ''),
        interpretation_version = coalesce(nullif(v ->> 'interpretationVersion', ''), 'v1'),
        interpreted_at = now(),
        updated_at = now()
    where product_id = v_product_id and is_current;

    if not found then
      raise exception 'No current formula for product code %', v ->> 'sourceProductCode';
    end if;
  end loop;
end
$interpretation$;
"""

REQUIRED = (
    "sourceProductCode",
    "formulaFunctionSummary",
    "formulaVerdict",
)
ARRAY_FIELDS = (
    "intendedSkinTypes", "intendedConcerns", "intendedUseContext",
    "primaryFormulaFunctions", "secondaryFormulaFunctions", "formulaBestFor",
    "formulaAlsoWorksFor", "formulaLessIdealFor", "formulaCaveats",
)


def validate(items: list[dict]) -> None:
    codes: list[str] = []
    for item in items:
        for key in REQUIRED:
            if not str(item.get(key, "")).strip():
                raise ValueError(f"Missing {key} for {item.get('sourceProductCode', '<unknown>')}")
        code = item["sourceProductCode"]
        codes.append(code)
        for field in ARRAY_FIELDS:
            value = item.get(field, [])
            if not isinstance(value, list) or not all(isinstance(x, str) for x in value):
                raise ValueError(f"{code}: {field} must be an array of strings")
        if len(item["formulaFunctionSummary"]) > 600 or len(item["formulaVerdict"]) > 500:
            raise ValueError(f"{code}: interpretation text is too long")
        serialized = json.dumps(item, ensure_ascii=False).lower()
        if any(token in serialized for token in ('"userprofile"', 'personalizedscore', 'match for you')):
            raise ValueError(f"{code}: personalized content must not be stored as product interpretation")
    if len(codes) != len(set(codes)):
        raise ValueError("Duplicate sourceProductCode in interpretation input")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=Path("/tmp/skincare101-interpretation-sql"))
    parser.add_argument("--batch-size", type=int, default=25)
    args = parser.parse_args()
    payload = json.loads(args.input.read_text(encoding="utf-8"))
    items = payload["products"] if isinstance(payload, dict) else payload
    validate(items)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for index in range(0, len(items), args.batch_size):
        batch = items[index:index + args.batch_size]
        encoded = json.dumps(batch, ensure_ascii=False, separators=(",", ":"))
        path = args.output_dir / f"batch_{index // args.batch_size + 1:02d}.sql"
        path.write_text(SQL_TEMPLATE.format(payload=encoded), encoding="utf-8")
        print(path)


if __name__ == "__main__":
    main()
