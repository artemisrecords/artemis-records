# Base de données & stockage fichiers

**Projet** : artemis-records
**Statut** : proposition, non implémenté
**Auteur** : Claude + Matheus
**Date** : 2026-04-23

---

## 1. Contexte & motivation

Aujourd'hui le site tourne 100 % statique : tout le contenu (`ARTISTS`, `NEWS`, `DEMOS`, `DEMANDS`, `SUBSCRIBERS`) est en dur dans `lib/data.ts` et `lib/adminData.ts`. Un backoffice est scaffoldé sous `app/backoffice/` avec des pages `artistes/`, `journal/`, `demos/`, `demandes/` + une page `auth/`. Mais rien n'est persisté.

**Objectifs de cette spec** :
1. Rendre le contenu éditable via le backoffice (CRUD artistes, journal, réponses aux démos/demandes).
2. Collecter les soumissions publiques : démos (page `/demo`), contact (`/contact`), newsletter (`NewsletterBand`).
3. Héberger les visuels (portraits artistes, covers, moodboards journal, uploads démos) ailleurs que dans `public/`.
4. Éviter l'auto-pause Supabase (contrainte utilisateur).

**Non-objectifs (out of scope pour v1)** :
- Multi-tenant.
- Edit collaboratif temps-réel.
- Versionning d'articles / drafts multiples.
- Recherche full-text sophistiquée (on peut s'en passer pour <100 artistes / <500 articles).

---

## 2. Choix de stack

| Couche | Choix | Pourquoi |
| --- | --- | --- |
| **Base relationnelle** | **Neon** (Postgres serverless) via Vercel Marketplace | Auto-suspend après 5 min mais **réveil automatique** en ~500 ms. Pas de pause manuelle. Free tier : 0.5 GB stockage, 190 h compute/mois. Branching git-like pour previews. |
| **Client DB** | **`drizzle-orm`** + `@neondatabase/serverless` | Typage fort (partage types avec Next.js), migrations versionnées, pas de runtime overhead façon Prisma. Driver HTTP serverless = zéro pool, compatible Fluid Compute. |
| **Stockage fichiers** | **Vercel Blob** (public mode par défaut) | 1 GB gratuit + 10 GB bandwidth/mois. Intégration native (`@vercel/blob`), URLs signées en 2 lignes. Alternative : Cloudinary si on veut transformations (pas nécessaire ici, Next/Image suffit). |
| **Auth backoffice** | **Clerk** (Marketplace Vercel) | Email + magic link suffisent pour 2-3 admins. Free tier : 10 000 MAU. Alternative plus légère : `next-auth` + table `users` dans Neon, à discuter. |
| **Env vars** | `vercel env pull` → `.env.local` | Auto-provision des `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `CLERK_*` via Marketplace. |

**Rejets explicites** :
- Supabase → auto-pause hebdo (problème utilisateur), même si stack techniquement équivalente.
- Prisma → lourdeur du runtime + codegen, overkill ici.
- PlanetScale → MySQL, pas de JSON natif aussi propre.
- Stockage images en `bytea` dans Postgres → gonfle la DB, ralentit les requêtes, coûte cher en transfert.

---

## 3. Modèle de données

Traduction directe des types TS existants (`lib/data.ts`, `lib/adminData.ts`) en tables Postgres. Les champs tableau / objet imbriqué (embeds, socials, tags, links) sont en **`jsonb`**, assez simples pour ne pas justifier de tables de jointure, assez structurés pour valider côté app.

### 3.1. Tables principales

```sql
-- Artistes (remplace lib/data.ts ARTISTS)
CREATE TABLE artists (
  id            text PRIMARY KEY,          -- slug, ex: "caelya"
  name          text NOT NULL,
  tagline       text NOT NULL,
  genre         text NOT NULL,             -- ligne résumé ("Folk · Pop onirique")
  signed_year   text NOT NULL,             -- "2025" (volontairement text, on n'en fait pas d'arithmétique)
  published     boolean NOT NULL DEFAULT false,
  portrait_url  text NOT NULL,             -- URL Vercel Blob
  cover_url     text NOT NULL,
  primary_color text,                      -- hex "#7800a8"
  quote         text,
  bio_short     text NOT NULL,
  bio_long      text NOT NULL,
  genres        jsonb NOT NULL DEFAULT '[]'::jsonb,  -- string[]
  socials       jsonb NOT NULL DEFAULT '{}'::jsonb,  -- Record<string,string>
  embeds        jsonb NOT NULL DEFAULT '[]'::jsonb,  -- Embed[]
  discography   jsonb NOT NULL DEFAULT '[]'::jsonb,  -- DiscoItem[] (cover_url dans chaque item)
  gallery       jsonb NOT NULL DEFAULT '[]'::jsonb,  -- string[] (URLs Blob)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Concerts (shows), table séparée car queryable par date
CREATE TABLE artist_shows (
  id          text PRIMARY KEY,
  artist_id   text NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  date        date NOT NULL,
  city        text NOT NULL,
  venue       text NOT NULL,
  status      text,                         -- "Complet" | "Billetterie ouverte" | "Gratuit" | "Annoncé"
  free        boolean NOT NULL DEFAULT false,
  ticket_url  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX artist_shows_date_idx ON artist_shows(date);
CREATE INDEX artist_shows_artist_idx ON artist_shows(artist_id);

-- Journal (remplace NEWS)
CREATE TABLE news (
  id          text PRIMARY KEY,             -- slug, ex: "alice-clip-devoile"
  published   boolean NOT NULL DEFAULT false,
  date        date NOT NULL,
  category    text NOT NULL,                -- "Sortie" | "Signature" | "Label" | ...
  title       text NOT NULL,
  excerpt     text NOT NULL,
  body        text NOT NULL,                -- markdown ou HTML (à trancher, voir §10)
  image_url   text NOT NULL,                -- Vercel Blob
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX news_date_idx ON news(date DESC) WHERE published = true;
```

### 3.2. Tables backoffice / soumissions

```sql
-- Démos reçues (public → via /demo)
CREATE TABLE demos (
  id           text PRIMARY KEY,            -- "dm-2041"
  artist       text NOT NULL,               -- nom d'artiste soumis (pas FK)
  contact      text NOT NULL,               -- nom de la personne
  email        text NOT NULL,
  city         text,
  genre        text,
  duration     text,                        -- "3 titres · 11 min"
  pitch        text NOT NULL,
  links        jsonb NOT NULL DEFAULT '[]'::jsonb,  -- {label,href}[]
  files        jsonb NOT NULL DEFAULT '[]'::jsonb,  -- uploads Vercel Blob {name, url, size}
  status       text NOT NULL DEFAULT 'nouveau',     -- nouveau|ecoute|retenu|refuse
  rating       smallint,                    -- 0–5
  tags         jsonb NOT NULL DEFAULT '[]'::jsonb,
  assigned_to  text,                        -- nom interne, pas FK pour l'instant
  notes        text,                        -- notes internes (pas dans le type public)
  received_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX demos_status_idx ON demos(status, received_at DESC);

-- Demandes (formulaire /contact)
CREATE TABLE demands (
  id           text PRIMARY KEY,
  category     text NOT NULL,               -- presse|booking|partenariat|licence|autre
  subject      text NOT NULL,
  name         text NOT NULL,
  org          text,
  email        text NOT NULL,
  phone        text,
  message      text NOT NULL,
  status       text NOT NULL DEFAULT 'ouverte',    -- ouverte|en_cours|close
  assigned_to  text,
  received_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX demands_status_idx ON demands(status, received_at DESC);

-- Abonnés newsletter (NewsletterBand)
CREATE TABLE subscribers (
  id            text PRIMARY KEY,           -- uuid
  email         text NOT NULL UNIQUE,
  name          text,
  tags          jsonb NOT NULL DEFAULT '[]'::jsonb,
  confirmed_at  timestamptz,                -- double opt-in, null = pas confirmé
  unsubscribed_at timestamptz,
  subscribed_at timestamptz NOT NULL DEFAULT now()
);
```

### 3.3. Typage côté app

Drizzle infère les types depuis le schema :

```ts
// lib/db/schema.ts
import { pgTable, text, boolean, jsonb, timestamp, date, smallint } from "drizzle-orm/pg-core";

export const artists = pgTable("artists", { /* ... */ });
export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;
```

Les pages existantes (`app/artists/[id]/page.tsx`, etc.) importent depuis `lib/db/schema.ts` au lieu de `lib/data.ts`. Les champs `jsonb` sont typés manuellement avec `.$type<Embed[]>()` côté Drizzle.

---

## 4. Stockage fichiers (Vercel Blob)

### 4.1. Organisation des chemins

```
artists/{slug}/portrait.webp
artists/{slug}/cover.webp
artists/{slug}/gallery/{uuid}.webp
artists/{slug}/discography/{releaseId}.webp
news/{slug}/hero.webp
demos/{demoId}/{uuid}-{filename}        # mp3/wav/zip, usage privé
moodboards/{uuid}.webp                  # déjà existant dans public/assets
```

### 4.2. Upload : deux modes

**Mode A · public (couvertures, portraits, moodboards)** :
- Upload via Server Action depuis le backoffice.
- `put(path, file, { access: "public", addRandomSuffix: false })`.
- Retourne URL CDN immuable (`https://<id>.public.blob.vercel-storage.com/...`).
- URL stockée en DB.

**Mode B · privé (démos audio)** :
- Upload direct client → Blob avec token signé (éviter de streamer via la fonction).
- `access: "public"` avec `randomSuffix: true` + URL non-devinable suffit pour le MVP (les URLs ne sont pas indexées).
- Alternative si besoin de vraies ACL : `access: "private"` + URL signée à chaque consultation backoffice.

### 4.3. Suppression

Trigger applicatif : quand on delete un artiste / un article, on appelle `del(urls)` avant le `DELETE` SQL (dans la même Server Action, ordre : Blob d'abord, DB ensuite ; si le Blob fail on ne casse pas la cohérence DB).

### 4.4. Remplacement d'image

Upload du nouveau Blob → update DB → delete de l'ancien. Pas d'optimistic concurrency, on suppose un seul admin à la fois.

---

## 5. Auth backoffice

**Clerk** via Marketplace Vercel :
1. Install integration → `CLERK_SECRET_KEY` + `CLERK_PUBLISHABLE_KEY` auto-provisionnés.
2. `middleware.ts` protège `/backoffice/**` :
   ```ts
   export default clerkMiddleware((auth, req) => {
     if (req.nextUrl.pathname.startsWith("/backoffice")) {
       auth.protect();
     }
   });
   export const config = { matcher: ["/backoffice/:path*"] };
   ```
3. La page `app/auth/page.tsx` actuelle (décorative, statique) est remplacée par un redirect vers Clerk hosted, OU on wire le formulaire existant à `clerk.signIn.create(...)` pour garder le design.
4. Whitelist : 2-3 admins créés à la main dans le dashboard Clerk. Pas de signup public.

**Décision ouverte** : garder le design actuel de `/auth` implique un peu de code custom Clerk. Alternative : rediriger vers l'UI Clerk hosted (moins joli mais zéro maintenance). Je propose **custom** pour préserver l'identité visuelle, qui est le cœur du projet.

---

## 6. Intégration Next.js 16

### 6.1. Lecture (pages publiques)

Server Components + Cache Components (Next 16) :

```tsx
// app/artists/[id]/page.tsx
import { db } from "@/lib/db";
import { artists } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from "next/cache";

async function getArtist(id: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`artist:${id}`);
  return db.select().from(artists).where(eq(artists.id, id)).limit(1);
}
```

`generateStaticParams()` lit la DB au build → toutes les pages artistes / news restent pré-rendues. Revalidation via `updateTag()` depuis le backoffice après chaque édition.

### 6.2. Écriture (backoffice + formulaires publics)

**Server Actions** uniquement, pas de route handlers :

```tsx
// app/backoffice/artistes/[id]/actions.ts
"use server";
export async function updateArtist(id: string, data: FormData) {
  // 1. validate (zod)
  // 2. uploads → Blob
  // 3. db.update(...)
  // 4. updateTag(`artist:${id}`); updateTag("artists:list");
  // 5. redirect
}
```

Les formulaires publics (`/demo`, `/contact`, `NewsletterBand`) appellent aussi des Server Actions qui `INSERT` dans `demos` / `demands` / `subscribers`, + envoi d'un email de notif (Resend via Marketplace, optionnel v1).

### 6.3. Validation

**Zod** côté Server Action (le seul endroit où ça compte, les données viennent d'Internet). Schémas co-localisés avec le schema Drizzle pour garder une source de vérité :

```ts
// lib/db/schema.ts
import { createInsertSchema } from "drizzle-zod";
export const insertDemoSchema = createInsertSchema(demos, { email: z.string().email() });
```

### 6.4. Anti-spam sur formulaires publics

- **Vercel BotID** sur `/demo` et `/contact` (GA, gratuit jusqu'à un certain volume).
- Rate-limit soft par IP via Upstash Redis (Marketplace) OU Runtime Cache API pour commencer (plus léger).

---

## 7. Environnements & workflow

### 7.1. Stratégie d'environnement

| Env | Branche Neon | Blob store | Clerk instance |
| --- | --- | --- | --- |
| **Local** | branche `dev` partagée OU `git branch preview` | `artemis-records-dev` | Clerk dev keys |
| **Preview** (PR) | branche Neon auto-créée par l'intégration Vercel | même que prod (public) / séparé (privé) | Clerk dev keys |
| **Prod** | branche `main` Neon | `artemis-records-prod` | Clerk prod keys |

Neon × Vercel provisionne automatiquement `DATABASE_URL` par environnement, et crée une **branche Neon éphémère par preview deployment**. Ça veut dire : chaque PR = DB isolée qui hérite d'un snapshot, on peut tester sans risque.

### 7.2. Migrations

`drizzle-kit` :
```bash
pnpm drizzle-kit generate   # diff schema → SQL
pnpm drizzle-kit migrate    # applique sur $DATABASE_URL
```

Hook `vercel-build` : `drizzle-kit migrate && next build`. Les migrations tournent automatiquement sur chaque deploy (preview compris, grâce au branching).

### 7.3. Seed

Script `scripts/seed.ts` qui importe les constantes existantes de `lib/data.ts` / `lib/adminData.ts`, les insère telles quelles, et upload les assets de `public/assets/` vers Blob. Lancé **une fois** après la première migration, puis `lib/data.ts` et `lib/adminData.ts` sont supprimés.

---

## 8. Plan de migration (étapes)

1. **Install & setup** (pas de change visible)
   - `pnpm add drizzle-orm @neondatabase/serverless @vercel/blob zod drizzle-zod`
   - `pnpm add -D drizzle-kit`
   - Créer `lib/db/{index.ts,schema.ts}`, `drizzle.config.ts`.
   - Installer Neon + Vercel Blob via Marketplace, puis `vercel env pull`.

2. **Schema & migrations**
   - Écrire `schema.ts` (§3), générer et appliquer la première migration sur la branche `dev` Neon.

3. **Seed**
   - Script d'import `lib/data.ts` → DB + upload `public/assets/*` → Blob.
   - Vérifier que les URLs Blob sont en DB, que tout matche visuellement.

4. **Swap lecture** (sans casser le site)
   - `lib/data.ts` exporte toujours les mêmes fonctions (`findArtist`, `findNews`), mais leur impl appelle Drizzle.
   - `ARTISTS` / `NEWS` (arrays) deviennent des fonctions async `getArtists()` / `getNews()`.
   - Adapter chaque `import { ARTISTS }` en `await getArtists()` dans les Server Components. Les pages restent SSG via `generateStaticParams`.
   - Build + test visuel sur preview.

5. **Auth + backoffice CRUD**
   - Clerk middleware.
   - Server Actions pour CRUD artistes, journal.
   - Upload Blob intégré aux formulaires.

6. **Soumissions publiques**
   - `/demo` → `INSERT demos` + upload Blob.
   - `/contact` → `INSERT demands`.
   - `NewsletterBand` → `INSERT subscribers` avec double opt-in (email de confirmation via Resend).

7. **Cleanup**
   - Supprimer `lib/data.ts`, `lib/adminData.ts`, `lib/tweaks.tsx` si non utilisé ailleurs.
   - Mettre à jour le README (§"Data & contenu" devient "DB & Blob").

---

## 9. Coûts & quotas (estimation free tier)

| Ressource | Quota free | Consommation estimée (v1, site vitrine label) | Marge |
| --- | --- | --- | --- |
| Neon stockage | 0.5 GB | ~5 MB (10 artistes, 100 articles, 1000 démos text) | 100× |
| Neon compute | 190 h/mois | ~30 h (auto-suspend 5 min) | 6× |
| Vercel Blob | 1 GB | ~200 MB (photos artistes + covers + moodboards) | 5× |
| Vercel Blob bandwidth | 10 GB/mois | <1 GB (site BtoB très faible traffic) | 10× |
| Clerk MAU | 10 000 | 3 (admins) | énorme |
| Vercel Functions | 100 h actif / 1M invocations | négligeable | énorme |

**Verdict** : tout free tier suffit largement pour la v1, et même pour 12-24 mois d'exploitation normale.

---

## 10. Questions ouvertes / décisions à prendre

1. **Format body journal** : markdown (parser côté serveur avec `remark`) ou HTML rich-text (éditeur type Tiptap dans le backoffice) ? → proposition : **markdown** (plus simple, versionnable, import facile).
2. **Clerk vs next-auth** : Clerk = plus cher mais zéro maintenance. next-auth + table `users` = plus de code, mais 100 % gratuit et sous contrôle. Pour 2-3 admins, next-auth est probablement préférable → à trancher.
3. **IDs artistes/articles** : garder des slugs humains (`caelya`, `alice-clip-devoile`) ou passer en UUID ? → **slugs** recommandés, URLs déjà publiques.
4. **Conservation des données** : RGPD, abonnés newsletter (double opt-in, lien unsubscribe obligatoire), demandes (purge après 3 ans ?), démos refusées (purge après 1 an ?). À documenter dans `/privacy`.
5. **Notif email** : Resend via Marketplace (3000 emails/mois gratuits) pour : confirmation newsletter, accusé réception démo, notif admin nouvelle demande. À cadrer v1 vs v2.
6. **Admin editing UX** : l'existant dans `app/backoffice/` est purement visuel aujourd'hui. Les Server Actions à plugger sur quels composants exactement ? À lister après lecture détaillée des pages backoffice.

---

## 11. Out of scope (noté pour plus tard)

- Webhooks Spotify / YouTube (auto-sync discographie) : v2.
- Agenda Google Cal sync pour `artist_shows`.
- Multi-langue (FR → EN).
- Analytics contenu (quels articles / artistes sont le plus lus).
- Versionning drafts articles (publier un brouillon sans écraser la version en ligne).

---

## 12. Résumé : TL;DR

**Neon (Postgres) + Drizzle + Vercel Blob + Clerk**, tout via Vercel Marketplace pour l'auto-provision des env vars. Migrations `drizzle-kit` lancées au build. Preview deploys utilisent des branches Neon isolées. Toutes les mutations passent par des Server Actions avec validation Zod. Assets visuels en Blob, URLs stockées en DB. Free tier suffisant pour 12-24 mois. Migration incrémentale en 7 étapes pour ne rien casser visuellement.
