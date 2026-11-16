-- Bento Visual Design Studio: one shared row for global tokens, page overrides and drafts.
create table if not exists public.bento_design_settings (
  id text primary key default 'global' check (id = 'global'),
  draft jsonb,
  published jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.bento_design_settings enable row level security;
drop policy if exists "Published Bento design is readable" on public.bento_design_settings;
drop policy if exists "Authenticated users can read Bento design settings" on public.bento_design_settings;
create policy "Published Bento design is readable" on public.bento_design_settings
  for select to anon using (published is not null);
create policy "Authenticated users can read Bento design settings" on public.bento_design_settings
  for select to authenticated using (true);
drop policy if exists "Bento admins manage design settings" on public.bento_design_settings;
create policy "Bento admins manage design settings" on public.bento_design_settings
  for all to authenticated
  using (
    auth.jwt() ->> 'email' in ('kshitiz2007@gmail.com','admin@civilprep.in')
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    auth.jwt() ->> 'email' in ('kshitiz2007@gmail.com','admin@civilprep.in')
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
revoke all on public.bento_design_settings from anon, authenticated;
grant select (id, published) on public.bento_design_settings to anon;
grant select on public.bento_design_settings to authenticated;
grant insert, update on public.bento_design_settings to authenticated;
