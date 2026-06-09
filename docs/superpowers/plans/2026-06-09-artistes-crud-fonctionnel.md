# Artistes fonctionnel — CRUD + uploads — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the backoffice Artistes section fully persist all six edit tabs plus create/delete, with image uploads to Vercel Blob.

**Architecture:** Mirror the existing démos pattern — Zod validation (`lib/validation/`) → focused mutations (`lib/db/*-mutations.ts`) → per-tab `"use server"` actions (`app/backoffice/artistes/actions.ts`) → `revalidatePath`. Each edit tab in `ArtistEditClient` becomes a self-contained form/section with its own save action and status line (like the newsletter sub-form already there). Images use Vercel Blob **client upload** via a token route, so they bypass the ~4.5 MB server-action cap.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, Drizzle ORM (Neon HTTP), Zod 4, `@vercel/blob` 2.3.3, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-06-09-artistes-crud-fonctionnel-design.md`

---

## File Structure

| File | Responsibility | Created / Modified |
|---|---|---|
| `lib/slug.ts` | Pure `slugify()` helper | Create |
| `lib/slug.test.ts` | Unit tests for slugify | Create |
| `lib/validation/artist.ts` | Zod schemas per editable unit | Create |
| `lib/validation/artist.test.ts` | Unit tests for schemas | Create |
| `lib/db/artist-mutations.ts` | DB writes (create/update/replace/delete + shows) | Create |
| `app/api/blob/upload/route.ts` | Blob client-upload token endpoint | Create |
| `app/backoffice/artistes/actions.ts` | Per-tab server actions | Create |
| `app/backoffice/artistes/nouveau/NouvelArtisteClient.tsx` | Create-form client wired to action | Create |
| `app/backoffice/artistes/nouveau/page.tsx` | Render the create client | Modify |
| `app/backoffice/artistes/[id]/ArtistEditClient.tsx` | Per-tab controlled UI + saves | Modify |

Notes for the engineer:
- Database mutations and server actions touch a live Neon DB and React Server Action runtime, so they are verified with `pnpm lint` + `pnpm exec tsc --noEmit` + manual checks, not unit tests. Only the pure functions (`slugify`, validation schemas) are unit-tested.
- Per memory: it is OK to migrate/seed the **dev** database only — never preview/prod. No schema migration is needed for this plan (all columns already exist).
- Run single test files with `pnpm exec vitest run <path>`.

---

## Task 1: `slugify` helper

**Files:**
- Create: `lib/slug.ts`
- Test: `lib/slug.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/slug.test.ts
import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and dashes spaces", () => {
    expect(slugify("Nova Aeon")).toBe("nova-aeon");
  });
  it("strips accents", () => {
    expect(slugify("Caëlya")).toBe("caelya");
  });
  it("trims punctuation and collapses separators", () => {
    expect(slugify("  Allicyone !! Live  ")).toBe("allicyone-live");
  });
  it("returns empty string for punctuation-only input", () => {
    expect(slugify("!!!")).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/slug.test.ts`
Expected: FAIL — `Failed to resolve import "./slug"` / `slugify is not a function`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/slug.ts
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/slug.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/slug.ts lib/slug.test.ts
git commit -m "feat(artistes): add slugify helper"
```

---

## Task 2: Validation schemas

**Files:**
- Create: `lib/validation/artist.ts`
- Test: `lib/validation/artist.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/validation/artist.test.ts
import { describe, it, expect } from "vitest";
import {
  identitySchema,
  bioSchema,
  discoItemSchema,
  showSchema,
  embedSchema,
  createArtistSchema,
} from "./artist";

describe("identitySchema", () => {
  const valid = {
    name: "Nova",
    tagline: "Pop onirique",
    genre: "Pop",
    signedYear: "2026",
    primaryColor: "#cc2244",
    quote: "",
    genres: ["Pop", "Folk"],
  };
  it("accepts a valid identity and trims name", () => {
    const r = identitySchema.safeParse({ ...valid, name: "  Nova  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("Nova");
  });
  it("rejects an empty name", () => {
    expect(identitySchema.safeParse({ ...valid, name: "  " }).success).toBe(false);
  });
  it("rejects an invalid hex color", () => {
    expect(identitySchema.safeParse({ ...valid, primaryColor: "rouge" }).success).toBe(false);
  });
  it("allows an empty color", () => {
    expect(identitySchema.safeParse({ ...valid, primaryColor: "" }).success).toBe(true);
  });
});

describe("bioSchema", () => {
  it("rejects a short bio over 280 chars", () => {
    const r = bioSchema.safeParse({ bioShort: "x".repeat(281), bioLong: "ok" });
    expect(r.success).toBe(false);
  });
  it("accepts valid bios", () => {
    expect(bioSchema.safeParse({ bioShort: "court", bioLong: "long" }).success).toBe(true);
  });
});

describe("discoItemSchema", () => {
  const valid = { id: "d1", kind: "Album", title: "Aurore", year: "2025", cover: "https://x/y.jpg", note: "" };
  it("accepts a valid item", () => {
    expect(discoItemSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects a non-url cover", () => {
    expect(discoItemSchema.safeParse({ ...valid, cover: "y.jpg" }).success).toBe(false);
  });
});

describe("showSchema", () => {
  const valid = { date: "2026-07-01", city: "Paris", venue: "La Cigale", status: "Complet", free: false, ticketUrl: "" };
  it("accepts a valid show", () => {
    expect(showSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects a malformed date", () => {
    expect(showSchema.safeParse({ ...valid, date: "01/07/2026" }).success).toBe(false);
  });
});

describe("embedSchema", () => {
  it("accepts spotify/youtube only", () => {
    expect(embedSchema.safeParse({ type: "spotify", title: "T", src: "https://open.spotify.com/x" }).success).toBe(true);
    expect(embedSchema.safeParse({ type: "soundcloud", title: "T", src: "https://x/y" }).success).toBe(false);
  });
});

describe("createArtistSchema", () => {
  it("requires only a name", () => {
    expect(createArtistSchema.safeParse({ name: "Nova" }).success).toBe(true);
  });
  it("rejects an empty name", () => {
    expect(createArtistSchema.safeParse({ name: "  " }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/validation/artist.test.ts`
Expected: FAIL — `Failed to resolve import "./artist"`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/validation/artist.ts
import { z } from "zod";

// Regex maison, cohérent avec lib/validation/demo.ts (indépendant des variations
// d'API url()/email() entre versions de Zod).
const URL_RE = /^https?:\/\/[^\s]+/i;
const HEX_RE = /^#?[0-9a-fA-F]{3,8}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const url = z.string().trim().refine((v) => URL_RE.test(v), "URL invalide (commencez par http…).");
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine((v) => v === "" || URL_RE.test(v), "URL invalide.");

export const identitySchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  tagline: z.string().trim().default(""),
  genre: z.string().trim().default(""),
  signedYear: z.string().trim().default(""),
  primaryColor: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || HEX_RE.test(v), "Couleur hex invalide (ex. #cc2244)."),
  quote: z.string().trim().optional().default(""),
  genres: z.array(z.string().trim().min(1)).default([]),
});
export type IdentityInput = z.infer<typeof identitySchema>;

export const bioSchema = z.object({
  bioShort: z.string().trim().max(280, "La bio courte doit faire 280 caractères max.").default(""),
  bioLong: z.string().trim().default(""),
});
export type BioInput = z.infer<typeof bioSchema>;

export const discoItemSchema = z.object({
  id: z.string().min(1),
  kind: z.string().trim().min(1, "Type requis."),
  title: z.string().trim().min(1, "Titre requis."),
  year: z.string().trim().min(1, "Année requise."),
  cover: url,
  note: z.string().trim().optional().default(""),
});
export const discographySchema = z.array(discoItemSchema);

export const showSchema = z.object({
  date: z.string().trim().refine((v) => DATE_RE.test(v), "Date au format AAAA-MM-JJ."),
  city: z.string().trim().min(1, "Ville requise."),
  venue: z.string().trim().min(1, "Lieu requis."),
  status: z.string().trim().optional().default(""),
  free: z.boolean().default(false),
  ticketUrl: optionalUrl,
});
export type ShowInput = z.infer<typeof showSchema>;

export const embedSchema = z.object({
  type: z.enum(["spotify", "youtube"]),
  title: z.string().trim().min(1, "Titre requis."),
  src: url,
});
export const embedsSchema = z.array(embedSchema);

export const socialsSchema = z.record(
  z.string().trim().min(1),
  z.string().trim().refine((v) => v === "" || URL_RE.test(v), "URL invalide."),
);

export const createArtistSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  slug: z.string().trim().optional().default(""),
  tagline: z.string().trim().optional().default(""),
  genre: z.string().trim().optional().default(""),
  signedYear: z.string().trim().optional().default(""),
  bioShort: z.string().trim().max(280).optional().default(""),
});
export type CreateArtistInput = z.infer<typeof createArtistSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/validation/artist.test.ts`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Commit**

```bash
git add lib/validation/artist.ts lib/validation/artist.test.ts
git commit -m "feat(artistes): add Zod validation schemas"
```

---

## Task 3: DB mutations

**Files:**
- Create: `lib/db/artist-mutations.ts`

No unit test (live DB). Verified by type-check in Step 2 and exercised through actions later.

- [ ] **Step 1: Write the implementation**

```ts
// lib/db/artist-mutations.ts
import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { artists, artistShows } from "./schema";
import type { DiscoItem, Embed } from "./schema";
import type { ArtistShow } from "./schema";
import { slugify } from "@/lib/slug";

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "artiste";
  let candidate = root;
  let n = 2;
  // Boucle bornée : on s'arrête dès qu'aucune ligne ne porte cet id.
  while (true) {
    const [hit] = await db
      .select({ id: artists.id })
      .from(artists)
      .where(eq(artists.id, candidate))
      .limit(1);
    if (!hit) return candidate;
    candidate = `${root}-${n++}`;
  }
}

export async function createArtist(input: {
  name: string;
  slug?: string;
  tagline?: string;
  genre?: string;
  signedYear?: string;
  bioShort?: string;
}): Promise<string> {
  const id = await uniqueSlug(input.slug && input.slug.length > 0 ? input.slug : input.name);
  await db.insert(artists).values({
    id,
    name: input.name,
    tagline: input.tagline ?? "",
    genre: input.genre ?? "",
    signedYear: input.signedYear ?? "",
    published: false,
    portraitUrl: "",
    coverUrl: "",
    bioShort: input.bioShort ?? "",
    bioLong: "",
  });
  return id;
}

export async function updateIdentity(
  id: string,
  data: {
    name: string;
    tagline: string;
    genre: string;
    signedYear: string;
    primaryColor: string;
    quote: string;
    genres: string[];
  },
): Promise<void> {
  await db
    .update(artists)
    .set({
      name: data.name,
      tagline: data.tagline,
      genre: data.genre,
      signedYear: data.signedYear,
      primaryColor: data.primaryColor === "" ? null : data.primaryColor,
      quote: data.quote === "" ? null : data.quote,
      genres: data.genres,
      updatedAt: new Date(),
    })
    .where(eq(artists.id, id));
}

export async function updateBio(
  id: string,
  data: { bioShort: string; bioLong: string },
): Promise<void> {
  await db
    .update(artists)
    .set({ bioShort: data.bioShort, bioLong: data.bioLong, updatedAt: new Date() })
    .where(eq(artists.id, id));
}

export async function setPublished(id: string, published: boolean): Promise<void> {
  await db
    .update(artists)
    .set({ published, updatedAt: new Date() })
    .where(eq(artists.id, id));
}

export async function replaceDiscography(id: string, items: DiscoItem[]): Promise<void> {
  await db
    .update(artists)
    .set({ discography: items, updatedAt: new Date() })
    .where(eq(artists.id, id));
}

export async function replaceEmbeds(id: string, items: Embed[]): Promise<void> {
  await db
    .update(artists)
    .set({ embeds: items, updatedAt: new Date() })
    .where(eq(artists.id, id));
}

export async function replaceSocials(
  id: string,
  socials: Record<string, string>,
): Promise<void> {
  await db
    .update(artists)
    .set({ socials, updatedAt: new Date() })
    .where(eq(artists.id, id));
}

export async function setMedia(
  id: string,
  media: { portraitUrl?: string; coverUrl?: string; gallery?: string[] },
): Promise<void> {
  const patch: Partial<typeof artists.$inferInsert> = { updatedAt: new Date() };
  if (media.portraitUrl !== undefined) patch.portraitUrl = media.portraitUrl;
  if (media.coverUrl !== undefined) patch.coverUrl = media.coverUrl;
  if (media.gallery !== undefined) patch.gallery = media.gallery;
  await db.update(artists).set(patch).where(eq(artists.id, id));
}

export async function upsertShow(
  artistId: string,
  show: {
    id?: string;
    date: string;
    city: string;
    venue: string;
    status: string;
    free: boolean;
    ticketUrl: string;
  },
): Promise<string> {
  if (show.id) {
    await db
      .update(artistShows)
      .set({
        date: show.date,
        city: show.city,
        venue: show.venue,
        status: show.status === "" ? null : show.status,
        free: show.free,
        ticketUrl: show.ticketUrl === "" ? null : show.ticketUrl,
      })
      .where(eq(artistShows.id, show.id));
    return show.id;
  }
  const id = randomUUID();
  await db.insert(artistShows).values({
    id,
    artistId,
    date: show.date,
    city: show.city,
    venue: show.venue,
    status: show.status === "" ? null : show.status,
    free: show.free,
    ticketUrl: show.ticketUrl === "" ? null : show.ticketUrl,
  });
  return id;
}

export async function deleteShow(showId: string): Promise<void> {
  await db.delete(artistShows).where(eq(artistShows.id, showId));
}

export async function deleteArtist(id: string): Promise<void> {
  // Cascade sur artist_shows (FK onDelete: "cascade").
  await db.delete(artists).where(eq(artists.id, id));
}

export type { ArtistShow };
```

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm exec tsc --noEmit`
Expected: No errors referencing `lib/db/artist-mutations.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/db/artist-mutations.ts
git commit -m "feat(artistes): add DB mutations (create/update/replace/shows/delete)"
```

---

## Task 4: Blob client-upload token route

**Files:**
- Create: `app/api/blob/upload/route.ts`

Reference Vercel Blob client-upload docs if needed (`@vercel/blob/client` → `handleUpload`).

- [ ] **Step 1: Write the implementation**

```ts
// app/api/blob/upload/route.ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// Reçoit la requête signée du navigateur (`upload()` côté client), restreint le
// chemin et les types autorisés, renvoie un token d'upload direct vers Blob.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("artists/")) {
          throw new Error("Chemin d'upload non autorisé.");
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
          maximumSizeInBytes: 8 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // L'URL est persistée côté client via l'action saveMedia ; rien à faire ici.
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
```

- [ ] **Step 2: Verify it type-checks and lints**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: No errors for `app/api/blob/upload/route.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/api/blob/upload/route.ts
git commit -m "feat(artistes): add Blob client-upload token route"
```

---

## Task 5: Server actions

**Files:**
- Create: `app/backoffice/artistes/actions.ts`

- [ ] **Step 1: Write the implementation**

```ts
// app/backoffice/artistes/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  identitySchema,
  bioSchema,
  discographySchema,
  embedsSchema,
  socialsSchema,
  showSchema,
  createArtistSchema,
} from "@/lib/validation/artist";
import * as m from "@/lib/db/artist-mutations";

export type ActionResult = { ok: true } | { ok: false; error: string };

function firstError(issues: { message: string }[]): string {
  return issues[0]?.message ?? "Données invalides.";
}

function revalidateArtist(id: string) {
  revalidatePath("/backoffice/artistes");
  revalidatePath(`/backoffice/artistes/${id}`);
  revalidatePath("/artists");
  revalidatePath("/artists/[id]", "page");
}

export async function saveIdentity(id: string, input: unknown): Promise<ActionResult> {
  const parsed = identitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await m.updateIdentity(id, parsed.data);
  revalidateArtist(id);
  return { ok: true };
}

export async function saveBio(id: string, input: unknown): Promise<ActionResult> {
  const parsed = bioSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await m.updateBio(id, parsed.data);
  revalidateArtist(id);
  return { ok: true };
}

export async function setArtistPublished(id: string, published: boolean): Promise<ActionResult> {
  await m.setPublished(id, published);
  revalidateArtist(id);
  return { ok: true };
}

export async function saveDiscography(id: string, items: unknown): Promise<ActionResult> {
  const parsed = discographySchema.safeParse(items);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await m.replaceDiscography(id, parsed.data);
  revalidateArtist(id);
  return { ok: true };
}

export async function saveEmbeds(id: string, items: unknown): Promise<ActionResult> {
  const parsed = embedsSchema.safeParse(items);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await m.replaceEmbeds(id, parsed.data);
  revalidateArtist(id);
  return { ok: true };
}

export async function saveSocials(id: string, socials: unknown): Promise<ActionResult> {
  const parsed = socialsSchema.safeParse(socials);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await m.replaceSocials(id, parsed.data);
  revalidateArtist(id);
  return { ok: true };
}

export async function saveShow(artistId: string, input: unknown): Promise<ActionResult> {
  const parsed = showSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  const id =
    typeof (input as { id?: unknown })?.id === "string"
      ? (input as { id: string }).id
      : undefined;
  await m.upsertShow(artistId, { ...parsed.data, id });
  revalidateArtist(artistId);
  return { ok: true };
}

export async function removeShow(artistId: string, showId: string): Promise<ActionResult> {
  await m.deleteShow(showId);
  revalidateArtist(artistId);
  return { ok: true };
}

export async function saveMedia(
  id: string,
  media: { portraitUrl?: string; coverUrl?: string; gallery?: string[] },
): Promise<ActionResult> {
  await m.setMedia(id, media);
  revalidateArtist(id);
  return { ok: true };
}

export async function archiveArtist(id: string, confirm: string): Promise<ActionResult> {
  if (confirm.trim().toLowerCase() !== "oui") {
    return { ok: false, error: "Tapez « oui » pour confirmer la suppression." };
  }
  await m.deleteArtist(id);
  revalidatePath("/backoffice/artistes");
  revalidatePath("/artists");
  redirect("/backoffice/artistes");
}

export async function createArtistAction(input: unknown): Promise<ActionResult> {
  const parsed = createArtistSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  const id = await m.createArtist(parsed.data);
  revalidatePath("/backoffice/artistes");
  redirect(`/backoffice/artistes/${id}`);
}
```

- [ ] **Step 2: Verify it type-checks and lints**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: No errors for `app/backoffice/artistes/actions.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/backoffice/artistes/actions.ts
git commit -m "feat(artistes): add per-tab server actions"
```

---

## Task 6: Wire the create page

**Files:**
- Create: `app/backoffice/artistes/nouveau/NouvelArtisteClient.tsx`
- Modify: `app/backoffice/artistes/nouveau/page.tsx`

The current `nouveau/page.tsx` is a client component with an inert form. We split it: a thin server `page.tsx` rendering a client that calls `createArtistAction`. Keep the existing markup; only wire the primary form fields + submit.

- [ ] **Step 1: Create the client component**

```tsx
// app/backoffice/artistes/nouveau/NouvelArtisteClient.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AdminBtn,
  AdminEyebrow,
  AdminField,
  AdminTextarea,
  PageHeader,
} from "@/components/admin/AdminPrimitives";
import { createArtistAction } from "@/app/backoffice/artistes/actions";

export default function NouvelArtisteClient() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    start(async () => {
      const res = await createArtistAction({
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        tagline: String(formData.get("tagline") ?? ""),
        genre: String(formData.get("genre") ?? ""),
        signedYear: String(formData.get("signedYear") ?? ""),
        bioShort: String(formData.get("bioShort") ?? ""),
      });
      // En cas de succès, createArtistAction redirige et ne renvoie rien.
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle">
        <Link href="/backoffice/artistes" className="hover:text-ink">
          ← Roster
        </Link>
      </div>

      <PageHeader
        eyebrow="Nouvelle signature"
        title="Créer une fiche artiste"
        italic="L'essentiel d'abord. Vous pourrez enrichir la fiche plus tard."
      />

      <form action={onSubmit} className="bg-paper-soft border border-ink/10 rounded-[2px] p-7 max-w-[760px]">
        <AdminEyebrow className="mb-4">Identité</AdminEyebrow>
        <div className="grid grid-cols-2 gap-4">
          <AdminField name="name" label="Nom d'artiste" placeholder="Caëlya, Allicyone…" />
          <AdminField
            name="slug"
            label="Slug URL"
            placeholder="genere-automatiquement"
            hint="Laissez vide pour générer depuis le nom. Définitif une fois créé."
          />
        </div>
        <AdminField name="tagline" label="Accroche" placeholder="Folk mythologique…" />
        <div className="grid grid-cols-2 gap-4">
          <AdminField name="genre" label="Genre principal" placeholder="Folk · Pop onirique" />
          <AdminField name="signedYear" label="Année de signature" placeholder="2026" />
        </div>
        <AdminTextarea
          name="bioShort"
          label="Bio courte (≤ 280 caractères)"
          rows={3}
          placeholder="Deux phrases qui donnent envie d'en savoir plus."
        />

        {error && (
          <div className="mb-3 font-serif text-[12px] text-magenta">{error}</div>
        )}

        <div className="flex items-center gap-3 pt-4 mt-2 border-t border-ink/10">
          <AdminBtn kind="accent" type="submit" disabled={pending}>
            {pending ? "Création…" : "Créer la fiche"}
          </AdminBtn>
          <Link
            href="/backoffice/artistes"
            className="font-serif italic text-[13px] text-ink-muted hover:text-ink"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Replace the page to render the client**

```tsx
// app/backoffice/artistes/nouveau/page.tsx
import NouvelArtisteClient from "./NouvelArtisteClient";

export default function NouvelArtistePage() {
  return <NouvelArtisteClient />;
}
```

- [ ] **Step 3: Verify type-check + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: No errors for the two files.

- [ ] **Step 4: Manual verification**

Run: `pnpm dev`, open `http://localhost:3000/backoffice/artistes/nouveau`, submit with a name only.
Expected: redirect to `/backoffice/artistes/<slug>`; the new artist appears in the roster list.

- [ ] **Step 5: Commit**

```bash
git add app/backoffice/artistes/nouveau/NouvelArtisteClient.tsx app/backoffice/artistes/nouveau/page.tsx
git commit -m "feat(artistes): wire create form to createArtistAction"
```

---

## Task 7: Edit client — shared save hook + Identité & Bio tabs

**Files:**
- Modify: `app/backoffice/artistes/[id]/ArtistEditClient.tsx`

This task changes the prop type to the DB shape, adds a small reusable save hook, and wires the **Identité** and **Bio** tabs. Genres become a controlled chip list.

- [ ] **Step 1: Update imports and prop type**

Replace lines 1–27 (the imports + the start of `export function ArtistEditClient`) with:

```tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AdminBtn,
  AdminEyebrow,
  AdminField,
  AdminTextarea,
  Pill,
} from "@/components/admin/AdminPrimitives";
import { saveArtistNewsletter } from "@/app/backoffice/newsletter/actions";
import {
  saveIdentity,
  saveBio,
  setArtistPublished,
} from "@/app/backoffice/artistes/actions";
import type { ArtistWithShows } from "@/lib/db/queries";

type Tab = "identite" | "bio" | "discographie" | "agenda" | "reseaux" | "medias";

const TABS: { k: Tab; label: string }[] = [
  { k: "identite", label: "Identité" },
  { k: "bio", label: "Biographie" },
  { k: "discographie", label: "Discographie" },
  { k: "agenda", label: "Concerts" },
  { k: "reseaux", label: "Réseaux" },
  { k: "medias", label: "Médias" },
];

type Status = { tone: "ok" | "error"; message: string } | null;

// Petit bandeau de statut réutilisé par chaque onglet.
function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <div
      className={`mt-2 font-serif text-[12px] ${
        status.tone === "ok" ? "text-vert-foret-700" : "text-magenta"
      }`}
    >
      {status.message}
    </div>
  );
}

export function ArtistEditClient({ artist }: { artist: ArtistWithShows }) {
```

- [ ] **Step 2: Replace the component state block**

Replace the existing state declarations (old lines 28–46, the `useState`/`useTransition` block and `saveNewsletter`) with:

```tsx
  const [tab, setTab] = useState<Tab>("identite");

  // Publication (action instantanée).
  const [published, setPublished] = useState(artist.published);
  const [pubPending, startPub] = useTransition();
  const togglePublished = (next: boolean) => {
    setPublished(next);
    startPub(async () => {
      const res = await setArtistPublished(artist.id, next);
      if (!res.ok) setPublished(!next); // rollback visuel si échec
    });
  };

  // Identité.
  const [genres, setGenres] = useState<string[]>(artist.genres);
  const [newGenre, setNewGenre] = useState("");
  const [identityStatus, setIdentityStatus] = useState<Status>(null);
  const [identityPending, startIdentity] = useTransition();

  // Bio.
  const [bioStatus, setBioStatus] = useState<Status>(null);
  const [bioPending, startBio] = useTransition();

  // Newsletter (existant).
  const [newsletterUrl, setNewsletterUrl] = useState(artist.newsletterUrl ?? "");
  const [nlStatus, setNlStatus] = useState<Status>(null);
  const [nlPending, startNlTransition] = useTransition();

  const saveNewsletter = () => {
    setNlStatus(null);
    startNlTransition(async () => {
      const res = await saveArtistNewsletter({ artistId: artist.id, url: newsletterUrl });
      setNlStatus(
        res.ok
          ? { tone: "ok", message: "Lien enregistré." }
          : { tone: "error", message: res.error },
      );
    });
  };

  const submitIdentity = (formData: FormData) => {
    setIdentityStatus(null);
    startIdentity(async () => {
      const res = await saveIdentity(artist.id, {
        name: String(formData.get("name") ?? ""),
        tagline: String(formData.get("tagline") ?? ""),
        genre: String(formData.get("genre") ?? ""),
        signedYear: String(formData.get("signedYear") ?? ""),
        primaryColor: String(formData.get("primaryColor") ?? ""),
        quote: String(formData.get("quote") ?? ""),
        genres,
      });
      setIdentityStatus(
        res.ok
          ? { tone: "ok", message: "Identité enregistrée." }
          : { tone: "error", message: res.error },
      );
    });
  };

  const submitBio = (formData: FormData) => {
    setBioStatus(null);
    startBio(async () => {
      const res = await saveBio(artist.id, {
        bioShort: String(formData.get("bioShort") ?? ""),
        bioLong: String(formData.get("bioLong") ?? ""),
      });
      setBioStatus(
        res.ok
          ? { tone: "ok", message: "Biographie enregistrée." }
          : { tone: "error", message: res.error },
      );
    });
  };

  const addGenre = () => {
    const g = newGenre.trim();
    if (g && !genres.includes(g)) setGenres([...genres, g]);
    setNewGenre("");
  };
```

- [ ] **Step 3: Wire the publish toggle**

In the header bar, replace the publish `<input>`'s `onChange` (old line 108) so it calls the action, and disable during the transition:

```tsx
              <input
                type="checkbox"
                checked={published}
                disabled={pubPending}
                onChange={(e) => togglePublished(e.target.checked)}
                className="sr-only"
              />
```

Also remove the misleading top-right "Enregistrer les modifications" button (old lines 119–122) and replace with a hint:

```tsx
          <div className="flex gap-2 items-center">
            <span className="font-serif italic text-[12px] text-ink-subtle">
              Chaque onglet s'enregistre séparément.
            </span>
          </div>
```

- [ ] **Step 4: Replace the Identité tab block**

Replace the whole `{tab === "identite" && ( … )}` block (old lines 151–199) with:

```tsx
          {tab === "identite" && (
            <form action={submitIdentity}>
              <AdminEyebrow className="mb-4">Identité du projet</AdminEyebrow>
              <div className="grid grid-cols-2 gap-4">
                <AdminField name="name" label="Nom d'artiste" defaultValue={artist.name} />
                <AdminField
                  label="Slug URL"
                  defaultValue={artist.id}
                  hint="Définitif (clé publique). Non modifiable."
                />
              </div>
              <AdminField name="tagline" label="Accroche (tagline)" defaultValue={artist.tagline} />
              <div className="grid grid-cols-2 gap-4">
                <AdminField name="genre" label="Genre principal" defaultValue={artist.genre} />
                <AdminField name="signedYear" label="Année de signature" defaultValue={artist.signedYear} />
              </div>
              <AdminField
                name="primaryColor"
                label="Couleur signature (hex)"
                defaultValue={artist.primaryColor ?? ""}
                hint="Utilisée sur la page publique comme accent."
              />
              <AdminTextarea name="quote" label="Citation en exergue" rows={2} defaultValue={artist.quote ?? ""} />
              <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                {genres.map((g) => (
                  <span
                    key={g}
                    className="text-[11px] tracking-[0.12em] uppercase font-bold text-ink-muted bg-ink/6 px-2.5 py-1 rounded-full"
                  >
                    {g}{" "}
                    <button
                      type="button"
                      onClick={() => setGenres(genres.filter((x) => x !== g))}
                      className="text-ink-subtle hover:text-magenta cursor-pointer"
                      aria-label={`Retirer ${g}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addGenre();
                    }
                  }}
                  placeholder="Ajouter un genre"
                  className="text-[12px] bg-paper-soft border border-ink/15 px-2.5 py-1 rounded-full outline-none focus:border-magenta"
                />
              </div>
              <div className="mt-5 flex items-center gap-3">
                <AdminBtn kind="accent" type="submit" disabled={identityPending}>
                  {identityPending ? "…" : "Enregistrer l'identité"}
                </AdminBtn>
              </div>
              <StatusLine status={identityStatus} />
            </form>
          )}
```

- [ ] **Step 5: Replace the Bio tab block**

Replace the whole `{tab === "bio" && ( … )}` block (old lines 201–219) with:

```tsx
          {tab === "bio" && (
            <form action={submitBio}>
              <AdminEyebrow className="mb-4">Biographie</AdminEyebrow>
              <AdminTextarea name="bioShort" label="Bio courte (carte)" rows={3} defaultValue={artist.bioShort} />
              <AdminTextarea name="bioLong" label="Bio longue (fiche)" rows={10} defaultValue={artist.bioLong} />
              <div className="italic text-[12px] text-ink-subtle">
                Markdown léger accepté : *italique*, **gras**, double saut de ligne pour paragraphes.
              </div>
              <div className="mt-5 flex items-center gap-3">
                <AdminBtn kind="accent" type="submit" disabled={bioPending}>
                  {bioPending ? "…" : "Enregistrer la biographie"}
                </AdminBtn>
              </div>
              <StatusLine status={bioStatus} />
            </form>
          )}
```

- [ ] **Step 6: Verify type-check + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: No errors. (The Discographie/Concerts/Médias blocks still render read-only — that is fine; they are wired in later tasks.)

- [ ] **Step 7: Manual verification**

`pnpm dev` → open an artist edit page → change the tagline, add a genre, Save → reload: change persists. Toggle publication → reload: state persists, and `/artists/<id>` reflects published state.

- [ ] **Step 8: Commit**

```bash
git add app/backoffice/artistes/[id]/ArtistEditClient.tsx
git commit -m "feat(artistes): wire Identité, Bio tabs and publish toggle"
```

---

## Task 8: Réseaux tab — socials + embeds

**Files:**
- Modify: `app/backoffice/artistes/[id]/ArtistEditClient.tsx`

Newsletter sub-form stays. Add controlled editors for `socials` (key→url map) and `embeds`.

- [ ] **Step 1: Add state for socials and embeds**

Just after the `addGenre` function (end of Task 7 Step 2 block), add:

```tsx
  // Réseaux : socials (liste de paires clef/valeur) + embeds.
  const [socials, setSocials] = useState<{ key: string; url: string }[]>(
    Object.entries(artist.socials).map(([key, url]) => ({ key, url })),
  );
  const [socialsStatus, setSocialsStatus] = useState<Status>(null);
  const [socialsPending, startSocials] = useTransition();

  const [embeds, setEmbeds] = useState(artist.embeds);
  const [embedsStatus, setEmbedsStatus] = useState<Status>(null);
  const [embedsPending, startEmbeds] = useTransition();

  const submitSocials = () => {
    setSocialsStatus(null);
    startSocials(async () => {
      const record: Record<string, string> = {};
      for (const s of socials) if (s.key.trim()) record[s.key.trim()] = s.url.trim();
      const { saveSocials } = await import("@/app/backoffice/artistes/actions");
      const res = await saveSocials(artist.id, record);
      setSocialsStatus(
        res.ok ? { tone: "ok", message: "Réseaux enregistrés." } : { tone: "error", message: res.error },
      );
    });
  };

  const submitEmbeds = () => {
    setEmbedsStatus(null);
    startEmbeds(async () => {
      const { saveEmbeds } = await import("@/app/backoffice/artistes/actions");
      const res = await saveEmbeds(artist.id, embeds);
      setEmbedsStatus(
        res.ok ? { tone: "ok", message: "Lecteurs enregistrés." } : { tone: "error", message: res.error },
      );
    });
  };
```

> Note: `saveSocials`/`saveEmbeds` are imported dynamically here only to keep the top import block small; you may instead add them to the static import from Task 7 Step 1 if you prefer — both work.

- [ ] **Step 2: Replace the Réseaux tab block**

Replace the whole `{tab === "reseaux" && ( … )}` block (old lines 305–377) with:

```tsx
          {tab === "reseaux" && (
            <>
              <AdminEyebrow className="mb-1">Newsletter de l&apos;artiste</AdminEyebrow>
              <p className="font-serif italic text-[12px] text-ink-muted mb-3 leading-[1.55]">
                Lien du formulaire d&apos;inscription du prestataire externe.
              </p>
              <div className="flex gap-2 items-center mb-1.5">
                <input
                  type="url"
                  value={newsletterUrl}
                  onChange={(e) => setNewsletterUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-paper-soft border border-ink/15 px-3.5 py-2.5 font-serif text-[14px] text-ink outline-none focus:border-magenta transition-colors rounded-[2px]"
                />
                <AdminBtn kind="accent" onClick={saveNewsletter} disabled={nlPending}>
                  {nlPending ? "…" : "Enregistrer"}
                </AdminBtn>
              </div>
              <StatusLine status={nlStatus} />

              <div className="mt-8 mb-4 border-t border-ink/10 pt-6 flex items-center justify-between">
                <AdminEyebrow>Réseaux & plateformes</AdminEyebrow>
                <AdminBtn kind="secondary" onClick={() => setSocials([...socials, { key: "", url: "" }])}>
                  + Ajouter une plateforme
                </AdminBtn>
              </div>
              <div className="flex flex-col gap-2">
                {socials.map((s, i) => (
                  <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center">
                    <input
                      value={s.key}
                      onChange={(e) =>
                        setSocials(socials.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))
                      }
                      placeholder="instagram"
                      className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta"
                    />
                    <input
                      value={s.url}
                      onChange={(e) =>
                        setSocials(socials.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
                      }
                      placeholder="https://..."
                      className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta"
                    />
                    <AdminBtn kind="ghost" onClick={() => setSocials(socials.filter((_, j) => j !== i))}>
                      Supprimer
                    </AdminBtn>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <AdminBtn kind="accent" onClick={submitSocials} disabled={socialsPending}>
                  {socialsPending ? "…" : "Enregistrer les réseaux"}
                </AdminBtn>
                <StatusLine status={socialsStatus} />
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <AdminEyebrow>Lecteurs intégrés</AdminEyebrow>
                  <AdminBtn
                    kind="secondary"
                    onClick={() => setEmbeds([...embeds, { type: "spotify", title: "", src: "" }])}
                  >
                    + Ajouter un embed
                  </AdminBtn>
                </div>
                <ul className="flex flex-col gap-2">
                  {embeds.map((e, i) => (
                    <li key={i} className="grid grid-cols-[120px_1fr_1.5fr_auto] gap-2 items-center">
                      <select
                        value={e.type}
                        onChange={(ev) =>
                          setEmbeds(
                            embeds.map((x, j) =>
                              j === i ? { ...x, type: ev.target.value as "spotify" | "youtube" } : x,
                            ),
                          )
                        }
                        className="bg-paper-soft border border-ink/15 px-2 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta"
                      >
                        <option value="spotify">spotify</option>
                        <option value="youtube">youtube</option>
                      </select>
                      <input
                        value={e.title}
                        onChange={(ev) =>
                          setEmbeds(embeds.map((x, j) => (j === i ? { ...x, title: ev.target.value } : x)))
                        }
                        placeholder="Titre"
                        className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta"
                      />
                      <input
                        value={e.src}
                        onChange={(ev) =>
                          setEmbeds(embeds.map((x, j) => (j === i ? { ...x, src: ev.target.value } : x)))
                        }
                        placeholder="https://..."
                        className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta"
                      />
                      <AdminBtn kind="ghost" onClick={() => setEmbeds(embeds.filter((_, j) => j !== i))}>
                        Supprimer
                      </AdminBtn>
                    </li>
                  ))}
                </ul>
                <div className="mt-3">
                  <AdminBtn kind="accent" onClick={submitEmbeds} disabled={embedsPending}>
                    {embedsPending ? "…" : "Enregistrer les lecteurs"}
                  </AdminBtn>
                  <StatusLine status={embedsStatus} />
                </div>
              </div>
            </>
          )}
```

- [ ] **Step 3: Verify type-check + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: No errors.

- [ ] **Step 4: Manual verification**

Edit an artist → Réseaux → add a social row + an embed, Save → reload: both persist; `/artists/<id>` shows them.

- [ ] **Step 5: Commit**

```bash
git add app/backoffice/artistes/[id]/ArtistEditClient.tsx
git commit -m "feat(artistes): wire Réseaux tab (socials + embeds)"
```

---

## Task 9: Discographie tab

**Files:**
- Modify: `app/backoffice/artistes/[id]/ArtistEditClient.tsx`

Controlled list of `DiscoItem`. Reordering via up/down. Saved as a full array.

- [ ] **Step 1: Add state**

After the embeds state/handlers (end of Task 8 Step 1), add:

```tsx
  // Discographie.
  const [disco, setDisco] = useState(artist.discography);
  const [discoStatus, setDiscoStatus] = useState<Status>(null);
  const [discoPending, startDisco] = useTransition();

  const updateDisco = (i: number, patch: Partial<(typeof disco)[number]>) =>
    setDisco(disco.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const moveDisco = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= disco.length) return;
    const next = [...disco];
    [next[i], next[j]] = [next[j], next[i]];
    setDisco(next);
  };
  const addDisco = () =>
    setDisco([
      ...disco,
      { id: crypto.randomUUID(), kind: "Single", title: "", year: "", cover: "", note: "" },
    ]);

  const submitDisco = () => {
    setDiscoStatus(null);
    startDisco(async () => {
      const { saveDiscography } = await import("@/app/backoffice/artistes/actions");
      const res = await saveDiscography(artist.id, disco);
      setDiscoStatus(
        res.ok ? { tone: "ok", message: "Discographie enregistrée." } : { tone: "error", message: res.error },
      );
    });
  };
```

- [ ] **Step 2: Replace the Discographie tab block**

Replace the whole `{tab === "discographie" && ( … )}` block (old lines 221–258) with:

```tsx
          {tab === "discographie" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <AdminEyebrow>Sorties · {disco.length}</AdminEyebrow>
                <AdminBtn kind="secondary" onClick={addDisco}>+ Ajouter une sortie</AdminBtn>
              </div>
              <ul className="flex flex-col gap-3">
                {disco.map((d, i) => (
                  <li key={d.id} className="grid grid-cols-[1fr_auto] gap-3 items-start p-3 border border-ink/10 rounded-[2px] bg-paper">
                    <div className="grid grid-cols-2 gap-2">
                      <input value={d.kind} onChange={(e) => updateDisco(i, { kind: e.target.value })} placeholder="Type (Album, EP…)" className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <input value={d.title} onChange={(e) => updateDisco(i, { title: e.target.value })} placeholder="Titre" className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <input value={d.year} onChange={(e) => updateDisco(i, { year: e.target.value })} placeholder="Année" className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <input value={d.cover} onChange={(e) => updateDisco(i, { cover: e.target.value })} placeholder="URL pochette (https://…)" className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <input value={d.note ?? ""} onChange={(e) => updateDisco(i, { note: e.target.value })} placeholder="Note (optionnel)" className="col-span-2 bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <AdminBtn kind="ghost" onClick={() => moveDisco(i, -1)}>↑</AdminBtn>
                      <AdminBtn kind="ghost" onClick={() => moveDisco(i, 1)}>↓</AdminBtn>
                      <AdminBtn kind="ghost" onClick={() => setDisco(disco.filter((_, j) => j !== i))}>Suppr.</AdminBtn>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <AdminBtn kind="accent" onClick={submitDisco} disabled={discoPending}>
                  {discoPending ? "…" : "Enregistrer la discographie"}
                </AdminBtn>
                <StatusLine status={discoStatus} />
              </div>
            </>
          )}
```

- [ ] **Step 3: Verify type-check + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: No errors.

- [ ] **Step 4: Manual verification**

Edit artist → Discographie → add a release (fill cover with a valid https URL), Save → reload: persists. Save with an empty cover URL → status shows the "URL invalide" validation error and nothing is written.

- [ ] **Step 5: Commit**

```bash
git add app/backoffice/artistes/[id]/ArtistEditClient.tsx
git commit -m "feat(artistes): wire Discographie tab"
```

---

## Task 10: Concerts tab (artist_shows)

**Files:**
- Modify: `app/backoffice/artistes/[id]/ArtistEditClient.tsx`

Shows are relational rows. Each row saves/deletes individually (upsert/delete actions). After a save the page is revalidated; we keep local state in sync from the action result by re-reading on success is unnecessary — we update local IDs optimistically.

- [ ] **Step 1: Add state and handlers**

After the discographie handlers (end of Task 9 Step 1), add:

```tsx
  // Concerts (artist_shows). On édite des lignes locales ; chaque ligne se
  // sauvegarde/supprime indépendamment via les actions upsert/delete.
  type ShowRow = {
    id: string | null;
    date: string;
    city: string;
    venue: string;
    status: string;
    free: boolean;
    ticketUrl: string;
  };
  const [shows, setShows] = useState<ShowRow[]>(
    artist.shows.map((s) => ({
      id: s.id,
      date: s.date,
      city: s.city,
      venue: s.venue,
      status: s.status ?? "",
      free: s.free,
      ticketUrl: s.ticketUrl ?? "",
    })),
  );
  const [showStatus, setShowStatus] = useState<Status>(null);
  const [showPending, startShow] = useTransition();

  const updateShow = (i: number, patch: Partial<ShowRow>) =>
    setShows(shows.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const addShowRow = () =>
    setShows([...shows, { id: null, date: "", city: "", venue: "", status: "", free: false, ticketUrl: "" }]);

  const saveShowRow = (i: number) => {
    setShowStatus(null);
    startShow(async () => {
      const row = shows[i];
      const { saveShow } = await import("@/app/backoffice/artistes/actions");
      const res = await saveShow(artist.id, row.id ? { ...row, id: row.id } : row);
      setShowStatus(
        res.ok ? { tone: "ok", message: "Date enregistrée." } : { tone: "error", message: res.error },
      );
    });
  };

  const deleteShowRow = (i: number) => {
    const row = shows[i];
    if (!row.id) {
      setShows(shows.filter((_, j) => j !== i));
      return;
    }
    startShow(async () => {
      const { removeShow } = await import("@/app/backoffice/artistes/actions");
      const res = await removeShow(artist.id, row.id as string);
      if (res.ok) setShows(shows.filter((_, j) => j !== i));
      else setShowStatus({ tone: "error", message: res.error });
    });
  };
```

- [ ] **Step 2: Replace the agenda (Concerts) tab block**

Replace the whole `{tab === "agenda" && ( … )}` block (old lines 260–303) with:

```tsx
          {tab === "agenda" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <AdminEyebrow>Concerts · {shows.length}</AdminEyebrow>
                <AdminBtn kind="secondary" onClick={addShowRow}>+ Ajouter une date</AdminBtn>
              </div>
              <ul className="flex flex-col gap-3">
                {shows.map((s, i) => (
                  <li key={s.id ?? `new-${i}`} className="grid grid-cols-[1fr_auto] gap-3 items-start p-3 border border-ink/10 rounded-[2px] bg-paper">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={s.date} onChange={(e) => updateShow(i, { date: e.target.value })} className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <input value={s.city} onChange={(e) => updateShow(i, { city: e.target.value })} placeholder="Ville" className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <input value={s.venue} onChange={(e) => updateShow(i, { venue: e.target.value })} placeholder="Lieu" className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <input value={s.status} onChange={(e) => updateShow(i, { status: e.target.value })} placeholder="Statut (Complet, En vente…)" className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <input value={s.ticketUrl} onChange={(e) => updateShow(i, { ticketUrl: e.target.value })} placeholder="Lien billetterie (optionnel)" className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <label className="flex items-center gap-2 text-[12px] text-ink-muted">
                        <input type="checkbox" checked={s.free} onChange={(e) => updateShow(i, { free: e.target.checked })} />
                        Gratuit
                      </label>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <AdminBtn kind="accent" onClick={() => saveShowRow(i)} disabled={showPending}>Enregistrer</AdminBtn>
                      <AdminBtn kind="ghost" onClick={() => deleteShowRow(i)} disabled={showPending}>Suppr.</AdminBtn>
                    </div>
                  </li>
                ))}
              </ul>
              <StatusLine status={showStatus} />
            </>
          )}
```

- [ ] **Step 3: Verify type-check + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: No errors.

- [ ] **Step 4: Manual verification**

Edit artist → Concerts → add a date (date+city+venue), Enregistrer → reload: persists. Delete it → reload: gone. `/artists/<id>` reflects the changes.

- [ ] **Step 5: Commit**

```bash
git add app/backoffice/artistes/[id]/ArtistEditClient.tsx
git commit -m "feat(artistes): wire Concerts tab (artist_shows upsert/delete)"
```

---

## Task 11: Médias tab (Blob upload) + Danger zone (archive)

**Files:**
- Modify: `app/backoffice/artistes/[id]/ArtistEditClient.tsx`

Client upload to Blob via `upload()`, then persist URLs via `saveMedia`. Also wire the "Archiver la fiche" danger button.

- [ ] **Step 1: Add media + archive state and handlers**

After the shows handlers (end of Task 10 Step 1), add:

```tsx
  // Médias.
  const [portraitUrl, setPortraitUrl] = useState(artist.portraitUrl);
  const [coverUrl, setCoverUrl] = useState(artist.coverUrl);
  const [gallery, setGallery] = useState<string[]>(artist.gallery);
  const [mediaStatus, setMediaStatus] = useState<Status>(null);
  const [mediaPending, startMedia] = useTransition();

  const uploadAndSave = (
    file: File,
    target: "portrait" | "cover" | "gallery",
  ) => {
    setMediaStatus(null);
    startMedia(async () => {
      try {
        const { upload } = await import("@vercel/blob/client");
        const blob = await upload(`artists/${artist.id}/${target}/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
        });
        const { saveMedia } = await import("@/app/backoffice/artistes/actions");
        let res;
        if (target === "portrait") {
          setPortraitUrl(blob.url);
          res = await saveMedia(artist.id, { portraitUrl: blob.url });
        } else if (target === "cover") {
          setCoverUrl(blob.url);
          res = await saveMedia(artist.id, { coverUrl: blob.url });
        } else {
          const next = [...gallery, blob.url];
          setGallery(next);
          res = await saveMedia(artist.id, { gallery: next });
        }
        setMediaStatus(
          res.ok ? { tone: "ok", message: "Image enregistrée." } : { tone: "error", message: res.error },
        );
      } catch (err) {
        setMediaStatus({ tone: "error", message: (err as Error).message });
      }
    });
  };

  const removeGalleryImage = (url: string) => {
    const next = gallery.filter((g) => g !== url);
    setGallery(next);
    startMedia(async () => {
      const { saveMedia } = await import("@/app/backoffice/artistes/actions");
      await saveMedia(artist.id, { gallery: next });
    });
  };

  // Archivage (suppression dure).
  const [confirmArchive, setConfirmArchive] = useState("");
  const [archivePending, startArchive] = useTransition();
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const doArchive = () => {
    setArchiveError(null);
    startArchive(async () => {
      const { archiveArtist } = await import("@/app/backoffice/artistes/actions");
      const res = await archiveArtist(artist.id, confirmArchive);
      // En cas de succès, archiveArtist redirige ; on ne lit l'erreur que sinon.
      if (res && !res.ok) setArchiveError(res.error);
    });
  };
```

- [ ] **Step 2: Replace the Médias tab block**

Replace the whole `{tab === "medias" && ( … )}` block (old lines 379–418) with:

```tsx
          {tab === "medias" && (
            <>
              <AdminEyebrow className="mb-4">Portrait & couverture</AdminEyebrow>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="aspect-square bg-cover bg-center rounded-[2px] grain mb-2" style={{ backgroundImage: `url(${portraitUrl})` }} />
                  <label className="text-[11px] tracking-eyebrow uppercase font-bold text-magenta cursor-pointer hover:underline">
                    Changer le portrait
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAndSave(f, "portrait"); }} />
                  </label>
                </div>
                <div>
                  <div className="aspect-[16/9] bg-cover bg-center rounded-[2px] grain mb-2" style={{ backgroundImage: `url(${coverUrl})` }} />
                  <label className="text-[11px] tracking-eyebrow uppercase font-bold text-magenta cursor-pointer hover:underline">
                    Changer la couverture
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAndSave(f, "cover"); }} />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <AdminEyebrow>Galerie · {gallery.length}</AdminEyebrow>
                {mediaPending && <span className="text-[11px] text-ink-subtle italic">Envoi…</span>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gallery.map((src) => (
                  <div key={src} className="aspect-[4/3] bg-cover bg-center rounded-[2px] relative group grain" style={{ backgroundImage: `url(${src})` }}>
                    <div className="absolute inset-0 bg-bleu-nuit-900/0 group-hover:bg-bleu-nuit-900/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button type="button" onClick={() => removeGalleryImage(src)} className="text-[10px] tracking-eyebrow uppercase font-bold text-beige-sable border border-beige-sable/40 px-3 py-1.5 rounded-full cursor-pointer hover:border-magenta">
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
                <label className="aspect-[4/3] border-2 border-dashed border-ink/25 rounded-[2px] flex flex-col items-center justify-center gap-1 text-ink-muted hover:border-magenta hover:text-magenta cursor-pointer">
                  <div className="text-[20px]">+</div>
                  <div className="text-[10px] tracking-eyebrow uppercase font-bold">Ajouter</div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAndSave(f, "gallery"); }} />
                </label>
              </div>
              <StatusLine status={mediaStatus} />
            </>
          )}
```

- [ ] **Step 3: Wire the Danger zone in the aside**

Replace the "Zone dangereuse" card (old lines 466–476) with a version whose Archive button requires the typed confirmation:

```tsx
          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
            <AdminEyebrow className="mb-3">Zone dangereuse</AdminEyebrow>
            <p className="italic text-[12px] text-ink-muted leading-[1.5]">
              Archiver supprime définitivement la fiche et ses concerts. Tapez « oui » pour confirmer.
            </p>
            <input
              value={confirmArchive}
              onChange={(e) => setConfirmArchive(e.target.value)}
              placeholder="oui"
              className="mt-3 w-full bg-paper border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta"
            />
            <div className="flex flex-col gap-2 mt-2">
              <AdminBtn kind="danger" onClick={doArchive} disabled={archivePending}>
                {archivePending ? "…" : "Archiver la fiche"}
              </AdminBtn>
              {archiveError && (
                <span className="font-serif text-[12px] text-magenta">{archiveError}</span>
              )}
            </div>
          </div>
```

- [ ] **Step 4: Update the "Couverture" aside preview to use state (optional consistency)**

In the "Couverture" aside card (old lines 452–464), change the background to the live state so it updates after upload:

```tsx
            <div className="aspect-[16/9] bg-center bg-cover rounded-[2px] grain" style={{ backgroundImage: `url(${coverUrl})` }} />
```

Remove the now-decorative "Changer / Recadrer" buttons under it (they are superseded by the Médias tab); leave the card as a live preview only.

- [ ] **Step 5: Verify type-check + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: No errors.

- [ ] **Step 6: Manual verification (requires BLOB_READ_WRITE_TOKEN)**

Ensure `.env.local` has `BLOB_READ_WRITE_TOKEN` (run `vercel env pull .env.local` if missing). `pnpm dev` → edit artist → Médias → upload a portrait image → it appears and persists after reload; check the file exists under `artists/<id>/portrait/` in the Vercel Blob store. Then test archive: type `oui`, click Archiver → redirected to roster, artist gone; `/artists/<id>` 404s.

- [ ] **Step 7: Commit**

```bash
git add app/backoffice/artistes/[id]/ArtistEditClient.tsx
git commit -m "feat(artistes): wire Médias uploads and archive (delete)"
```

---

## Final verification

- [ ] **Run the full test suite**

Run: `pnpm test`
Expected: all suites pass (incl. `lib/slug.test.ts`, `lib/validation/artist.test.ts`).

- [ ] **Type-check + lint the whole project**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: clean.

- [ ] **End-to-end manual pass**

Create a fresh artist → fill every tab → upload images → publish → confirm `/artists/<slug>` renders the full public fiche → archive it.

---

## Self-review notes (coverage)

- Spec §Périmètre (6 tabs + create + delete): Identité/Bio (Task 7), Réseaux (Task 8), Discographie (Task 9), Concerts (Task 10), Médias + archive (Task 11), create (Task 6). ✓
- Spec §Architecture layers: validation (Task 2), mutations (Task 3), actions (Task 5), Blob route (Task 4). ✓
- Spec decision A (immutable slug): Slug field read-only in edit, Task 7 Step 4. ✓
- Spec decision B1 (publish toggle vs hard-delete-with-confirm): Task 7 Step 3 (toggle) + Task 11 Step 3 (archive with `oui`). ✓
- Spec §Revalidation: `revalidateArtist` covers `/artists` + `/artists/[id]` + backoffice paths, Task 5. ✓
- Spec §Tests: unit for slug + schemas; manual for DB/UI. ✓
