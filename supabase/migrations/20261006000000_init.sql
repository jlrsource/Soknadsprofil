-- SøknadsProfil: grunnskjema
-- Alle tabeller eies av en bruker og beskyttes med RLS (user_id = auth.uid()).

create extension if not exists "pgcrypto";

-- Felles trigger for updated_at
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  user_id      uuid primary key references auth.users on delete cascade,
  first_name   text,
  last_name    text,
  email        text,
  phone        text,
  address      text,
  postal_code  text,
  city         text,
  country      text,
  birth_date   date,
  linkedin_url text,
  website_url  text,
  github_url   text,
  headline     text,
  summary      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Opprett profilrad automatisk når en bruker registrerer seg
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email) values (new.id, new.email)
  on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- listeseksjoner
create table public.experiences (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  employer    text not null,
  title       text not null,
  location    text,
  start_date  date,
  end_date    date,
  is_current  boolean not null default false,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.educations (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users on delete cascade,
  school         text not null,
  degree         text,
  field_of_study text,
  start_date     date,
  end_date       date,
  grade          text,
  description    text,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.certifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  name        text not null,
  issuer      text,
  issued_date date,
  url         text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.skills (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null,
  level      text check (level in ('beginner', 'intermediate', 'advanced', 'expert')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.languages (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  language      text not null,
  spoken_level  text check (spoken_level in ('basic', 'conversational', 'fluent', 'native')),
  written_level text check (written_level in ('basic', 'conversational', 'fluent', 'native')),
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public."references" (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null,
  role       text,
  company    text,
  phone      text,
  email      text,
  relation   text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_answers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  question   text not null,
  answer     text not null,
  tags       text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  type         text not null check (type in ('cv', 'cover_letter', 'diploma', 'other')),
  file_name    text not null,
  storage_path text not null unique,
  mime_type    text,
  size_bytes   bigint,
  is_default   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Maks ett standarddokument per type per bruker
create unique index documents_one_default_per_type
  on public.documents (user_id, type) where is_default;

-- ---------------------------------------------------------------- indekser, triggere og RLS
do $$
declare t text;
begin
  foreach t in array array['profiles', 'experiences', 'educations', 'certifications', 'skills',
                           'languages', 'references', 'saved_answers', 'documents']
  loop
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "eier kan lese" on public.%I for select using (user_id = auth.uid())', t);
    execute format('create policy "eier kan opprette" on public.%I for insert with check (user_id = auth.uid())', t);
    execute format('create policy "eier kan endre" on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy "eier kan slette" on public.%I for delete using (user_id = auth.uid())', t);
    if t <> 'profiles' then
      execute format('create index %I on public.%I (user_id)', t || '_user_id_idx', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------- hele profilen som én JSON
-- Brukes av Chrome-extensionen. security invoker → RLS gjelder.
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

grant execute on function public.get_full_profile() to authenticated;

-- ---------------------------------------------------------------- lagring av dokumenter
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 10485760) -- 10 MB
on conflict (id) do nothing;

-- Filer ligger under documents/{user_id}/...
create policy "eier kan lese egne filer" on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "eier kan laste opp egne filer" on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "eier kan endre egne filer" on storage.objects for update
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "eier kan slette egne filer" on storage.objects for delete
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
