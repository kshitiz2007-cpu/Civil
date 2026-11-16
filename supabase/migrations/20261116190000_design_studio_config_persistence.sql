-- Shared Design Studio configuration.
-- Admin drafts remain browser-local; this table stores the published snapshot.
create table if not exists public.design_studio_config (
  id text primary key,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.design_studio_config enable row level security;

grant select on public.design_studio_config to anon, authenticated;
grant insert, update on public.design_studio_config to authenticated;

drop policy if exists "Published design config is readable by everyone" on public.design_studio_config;
create policy "Published design config is readable by everyone"
  on public.design_studio_config
  for select
  to anon, authenticated
  using (id = 'global');

drop policy if exists "Only admins can publish design config" on public.design_studio_config;
create policy "Only admins can publish design config"
  on public.design_studio_config
  for insert
  to authenticated
  with check (
    id = 'global'
    and (
      exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and lower(coalesce(p.role, '')) = 'admin'
      )
      or lower(coalesce((select auth.jwt()) ->> 'email', '')) in (
        'kshitiz2007@gmail.com',
        'admin@civilprep.in'
      )
    )
  );

drop policy if exists "Only admins can update design config" on public.design_studio_config;
create policy "Only admins can update design config"
  on public.design_studio_config
  for update
  to authenticated
  using (
    id = 'global'
    and (
      exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and lower(coalesce(p.role, '')) = 'admin'
      )
      or lower(coalesce((select auth.jwt()) ->> 'email', '')) in (
        'kshitiz2007@gmail.com',
        'admin@civilprep.in'
      )
    )
  )
  with check (
    id = 'global'
    and (
      exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and lower(coalesce(p.role, '')) = 'admin'
      )
      or lower(coalesce((select auth.jwt()) ->> 'email', '')) in (
        'kshitiz2007@gmail.com',
        'admin@civilprep.in'
      )
    )
  );

create or replace function public.set_design_studio_config_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists design_studio_config_updated_at on public.design_studio_config;
create trigger design_studio_config_updated_at
  before update on public.design_studio_config
  for each row execute function public.set_design_studio_config_updated_at();
