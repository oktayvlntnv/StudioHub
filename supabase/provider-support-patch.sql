-- StudioHub official provider support patch.
-- Safe to run on an existing StudioHub Private database.

alter table public.providers
  add column if not exists slug text,
  add column if not exists default_playback_type text not null default 'external_link',
  add column if not exists default_access_type text not null default 'unknown',
  add column if not exists is_enabled boolean not null default true,
  add column if not exists notes text;

update public.providers
set slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
where slug is null or slug = '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'providers_default_playback_type_check'
  ) then
    alter table public.providers
      add constraint providers_default_playback_type_check
      check (default_playback_type in ('external_link', 'youtube_embed', 'official_embed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'providers_default_access_type_check'
  ) then
    alter table public.providers
      add constraint providers_default_access_type_check
      check (default_access_type in ('no_login_required', 'optional_login', 'login_required', 'unknown'));
  end if;
end $$;

create unique index if not exists providers_slug_unique
on public.providers (slug);

alter table public.providers
  alter column slug set not null;

alter table public.media_provider_links
  add column if not exists notes text;

notify pgrst, 'reload schema';
