-- Logg over CV-importer med AI, brukt til å begrense hvor mange hver bruker kan kjøre per døgn.

create table public.cv_import_usage (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  document_id uuid references public.documents on delete set null,
  created_at  timestamptz not null default now()
);

create index cv_import_usage_user_time_idx on public.cv_import_usage (user_id, created_at desc);

-- Brukere kan se sin egen bruk, men ikke endre eller slette den.
-- Kun serveren (secret key) skriver hit, via claim_cv_import().
alter table public.cv_import_usage enable row level security;
create policy "eier kan lese" on public.cv_import_usage for select using (user_id = auth.uid());

-- Reserverer én import hvis brukeren er under grensen siste 24 timer.
-- Returnerer { allowed, usage_id, remaining, reset_at }.
create or replace function public.claim_cv_import(p_user_id uuid, p_document_id uuid, p_limit int)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  used      int;
  oldest    timestamptz;
  new_id    uuid;
begin
  -- Lås per bruker, så to samtidige forespørsler ikke begge slipper gjennom.
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  select count(*), min(created_at) into used, oldest
  from cv_import_usage
  where user_id = p_user_id and created_at > now() - interval '24 hours';

  if used >= p_limit then
    return jsonb_build_object('allowed', false, 'usage_id', null, 'remaining', 0,
                              'reset_at', oldest + interval '24 hours');
  end if;

  insert into cv_import_usage (user_id, document_id) values (p_user_id, p_document_id)
  returning id into new_id;

  return jsonb_build_object('allowed', true, 'usage_id', new_id, 'remaining', p_limit - used - 1,
                            'reset_at', coalesce(oldest, now()) + interval '24 hours');
end $$;

-- Bare serveren får kalle funksjonen. Ellers kunne brukere sendt inn en egen grense.
revoke execute on function public.claim_cv_import(uuid, uuid, int) from public, anon, authenticated;
grant execute on function public.claim_cv_import(uuid, uuid, int) to service_role;
