-- Keep candidate provenance for review, but remove unverified open-data products
-- and formula-equivalent refill SKUs from the public catalog.
update public.products
set archived_at = now(), updated_at = now()
where archived_at is null and (
  source_product_code like 'obf-%'
  or source_product_code = 'official-sg-chanel-sublimage-la-creme-texture-fine-recharge'
);
