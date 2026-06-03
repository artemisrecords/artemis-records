# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm**. Node ≥ 20.

```bash
pnpm dev          # Next dev server (Turbopack): http://localhost:3000
pnpm build        # runs drizzle-kit migrate THEN next build: needs DATABASE_URL + migrations
pnpm start        # serve prod build
pnpm lint         # next lint

pnpm db:generate  # drizzle-kit generate: emit new migration from lib/db/schema.ts
pnpm db:migrate   # apply migrations (reads DATABASE_URL from .env.local via dotenv)
pnpm db:studio    # drizzle-kit studio UI
pnpm db:seed      # tsx scripts/seed.ts. NOTE: scripts/seed.ts does not yet exist
```

`pnpm build` currently fails if `lib/db/migrations/` is empty or `DATABASE_URL` is unset. Run `vercel env pull .env.local` then `pnpm db:generate` before the first build.

Env vars (see `.env.example`): `DATABASE_URL` (Neon Postgres, Vercel Marketplace) and `BLOB_READ_WRITE_TOKEN` (Vercel Blob). The Vercel project is already linked. `.vercel/project.json` is committed.

## Architecture

### Route groups: public site vs. backoffice

- `app/(public)/`: marketing site (home, `/about`, `/artists`, `/artists/[id]`, `/news`, `/news/[id]`, `/contact`, `/demo`, `/auth`, `/charte`, `/legal`, `/privacy`, `/cgu`). Wrapped by the root layout's `Nav` + `Footer` via `app/layout.tsx`.
- `app/backoffice/`: admin panel (`artistes/`, `journal/`, `demos/`, `demandes/`, `agenda/`, `contrats/`, `newsletter/`, `statistiques/`, `reglages/`, `compte/`). Wrapped by `app/backoffice/layout.tsx` → `AdminChrome` (sidebar + topbar + command palette, ⌘K). No auth guard yet. The `/auth` page is UI-only.

Both groups share the root `<html>` shell. Path alias `@/*` → repo root.

### Data layer: mid-migration

The README still says "pas de base de données" but the repo is mid-transition to Neon + Drizzle. Current state:

- **Static source of truth** (what pages actually read today):
  - `lib/data.ts` → `ARTISTS`, `NEWS`, `findArtist`, `findNews`, `formatDate`. Used by `app/(public)/artists/**` and `app/(public)/news/**` via `generateStaticParams()`.
  - `lib/adminData.ts` → `DEMOS`, `DEMANDS`, `SUBSCRIBERS`, `TEAM`, contract/event seeds. Used by backoffice pages.
- **Future source of truth**: `lib/db/schema.ts` (Drizzle pgTable defs for `artists`, `artist_shows`, `news`, `demos`, `demands`, `subscribers`). `lib/db/index.ts` exports a `db` client built on `@neondatabase/serverless` (HTTP driver, Fluid-Compute-friendly). **No migrations are committed yet**; the schema defines tables but nothing queries them.
- The schema's `Artist` shape differs slightly from the static `Artist` type: DB has `portraitUrl`/`coverUrl`/`primaryColor` flat columns and `jsonb` for `socials`/`embeds`/`discography`/`gallery`; the static type uses `portrait`/`cover` and a separate `shows` array (DB splits shows into `artist_shows`). When porting pages from static → DB, expect a field-mapping layer.

See `docs/superpowers/specs/2026-04-23-implémentation-neondb-et-gestion-fichier.md` for the full migration plan (Neon rationale, Blob layout, Clerk auth TBD).

### Tailwind v4: tokens live in CSS, not a config file

No `tailwind.config.js`. All design tokens (`--color-bleu-nuit-*`, `--color-beige-sable-*`, `--color-magenta`, fonts, letter-spacing, shadows) are declared in the `@theme` block of `app/globals.css`. To add/tweak a color or token, edit that file.

Custom utilities (`.stars`, `.grain`, `.legal-body`, twinkle keyframes) live under `@layer utilities` in the same file.

### Per-artist accent color

`app/(public)/artists/[id]/page.tsx` overrides `--color-magenta` inline on the article root:

```tsx
const rootStyle = artist.primaryColor ? { ['--color-magenta' as string]: artist.primaryColor } : {};
```

Every descendant that uses `text-magenta` / `bg-magenta` / `border-magenta` picks up the artist's color through CSS cascade. Don't "fix" these classes to hex values. The cascade is the feature.

### Client boundaries

Default is Server Components. `"use client"` is used only for interactive surfaces: form pages (`contact`, `demo`, `auth`), roster filters, `NewsletterBand`, and most of `app/backoffice/**` (admin is client-heavy by design).

The home page is hardcoded to the "magazine" layout (`HomeClient`) and the `/artists` roster is hardcoded to the grid layout. A dev-only "Tweaks" layout switcher (`lib/tweaks.tsx` + `components/TweaksPanel.tsx`, localStorage-backed) used to live in the root layout; it has been removed.

## Conventions

- **Language split**: user-facing copy in French, all identifiers/types/keys/commits in English. Preserve this when adding content.
- **Dynamic background images**: use inline `style={{ background: \`center/cover url(${x})\` }}`, not Tailwind arbitrary values. Tailwind v4 doesn't handle runtime URLs.
- **Fonts**: `font-display` = Catchy Mager (self-hosted at `/public/fonts/CatchyMager.woff`, **commercial license required before prod**, see README "Polices"); `font-serif` = Libre Baskerville; Italiana as display fallback. Both Google fonts loaded via `<link>` in `app/layout.tsx` head (not `next/font`).
- **Specs/plans**: `docs/superpowers/specs/` holds design specs and `docs/superpowers/plans/` holds implementation plans. Check these before large changes. They capture rejected alternatives (e.g. why Neon over Supabase).

## What's out of scope (intentionally)

- No Edge runtime. Neon HTTP driver + Next default runtime. Fluid Compute is fine.
- No i18n, single-locale (fr).
- Auth is UI-mocked only; the `/auth` page doesn't authenticate anything, and `/backoffice/**` is publicly reachable in dev. Don't add secrets or PII flows until auth lands.
