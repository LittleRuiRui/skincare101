-- The unique constraint on user_id already provides the index needed by owner lookups.
drop index if exists public.skin_profiles_user_id_idx;
