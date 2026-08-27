alter table public.products
  add column if not exists main_category text,
  add column if not exists product_subtype text;

comment on column public.products.main_category is
  'User-facing normalized product type: Moisturizer / Cream, Serum, Eye Care, Cleanser / Makeup Remover, Toner / Essence, Sunscreen, Mask, Lip Care, or Special Treatment.';
comment on column public.products.product_subtype is
  'Optional finer dosage-form/type such as cream, lotion, gel cream, cleansing oil, micellar water, peel, acne gel, eye serum, etc.';

update public.products
set main_category = case
  when category in ('乳液 / 面霜','面霜','乳液','润色面霜','晚霜','身体乳','颈霜','手部护理') then 'Moisturizer / Cream'
  when category in ('精华','精华油','护理精华','安瓶','面部油') then 'Serum'
  when category in ('眼霜','眼部','眼部精华','眼膜','眼部护理','眼唇护理') then 'Eye Care'
  when category in ('洁面','卸妆') then 'Cleanser / Makeup Remover'
  when category in ('化妆水','精华水','爽肤水','喷雾') then 'Toner / Essence'
  when category = '防晒' then 'Sunscreen'
  when category in ('面膜','清洁面膜') then 'Mask'
  when category = '唇部护理' then 'Lip Care'
  when category in ('焕肤','祛痘','去角质','局部护理') then 'Special Treatment'
  else 'Special Treatment'
end
where archived_at is null;

update public.products
set product_subtype = case
  when category='乳液' then 'lotion'
  when category='面霜' then 'cream'
  when category='乳液 / 面霜' then 'moisturizer'
  when category='润色面霜' then 'tinted cream'
  when category='晚霜' then 'night cream'
  when category='身体乳' then 'body lotion'
  when category='颈霜' then 'neck cream'
  when category='手部护理' then 'hand cream'
  when category='精华' then 'serum'
  when category in ('精华油','面部油') then 'facial oil / oil serum'
  when category='护理精华' then 'treatment serum'
  when category='安瓶' then 'ampoule'
  when category='眼霜' then 'eye cream'
  when category='眼部精华' then 'eye serum'
  when category='眼膜' then 'eye mask'
  when category in ('眼部','眼部护理','眼唇护理') then 'eye care'
  when category='洁面' then 'cleanser'
  when category='卸妆' then 'makeup remover'
  when category in ('化妆水','爽肤水') then 'toner'
  when category='精华水' then 'essence'
  when category='喷雾' then 'mist'
  when category='防晒' then 'sunscreen'
  when category='面膜' then 'mask'
  when category='清洁面膜' then 'cleansing mask'
  when category='唇部护理' then 'lip care'
  when category in ('焕肤','去角质') then 'exfoliating treatment'
  when category='祛痘' then 'acne treatment'
  when category='局部护理' then 'spot treatment'
  else lower(coalesce(category,'special treatment'))
end
where archived_at is null;
