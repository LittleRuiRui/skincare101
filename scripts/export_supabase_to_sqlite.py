"""Export the public, approved Supabase catalog to an offline SQLite database."""

from __future__ import annotations

import json
import os
import sqlite3
import sys
import urllib.parse
import urllib.request
from pathlib import Path


PROJECT_URL = os.environ.get("SUPABASE_URL", "https://tepiqcwytynhrjhtvnws.supabase.co").rstrip("/")
PUBLISHABLE_KEY = os.environ.get(
    "SUPABASE_PUBLISHABLE_KEY",
    "sb_publishable_J9GjGc-hNTEvpl-MTyRAiw__JuISs-T",
)
REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = Path(os.environ.get("SQLITE_OUTPUT", REPO_ROOT / "data" / "skincare.db")).resolve()


def fetch_catalog() -> list[dict]:
    columns = (
        "id,brand,name,category,market,source_url,formula_id,ingredient_names,"
        "ingredient_list_type,data_completeness,verified_at"
    )
    query = urllib.parse.urlencode({"select": columns, "order": "brand.asc,name.asc"})
    request = urllib.request.Request(
        f"{PROJECT_URL}/rest/v1/approved_product_catalog?{query}",
        headers={
            "apikey": PUBLISHABLE_KEY,
            "Authorization": f"Bearer {PUBLISHABLE_KEY}",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def write_sqlite(rows: list[dict]) -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = OUTPUT_PATH.with_suffix(".tmp")
    if temporary_path.exists():
        temporary_path.unlink()

    connection = sqlite3.connect(temporary_path)
    try:
        connection.executescript(
            """
            pragma foreign_keys = on;

            create table metadata (
              key text primary key,
              value text not null
            );

            create table products (
              id text primary key,
              brand text not null,
              name text not null,
              category text not null,
              market text not null,
              source_url text
            );

            create table formulas (
              id text primary key,
              product_id text not null references products(id) on delete cascade,
              ingredient_list_type text not null,
              data_completeness integer not null check (data_completeness between 0 and 100),
              verified_at text
            );

            create table formula_ingredients (
              formula_id text not null references formulas(id) on delete cascade,
              position integer not null,
              ingredient_name text not null,
              primary key (formula_id, position)
            );

            create index formulas_product_id_idx on formulas(product_id);
            create index formula_ingredients_name_idx on formula_ingredients(ingredient_name);
            """
        )
        connection.execute(
            "insert into metadata(key, value) values('source', ?)",
            (f"{PROJECT_URL}/rest/v1/approved_product_catalog",),
        )
        connection.execute(
            "insert into metadata(key, value) values('product_count', ?)",
            (str(len(rows)),),
        )

        for row in rows:
            connection.execute(
                """insert into products(id, brand, name, category, market, source_url)
                   values(?, ?, ?, ?, ?, ?)""",
                (
                    row["id"],
                    row["brand"],
                    row["name"],
                    row.get("category") or "其他",
                    row.get("market") or "global",
                    row.get("source_url"),
                ),
            )
            connection.execute(
                """insert into formulas(id, product_id, ingredient_list_type, data_completeness, verified_at)
                   values(?, ?, ?, ?, ?)""",
                (
                    row["formula_id"],
                    row["id"],
                    row.get("ingredient_list_type") or "partial",
                    row.get("data_completeness") or 0,
                    row.get("verified_at"),
                ),
            )
            connection.executemany(
                "insert into formula_ingredients(formula_id, position, ingredient_name) values(?, ?, ?)",
                [
                    (row["formula_id"], position, ingredient)
                    for position, ingredient in enumerate(row.get("ingredient_names") or [], start=1)
                ],
            )

        connection.commit()
    finally:
        connection.close()

    temporary_path.replace(OUTPUT_PATH)


def main() -> int:
    try:
        rows = fetch_catalog()
        write_sqlite(rows)
    except Exception as exc:  # concise CLI error without leaking credentials
        print(f"SQLite export failed: {exc}", file=sys.stderr)
        return 1

    print(f"Exported {len(rows)} approved products to {OUTPUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
