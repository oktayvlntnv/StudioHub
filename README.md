# StudioHub Private

StudioHub Private is an owner-only personal streaming portal for organizing legal media sources: public-domain videos, official provider links, official embeds, YouTube embeds, legal M3U playlists, legal Xtream-compatible providers, and TMDB metadata.

It is not a piracy platform. The app must not host illegal copyrighted files, scrape protected sources, bypass DRM/login/geo restrictions, proxy copyrighted streams, or restream unauthorized content.

## What Is Built

- Next.js App Router, TypeScript, Tailwind CSS
- Private dark streaming UI for desktop, mobile, tablet, and TV browsers
- Routes: `/login`, `/`, `/movies`, `/tv-shows`, `/live-tv`, `/search`, `/title/[id]`, `/watch/[id]`, `/sources`, `/sources/m3u`, `/sources/xtream`, `/settings`, `/legal`
- Supabase Auth helpers, owner/admin route protection, and guarded API routes
- Supabase SQL schema with RLS policies and safe seed data
- M3U parser/import route with pending-review workflow
- Xtream-compatible server connector with encrypted credential storage
- TMDB search/import API and admin metadata panel
- Legal discovery panel and auto-fill importer for Internet Archive, IPTV-org live TV, and YouTube Creative Commons
- Review queue, import logs, source status, settings save, and safe mock fallback
- PWA manifest, icon, and conservative app-shell service worker

## Local Development

From this directory:

```bash
node .tools/pnpm/bin/pnpm.cjs dev
node .tools/pnpm/bin/pnpm.cjs lint
node .tools/pnpm/bin/pnpm.cjs build
```

If you have normal Node/npm tooling installed, `pnpm dev`, `pnpm lint`, and `pnpm build` also work.

## Environment

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TMDB_API_KEY=
YOUTUBE_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
PRIVATE_APP_MODE=true
ENCRYPTION_SECRET=
```

`ENCRYPTION_SECRET` should be a long random value. It is used server-side for Xtream credential encryption. Never expose it to the browser.

When Supabase env vars are absent, the app runs in safe mock mode. When they are present and `PRIVATE_APP_MODE=true`, all pages except `/login` and `/legal` require an authenticated owner/admin profile.

## Supabase Setup

1. Create a Supabase project.
2. Disable public signups in Supabase Auth settings for the MVP.
3. Run `supabase/schema.sql` in the Supabase SQL editor.
4. Create the owner user from the Supabase dashboard.
5. In `public.profiles`, set that user's role to `owner`.
6. Optionally run `supabase/seed.sql` for legal placeholder data.
7. Add the Supabase URL, anon key, and service role key to `.env.local`.

Only one `owner` profile is allowed by the schema. Additional trusted accounts can be `admin`, but the MVP should use one owner account.

## Playback Modes

- `youtube_embed`: official YouTube iframe only when embedding is allowed.
- `official_embed`: provider-approved embed URL/code only.
- `external_link`: opens the official provider page.
- `public_domain_video`: HTML5 playback for public-domain, open-license, owned, or legally authorized videos.
- `official_live_stream`: HTML5 playback only when official streaming is allowed.
- `m3u_stream`: legal/authorized M3U streams, no proxying or bypassing.
- `xtream_stream`: legal/authorized Xtream sources; credentials remain server-side.

## Access Types

- `no_login_required`
- `optional_login`
- `login_required`
- `owner_credentials_required`
- `unknown`

Unknown access and unconfirmed sources are hidden by default in owner settings.

## M3U Workflow

1. Open `/sources/m3u`.
2. Paste a legal M3U URL or upload an authorized M3U file.
3. Confirm legal authorization.
4. Import channels as `pending_review`.
5. Approve only channels you are legally authorized to watch.

The app does not proxy M3U streams and does not bypass tokens, DRM, or provider restrictions.

## Xtream Workflow

1. Open `/sources/xtream`.
2. Add provider URL, username, password, and legal/license notes.
3. Confirm the provider is legal and you are authorized to use it.
4. The source is saved disabled by default.
5. Test connection and import live/movie/series metadata through server routes.
6. Imported items stay `pending_review` until approved.

Xtream usernames/passwords are encrypted server-side and never returned to the frontend. Raw provider responses are normalized before storage.

## TMDB Workflow

Use the TMDB panel on `/sources` to search and import metadata. TMDB is metadata only; it does not prove a title is free or legal to watch. Imported metadata remains pending review until an owner adds a legal playback source.

## Legal Discovery Workflow

Open `/sources` and use the Legal discovery panel to find candidate content from safe sources:

- Internet Archive: searches public archive metadata and imports playable files when available.
- IPTV-org Live TV: searches the public IPTV-org API, skips geo-blocked labels and streams requiring custom headers, then imports as live TV.
- YouTube Creative Commons: uses the official YouTube Data API with embeddable and Creative Commons filters. Add `YOUTUBE_API_KEY` in Vercel to enable it.

Use **Auto-fill starter catalog** to run several searches at once. By default it imports items into review so the catalog stays private and legally controlled. To make imported items immediately visible in Movies or Live TV, check the legal confirmation box and import as approved only after you have verified the source.

Discovery imports are owner-only. Import as `pending_review` by default, or check the legal confirmation box and import as `approved` when you have verified that the selected items are legal for your use.

Plex, Tubi, Pluto TV, and similar providers are handled as official external links unless you have a provider-approved catalog export or API key. StudioHub does not scrape their catalogs or extract playback URLs.

## Deployment

The project is Vercel-ready:

1. Push the repository to GitHub.
2. Create a Vercel project.
3. Add the environment variables above.
4. Deploy.
5. Confirm Supabase Auth redirect URLs include your Vercel domain.

## Legal Reminder

StudioHub Private is for private personal use. The owner is responsible for using only sources they are legally authorized to access. If embedding or direct playback is unclear, use `external_link` or keep the item hidden.
