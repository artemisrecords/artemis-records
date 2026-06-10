# Finalisation rôles & espace artiste — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finaliser le système de gestion des utilisateurs par rôles : combler les Server Actions et la route d'upload non gardées, et créer la surface artiste `/espace` (un compte `artiste` voit et édite uniquement SA fiche).

**Architecture:** L'auth Better Auth (magic link, invitations, rôles `superadmin`/`admin`/`artiste`) est déjà en place (`lib/auth.ts`, `proxy.ts`, `/backoffice/comptes`). Il reste : (1) un garde `requireArtistAccess(artistId)` qui autorise admin/superadmin partout et un artiste sur sa propre fiche ; (2) l'application de ce garde + `requireRole` sur les actions `artistes`, `journal`, `newsletter` et la route Blob ; (3) la surface `/espace` qui réutilise `ArtistEditClient` avec un mode `artiste` (sans publication / archivage / lien roster).

**Tech Stack:** Next.js 16 (App Router, Server Actions), Better Auth 1.6, Drizzle + Neon, Tailwind v4. Pas d'infra de tests unitaires dans ce repo : la vérification passe par `pnpm lint`, `pnpm build` et un test manuel E2E (dev server + Mailpit).

**Conventions du repo à respecter :** copy utilisateur en français, identifiants/commits en anglais. Ne PAS committer les modifications déjà présentes dans le worktree (`app/backoffice/page.tsx`, `app/backoffice/statistiques/StatistiquesClient.tsx`, `lib/db/admin-queries.ts`, `docs/superpowers/specs/2026-05-22-auth-better-auth-design.md`) : elles appartiennent à un autre chantier (dashboard). Stager uniquement les fichiers touchés par chaque tâche.

---

### Task 1: Garde `requireArtistAccess` dans `lib/auth-helpers.ts`

**Files:**
- Modify: `lib/auth-helpers.ts`

- [ ] **Step 1: Ajouter le garde à la fin du fichier**

```ts
/**
 * Garde d'édition d'une fiche artiste : admin/superadmin passent toujours,
 * un compte artiste ne passe que sur SA fiche (session.user.artistId).
 */
export async function requireArtistAccess(artistId: string) {
  const session = await getSession();
  const role = session?.user.role as Role | undefined;
  if (!session || !role) throw new Error("Accès refusé.");
  if (role === "superadmin" || role === "admin") {
    return { user: session.user, role };
  }
  if (role === "artiste" && session.user.artistId === artistId) {
    return { user: session.user, role };
  }
  throw new Error("Accès refusé.");
}
```

- [ ] **Step 2: Vérifier que ça compile**

Run: `pnpm lint`
Expected: pas de nouvelle erreur (warnings préexistants tolérés).

- [ ] **Step 3: Commit**

```bash
git add lib/auth-helpers.ts
git commit -m "feat(auth): add requireArtistAccess guard (admin anywhere, artiste on own record)"
```

---

### Task 2: Garder les actions `app/backoffice/artistes/actions.ts`

**Files:**
- Modify: `app/backoffice/artistes/actions.ts`

Règle : les actions de **contenu** (`saveIdentity`, `saveBio`, `saveDiscography`, `saveEmbeds`, `saveSocials`, `saveShow`, `removeShow`, `saveMedia`) utilisent `requireArtistAccess(id)` — un artiste peut éditer sa fiche depuis `/espace`. Les actions **structurantes** (`setArtistPublished`, `archiveArtist`, `createArtistAction`) restent admin-only via `requireRole("superadmin", "admin")`.

- [ ] **Step 1: Ajouter les imports**

```ts
import { requireArtistAccess, requireRole } from "@/lib/auth-helpers";
```

- [ ] **Step 2: Étendre `revalidateArtist` pour rafraîchir aussi `/espace`**

```ts
function revalidateArtist(id: string) {
  revalidatePath("/backoffice/artistes");
  revalidatePath(`/backoffice/artistes/${id}`);
  revalidatePath("/artists");
  revalidatePath("/artists/[id]", "page");
  revalidatePath("/espace");
}
```

- [ ] **Step 3: Ajouter le garde en première ligne de chaque action de contenu**

Pour `saveIdentity`, `saveBio`, `saveDiscography`, `saveEmbeds`, `saveSocials`, `saveMedia` — la première ligne du corps devient (exemple sur `saveIdentity`, identique pour les autres avec leur paramètre `id`) :

```ts
export async function saveIdentity(id: string, input: unknown): Promise<ActionResult> {
  await requireArtistAccess(id);
  const parsed = identitySchema.safeParse(input);
  ...
```

Pour `saveShow` et `removeShow`, le paramètre s'appelle `artistId` :

```ts
export async function saveShow(artistId: string, input: unknown): Promise<ActionResult> {
  await requireArtistAccess(artistId);
  ...
export async function removeShow(artistId: string, showId: string): Promise<ActionResult> {
  await requireArtistAccess(artistId);
  ...
```

⚠️ `removeShow` fait confiance à `artistId` pour le garde mais supprime par `showId` : vérifier l'appartenance du show. Remplacer le corps par :

```ts
export async function removeShow(artistId: string, showId: string): Promise<ActionResult> {
  await requireArtistAccess(artistId);
  const removed = await m.deleteShow(showId, artistId);
  if (!removed) return { ok: false, error: "Cette date n'appartient pas à cette fiche." };
  revalidateArtist(artistId);
  return { ok: true };
}
```

et dans `lib/db/artist-mutations.ts`, faire porter le filtre à `deleteShow` (retourne `true` si une ligne a été supprimée) :

```ts
export async function deleteShow(showId: string, artistId: string): Promise<boolean> {
  const rows = await db
    .delete(artistShows)
    .where(and(eq(artistShows.id, showId), eq(artistShows.artistId, artistId)))
    .returning({ id: artistShows.id });
  return rows.length > 0;
}
```

(adapter les imports `and`/noms réels du fichier ; si `deleteShow` a une autre signature existante, conserver son style). Même logique pour `upsertShow` si son implémentation ne filtre pas déjà par `artistId` lors d'un update : un update de show doit être contraint par `artistId`.

- [ ] **Step 4: Garder les actions admin-only**

```ts
export async function setArtistPublished(id: string, published: boolean): Promise<ActionResult> {
  await requireRole("superadmin", "admin");
  await m.setPublished(id, published);
  revalidateArtist(id);
  return { ok: true };
}

export async function archiveArtist(id: string, confirm: string): Promise<ActionResult> {
  await requireRole("superadmin", "admin");
  if (confirm.trim().toLowerCase() !== "oui") {
    return { ok: false, error: "Tapez « oui » pour confirmer la suppression." };
  }
  await m.deleteArtist(id);
  revalidatePath("/backoffice/artistes");
  revalidatePath("/artists");
  redirect("/backoffice/artistes");
}

export async function createArtistAction(input: unknown): Promise<ActionResult> {
  await requireRole("superadmin", "admin");
  const parsed = createArtistSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  const id = await m.createArtist(parsed.data);
  revalidatePath("/backoffice/artistes");
  redirect(`/backoffice/artistes/${id}`);
}
```

- [ ] **Step 5: Vérifier**

Run: `pnpm lint`
Expected: OK.

- [ ] **Step 6: Commit**

```bash
git add app/backoffice/artistes/actions.ts lib/db/artist-mutations.ts
git commit -m "feat(auth): role-guard artist actions (content: owner-or-admin, structure: admin-only)"
```

---

### Task 3: Garder `journal` et `newsletter`

**Files:**
- Modify: `app/backoffice/journal/actions.ts`
- Modify: `app/backoffice/newsletter/actions.ts`

- [ ] **Step 1: `journal/actions.ts` — tout est admin-only**

Ajouter l'import :

```ts
import { requireRole } from "@/lib/auth-helpers";
```

puis en première ligne du corps de `saveNews`, `saveNewsImage`, `setNewsPublished`, `deleteNews`, `createNewsAction` :

```ts
  await requireRole("superadmin", "admin");
```

- [ ] **Step 2: `newsletter/actions.ts` — settings admin-only, lien artiste = owner-or-admin**

Ajouter l'import :

```ts
import { requireArtistAccess, requireRole } from "@/lib/auth-helpers";
```

`saveNewsletterSettings` : première ligne du corps :

```ts
  await requireRole("superadmin", "admin");
```

`saveArtistNewsletter` (un artiste gère le lien newsletter de SA fiche depuis /espace) : première ligne du corps :

```ts
  await requireArtistAccess(input.artistId);
```

- [ ] **Step 3: Vérifier**

Run: `pnpm lint`
Expected: OK.

- [ ] **Step 4: Commit**

```bash
git add app/backoffice/journal/actions.ts app/backoffice/newsletter/actions.ts
git commit -m "feat(auth): role-guard journal and newsletter actions"
```

---

### Task 4: Garder la route d'upload Blob

**Files:**
- Modify: `app/api/blob/upload/route.ts`

- [ ] **Step 1: Exiger une session et restreindre l'artiste à son préfixe**

Remplacer le contenu par :

```ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Reçoit la requête signée du navigateur (`upload()` côté client), restreint le
// chemin et les types autorisés, renvoie un token d'upload direct vers Blob.
// Session obligatoire : admin/superadmin uploadent partout, un compte artiste
// uniquement sous `artists/<sa-fiche>/`.
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
  const { role, artistId } = session.user;

  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (role === "artiste") {
          if (!artistId || !pathname.startsWith(`artists/${artistId}/`)) {
            throw new Error("Chemin d'upload non autorisé.");
          }
        } else if (!pathname.startsWith("artists/") && !pathname.startsWith("news/")) {
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

Note : `session.user.role`/`artistId` sont typés via les additional fields Better Auth ; si TS râle, caster `session.user` vers `{ role?: string; artistId?: string | null }`.

- [ ] **Step 2: Vérifier**

Run: `pnpm lint`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add app/api/blob/upload/route.ts
git commit -m "feat(auth): require session on blob upload, scope artiste to own prefix"
```

---

### Task 5: Mode `artiste` dans `ArtistEditClient`

**Files:**
- Modify: `app/backoffice/artistes/[id]/ArtistEditClient.tsx`

En mode `artiste` : pas de lien « ← Roster », pas de toggle publication (badge Publié/Brouillon seul), pas de « Zone dangereuse » (archivage). Tout le reste (onglets, médias, newsletter) est identique.

- [ ] **Step 1: Étendre la signature**

```ts
export function ArtistEditClient({
  artist,
  mode = "admin",
}: {
  artist: ArtistWithShows;
  mode?: "admin" | "artiste";
}) {
  const isAdmin = mode === "admin";
```

- [ ] **Step 2: Conditionner le lien roster**

Remplacer le bloc breadcrumb (`<div className="flex items-center gap-2 …"><Link href="/backoffice/artistes">← Roster</Link></div>`) par :

```tsx
      {isAdmin && (
        <div className="flex items-center gap-2 text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle">
          <Link href="/backoffice/artistes" className="hover:text-ink">
            ← Roster
          </Link>
        </div>
      )}
```

- [ ] **Step 3: Conditionner le toggle publication**

Dans le bandeau (`px-8 pt-12 pb-6 …`), envelopper le `<label>` du switch :

```tsx
          <div className="flex items-center gap-3">
            {isAdmin && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                {/* …switch existant inchangé… */}
              </label>
            )}
            <Pill tone={published ? "live" : "draft"}>
              {published ? "Publié" : "Brouillon"}
            </Pill>
          </div>
```

(Le `Pill` reste visible dans les deux modes : l'artiste voit l'état de publication sans pouvoir le changer.)

- [ ] **Step 4: Conditionner la zone dangereuse**

Envelopper le dernier bloc `<div className="bg-paper-soft …"><AdminEyebrow>Zone dangereuse</AdminEyebrow>…</div>` de l'aside :

```tsx
          {isAdmin && (
            <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
              {/* …contenu archivage existant inchangé… */}
            </div>
          )}
```

- [ ] **Step 5: Vérifier**

Run: `pnpm lint`
Expected: OK. Le backoffice (`/backoffice/artistes/[id]`) ne passe pas `mode` → comportement inchangé.

- [ ] **Step 6: Commit**

```bash
git add "app/backoffice/artistes/[id]/ArtistEditClient.tsx"
git commit -m "feat(espace): add artiste mode to ArtistEditClient (no publish/archive/roster link)"
```

---

### Task 6: Surface `/espace` (layout + page)

**Files:**
- Create: `app/espace/layout.tsx`
- Create: `app/espace/page.tsx`

Le root layout enveloppe tout avec `Nav` + `Footer`, mais les deux retournent déjà `null` quand `pathname.startsWith("/espace")` — pas de changement à y faire. `signOutAction` existe déjà (`app/backoffice/compte/actions.ts`) et redirige vers `/auth`.

- [ ] **Step 1: Créer `app/espace/layout.tsx`**

```tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Wordmark } from "@/components/Primitives";
import { signOutAction } from "@/app/backoffice/compte/actions";

/**
 * Surface artiste : chrome volontairement minimal (pas l'AdminChrome du
 * backoffice). Vérif de rôle réelle ici — le proxy n'a fait qu'un check
 * optimiste du cookie.
 */
export default async function EspaceLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth");
  // Un admin n'a rien à faire ici → son backoffice.
  if (session.user.role !== "artiste") redirect("/backoffice");

  const displayName =
    session.user.firstName?.trim() || session.user.name?.trim() || session.user.email;

  return (
    <div className="min-h-screen bg-paper text-ink font-serif">
      <header className="flex items-center justify-between px-[clamp(24px,4vw,56px)] h-[76px] border-b border-ink/15 bg-paper/70 sticky top-0 z-50 backdrop-blur">
        <div className="flex items-center gap-4">
          <Wordmark size={18} />
          <span className="text-[10px] tracking-eyebrow uppercase font-bold text-magenta border-l border-ink/15 pl-4">
            Espace artiste
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="italic text-[13px] text-ink-muted hidden sm:block">{displayName}</span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle hover:text-magenta cursor-pointer"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </header>
      <main className="px-[clamp(24px,4vw,56px)] py-10 max-w-[1200px] mx-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Créer `app/espace/page.tsx`**

```tsx
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { findArtist } from "@/lib/db/queries";
import { ArtistEditClient } from "@/app/backoffice/artistes/[id]/ArtistEditClient";

export const metadata = { title: "Espace artiste · ARTémis Records" };

export default async function EspacePage() {
  // Le layout garantit session + rôle artiste ; on relit pour l'artistId.
  const session = await auth.api.getSession({ headers: await headers() });
  const artistId = session?.user.artistId ?? null;
  const artist = artistId ? await findArtist(artistId) : null;

  if (!artist) {
    return (
      <div className="max-w-[560px] mx-auto text-center py-20">
        <h1 className="font-display uppercase tracking-display text-[28px] mb-4">
          Aucune fiche liée
        </h1>
        <p className="italic text-[14px] text-ink-muted leading-[1.65]">
          Votre compte n&apos;est encore relié à aucune fiche artiste. Contactez
          l&apos;équipe du label pour faire le lien.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="text-[10px] tracking-eyebrow uppercase font-bold text-magenta mb-2">
          Votre fiche publique
        </div>
        <p className="italic text-[13px] text-ink-muted leading-[1.6] max-w-[640px]">
          Tout ce que vous enregistrez ici est publié sur votre page du site
          ARTémis Records. La mise en ligne de la fiche reste gérée par le label.
        </p>
      </div>
      <ArtistEditClient artist={artist} mode="artiste" />
    </div>
  );
}
```

- [ ] **Step 3: Vérifier le build complet**

Run: `pnpm lint` puis `pnpm build`
Expected: build OK (le build exécute aussi drizzle-kit migrate — ne doit rien appliquer de nouveau).

- [ ] **Step 4: Commit**

```bash
git add app/espace/layout.tsx app/espace/page.tsx
git commit -m "feat(espace): artist space at /espace (own record editing, minimal chrome)"
```

---

### Task 7: Vérification E2E (dev server)

**Files:** aucun (vérification).

Pré-requis : `.env.local` présent (DATABASE_URL → branche Neon dev, BETTER_AUTH_*), Mailpit lancé (`http://localhost:8025`). DB dev uniquement (jamais preview/prod).

- [ ] **Step 1: Lancer le dev server**

Run: `pnpm dev` (en arrière-plan)

- [ ] **Step 2: Vérifier les redirections non authentifiées**

Sans cookie : `GET http://localhost:3000/backoffice` → 307 vers `/auth?redirect=%2Fbackoffice` ; `GET http://localhost:3000/espace` → 307 vers `/auth?redirect=%2Fespace`.

- [ ] **Step 3: Flux superadmin**

Via navigateur : `/auth` → email du superadmin seedé → lien dans Mailpit → atterrit sur `/backoffice`. Vérifier `/backoffice/comptes` (onglets comptes admins visibles pour superadmin).

- [ ] **Step 4: Flux artiste**

Créer (ou réutiliser) un user artiste en DB dev lié à une fiche `artists` existante (insertion directe SQL sur la branche dev, ou invitation via l'UI comptes + acceptation). Se connecter par magic link → doit atterrir sur `/espace`, voir SA fiche, sans toggle publication ni zone dangereuse. Vérifier qu'une visite de `/backoffice` redirige vers `/espace`.

- [ ] **Step 5: Vérifier le refus croisé**

Connecté en artiste, appeler une action admin (ex. publier via l'UI — absente — ou vérifier qu'éditer la fiche fonctionne et qu'aucune surface admin n'est accessible). Connecté en admin, vérifier que `/espace` redirige vers `/backoffice`.

---

## Self-Review

- **Couverture spec** (`2026-05-22-auth-better-auth-design.md`) : §2 rôles → Tasks 1–4 (gardes) ; §4.3 signOut espace → Task 6 layout ; §5 protection routes `/espace` → proxy existant + Task 6 layout (defense in depth) ; « artiste voit et édite uniquement SA fiche » → Tasks 2, 5, 6 ; uploads → Task 4. Connexion/invitation/amorçage : déjà implémentés (rien à faire).
- **Placeholders** : aucun TBD ; les blocs « …existant inchangé… » de la Task 5 désignent du code déjà présent dans le fichier, pas du code à inventer.
- **Cohérence types** : `requireArtistAccess(artistId: string)` utilisé avec `id`/`artistId`/`input.artistId` (tous `string`) ; `mode?: "admin" | "artiste"` défini Task 5, utilisé Task 6.
