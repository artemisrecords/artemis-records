# Embeds — popup d'ajout/édition avec reformatage auto — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la liste d'embeds éditable inline du backoffice par une popup qui prend n'importe quel lien de partage Spotify/YouTube, le reformate en URL d'embed valide, récupère le titre automatiquement, et montre un aperçu live.

**Architecture:** Parsing pur et testable dans `lib/embeds.ts` ; titre récupéré via oEmbed côté serveur (server action `resolveEmbed`, contourne le CORS) ; popup client `EmbedDialog` (calquée sur `DecisionDialog`) utilisée pour ajout et édition ; `ArtistEditClient` passe d'une liste éditable à une liste lecture seule + déclencheurs de popup. Persistance inchangée via `saveEmbeds`.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, TypeScript, Vitest, Tailwind v4.

## Global Constraints

- Copy utilisateur en **français**, identifiants/types/clés en **anglais**.
- Package manager **pnpm**, Node ≥ 20. Tests via `pnpm test` (Vitest, `vitest run`).
- Type `Embed = { type: "spotify" | "youtube"; title: string; src: string }` (défini dans `lib/db/schema.ts`, ré-exporté par `@/lib/data`). Ne pas le modifier.
- `src` d'un embed doit être une URL d'iframe valide :
  - Spotify : `https://open.spotify.com/embed/{type}/{id}`
  - YouTube : `https://www.youtube.com/embed/{id}`
- Server actions protégées par les gardes de `lib/auth-helpers.ts`. Rôles existants : `"superadmin"`, `"admin"`, `"artiste"`.
- Commits : messages en anglais, terminés par la ligne `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Branche de travail : `preview` (ne pas merger vers `master`).

---

## File Structure

| Fichier | Responsabilité |
|---|---|
| `lib/embeds.ts` | **Nouveau.** `parseEmbedUrl(raw)` pur, sans réseau. |
| `lib/embeds.test.ts` | **Nouveau.** Tests unitaires Vitest de `parseEmbedUrl`. |
| `app/backoffice/artistes/actions.ts` | **Modifié.** Ajout de la server action `resolveEmbed`. |
| `components/admin/EmbedDialog.tsx` | **Nouveau.** La popup (client), ajout + édition. |
| `app/backoffice/artistes/[id]/ArtistEditClient.tsx` | **Modifié.** Liste inline → liste lecture seule + popup. |

---

### Task 1: `parseEmbedUrl` — parsing pur + tests

**Files:**
- Create: `lib/embeds.ts`
- Test: `lib/embeds.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `type EmbedType = "spotify" | "youtube"`
  - `type ParsedEmbed = { type: EmbedType; src: string }`
  - `function parseEmbedUrl(raw: string): ParsedEmbed | null`

- [ ] **Step 1: Write the failing test**

Create `lib/embeds.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseEmbedUrl } from "./embeds";

describe("parseEmbedUrl — Spotify", () => {
  it("reformate un lien de partage album avec préfixe intl et ?si", () => {
    expect(
      parseEmbedUrl(
        "https://open.spotify.com/intl-fr/album/0T5qEo7UssRa1mnRR0LGx9?si=2MHjlSJJQtWFlm6QqlqlyQ",
      ),
    ).toEqual({
      type: "spotify",
      src: "https://open.spotify.com/embed/album/0T5qEo7UssRa1mnRR0LGx9",
    });
  });

  it("gère un lien track sans préfixe intl", () => {
    expect(parseEmbedUrl("https://open.spotify.com/track/19pmxKlRw5FnuRNX3mXrZ7")).toEqual({
      type: "spotify",
      src: "https://open.spotify.com/embed/track/19pmxKlRw5FnuRNX3mXrZ7",
    });
  });

  it("gère playlist, artist, episode, show", () => {
    expect(parseEmbedUrl("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M")?.src).toBe(
      "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M",
    );
    expect(parseEmbedUrl("https://open.spotify.com/artist/285mwpEqyCKT0Y3liIdR0q")?.src).toBe(
      "https://open.spotify.com/embed/artist/285mwpEqyCKT0Y3liIdR0q",
    );
    expect(parseEmbedUrl("https://open.spotify.com/episode/512ojhOuo1ktJprKbVcKyQ")?.src).toBe(
      "https://open.spotify.com/embed/episode/512ojhOuo1ktJprKbVcKyQ",
    );
    expect(parseEmbedUrl("https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk")?.src).toBe(
      "https://open.spotify.com/embed/show/4rOoJ6Egrf8K2IrywzwOMk",
    );
  });

  it("est idempotent sur un lien déjà en /embed/", () => {
    expect(
      parseEmbedUrl("https://open.spotify.com/embed/album/668VWNUYAvVY6tKggLNDh8")?.src,
    ).toBe("https://open.spotify.com/embed/album/668VWNUYAvVY6tKggLNDh8");
  });

  it("gère une URI spotify:", () => {
    expect(parseEmbedUrl("spotify:album:0T5qEo7UssRa1mnRR0LGx9")).toEqual({
      type: "spotify",
      src: "https://open.spotify.com/embed/album/0T5qEo7UssRa1mnRR0LGx9",
    });
  });
});

describe("parseEmbedUrl — YouTube", () => {
  it("gère watch?v= avec params parasites", () => {
    expect(
      parseEmbedUrl("https://www.youtube.com/watch?v=xw0BKRUgV78&list=PLabc&t=10s"),
    ).toEqual({ type: "youtube", src: "https://www.youtube.com/embed/xw0BKRUgV78" });
  });

  it("gère youtu.be avec ?si", () => {
    expect(parseEmbedUrl("https://youtu.be/QVJS9At8xAQ?si=abcd")).toEqual({
      type: "youtube",
      src: "https://www.youtube.com/embed/QVJS9At8xAQ",
    });
  });

  it("gère shorts/ et embed/", () => {
    expect(parseEmbedUrl("https://www.youtube.com/shorts/xw0BKRUgV78")?.src).toBe(
      "https://www.youtube.com/embed/xw0BKRUgV78",
    );
    expect(parseEmbedUrl("https://www.youtube.com/embed/xw0BKRUgV78")?.src).toBe(
      "https://www.youtube.com/embed/xw0BKRUgV78",
    );
  });

  it("gère music.youtube.com", () => {
    expect(parseEmbedUrl("https://music.youtube.com/watch?v=xw0BKRUgV78")?.src).toBe(
      "https://www.youtube.com/embed/xw0BKRUgV78",
    );
  });
});

describe("parseEmbedUrl — invalides", () => {
  it("renvoie null pour un domaine inconnu ou une chaîne vide", () => {
    expect(parseEmbedUrl("https://soundcloud.com/foo/bar")).toBeNull();
    expect(parseEmbedUrl("")).toBeNull();
    expect(parseEmbedUrl("   ")).toBeNull();
    expect(parseEmbedUrl("pas une url")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- lib/embeds.test.ts`
Expected: FAIL — `parseEmbedUrl` introuvable (le module `./embeds` n'existe pas).

- [ ] **Step 3: Write minimal implementation**

Create `lib/embeds.ts`:

```ts
export type EmbedType = "spotify" | "youtube";
export type ParsedEmbed = { type: EmbedType; src: string };

const SPOTIFY_TYPES = "album|track|playlist|artist|episode|show";
// Tolère le préfixe /intl-xx, un /embed/ déjà présent, et la query ?si=…
const SPOTIFY_URL_RE = new RegExp(
  `open\\.spotify\\.com/(?:intl-[a-z-]+/)?(?:embed/)?(${SPOTIFY_TYPES})/([A-Za-z0-9]+)`,
  "i",
);
const SPOTIFY_URI_RE = new RegExp(`^spotify:(${SPOTIFY_TYPES}):([A-Za-z0-9]+)$`, "i");

// Un id YouTube fait 11 caractères [A-Za-z0-9_-].
const YOUTUBE_RES: RegExp[] = [
  /youtu\.be\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/(?:watch\?(?:[^#]*&)?v=)([A-Za-z0-9_-]{11})/,
  /youtube\.com\/(?:embed|shorts|v)\/([A-Za-z0-9_-]{11})/,
];

/** Reformate n'importe quel lien Spotify/YouTube en URL d'embed, ou null. */
export function parseEmbedUrl(raw: string): ParsedEmbed | null {
  const input = raw.trim();
  if (!input) return null;

  const uri = input.match(SPOTIFY_URI_RE);
  if (uri) {
    return {
      type: "spotify",
      src: `https://open.spotify.com/embed/${uri[1].toLowerCase()}/${uri[2]}`,
    };
  }

  const sp = input.match(SPOTIFY_URL_RE);
  if (sp) {
    return {
      type: "spotify",
      src: `https://open.spotify.com/embed/${sp[1].toLowerCase()}/${sp[2]}`,
    };
  }

  for (const re of YOUTUBE_RES) {
    const m = input.match(re);
    if (m) {
      return { type: "youtube", src: `https://www.youtube.com/embed/${m[1]}` };
    }
  }

  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- lib/embeds.test.ts`
Expected: PASS (tous les `describe`).

- [ ] **Step 5: Commit**

```bash
git add lib/embeds.ts lib/embeds.test.ts
git commit -m "feat(embeds): parseEmbedUrl reformats Spotify/YouTube share links"
```

---

### Task 2: `resolveEmbed` server action

**Files:**
- Modify: `app/backoffice/artistes/actions.ts`

**Interfaces:**
- Consumes: `parseEmbedUrl` (Task 1) ; `requireRole` de `@/lib/auth-helpers`.
- Produces:
  - `type ResolveEmbedResult = { ok: true; type: "spotify" | "youtube"; src: string; title: string } | { ok: false; error: string }`
  - `async function resolveEmbed(rawUrl: string): Promise<ResolveEmbedResult>`

- [ ] **Step 1: Add the import**

Dans `app/backoffice/artistes/actions.ts`, ajouter en haut (après les imports existants) :

```ts
import { parseEmbedUrl } from "@/lib/embeds";
```

Et compléter l'import existant `import { requireArtistAccess, requireRole } from "@/lib/auth-helpers";` (déjà présent — `requireRole` est déjà importé, ne rien changer si c'est le cas).

- [ ] **Step 2: Add the action**

À la fin de `app/backoffice/artistes/actions.ts`, ajouter :

```ts
export type ResolveEmbedResult =
  | { ok: true; type: "spotify" | "youtube"; src: string; title: string }
  | { ok: false; error: string };

/**
 * Reformate un lien de partage en URL d'embed et récupère le titre via oEmbed
 * (appel serveur : les endpoints oEmbed de Spotify/YouTube ne sont pas CORS).
 * Si l'oEmbed échoue, l'embed reste valide avec un titre vide.
 */
export async function resolveEmbed(rawUrl: string): Promise<ResolveEmbedResult> {
  await requireRole("superadmin", "admin", "artiste");

  const parsed = parseEmbedUrl(rawUrl);
  if (!parsed) {
    return { ok: false, error: "Lien non reconnu (Spotify ou YouTube attendu)." };
  }

  let title = "";
  try {
    const endpoint =
      parsed.type === "spotify"
        ? `https://open.spotify.com/oembed?url=${encodeURIComponent(parsed.src)}`
        : `https://www.youtube.com/oembed?url=${encodeURIComponent(
            `https://www.youtube.com/watch?v=${parsed.src.split("/embed/")[1]}`,
          )}&format=json`;
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = (await res.json()) as { title?: unknown };
      if (typeof data.title === "string") title = data.title;
    }
  } catch {
    // oEmbed indisponible → on garde title = "" ; l'embed est valide quand même.
  }

  return { ok: true, type: parsed.type, src: parsed.src, title };
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: aucune erreur liée à `actions.ts` / `resolveEmbed`.

- [ ] **Step 4: Commit**

```bash
git add app/backoffice/artistes/actions.ts
git commit -m "feat(embeds): resolveEmbed server action (parse + oEmbed title)"
```

---

### Task 3: `EmbedDialog` — la popup

**Files:**
- Create: `components/admin/EmbedDialog.tsx`

**Interfaces:**
- Consumes: `resolveEmbed`, `ResolveEmbedResult` (Task 2) ; `EmbedPlayer` (`@/components/EmbedPlayer`) ; `Embed` (`@/lib/data`) ; `AdminBtn`, `AdminEyebrow` (`@/components/admin/AdminPrimitives`).
- Produces:
  - `function EmbedDialog(props: { initial?: Embed; onSave: (embed: Embed) => void; onClose: () => void }): JSX.Element`

- [ ] **Step 1: Write the component**

Create `components/admin/EmbedDialog.tsx`:

```tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import type { Embed } from "@/lib/data";
import { EmbedPlayer } from "@/components/EmbedPlayer";
import { AdminBtn, AdminEyebrow } from "@/components/admin/AdminPrimitives";
import { resolveEmbed } from "@/app/backoffice/artistes/actions";

type Resolved = { type: "spotify" | "youtube"; src: string };

const TYPE_LABEL: Record<string, string> = {
  album: "album",
  track: "titre",
  playlist: "playlist",
  artist: "artiste",
  episode: "épisode",
  show: "podcast",
};

// "https://open.spotify.com/embed/album/x" -> "Spotify · album"
function describe(r: Resolved): string {
  if (r.type === "youtube") return "YouTube · vidéo";
  const kind = r.src.split("/embed/")[1]?.split("/")[0] ?? "";
  return `Spotify · ${TYPE_LABEL[kind] ?? kind}`;
}

export function EmbedDialog({
  initial,
  onSave,
  onClose,
}: {
  initial?: Embed;
  onSave: (embed: Embed) => void;
  onClose: () => void;
}) {
  const [rawUrl, setRawUrl] = useState(initial?.src ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [resolved, setResolved] = useState<Resolved | null>(
    initial ? { type: initial.type, src: initial.src } : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startResolve] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const resolve = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setResolved(null);
      setError(null);
      return;
    }
    startResolve(async () => {
      const res = await resolveEmbed(trimmed);
      if (!res.ok) {
        setResolved(null);
        setError(res.error);
        return;
      }
      setError(null);
      setResolved({ type: res.type, src: res.src });
      // On ne pré-remplit le titre que s'il est vide (ne pas écraser une saisie).
      if (res.title && !title.trim()) setTitle(res.title);
    });
  };

  const canSave = !!resolved && !pending;
  const submit = () => {
    if (!resolved) return;
    onSave({ type: resolved.type, src: resolved.src, title: title.trim() });
    onClose();
  };

  const heading = initial ? "Modifier le lecteur" : "Ajouter un lecteur";

  return (
    <div
      className="fixed inset-0 z-50 bg-bleu-nuit-900/60 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      onClick={onClose}
    >
      <div
        className="bg-paper border border-ink/15 rounded-[3px] w-full max-w-[560px] my-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-ink/10 flex items-center justify-between">
          <AdminEyebrow className="!text-magenta">{heading}</AdminEyebrow>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-subtle hover:text-ink text-[20px] leading-none cursor-pointer"
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
              Lien Spotify ou YouTube
            </label>
            <input
              value={rawUrl}
              onChange={(e) => setRawUrl(e.target.value)}
              onBlur={(e) => resolve(e.target.value)}
              onPaste={(e) => resolve(e.clipboardData.getData("text"))}
              placeholder="Collez le lien de partage…"
              className="w-full bg-paper-soft border border-ink/15 px-3.5 py-2.5 font-serif text-[14px] text-ink outline-none focus:border-magenta transition-colors rounded-[2px]"
            />
            {pending && (
              <div className="mt-1.5 font-serif italic text-[12px] text-ink-subtle">
                Analyse du lien…
              </div>
            )}
            {error && (
              <div className="mt-1.5 font-serif text-[12px] text-magenta">{error}</div>
            )}
            {resolved && !error && (
              <div className="mt-1.5 font-serif text-[12px] text-vert-foret-700">
                ✓ {describe(resolved)} détecté
              </div>
            )}
          </div>

          {resolved && (
            <>
              <div>
                <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                  Titre affiché
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex. Pellicule · EP"
                  className="w-full bg-paper-soft border border-ink/15 px-3.5 py-2.5 font-serif text-[14px] text-ink outline-none focus:border-magenta transition-colors rounded-[2px]"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                  Aperçu
                </label>
                <EmbedPlayer embed={{ type: resolved.type, src: resolved.src, title }} />
              </div>
            </>
          )}

          <div className="flex items-center gap-2 justify-end pt-2 border-t border-ink/10">
            <AdminBtn kind="ghost" onClick={onClose}>
              Annuler
            </AdminBtn>
            <AdminBtn kind="accent" onClick={submit} disabled={!canSave}>
              {initial ? "Enregistrer" : "Ajouter"}
            </AdminBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: aucune erreur dans `EmbedDialog.tsx`.

> Note : vérifier que `vert-foret-700` existe comme token (utilisé par `StatusLine` dans `ArtistEditClient.tsx`, donc disponible). Si un token de couleur manque, le remplacer par un équivalent déjà utilisé dans le backoffice.

- [ ] **Step 3: Commit**

```bash
git add components/admin/EmbedDialog.tsx
git commit -m "feat(embeds): EmbedDialog popup with auto-reformat, title and live preview"
```

---

### Task 4: Brancher la popup dans `ArtistEditClient`

**Files:**
- Modify: `app/backoffice/artistes/[id]/ArtistEditClient.tsx`

**Interfaces:**
- Consumes: `EmbedDialog` (Task 3).
- Produces: rien (composant écran).

- [ ] **Step 1: Importer `EmbedDialog`**

Après l'import de `AdminPrimitives` (vers la ligne 12), ajouter :

```ts
import { EmbedDialog } from "@/components/admin/EmbedDialog";
```

- [ ] **Step 2: Ajouter l'état de la popup**

Juste après la ligne `const [embedsPending, startEmbeds] = useTransition();` (~ligne 154), ajouter :

```ts
// Popup d'ajout/édition d'un embed. index = null → création ; sinon édition.
const [embedDialog, setEmbedDialog] = useState<{ index: number | null } | null>(null);

const upsertEmbed = (embed: (typeof embeds)[number]) => {
  setEmbeds((prev) => {
    if (embedDialog?.index == null) return [...prev, embed];
    return prev.map((x, j) => (j === embedDialog.index ? embed : x));
  });
};
```

> Note : `setEmbeds` est initialisé par `useState(artist.embeds)`. Le callback `(prev) => …` ci-dessus suppose la forme fonctionnelle ; elle marche quelle que soit la signature de `setEmbeds`.

- [ ] **Step 3: Remplacer le bloc de la liste d'embeds**

Remplacer **tout** le bloc actuel (de `<div className="flex items-center justify-between mb-4">` contenant `AdminEyebrow>Lecteurs intégrés` jusqu'au `</ul>` fermant, soit ~lignes 630-677) par :

```tsx
                <div className="flex items-center justify-between mb-4">
                  <AdminEyebrow>Lecteurs intégrés</AdminEyebrow>
                  <AdminBtn kind="secondary" onClick={() => setEmbedDialog({ index: null })}>
                    + Ajouter un embed
                  </AdminBtn>
                </div>
                {embeds.length === 0 ? (
                  <p className="font-serif italic text-[13px] text-ink-subtle">
                    Aucun lecteur pour l&apos;instant.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {embeds.map((e, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 border border-ink/12 rounded-[2px] px-3 py-2.5"
                      >
                        <Pill>{e.type === "spotify" ? "Spotify" : "YouTube"}</Pill>
                        <span className="flex-1 font-serif text-[13px] text-ink truncate">
                          {e.title || <span className="italic text-ink-subtle">Sans titre</span>}
                        </span>
                        <AdminBtn kind="ghost" onClick={() => setEmbedDialog({ index: i })}>
                          Modifier
                        </AdminBtn>
                        <AdminBtn
                          kind="ghost"
                          onClick={() => setEmbeds(embeds.filter((_, j) => j !== i))}
                        >
                          Supprimer
                        </AdminBtn>
                      </li>
                    ))}
                  </ul>
                )}
```

(Le bloc `<div className="mt-3"><AdminBtn … submitEmbeds …>Enregistrer les lecteurs</AdminBtn><StatusLine …/></div>` qui suit reste **inchangé**.)

- [ ] **Step 4: Monter la popup**

Juste avant le `</>` qui ferme l'onglet `reseaux` (la ligne `</>` suivie de `)}` vers la ligne 685, après le bloc « Enregistrer les lecteurs »), ajouter le rendu conditionnel de la popup :

```tsx
              {embedDialog && (
                <EmbedDialog
                  initial={embedDialog.index != null ? embeds[embedDialog.index] : undefined}
                  onSave={upsertEmbed}
                  onClose={() => setEmbedDialog(null)}
                />
              )}
```

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm exec tsc --noEmit` puis `pnpm lint`
Expected: aucune erreur dans `ArtistEditClient.tsx`.

- [ ] **Step 6: Vérification manuelle**

Run: `pnpm dev`, aller sur `/backoffice/artistes/<id>` → onglet **Réseaux**.
Attendu :
1. La section « Lecteurs intégrés » liste les embeds existants (badge + titre + Modifier/Supprimer).
2. « + Ajouter un embed » ouvre la popup ; coller `https://open.spotify.com/intl-fr/album/0T5qEo7UssRa1mnRR0LGx9?si=…` → `✓ Spotify · album détecté`, titre pré-rempli, aperçu live visible.
3. « Ajouter » referme la popup et ajoute la ligne ; « Enregistrer les lecteurs » persiste (message de succès).
4. « Modifier » rouvre la popup pré-remplie ; un lien YouTube `watch?v=…` fonctionne aussi.
5. Recharger la page : l'embed enregistré s'affiche bien sur la fiche publique `/artists/<id>`.

- [ ] **Step 7: Commit**

```bash
git add app/backoffice/artistes/[id]/ArtistEditClient.tsx
git commit -m "feat(embeds): wire EmbedDialog into artist editor, read-only embed list"
```

---

## Self-Review

**Spec coverage :**
- Détection auto plateforme/type → Task 1 (`parseEmbedUrl`) + Task 3 (badge `describe`). ✓
- Reformatage du lien d'exemple → Task 1 (test dédié). ✓
- Titre auto via oEmbed serveur, éditable → Task 2 (`resolveEmbed`) + Task 3 (champ titre). ✓
- Aperçu live → Task 3 (`<EmbedPlayer>`). ✓
- Popup ajout + édition → Task 3 (prop `initial`) + Task 4 (déclencheurs). ✓
- Liste lecture seule, save explicite inchangé → Task 4. ✓
- Tests unitaires sur `parseEmbedUrl` → Task 1. ✓

**Placeholder scan :** aucun TBD/TODO ; tout le code est fourni. ✓

**Type consistency :** `parseEmbedUrl → ParsedEmbed {type, src}` (T1) consommé par `resolveEmbed` qui renvoie `{type, src, title}` (T2) consommé par `EmbedDialog` (T3) qui émet un `Embed {type, src, title}` via `onSave` (T4). Cohérent. `setEmbedDialog({ index })` ↔ `embedDialog.index` cohérent entre Steps de T4. ✓

**Risque connu :** la garde `requireRole("superadmin","admin","artiste")` suppose ces 3 valeurs de rôle (confirmées dans `lib/auth-helpers.ts`). L'aperçu iframe Spotify/YouTube dépend du réseau ; sans connexion, l'aperçu reste vide mais l'embed est valide.
