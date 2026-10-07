-- Verv og frivillig arbeid. Trygg å kjøre flere ganger.

create table if not exists public.volunteering (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  organization text not null,
  role         text not null,
  location     text,
  start_date   date,
  end_date     date,
  is_current   boolean not null default false,
  description  text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists volunteering_user_id_idx on public.volunteering (user_id);
drop trigger if exists set_updated_at on public.volunteering;
create trigger set_updated_at before update on public.volunteering
  for each row execute function public.set_updated_at();

alter table public.volunteering enable row level security;
drop policy if exists "eier kan lese" on public.volunteering;
create policy "eier kan lese" on public.volunteering for select using (user_id = auth.uid());
drop policy if exists "eier kan opprette" on public.volunteering;
create policy "eier kan opprette" on public.volunteering for insert with check (user_id = auth.uid());
drop policy if exists "eier kan endre" on public.volunteering;
create policy "eier kan endre" on public.volunteering for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "eier kan slette" on public.volunteering;
create policy "eier kan slette" on public.volunteering for delete using (user_id = auth.uid());

-- Ta med verv i hele profilen
create or replace function public.get_full_profile() returns jsonb
language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'personal', (select to_jsonb(p) - 'user_id' - 'created_at' - 'updated_at'
                 from profiles p where p.user_id = auth.uid()),
    'experiences', coalesce((select jsonb_agg(to_jsonb(x) - 'user_id' - 'created_at' - 'updated_at'
                             order by x.sort_order, x.start_date desc nulls last)
                             from experiences x where x.user_id = auth.uid()), '[]'),
    'educations', coalesce((select jsonb_agg(to_jsonb(x) - 'user_id' - 'created_at' - 'updated_at'
                            order by x.sort_order, x.start_date desc nulls last)
                            from educations x where x.user_id = auth.uid()), '[]'),
    'volunteering', coalesce((select jsonb_agg(to_jsonb(x) - 'user_id' - 'created_at' - 'updated_at'
                              order by x.sort_order, x.start_date desc nulls last)
                              from volunteering x where x.user_id = auth.uid()), '[]'),
    'certifications', coalesce((select jsonb_agg(to_jsonb(x) - 'user_id' - 'created_at' - 'updated_at'
                                order by x.sort_order)
                                from certifications x where x.user_id = auth.uid()), '[]'),
    'skills', coalesce((select jsonb_agg(to_jsonb(x) - 'user_id' - 'created_at' - 'updated_at'
                        order by x.sort_order)
                        from skills x where x.user_id = auth.uid()), '[]'),
    'languages', coalesce((select jsonb_agg(to_jsonb(x) - 'user_id' - 'created_at' - 'updated_at'
                           order by x.sort_order)
                           from languages x where x.user_id = auth.uid()), '[]'),
    'references', coalesce((select jsonb_agg(to_jsonb(x) - 'user_id' - 'created_at' - 'updated_at'
                            order by x.sort_order)
                            from "references" x where x.user_id = auth.uid()), '[]'),
    'saved_answers', coalesce((select jsonb_agg(to_jsonb(x) - 'user_id' - 'created_at' - 'updated_at'
                               order by x.created_at)
                               from saved_answers x where x.user_id = auth.uid()), '[]'),
    'documents', coalesce((select jsonb_agg(to_jsonb(x) - 'user_id' - 'updated_at'
                           order by x.created_at desc)
                           from documents x where x.user_id = auth.uid()), '[]')
  );
$$;
