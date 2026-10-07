-- Sted (by) for utdanning, så extensionen kan svare på «Hvilken by studerer du i?».
-- get_full_profile() bruker to_jsonb(rad), så den nye kolonnen kommer med automatisk.
alter table public.educations add column if not exists location text;
