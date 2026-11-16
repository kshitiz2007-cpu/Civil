-- Design System Studio persistence.
-- Apply this migration in the Supabase SQL editor before enabling shared publishing.
create table if not exists public.design_studio_config (
  id text primary key check (id = 'global'),
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.design_studio_config enable row level security;

drop policy if exists "Design tokens are readable by app visitors" on public.design_studio_config;
create policy "Design tokens are readable by app visitors"
  on public.design_studio_config for select using (true);

drop policy if exists "Only admins can publish design tokens" on public.design_studio_config;
create policy "Only admins can publish design tokens"
  on public.design_studio_config for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or (auth.jwt() ->> 'email') in ('kshitiz2007@gmail.com', 'admin@civilprep.in')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or (auth.jwt() ->> 'email') in ('kshitiz2007@gmail.com', 'admin@civilprep.in')
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('design-assets', 'design-assets', true, 10485760, array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml'])
on conflict (id) do nothing;

drop policy if exists "Admins upload design assets" on storage.objects;
create policy "Admins upload design assets" on storage.objects for insert to authenticated
with check (
  bucket_id = 'design-assets' and (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or (auth.jwt() ->> 'email') in ('kshitiz2007@gmail.com', 'admin@civilprep.in')
  )
);
drop policy if exists "Public reads design assets" on storage.objects;
create policy "Public reads design assets" on storage.objects for select
using (bucket_id = 'design-assets');
drop policy if exists "Admins delete design assets" on storage.objects;
create policy "Admins delete design assets" on storage.objects for delete to authenticated
using (
  bucket_id = 'design-assets' and (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or (auth.jwt() ->> 'email') in ('kshitiz2007@gmail.com', 'admin@civilprep.in')
  )
);
