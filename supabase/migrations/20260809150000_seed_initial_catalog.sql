do $seed$
declare
  v_record jsonb;
  v_product_id uuid;
  v_formula_id uuid;
  v_ingredients text[];
  v_ingredient text;
  v_ingredient_id bigint;
  v_position smallint;
begin
  for v_record in
    select value from jsonb_array_elements($catalog$
    [
      {"brand":"La Roche-Posay","name":"Toleriane Double Repair Face Moisturizer","category":"乳霜","ingredients":["Aqua / Water / Eau","Glycerin","Squalane","Dimethicone","Zea Mays Starch / Corn Starch","Niacinamide","Ammonium Polyacryloyldimethyl Taurate","Myristyl Myristate","Stearic Acid","Ceramide NP","Potassium Cetyl Phosphate","Glyceryl Stearate SE","Sodium Hydroxide","Myristic Acid","Palmitic Acid","Capryloyl Glycine","Caprylyl Glycol","Xanthan Gum"],"listType":"full","completeness":100,"sourceUrl":"https://www.laroche-posay.us/our-products/face/face-moisturizer/toleriane-double-repair-face-moisturizer-tolerianedoublerepair.html","verifiedAt":"2026-08-08"},
      {"brand":"CeraVe","name":"PM Facial Moisturizing Lotion","category":"乳霜","ingredients":["甘油 (Glycerin)","烟酰胺 (Niacinamide)","透明质酸钠 (Sodium Hyaluronate)","神经酰胺 (Ceramide NP)","胆固醇/谷甾醇 (Beta-Sitosterol)","植物鞘氨醇 (Phytosphingosine)"],"listType":"partial","completeness":45,"sourceUrl":"https://www.cerave.com/en-us/skincare/moisturizers/pm-facial-moisturizing-lotion","verifiedAt":"2026-08-08"},
      {"brand":"Vanicream","name":"Daily Facial Moisturizer","category":"乳霜","ingredients":["透明质酸钠 (Sodium Hyaluronate)","神经酰胺 (Ceramide NP)","角鲨烷 (Squalane)","甘油 (Glycerin)"],"listType":"partial","completeness":40,"sourceUrl":"https://www.vanicream.com/product/vanicream-daily-facial-moisturizer","verifiedAt":"2026-08-08"},
      {"brand":"Aveeno","name":"Calm + Restore Oat Gel Moisturizer","category":"乳霜","ingredients":["甘油 (Glycerin)","燕麦仁提取物 (Avena Sativa/Oat Kernel Extract)","1,2-己二醇/辛甘醇 (1,2-Hexanediol/Caprylyl Glycol)","硅油类 (Dimethicone)"],"listType":"partial","completeness":35,"sourceUrl":"https://www.aveeno.com/products/calm-restore-oat-gel-moisturizer-sensitive-skin","verifiedAt":"2026-08-08"},
      {"brand":"The Ordinary","name":"Niacinamide 10% + Zinc 1%","category":"精华","ingredients":["Aqua (Water)","Niacinamide","Pentylene Glycol","Zinc PCA","Dimethyl Isosorbide","Tamarindus Indica Seed Gum","Xanthan Gum","Isoceteth-20","Ethoxydiglycol","Phenoxyethanol","Chlorphenesin"],"listType":"full","completeness":100,"sourceUrl":"https://theordinary.com/en-us/niacinamide-10-zinc-1-serum-100436.html","verifiedAt":"2026-08-08"},
      {"brand":"Paula's Choice","name":"Skin Perfecting 2% BHA Liquid Exfoliant","category":"焕肤","ingredients":["水","水杨酸 (BHA)","绿茶提取物 (Camellia Sinensis Leaf Extract)","丁二醇 (Butylene Glycol)"],"listType":"partial","completeness":50,"sourceUrl":"https://www.paulaschoice.com/skin-perfecting-2pct-bha-liquid-exfoliant/201.html","verifiedAt":"2026-08-08"},
      {"brand":"CeraVe","name":"SA Cream for Rough & Bumpy Skin","category":"焕肤","ingredients":["水杨酸 (BHA)","果酸 (Glycolic/Lactic/Mandelic Acid)","透明质酸钠 (Sodium Hyaluronate)","烟酰胺 (Niacinamide)","神经酰胺 (Ceramide NP)"],"listType":"partial","completeness":45,"sourceUrl":"https://www.cerave.com/en-us/skincare/moisturizers/sa-cream-for-rough-and-bumpy-skin","verifiedAt":"2026-08-08"},
      {"brand":"Eucerin","name":"Clear Skin SPF 50 Face Sunscreen","category":"防晒","ingredients":["阿伏苯宗/奥克立林等 (化学防晒剂)","生育酚/维E (Tocopherol/Tocopheryl Acetate)","甘草酸二钾/甘草根提取物 (Glycyrrhiza Glabra)","硅油类 (Dimethicone)"],"listType":"partial","completeness":45,"sourceUrl":"https://www.eucerinus.com/products/sun-protection/clear-skin-spf-50-face-sunscreen","verifiedAt":"2026-08-08"}
    ]
    $catalog$::jsonb)
  loop
    select array_agg(value order by ordinality) into v_ingredients
    from jsonb_array_elements_text(v_record -> 'ingredients') with ordinality;

    select id into v_product_id from public.products
    where lower(brand) = lower(v_record ->> 'brand')
      and lower(name) = lower(v_record ->> 'name')
      and market = 'global' and archived_at is null limit 1;

    if v_product_id is null then
      insert into public.products (brand, name, category, market, source_url)
      values (v_record ->> 'brand', v_record ->> 'name', v_record ->> 'category',
        'global', v_record ->> 'sourceUrl') returning id into v_product_id;
    end if;

    update public.product_formulas set is_current = false, updated_at = now()
    where product_id = v_product_id and market = 'global' and is_current;

    insert into public.product_formulas (
      product_id, market, raw_ingredients, ingredient_names, ingredient_list_type,
      data_completeness, source_url, verified_at
    ) values (
      v_product_id, 'global', array_to_string(v_ingredients, ', '), v_ingredients,
      v_record ->> 'listType', (v_record ->> 'completeness')::smallint,
      v_record ->> 'sourceUrl', (v_record ->> 'verifiedAt')::date
    ) returning id into v_formula_id;

    v_position := 0;
    foreach v_ingredient in array v_ingredients loop
      v_position := v_position + 1;
      insert into public.ingredients (inci_name, normalized_name)
      values (v_ingredient, regexp_replace(lower(v_ingredient), '[[:space:][:punct:]]+', '', 'g'))
      on conflict (normalized_name) do update set updated_at = now()
      returning id into v_ingredient_id;
      insert into public.formula_ingredients (formula_id, position, ingredient_id, raw_name)
      values (v_formula_id, v_position, v_ingredient_id, v_ingredient);
    end loop;
  end loop;
end;
$seed$;

create or replace function public.approve_product_submission(p_submission_id uuid, p_source_url text default null)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_submission public.product_submissions%rowtype;
  v_product_id uuid;
  v_formula_id uuid;
  v_ingredient_names text[];
  v_name text;
  v_ingredient_id bigint;
  v_position smallint := 0;
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') <> 'reviewer' then
    raise exception 'Reviewer access required';
  end if;
  select * into v_submission from public.product_submissions
  where id = p_submission_id and status in ('pending', 'reviewing') for update;
  if not found then raise exception 'Pending submission not found'; end if;
  select array_agg(value order by ordinality) into v_ingredient_names
  from jsonb_array_elements_text(v_submission.parsed_ingredients) with ordinality;
  if coalesce(array_length(v_ingredient_names, 1), 0) = 0 then
    raise exception 'Submission has no normalized ingredients';
  end if;
  select id into v_product_id from public.products
  where lower(brand) = lower(v_submission.brand)
    and lower(name) = lower(v_submission.product_name)
    and market = v_submission.market and archived_at is null limit 1;
  if v_product_id is null then
    insert into public.products (brand, name, category, market, source_url, created_by)
    values (trim(v_submission.brand), trim(v_submission.product_name), v_submission.category,
      v_submission.market, p_source_url, (select auth.uid())) returning id into v_product_id;
  else
    update public.products set category = v_submission.category,
      source_url = coalesce(p_source_url, source_url), updated_at = now() where id = v_product_id;
  end if;
  update public.product_formulas set is_current = false, updated_at = now()
  where product_id = v_product_id and market = v_submission.market and is_current;
  insert into public.product_formulas (
    product_id, market, raw_ingredients, ingredient_names, ingredient_list_type,
    data_completeness, source_url, verified_at, created_by
  ) values (
    v_product_id, v_submission.market, v_submission.raw_ingredients, v_ingredient_names,
    case when v_submission.data_completeness >= 85 then 'full' else 'partial' end,
    v_submission.data_completeness, p_source_url, current_date, (select auth.uid())
  ) returning id into v_formula_id;
  for v_name in select value from jsonb_array_elements_text(v_submission.parsed_ingredients) loop
    v_position := v_position + 1;
    insert into public.ingredients (inci_name, normalized_name)
    values (v_name, regexp_replace(lower(v_name), '[[:space:][:punct:]]+', '', 'g'))
    on conflict (normalized_name) do update set updated_at = now()
    returning id into v_ingredient_id;
    insert into public.formula_ingredients (formula_id, position, ingredient_id, raw_name)
    values (v_formula_id, v_position, v_ingredient_id, v_name);
  end loop;
  update public.product_submissions set status = 'approved', reviewer_id = (select auth.uid()),
    reviewed_at = now(), updated_at = now() where id = p_submission_id;
  insert into public.review_events (submission_id, reviewer_id, action, public_message)
  values (p_submission_id, (select auth.uid()), 'approved', '投稿已审核并加入共享产品数据库。');
  return v_product_id;
end;
$$;
