-- StudioHub Private schema
-- Run this in the Supabase SQL editor before enabling the production app.

create extension if not exists "pgcrypto";

create schema if not exists app_private;

revoke all on schema app_private from public;

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  preferred_languages text[] not null default '{}',
  preferred_countries text[] not null default '{}',
  preferred_sources uuid[] not null default '{}',
  preferred_categories text[] not null default '{}',
  default_playback_preference text not null default 'in_app' check (default_playback_preference in ('in_app', 'official_provider')),
  hide_unknown_access boolean not null default true,
  hide_unconfirmed_sources boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists one_owner_profile
on public.profiles ((role))
where role = 'owner';

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  website_url text,
  logo_url text,
  provider_type text not null check (
    provider_type in (
      'official_provider',
      'free_avod',
      'free_live_tv',
      'public_broadcaster',
      'youtube'
    )
  ),
  default_playback_type text not null default 'external_link' check (
    default_playback_type in ('external_link', 'youtube_embed', 'official_embed')
  ),
  default_access_type text not null default 'unknown' check (
    default_access_type in ('no_login_required', 'optional_login', 'login_required', 'unknown')
  ),
  country_availability text[] not null default '{}',
  is_enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.iptv_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null check (source_type in ('m3u_url', 'm3u_file', 'xtream', 'xmltv_epg')),
  provider_id uuid references public.providers(id) on delete set null,
  base_url text,
  username_encrypted text,
  password_encrypted text,
  source_url text,
  epg_url text,
  is_legal_confirmed boolean not null default false,
  is_enabled boolean not null default false,
  notes text,
  country text,
  provider_website text,
  legal_contact_info text,
  last_imported_at timestamptz,
  last_tested_at timestamptz,
  last_status text not null default 'unknown' check (last_status in ('unknown', 'success', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  original_title text,
  overview text,
  poster_path text,
  backdrop_path text,
  release_date date,
  runtime integer,
  number_of_seasons integer,
  genres text[] not null default '{}',
  original_language text,
  origin_country text[] not null default '{}',
  popularity numeric not null default 0,
  vote_average numeric not null default 0,
  source_type text not null check (
    source_type in ('official_provider', 'youtube', 'public_domain', 'm3u', 'xtream', 'manual', 'other_legal')
  ),
  iptv_source_id uuid references public.iptv_sources(id) on delete set null,
  xtream_stream_id text,
  xtream_category_id text,
  import_status text not null default 'pending_review' check (import_status in ('pending_review', 'approved', 'rejected')),
  legal_review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_provider_links (
  id uuid primary key default gen_random_uuid(),
  media_item_id uuid not null references public.media_items(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,
  iptv_source_id uuid references public.iptv_sources(id) on delete set null,
  watch_url text,
  playback_type text not null check (
    playback_type in (
      'youtube_embed',
      'official_embed',
      'external_link',
      'public_domain_video',
      'official_live_stream',
      'm3u_stream',
      'xtream_stream'
    )
  ),
  access_type text not null default 'unknown' check (
    access_type in ('no_login_required', 'optional_login', 'login_required', 'owner_credentials_required', 'unknown')
  ),
  source_type text not null check (
    source_type in ('official_provider', 'youtube', 'public_domain', 'm3u', 'xtream', 'manual', 'other_legal')
  ),
  youtube_video_id text,
  embed_url text,
  video_url text,
  stream_url text,
  xtream_stream_id text,
  is_free boolean not null default false,
  is_legal_confirmed boolean not null default false,
  availability_country text[] not null default '{}',
  notes text,
  expires_at timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.live_channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  category text,
  country text,
  language text,
  provider_id uuid references public.providers(id) on delete set null,
  iptv_source_id uuid references public.iptv_sources(id) on delete set null,
  watch_url text,
  playback_type text not null check (
    playback_type in ('official_embed', 'external_link', 'official_live_stream', 'm3u_stream', 'xtream_stream')
  ),
  access_type text not null default 'unknown' check (
    access_type in ('no_login_required', 'optional_login', 'login_required', 'owner_credentials_required', 'unknown')
  ),
  source_type text not null check (
    source_type in ('official_provider', 'youtube', 'public_domain', 'm3u', 'xtream', 'manual', 'other_legal')
  ),
  embed_url text,
  stream_url text,
  tvg_id text,
  tvg_name text,
  tvg_logo text,
  group_title text,
  xtream_stream_id text,
  xtream_category_id text,
  is_free boolean not null default false,
  is_legal_confirmed boolean not null default false,
  import_status text not null default 'pending_review' check (import_status in ('pending_review', 'approved', 'rejected')),
  legal_review_notes text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_logs (
  id uuid primary key default gen_random_uuid(),
  iptv_source_id uuid references public.iptv_sources(id) on delete cascade,
  import_type text not null check (import_type in ('m3u', 'xtream_live', 'xtream_movies', 'xtream_series', 'epg')),
  status text not null check (status in ('started', 'success', 'failed')),
  message text,
  items_found integer not null default 0,
  items_imported integer not null default 0,
  items_updated integer not null default 0,
  items_failed integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_item_id uuid references public.media_items(id) on delete cascade,
  live_channel_id uuid references public.live_channels(id) on delete cascade,
  progress_seconds integer,
  last_watched_at timestamptz not null default now(),
  check (
    (media_item_id is not null and live_channel_id is null)
    or (media_item_id is null and live_channel_id is not null)
  )
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function app_private.set_updated_at();

drop trigger if exists providers_updated_at on public.providers;
create trigger providers_updated_at
before update on public.providers
for each row execute function app_private.set_updated_at();

drop trigger if exists iptv_sources_updated_at on public.iptv_sources;
create trigger iptv_sources_updated_at
before update on public.iptv_sources
for each row execute function app_private.set_updated_at();

drop trigger if exists media_items_updated_at on public.media_items;
create trigger media_items_updated_at
before update on public.media_items
for each row execute function app_private.set_updated_at();

drop trigger if exists media_provider_links_updated_at on public.media_provider_links;
create trigger media_provider_links_updated_at
before update on public.media_provider_links
for each row execute function app_private.set_updated_at();

drop trigger if exists live_channels_updated_at on public.live_channels;
create trigger live_channels_updated_at
before update on public.live_channels
for each row execute function app_private.set_updated_at();

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'Owner'),
    coalesce(new.raw_user_meta_data ->> 'role', 'admin')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function app_private.handle_new_user();

create or replace function app_private.is_owner_or_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

revoke all on function app_private.handle_new_user() from public;
revoke all on function app_private.is_owner_or_admin() from public;
grant usage on schema app_private to authenticated;
grant execute on function app_private.is_owner_or_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.providers enable row level security;
alter table public.iptv_sources enable row level security;
alter table public.media_items enable row level security;
alter table public.media_provider_links enable row level security;
alter table public.live_channels enable row level security;
alter table public.import_logs enable row level security;
alter table public.watch_history enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "owner profiles read" on public.profiles;
create policy "owner profiles read"
on public.profiles for select
to authenticated
using (app_private.is_owner_or_admin());

drop policy if exists "owner profiles update own" on public.profiles;
create policy "owner profiles update own"
on public.profiles for update
to authenticated
using (id = auth.uid() and app_private.is_owner_or_admin())
with check (id = auth.uid() and app_private.is_owner_or_admin());

drop policy if exists "owner providers all" on public.providers;
create policy "owner providers all"
on public.providers for all
to authenticated
using (app_private.is_owner_or_admin())
with check (app_private.is_owner_or_admin());

drop policy if exists "owner iptv sources all" on public.iptv_sources;
create policy "owner iptv sources all"
on public.iptv_sources for all
to authenticated
using (app_private.is_owner_or_admin())
with check (app_private.is_owner_or_admin());

drop policy if exists "owner media all" on public.media_items;
create policy "owner media all"
on public.media_items for all
to authenticated
using (app_private.is_owner_or_admin())
with check (app_private.is_owner_or_admin());

drop policy if exists "owner links all" on public.media_provider_links;
create policy "owner links all"
on public.media_provider_links for all
to authenticated
using (app_private.is_owner_or_admin())
with check (app_private.is_owner_or_admin());

drop policy if exists "owner live channels all" on public.live_channels;
create policy "owner live channels all"
on public.live_channels for all
to authenticated
using (app_private.is_owner_or_admin())
with check (app_private.is_owner_or_admin());

drop policy if exists "owner import logs all" on public.import_logs;
create policy "owner import logs all"
on public.import_logs for all
to authenticated
using (app_private.is_owner_or_admin())
with check (app_private.is_owner_or_admin());

drop policy if exists "owner watch history all" on public.watch_history;
create policy "owner watch history all"
on public.watch_history for all
to authenticated
using (user_id = auth.uid() and app_private.is_owner_or_admin())
with check (user_id = auth.uid() and app_private.is_owner_or_admin());
