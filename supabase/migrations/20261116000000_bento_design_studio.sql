-- Bento Visual Design Studio: persisted drafts, published designs, and revision history.
create table if not exists public.bento_design_settings (
  id text primary key default 'global' check (id = 'global'),
  draft jsonb,
  published jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.bento_design_revisions (
  id bigint generated always as identity primary key,
  settings_id text not null default 'global'
    references public.bento_design_settings(id) on delete cascade,
  design jsonb not null,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

alter table public.bento_design_settings enable row level security;
alter table public.bento_design_revisions enable row level security;

drop policy if exists "Published Bento design is readable" on public.bento_design_settings;
drop policy if exists "Authenticated users can read Bento design settings" on public.bento_design_settings;
create policy "Published Bento design is readable"
  on public.bento_design_settings for select
  to anon using (published is not null);
create policy "Authenticated users can read Bento design settings"
  on public.bento_design_settings for select
  to authenticated using (true);

drop policy if exists "Bento admins manage design settings" on public.bento_design_settings;
create policy "Bento admins manage design settings"
  on public.bento_design_settings for all
  to authenticated
  using (
    (auth.jwt() ->> 'email') in ('kshitiz2007@gmail.com', 'admin@civilprep.in')
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    (auth.jwt() ->> 'email') in ('kshitiz2007@gmail.com', 'admin@civilprep.in')
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Bento admins manage design revisions" on public.bento_design_revisions;
create policy "Bento admins manage design revisions"
  on public.bento_design_revisions for all
  to authenticated
  using (
    (auth.jwt() ->> 'email') in ('kshitiz2007@gmail.com', 'admin@civilprep.in')
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    (auth.jwt() ->> 'email') in ('kshitiz2007@gmail.com', 'admin@civilprep.in')
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

revoke all on public.bento_design_settings from anon, authenticated;
revoke all on public.bento_design_revisions from anon, authenticated;
grant select (id, published) on public.bento_design_settings to anon;
grant select on public.bento_design_settings to authenticated;
grant insert, update on public.bento_design_settings to authenticated;
grant select, insert, delete on public.bento_design_revisions to authenticated;
grant usage, select on sequence public.bento_design_revisions_id_seq to authenticated;


-- Shared component library and asset metadata.
create table if not exists public.bento_design_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  path text not null unique,
  public_url text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
alter table public.bento_design_assets enable row level security;
revoke all on public.bento_design_assets from anon, authenticated;
grant select on public.bento_design_assets to authenticated;
grant insert, update, delete on public.bento_design_assets to authenticated;
drop policy if exists "Bento admins manage design assets" on public.bento_design_assets;
create policy "Bento admins manage design assets" on public.bento_design_assets
  for all to authenticated
  using (
    (auth.jwt() ->> 'email') in ('kshitiz2007@gmail.com', 'admin@civilprep.in')
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    (auth.jwt() ->> 'email') in ('kshitiz2007@gmail.com', 'admin@civilprep.in')
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bento-design-assets', 'bento-design-assets', true, 10485760,
  array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 10485760;

drop policy if exists "Public can view Bento design assets" on storage.objects;
create policy "Public can view Bento design assets" on storage.objects
  for select to anon, authenticated using (bucket_id = 'bento-design-assets');
drop policy if exists "Bento admins upload design assets" on storage.objects;
create policy "Bento admins upload design assets" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'bento-design-assets' and (
      (auth.jwt() ->> 'email') in ('kshitiz2007@gmail.com', 'admin@civilprep.in')
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    )
  );
drop policy if exists "Bento admins update design assets" on storage.objects;
create policy "Bento admins update design assets" on storage.objects
  for update to authenticated using (
    bucket_id = 'bento-design-assets' and (
      (auth.jwt() ->> 'email') in ('kshitiz2007@gmail.com', 'admin@civilprep.in')
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    )
  ) with check (bucket_id = 'bento-design-assets');
drop policy if exists "Bento admins delete design assets" on storage.objects;
create policy "Bento admins delete design assets" on storage.objects
  for delete to authenticated using (
    bucket_id = 'bento-design-assets' and (
      (auth.jwt() ->> 'email') in ('kshitiz2007@gmail.com', 'admin@civilprep.in')
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    )
  );
