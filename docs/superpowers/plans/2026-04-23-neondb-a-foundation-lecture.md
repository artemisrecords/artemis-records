# Plan A — Foundation DB & lecture (Neon + Drizzle + Blob)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les constantes statiques `lib/data.ts` / `lib/adminData.ts` par une base Neon Postgres (via Drizzle) + Vercel Blob pour les assets, sans changer le comportement visible du site (lecture seule, pas encore de CRUD backoffice ni de soumissions publiques).

**Architecture:** Neon Postgres (HTTP serverless, `@neondatabase/serverless`) + Drizzle ORM pour le typage/migrations. Les images locales de `public/assets/` sont migrées vers Vercel Blob par un script de seed one-shot. Les pages Server Components (`/`, `/artists`, `/artists/[id]`, `/news`, `/news/[id]`) lisent la DB via un module `lib/db/queries.ts` avec les mêmes signatures `findArtist`/`findNews`/`getArtists`/`getNews` mais asynchrones. Les pages backoffice sont déjà non-fonctionnelles (visuel only) — on les laisse pointer sur `lib/data.ts` / `lib/adminData.ts` qui exportent des **stubs async** le temps du Plan B. Pas d'auth, pas de Server Actions d'écriture, pas de Cache Components (v1).

**Tech Stack:** Next.js 16.2 App Router · Drizzle ORM · `@neondatabase/serverless` · `drizzle-kit` · `@vercel/blob` · `zod` + `drizzle-zod` · `tsx` (pour scripts) · Vercel CLI (setup env).

---

## File Structure

### Créations
- `.env.example` — documente les env vars requises
- `drizzle.config.ts` — config `drizzle-kit`
- `lib/db/index.ts` — instance Drizzle sur client Neon HTTP
- `lib/db/schema.ts` — tables Drizzle (artists, artist_shows, news, demos, demands, subscribers) + types exportés
- `lib/db/queries.ts` — fonctions de lecture `getArtists`, `findArtist`, `getNews`, `findNews` (typing compatible avec l'existant)
- `lib/db/migrations/` — SQL généré par `drizzle-kit generate` (engagé en git)
- `scripts/seed.ts` — script one-shot : upload assets → Blob, INSERT données initiales
- `scripts/tsconfig.json` — tsconfig autonome pour scripts hors Next
- `docs/superpowers/plans/2026-04-23-neondb-a-foundation-lecture.md` — ce plan

### Modifications
- `package.json` — deps + scripts `db:generate`, `db:migrate`, `db:seed`
- `next.config.ts` — autoriser hostname `*.public.blob.vercel-storage.com` dans `images.remotePatterns`
- `lib/data.ts` — ne contient plus que les types + `formatDate`, ré-exporte `findArtist`/`findNews` depuis `queries.ts`
- `lib/adminData.ts` — ne contient plus que les types + labels, les arrays `DEMOS` / `DEMANDS` / `SUBSCRIBERS` deviennent des fonctions async `getDemos()` / `getDemands()` / `getSubscribers()` lisant la DB
- `app/(public)/page.tsx`, `app/(public)/artists/page.tsx`, `app/(public)/artists/[id]/page.tsx`, `app/(public)/news/page.tsx`, `app/(public)/news/[id]/page.tsx` — lecture asynchrone depuis `queries.ts`, `generateStaticParams` devient async
- `app/backoffice/**/page.tsx` — adapter les imports : les pages utilisent maintenant `await getXxx()` au lieu de `XXX` en import direct
- `.gitignore` — déjà OK (ignore `.env*.local`)

### Suppressions / conservations
- `public/assets/*.webp` — on **garde** les fichiers sur disque (pour rollback + fallback moodboards/logos), mais les références en DB pointeront vers Blob après seed.

---

## Prérequis côté utilisateur (manuels)

Ces étapes se font hors de l'IDE et doivent être faites avant la Task 5. Je les liste ici pour qu'elles soient claires :

1. **Installer Vercel CLI globalement** : `npm i -g vercel` (si pas déjà fait)
2. **Créer le projet Vercel** et lier le repo : depuis la racine du repo, `vercel link` (répondre aux prompts)
3. **Provisionner Neon** via Marketplace :
   - https://vercel.com/marketplace/neon → "Install" → choisir le projet `artemis-records`
   - Region : `eu-central-1` (Frankfurt) pour latence FR
   - Cela crée automatiquement une database et injecte `DATABASE_URL` dans les env vars Vercel
4. **Provisionner Vercel Blob** :
   - Dans le dashboard du projet → Storage → Create → Blob → nom `artemis-records`
   - Cela injecte `BLOB_READ_WRITE_TOKEN`
5. **Pull des env vars** : `vercel env pull .env.local`

Ces étapes produisent `.env.local` avec `DATABASE_URL` et `BLOB_READ_WRITE_TOKEN`. Le reste du plan s'exécute en local.

---

## Task 1 : Dependencies & config TypeScript pour scripts

**Files:**
- Modify: `package.json`
- Create: `scripts/tsconfig.json`

- [ ] **Step 1 : Installer runtime deps**

Run:
```bash
pnpm add drizzle-orm @neondatabase/serverless @vercel/blob zod drizzle-zod
```

Expected: `pnpm-lock.yaml` modifié, pas d'erreur.

- [ ] **Step 2 : Installer dev deps**

Run:
```bash
pnpm add -D drizzle-kit tsx dotenv
```

- [ ] **Step 3 : Ajouter scripts dans `package.json`**

Modifier la section `"scripts"` pour obtenir exactement :

```json
  "scripts": {
    "dev": "next dev",
    "build": "drizzle-kit migrate && next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx --env-file=.env.local scripts/seed.ts"
  },
```

- [ ] **Step 4 : Créer `scripts/tsconfig.json`**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "noEmit": true,
    "jsx": "preserve"
  },
  "include": ["./**/*.ts"],
  "exclude": []
}
```

- [ ] **Step 5 : Commit**

```bash
git add package.json pnpm-lock.yaml scripts/tsconfig.json
git commit -m "deps: drizzle, neon serverless, vercel blob, zod, tsx"
```

---

## Task 2 : Drizzle config & schema

**Files:**
- Create: `drizzle.config.ts`
- Create: `lib/db/schema.ts`
- Create: `.env.example`

- [ ] **Step 1 : Créer `.env.example`**

```bash
# Neon Postgres (auto-provisionné par l'intégration Vercel Marketplace)
DATABASE_URL="postgres://<user>:<pass>@<host>/<db>?sslmode=require"

# Vercel Blob (auto-provisionné)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxx"
```

- [ ] **Step 2 : Créer `drizzle.config.ts`**

```ts
import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
} satisfies Config;
```

- [ ] **Step 3 : Créer `lib/db/schema.ts`**

```ts
import {
  pgTable,
  text,
  boolean,
  jsonb,
  timestamp,
  date,
  smallint,
  index,
} from "drizzle-orm/pg-core";

// ── Types JSON réutilisés par l'app ──────────────────────────────────────────

export type Embed = { type: "spotify" | "youtube"; title: string; src: string };
export type DiscoItem = {
  id: string;
  kind: string;
  title: string;
  year: string;
  cover: string;
  note?: string;
};
export type DemoLink = { label: string; href: string };
export type DemoFile = { name: string; url: string; size: number };

// ── Tables ──────────────────────────────────────────────────────────────────

export const artists = pgTable("artists", {
  id: text("id").primaryKey(), // slug
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  genre: text("genre").notNull(),
  signedYear: text("signed_year").notNull(),
  published: boolean("published").notNull().default(false),
  portraitUrl: text("portrait_url").notNull(),
  coverUrl: text("cover_url").notNull(),
  primaryColor: text("primary_color"),
  quote: text("quote"),
  bioShort: text("bio_short").notNull(),
  bioLong: text("bio_long").notNull(),
  genres: jsonb("genres").$type<string[]>().notNull().default([]),
  socials: jsonb("socials").$type<Record<string, string>>().notNull().default({}),
  embeds: jsonb("embeds").$type<Embed[]>().notNull().default([]),
  discography: jsonb("discography").$type<DiscoItem[]>().notNull().default([]),
  gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const artistShows = pgTable(
  "artist_shows",
  {
    id: text("id").primaryKey(),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    city: text("city").notNull(),
    venue: text("venue").notNull(),
    status: text("status"),
    free: boolean("free").notNull().default(false),
    ticketUrl: text("ticket_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("artist_shows_date_idx").on(t.date), index("artist_shows_artist_idx").on(t.artistId)],
);

export const news = pgTable(
  "news",
  {
    id: text("id").primaryKey(), // slug
    published: boolean("published").notNull().default(false),
    date: date("date").notNull(),
    category: text("category").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    body: text("body").notNull(), // markdown
    imageUrl: text("image_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("news_date_idx").on(t.date)],
);

export const demos = pgTable(
  "demos",
  {
    id: text("id").primaryKey(),
    artist: text("artist").notNull(),
    contact: text("contact").notNull(),
    email: text("email").notNull(),
    city: text("city"),
    genre: text("genre"),
    duration: text("duration"),
    pitch: text("pitch").notNull(),
    links: jsonb("links").$type<DemoLink[]>().notNull().default([]),
    files: jsonb("files").$type<DemoFile[]>().notNull().default([]),
    status: text("status").notNull().default("nouveau"),
    rating: smallint("rating"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    assignedTo: text("assigned_to"),
    notes: text("notes"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("demos_status_idx").on(t.status, t.receivedAt)],
);

export const demands = pgTable(
  "demands",
  {
    id: text("id").primaryKey(),
    category: text("category").notNull(),
    subject: text("subject").notNull(),
    name: text("name").notNull(),
    org: text("org"),
    email: text("email").notNull(),
    phone: text("phone"),
    message: text("message").notNull(),
    status: text("status").notNull().default("ouverte"),
    assignedTo: text("assigned_to"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("demands_status_idx").on(t.status, t.receivedAt)],
);

export const subscribers = pgTable("subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Types inférés ───────────────────────────────────────────────────────────

export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;
export type ArtistShow = typeof artistShows.$inferSelect;
export type NewsRow = typeof news.$inferSelect;
export type DemoRow = typeof demos.$inferSelect;
export type DemandRow = typeof demands.$inferSelect;
export type SubscriberRow = typeof subscribers.$inferSelect;
```

- [ ] **Step 4 : Vérifier la compilation TypeScript**

Run:
```bash
pnpm exec tsc --noEmit
```

Expected: aucune erreur (ou uniquement celles pré-existantes non liées). Si Drizzle rale, lire le message et corriger avant de continuer.

- [ ] **Step 5 : Commit**

```bash
git add drizzle.config.ts lib/db/schema.ts .env.example
git commit -m "db: drizzle schema (artists, shows, news, demos, demands, subscribers)"
```

---

## Task 3 : DB client

**Files:**
- Create: `lib/db/index.ts`

- [ ] **Step 1 : Créer `lib/db/index.ts`**

```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Run `vercel env pull .env.local`.");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
export { schema };
```

- [ ] **Step 2 : Vérifier typecheck**

Run:
```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 3 : Commit**

```bash
git add lib/db/index.ts
git commit -m "db: neon http client via drizzle"
```

---

## Task 4 : STOP — prérequis utilisateur

- [ ] **Step 1 : Demander à l'utilisateur d'exécuter les prérequis** listés en tête de plan (installation Vercel CLI, `vercel link`, provisioning Neon + Blob via Marketplace, `vercel env pull .env.local`).

- [ ] **Step 2 : Vérifier que `.env.local` existe et contient `DATABASE_URL` + `BLOB_READ_WRITE_TOKEN`** :

Run:
```bash
test -f .env.local && grep -c "DATABASE_URL" .env.local && grep -c "BLOB_READ_WRITE_TOKEN" .env.local
```

Expected: sortie `1` et `1`. Si un des deux manque, STOP et demander à l'utilisateur de compléter.

---

## Task 5 : Générer + appliquer la première migration

**Files:**
- Create: `lib/db/migrations/0000_*.sql` (généré)
- Create: `lib/db/migrations/meta/` (généré)

- [ ] **Step 1 : Générer le SQL**

Run:
```bash
pnpm db:generate
```

Expected: création de `lib/db/migrations/0000_xxx.sql` + `meta/`. Ouvrir le fichier SQL et relire : 6 `CREATE TABLE`, 4 `CREATE INDEX`. Vérifier que `artist_shows.artist_id` a bien la FK `REFERENCES artists(id) ON DELETE CASCADE`.

- [ ] **Step 2 : Appliquer la migration sur la DB**

Run:
```bash
pnpm db:migrate
```

Expected: sortie `Applied 1 migrations`. Pas d'erreur de connexion.

- [ ] **Step 3 : Vérifier sur la DB**

Run:
```bash
pnpm db:studio
```

Ouvre `https://local.drizzle.studio`. Vérifier visuellement que les 6 tables existent et sont vides. Fermer le studio (Ctrl-C).

- [ ] **Step 4 : Commit**

```bash
git add lib/db/migrations
git commit -m "db: initial migration (6 tables)"
```

---

## Task 6 : Module `queries.ts` (lecture seule)

**Files:**
- Create: `lib/db/queries.ts`

- [ ] **Step 1 : Créer `lib/db/queries.ts`**

```ts
import "server-only";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "./index";
import { artists, artistShows, news } from "./schema";
import type { Artist, ArtistShow, NewsRow } from "./schema";

// ── Types de surface (compatibles avec l'ancien lib/data.ts) ─────────────────

export type ArtistWithShows = Artist & { shows: ArtistShow[] };

// ── Artists ──────────────────────────────────────────────────────────────────

export async function getArtists(): Promise<ArtistWithShows[]> {
  const rows = await db.select().from(artists).orderBy(asc(artists.name));
  if (rows.length === 0) return [];
  const shows = await db
    .select()
    .from(artistShows)
    .orderBy(asc(artistShows.date));
  const byArtist = new Map<string, ArtistShow[]>();
  for (const s of shows) {
    const list = byArtist.get(s.artistId) ?? [];
    list.push(s);
    byArtist.set(s.artistId, list);
  }
  return rows.map((r) => ({ ...r, shows: byArtist.get(r.id) ?? [] }));
}

export async function findArtist(id: string): Promise<ArtistWithShows | undefined> {
  const rows = await db.select().from(artists).where(eq(artists.id, id)).limit(1);
  if (rows.length === 0) return undefined;
  const shows = await db
    .select()
    .from(artistShows)
    .where(eq(artistShows.artistId, id))
    .orderBy(asc(artistShows.date));
  return { ...rows[0], shows };
}

// ── News ─────────────────────────────────────────────────────────────────────

export async function getNews(): Promise<NewsRow[]> {
  return db
    .select()
    .from(news)
    .where(eq(news.published, true))
    .orderBy(desc(news.date));
}

export async function findNews(id: string): Promise<NewsRow | undefined> {
  const rows = await db.select().from(news).where(eq(news.id, id)).limit(1);
  return rows[0];
}
```

- [ ] **Step 2 : Typecheck**

Run:
```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 3 : Commit**

```bash
git add lib/db/queries.ts
git commit -m "db: read queries (getArtists, findArtist, getNews, findNews)"
```

---

## Task 7 : Seed script

**Files:**
- Create: `scripts/seed.ts`

- [ ] **Step 1 : Créer `scripts/seed.ts`**

Le seed doit :
1. Uploader chaque `public/assets/*.webp` référencé par les données vers Blob, récupérer l'URL.
2. Mapper les paths locaux (`/assets/xxx.webp`) vers les URLs Blob dans les objets à INSERT.
3. Laisser les URLs externes (`images.unsplash.com`) telles quelles.
4. INSERT dans l'ordre : artists, artistShows, news, demos, demands, subscribers.
5. Être idempotent (si relancé, `ON CONFLICT DO UPDATE`).

```ts
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { put } from "@vercel/blob";
import { db } from "../lib/db/index";
import {
  artists,
  artistShows,
  news,
  demos,
  demands,
  subscribers,
} from "../lib/db/schema";

// ── Données source (copiées depuis lib/data.ts & lib/adminData.ts) ───────────
// On les inline ici pour que le seed reste reproductible même après suppression
// des constantes dans lib/.

type SeedArtist = {
  id: string;
  name: string;
  tagline: string;
  genre: string;
  signedYear: string;
  published: boolean;
  portrait: string;
  cover: string;
  primaryColor?: string;
  quote?: string;
  bioShort: string;
  bioLong: string;
  genres: string[];
  socials: Record<string, string>;
  embeds: { type: "spotify" | "youtube"; title: string; src: string }[];
  discography: {
    id: string;
    kind: string;
    title: string;
    year: string;
    cover: string;
    note?: string;
  }[];
  shows: {
    id: string;
    date: string;
    city: string;
    venue: string;
    status?: string;
    free?: boolean;
    ticketUrl?: string;
  }[];
  gallery: string[];
};

// ⚠️ IMPORTANT : Coller ici la valeur actuelle de ARTISTS (lib/data.ts) et de
// NEWS, DEMOS, DEMANDS, SUBSCRIBERS (lib/adminData.ts). Voir le step 2 pour
// l'instruction exacte.
const SEED_ARTISTS: SeedArtist[] = [/* REMPLACÉ AU STEP 2 */];
const SEED_NEWS: {
  id: string;
  published: boolean;
  date: string;
  category: string;
  title: string;
  excerpt: string;
  body: string;
  image: string;
}[] = [/* REMPLACÉ AU STEP 2 */];
const SEED_DEMOS: any[] = [/* REMPLACÉ AU STEP 2 */];
const SEED_DEMANDS: any[] = [/* REMPLACÉ AU STEP 2 */];
const SEED_SUBSCRIBERS: any[] = [/* REMPLACÉ AU STEP 2 */];

// ── Helpers ─────────────────────────────────────────────────────────────────

const uploadCache = new Map<string, string>();

async function uploadLocalAsset(localPath: string, blobPath: string): Promise<string> {
  const cached = uploadCache.get(localPath);
  if (cached) return cached;
  const abs = resolve(process.cwd(), "public" + localPath);
  const buf = await readFile(abs);
  const result = await put(blobPath, buf, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/webp",
    allowOverwrite: true,
  });
  uploadCache.set(localPath, result.url);
  return result.url;
}

async function mapUrl(u: string, blobPath: string): Promise<string> {
  if (u.startsWith("/assets/")) {
    return uploadLocalAsset(u, blobPath);
  }
  return u; // external URL (unsplash, etc.) stays as-is
}

// ── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("▸ Uploading assets + seeding artists…");
  for (const a of SEED_ARTISTS) {
    const portraitUrl = await mapUrl(a.portrait, `artists/${a.id}/portrait.webp`);
    const coverUrl = await mapUrl(a.cover, `artists/${a.id}/cover.webp`);
    const gallery = await Promise.all(
      a.gallery.map((g, i) => mapUrl(g, `artists/${a.id}/gallery/${i}.webp`)),
    );
    const discography = await Promise.all(
      a.discography.map(async (d) => ({
        ...d,
        cover: await mapUrl(d.cover, `artists/${a.id}/discography/${d.id}.webp`),
      })),
    );

    await db
      .insert(artists)
      .values({
        id: a.id,
        name: a.name,
        tagline: a.tagline,
        genre: a.genre,
        signedYear: a.signedYear,
        published: a.published,
        portraitUrl,
        coverUrl,
        primaryColor: a.primaryColor,
        quote: a.quote,
        bioShort: a.bioShort,
        bioLong: a.bioLong,
        genres: a.genres,
        socials: a.socials,
        embeds: a.embeds,
        discography,
        gallery,
      })
      .onConflictDoUpdate({
        target: artists.id,
        set: {
          name: a.name,
          tagline: a.tagline,
          genre: a.genre,
          signedYear: a.signedYear,
          published: a.published,
          portraitUrl,
          coverUrl,
          primaryColor: a.primaryColor,
          quote: a.quote,
          bioShort: a.bioShort,
          bioLong: a.bioLong,
          genres: a.genres,
          socials: a.socials,
          embeds: a.embeds,
          discography,
          gallery,
          updatedAt: new Date(),
        },
      });

    for (const s of a.shows) {
      await db
        .insert(artistShows)
        .values({
          id: `${a.id}-${s.id}`,
          artistId: a.id,
          date: s.date,
          city: s.city,
          venue: s.venue,
          status: s.status,
          free: s.free ?? false,
          ticketUrl: s.ticketUrl,
        })
        .onConflictDoUpdate({
          target: artistShows.id,
          set: {
            date: s.date,
            city: s.city,
            venue: s.venue,
            status: s.status,
            free: s.free ?? false,
            ticketUrl: s.ticketUrl,
          },
        });
    }
  }

  console.log("▸ Seeding news…");
  for (const n of SEED_NEWS) {
    const imageUrl = await mapUrl(n.image, `news/${n.id}/hero.webp`);
    await db
      .insert(news)
      .values({
        id: n.id,
        published: n.published,
        date: n.date,
        category: n.category,
        title: n.title,
        excerpt: n.excerpt,
        body: n.body,
        imageUrl,
      })
      .onConflictDoUpdate({
        target: news.id,
        set: {
          published: n.published,
          date: n.date,
          category: n.category,
          title: n.title,
          excerpt: n.excerpt,
          body: n.body,
          imageUrl,
          updatedAt: new Date(),
        },
      });
  }

  console.log("▸ Seeding demos…");
  for (const d of SEED_DEMOS) {
    await db
      .insert(demos)
      .values({
        id: d.id,
        artist: d.artist,
        contact: d.contact,
        email: d.email,
        city: d.city,
        genre: d.genre,
        duration: d.duration,
        pitch: d.pitch,
        links: d.links ?? [],
        status: d.status,
        rating: d.rating,
        tags: d.tags ?? [],
        assignedTo: d.assignedTo,
        receivedAt: new Date(d.received),
      })
      .onConflictDoNothing();
  }

  console.log("▸ Seeding demands…");
  for (const d of SEED_DEMANDS) {
    await db
      .insert(demands)
      .values({
        id: d.id,
        category: d.category,
        subject: d.subject,
        name: d.name,
        org: d.org,
        email: d.email,
        phone: d.phone,
        message: d.message,
        status: d.status,
        assignedTo: d.assignedTo,
        receivedAt: new Date(d.received),
      })
      .onConflictDoNothing();
  }

  console.log("▸ Seeding subscribers…");
  for (const s of SEED_SUBSCRIBERS) {
    await db
      .insert(subscribers)
      .values({
        id: s.id,
        email: s.email,
        name: s.name,
        tags: s.tags ?? [],
        confirmedAt: new Date(s.subscribed),
        subscribedAt: new Date(s.subscribed),
      })
      .onConflictDoNothing();
  }

  console.log("✅ Seed done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2 : Remplir les arrays `SEED_*`**

Remplacer les `/* REMPLACÉ AU STEP 2 */` par les valeurs actuelles de :
- `ARTISTS` (depuis `lib/data.ts` lignes 59–246) → `SEED_ARTISTS` (adapter `signed` → `signedYear`, `portrait`/`cover` → string tels quels, rien d'autre ne change — la conversion URL se fait à l'exécution)
- `NEWS` (depuis `lib/data.ts` lignes 248–285) → `SEED_NEWS`
- `DEMOS` (depuis `lib/adminData.ts` lignes 57–172) → `SEED_DEMOS`
- `DEMANDS` (depuis `lib/adminData.ts` lignes 174–263) → `SEED_DEMANDS`
- `SUBSCRIBERS` (depuis `lib/adminData.ts` lignes 265–293) → `SEED_SUBSCRIBERS`

**Note** : `TEAM` et `DEMO_STATUS_LABEL` / `DEMAND_CATEGORY_LABEL` / `DEMAND_STATUS_LABEL` ne vont PAS en DB (ce sont des constantes UI). Les laisser dans `lib/adminData.ts`.

- [ ] **Step 3 : Typecheck scripts**

Run:
```bash
pnpm exec tsc -p scripts/tsconfig.json
```

Expected: pas d'erreur. Si le path `../lib/db/index` pose problème à cause de `"server-only"`, ajouter `import "server-only";` mock — en pratique `tsx` n'interprète pas `server-only` côté runtime, mais si blocage, commenter l'import et remettre au step 5 après le seed.

- [ ] **Step 4 : Commit**

```bash
git add scripts/seed.ts
git commit -m "scripts: one-shot seed (upload blob + insert initial data)"
```

---

## Task 8 : Lancer le seed

- [ ] **Step 1 : Seed**

Run:
```bash
pnpm db:seed
```

Expected:
```
▸ Uploading assets + seeding artists…
▸ Seeding news…
▸ Seeding demos…
▸ Seeding demands…
▸ Seeding subscribers…
✅ Seed done.
```

Durée attendue : < 30 s (2 artistes × ~6 assets chacun à uploader).

- [ ] **Step 2 : Vérifier en DB via studio**

Run:
```bash
pnpm db:studio
```

Vérifier : 2 artists, 6 artist_shows, 3 news, 7 demos, 7 demands, 4 subscribers. Les URLs `portrait_url` / `cover_url` doivent commencer par `https://` + `.public.blob.vercel-storage.com/`. Les URLs `image_url` des news (unsplash) sont inchangées.

- [ ] **Step 3 : Vérifier les blobs**

Dans le dashboard Vercel → Storage → Blob → parcourir l'arborescence `artists/caelya/...`, `artists/allicyone/...`. Les fichiers doivent être là.

- [ ] **Step 4 : Commit d'une note si besoin**

Pas de commit (rien n'a bougé en code) — juste noter dans le plan "seed OK le YYYY-MM-DD".

---

## Task 9 : Autoriser Blob dans `next.config.ts`

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1 : Ajouter le hostname Blob**

Remplacer le contenu par :

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 2 : Commit**

```bash
git add next.config.ts
git commit -m "next: allow vercel blob hostnames for next/image"
```

---

## Task 10 : Swap `lib/data.ts` (types only + passerelle)

**Files:**
- Modify: `lib/data.ts`

- [ ] **Step 1 : Réécrire `lib/data.ts`**

Remplacer **tout** le contenu par :

```ts
// Compat layer : les types restent ici pour ne pas casser les imports existants
// (`import type { Artist, NewsItem } from "@/lib/data"`), les queries viennent
// de `lib/db/queries.ts`. Après Plan B, ce fichier ne contiendra plus que
// `formatDate` et les re-exports de types.

export type { ArtistWithShows as Artist } from "./db/queries";
export type { NewsRow as NewsItem } from "./db/schema";
export type { Embed, DiscoItem } from "./db/schema";
export type Show = {
  id: string;
  date: string;
  city: string;
  venue: string;
  status?: string | null;
  free?: boolean;
  ticketUrl?: string | null;
};

export { getArtists, findArtist, getNews, findNews } from "./db/queries";

export const formatDate = (iso: string | Date): string => {
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
};
```

- [ ] **Step 2 : Trouver les imports cassés**

Run:
```bash
pnpm exec tsc --noEmit 2>&1 | head -80
```

On s'attend à des erreurs du type :
- `ARTISTS` is not exported → il faut basculer en `await getArtists()`
- `NEWS` is not exported → `await getNews()`
- Champs renommés : `signed` → `signedYear`, `portrait` → `portraitUrl`, `cover` → `coverUrl`, `image` → `imageUrl`

Noter la liste des fichiers à modifier (task 11).

- [ ] **Step 3 : Commit (intentionnellement cassé — sera fixé task 11)**

```bash
git add lib/data.ts
git commit -m "data: switch static exports to async DB queries (callers to fix next)"
```

---

## Task 11 : Adapter les pages publiques

**Files:**
- Modify: `app/(public)/page.tsx`
- Modify: `app/(public)/artists/page.tsx`
- Modify: `app/(public)/artists/[id]/page.tsx`
- Modify: `app/(public)/news/page.tsx`
- Modify: `app/(public)/news/[id]/page.tsx`
- Modify: `components/ArtistCard.tsx`, `components/NewsCard.tsx`, `components/EmbedPlayer.tsx` (uniquement si renommages de champs impactent — sinon, props inchangées)

### Step 1 : `app/(public)/page.tsx`

- [ ] Remplacer l'accès direct à `ARTISTS` / `NEWS` par :

```tsx
// en haut du fichier, conserver les autres imports existants
import { getArtists, getNews } from "@/lib/data";

// dans le composant (doit être async si pas déjà)
export default async function HomePage() {
  const artists = await getArtists();
  const news = await getNews();
  const published = artists.filter((a) => a.published);
  // … rester du rendu existant en remplaçant ARTISTS → published, NEWS → news
}
```

Adapter les accès aux champs renommés :
- `a.portrait` → `a.portraitUrl`
- `a.cover` → `a.coverUrl`
- `a.signed` → `a.signedYear`
- `n.image` → `n.imageUrl`

### Step 2 : `app/(public)/artists/page.tsx`

- [ ] Même traitement : `const artists = await getArtists()`, rendre le composant `async`, adapter les champs.

### Step 3 : `app/(public)/artists/[id]/page.tsx`

- [ ] Adapter :

```tsx
import { findArtist, getArtists } from "@/lib/data";

export async function generateStaticParams() {
  const list = await getArtists();
  return list.filter((a) => a.published).map((a) => ({ id: a.id }));
}

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await findArtist(id);
  if (!artist) notFound();
  // … rester du rendu, adapter portraitUrl / coverUrl / signedYear / etc.
}
```

### Step 4 : `app/(public)/news/page.tsx` & `app/(public)/news/[id]/page.tsx`

- [ ] Même pattern avec `getNews()` / `findNews(id)`. Attention : `date` devient `Date` (colonne `date`) au lieu de `string`. Adapter `formatDate(n.date)` → accepte maintenant `Date`.

### Step 5 : Composants

- [ ] Ouvrir `components/ArtistCard.tsx`, `components/NewsCard.tsx`, `components/EmbedPlayer.tsx`. Si un composant reçoit un `Artist` / `NewsItem` en props et accède à `.portrait` / `.image`, adapter en `.portraitUrl` / `.imageUrl`. Ne rien changer d'autre.

### Step 6 : Typecheck

Run:
```bash
pnpm exec tsc --noEmit
```

Expected: **zéro erreur côté public**. S'il en reste côté `app/backoffice/**`, c'est attendu (task 12).

### Step 7 : Commit

```bash
git add app/\(public\) components
git commit -m "read: public pages + components read from DB via queries"
```

---

## Task 12 : Adapter les pages backoffice (stubs async temporaires)

**Files:**
- Modify: `lib/adminData.ts`
- Modify: `app/backoffice/demos/page.tsx`, `app/backoffice/demandes/page.tsx`, `app/backoffice/newsletter/page.tsx`, `app/backoffice/artistes/page.tsx`, `app/backoffice/artistes/[id]/page.tsx`, `app/backoffice/journal/page.tsx`, `app/backoffice/journal/[id]/page.tsx`, `app/backoffice/agenda/page.tsx`, `app/backoffice/statistiques/page.tsx`, `app/backoffice/reglages/page.tsx`, `app/backoffice/page.tsx`

### Step 1 : Réécrire `lib/adminData.ts`

- [ ] Remplacer **tout** le contenu par :

```ts
// Compat layer : les types et labels restent ici, les arrays deviennent des
// fonctions async de lecture. Les écritures (UPDATE status, UPDATE rating, etc.)
// seront ajoutées en Plan B.

import { db } from "./db";
import { demos, demands, subscribers } from "./db/schema";
import { desc } from "drizzle-orm";

export type DemoStatus = "nouveau" | "ecoute" | "retenu" | "refuse";
export type DemandCategory =
  | "presse"
  | "booking"
  | "partenariat"
  | "licence"
  | "autre";

export type Demo = typeof demos.$inferSelect;
export type Demand = typeof demands.$inferSelect;
export type Subscriber = typeof subscribers.$inferSelect;

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
};

// Team : reste hardcodé pour l'instant (pas encore de table users — Plan B)
export const TEAM: TeamMember[] = [
  { id: "u1", name: "Margaux Villeneuve", role: "Direction artistique", email: "margaux@artemis-records.fr" },
  { id: "u2", name: "Jules Antonin", role: "Production & tournées", email: "jules@artemis-records.fr" },
  { id: "u3", name: "Inès Rocher", role: "Presse & communication", email: "ines@artemis-records.fr" },
];

export async function getDemos(): Promise<Demo[]> {
  return db.select().from(demos).orderBy(desc(demos.receivedAt));
}
export async function getDemands(): Promise<Demand[]> {
  return db.select().from(demands).orderBy(desc(demands.receivedAt));
}
export async function getSubscribers(): Promise<Subscriber[]> {
  return db.select().from(subscribers).orderBy(desc(subscribers.subscribedAt));
}

export const DEMO_STATUS_LABEL: Record<DemoStatus, string> = {
  nouveau: "Nouveau",
  ecoute: "À écouter",
  retenu: "Retenu",
  refuse: "Refusé",
};

export const DEMAND_CATEGORY_LABEL: Record<DemandCategory, string> = {
  presse: "Presse",
  booking: "Booking",
  partenariat: "Partenariat",
  licence: "Synchro / Licence",
  autre: "Autre",
};

export const DEMAND_STATUS_LABEL = {
  ouverte: "Ouverte",
  en_cours: "En cours",
  close: "Close",
} as const;
```

### Step 2 : Adapter les pages backoffice

Pour chacune des pages listées, changer les imports type `import { DEMOS } from "@/lib/adminData"` en `import { getDemos } from "@/lib/adminData"` et consommer via `await getDemos()` dans le composant (rendre le composant `async` s'il ne l'est pas). Idem `DEMANDS` → `getDemands()`, `SUBSCRIBERS` → `getSubscribers()`.

Si une page est un Client Component (`"use client"`), **la transformer temporairement** : déplacer les imports data vers un wrapper server (ex: garder la page elle-même `"use client"`, créer `page.server.tsx` qui fetch et passe en props). **Alternative plus simple pour Plan A** : convertir en Server Component si le composant n'a pas de hooks — ce qui est le cas de la plupart des backoffice pages (elles affichent en lecture seule).

**Pour chaque page backoffice**, la règle est : si elle contenait `const demos = DEMOS;`, écrire `const demos = await getDemos();` et marquer la fonction `async`. Les champs renommés (notamment `demos.received` → `demos.receivedAt: Date`) sont à convertir : `formatDate(d.receivedAt)` (la fonction accepte déjà un `Date` après Task 10).

Champs renommés en DB vs types legacy :
- `Demo.received` → `Demo.receivedAt` (Date)
- `Demand.received` → `Demand.receivedAt` (Date)
- `Subscriber.subscribed` → `Subscriber.subscribedAt` (Date)
- `Demo.assignedTo` reste `assignedTo` (même nom)
- `Demo.notes` : nouveau champ (nullable)

- [ ] **Step 3 : Typecheck full**

Run:
```bash
pnpm exec tsc --noEmit
```

Expected: **zéro erreur**.

- [ ] **Step 4 : Commit**

```bash
git add lib/adminData.ts app/backoffice
git commit -m "admin: backoffice pages read from DB via getDemos/getDemands/getSubscribers"
```

---

## Task 13 : Build + smoke test visuel

- [ ] **Step 1 : Build production**

Run:
```bash
pnpm build
```

Expected:
- Migration appliquée (no-op si déjà up-to-date)
- Next compile sans erreur
- `generateStaticParams` génère bien les pages artists/[id] et news/[id]
- Pas de warning "Dynamic server usage" sur les pages publiques

- [ ] **Step 2 : Start + smoke**

Run:
```bash
pnpm start &
```

Puis vérifier manuellement dans le navigateur à `http://localhost:3000` :
- [ ] `/` affiche les 2 artistes, les 3 news, avec les bonnes images (portraits = URLs Blob)
- [ ] `/artists` liste les 2 artistes
- [ ] `/artists/caelya` affiche la bio complète, discographie, shows, gallery
- [ ] `/artists/allicyone` idem
- [ ] `/news` liste 3 articles
- [ ] `/news/n1` affiche le body
- [ ] `/backoffice` → pas d'auth = accessible, les données demos/demandes viennent bien de la DB
- [ ] Arrêter le serveur : `kill %1` ou Ctrl-C

- [ ] **Step 3 : Commit final**

```bash
git add -A
git commit -m "plan-a: foundation DB + read path migrated to neon/blob" --allow-empty
```

---

## Self-Review (à lire avant de commencer l'exécution)

**Spec coverage :**
- ✅ §3 Modèle de données → Tasks 2–6
- ✅ §4 Stockage fichiers (upload + organisation) → Tasks 7–9 (uploads via seed ; suppression / remplacement = Plan B)
- ⏭️ §5 Auth backoffice → Plan B (pas dans ce plan)
- ✅ §6.1 Lecture Server Components → Tasks 10–11 (Cache Components volontairement reportés à Plan B)
- ⏭️ §6.2 Écriture Server Actions → Plan B
- ⏭️ §6.3 Validation Zod → Plan B (seulement côté écriture)
- ⏭️ §6.4 Anti-spam → Plan C
- ✅ §7.1 Environnements → Task 4 (prérequis user)
- ✅ §7.2 Migrations → Task 5 + build script `package.json`
- ✅ §7.3 Seed → Tasks 7–8
- ⏭️ §8.5 Auth+CRUD, §8.6 Soumissions → Plans B & C

**Placeholder scan :** un seul `/* REMPLACÉ AU STEP 2 */` dans le seed, qui est une instruction explicite à l'exécutant pour copier les données existantes — c'est intentionnel, pas un placeholder oublié.

**Type consistency :** 
- Champs renommés documentés dans Task 12 (`received` → `receivedAt`, `portrait` → `portraitUrl`, etc.).
- Types `Artist`, `NewsItem`, `Demo` ré-exportés depuis `lib/db/schema.ts` via `lib/data.ts` et `lib/adminData.ts` pour garder la compatibilité des imports.

**Hors scope noté pour Plans B et C :**
- Plan B : auth (next-auth + table `users`), Server Actions CRUD artistes/news, upload Blob depuis backoffice, Cache Components + `updateTag`, suppression Blob au delete DB.
- Plan C : Server Actions publiques (/demo, /contact, newsletter), BotID, rate-limit, validation Zod côté public.
