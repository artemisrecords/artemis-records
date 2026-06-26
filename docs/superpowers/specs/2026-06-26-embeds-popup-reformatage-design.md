# Embeds — popup d'ajout/édition avec reformatage automatique

Date : 2026-06-26
Statut : design validé, en attente du plan d'implémentation

## Problème

Dans le backoffice (`/backoffice/artistes/[id]`, onglet « Réseaux »), la section
« Lecteurs intégrés » est une liste éditable inline où l'admin doit coller à la
main l'**URL d'embed** exacte dans le champ `src` :

- Spotify : `https://open.spotify.com/embed/album/<id>`
- YouTube : `https://www.youtube.com/embed/<id>`

Or un lien « Partager » normal copié depuis l'app n'est **pas** dans ce format.
Exemple réel fourni :

```
https://open.spotify.com/intl-fr/album/0T5qEo7UssRa1mnRR0LGx9?si=2MHjlSJJQtWFlm6QqlqlyQ
```

Ce lien ne s'affiche pas dans l'`<iframe>` : il contient le préfixe `/intl-fr`,
n'a pas `/embed/`, et traîne un `?si=…`. L'admin doit aujourd'hui deviner le bon
format à la main.

## Objectif

Remplacer la liste inline par une **popup** d'ajout/édition d'un lecteur où
l'admin colle simplement n'importe quel lien de partage. Le système :

1. détecte automatiquement la plateforme (Spotify / YouTube) et le type de
   contenu à partir du lien collé ;
2. reformate le lien en URL d'embed valide ;
3. récupère automatiquement le titre (modifiable) ;
4. montre un aperçu live du lecteur avant validation.

## Décisions de design (validées)

- **Détection** : automatique à partir du lien collé (pas de toggle manuel).
- **Titre** : auto-rempli via oEmbed, champ éditable. Si l'appel échoue, champ
  vide à remplir à la main.
- **Aperçu** : iframe live du lecteur dans la popup avant validation.
- **Sauvegarde** : la popup met à jour le state local ; la persistance reste sur
  le bouton existant « Enregistrer les lecteurs » (cohérent avec les autres
  sections du formulaire, qui ont toutes un save explicite).

## Architecture

Le reformatage est du pur texte ; récupérer le titre demande un appel réseau que
le navigateur ne peut pas faire directement (les endpoints oEmbed de Spotify et
YouTube ne renvoient pas d'en-têtes CORS permissifs). On sépare donc en deux :

### 1. `lib/embeds.ts` — parsing pur (sans réseau)

```ts
export type ParsedEmbed = { type: "spotify" | "youtube"; src: string };

/** Renvoie l'embed reformaté, ou null si le lien n'est pas reconnu. */
export function parseEmbedUrl(raw: string): ParsedEmbed | null;
```

Règles :

- **Spotify** — regex tolérante :
  `open\.spotify\.com/(?:intl-[a-z-]+/)?(?:embed/)?(album|track|playlist|artist|episode|show)/([A-Za-z0-9]+)`
  → `https://open.spotify.com/embed/{type}/{id}`.
  Gère aussi l'URI `spotify:{type}:{id}`. Préfixe `/intl-xx` et query `?si=…`
  ignorés. Un lien déjà en `/embed/` se reformate en lui-même (idempotent — utile
  à l'édition).
- **YouTube** — extrait l'`id` vidéo (11 caractères) depuis `watch?v=`,
  `youtu.be/<id>`, `shorts/<id>`, `embed/<id>` (et `music.youtube.com`)
  → `https://www.youtube.com/embed/{id}`. Query (`?si=`, `&list=`, `&t=`) ignorée.
- Lien non reconnu → `null`.

Fonction pure, sans dépendance, **testée unitairement**.

### 2. `resolveEmbed` — server action (titre via oEmbed)

Dans `app/backoffice/artistes/actions.ts` (ou un fichier dédié), nouvelle action :

```ts
export async function resolveEmbed(rawUrl: string): Promise<
  | { ok: true; type: "spotify" | "youtube"; src: string; title: string }
  | { ok: false; error: string }
>;
```

- Appelle `parseEmbedUrl(rawUrl)`. Si `null` → `{ ok: false, error: "Lien non
  reconnu (Spotify ou YouTube attendu)." }`.
- Sinon, `fetch` côté serveur de l'oEmbed pour récupérer `title` :
  - Spotify : `https://open.spotify.com/oembed?url=<src>` → champ `title`.
  - YouTube : `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<id>&format=json` → champ `title`.
- Si l'oEmbed échoue (réseau / 404), on renvoie quand même `{ ok: true }` avec
  `title: ""` (l'embed est valide même sans titre).
- Gardée par `requireArtistAccess` comme les autres actions de la fiche.

### 3. `EmbedDialog` — composant client (popup)

Nouveau `components/admin/EmbedDialog.tsx`, calqué sur
`components/admin/DecisionDialog.tsx` (overlay `fixed inset-0 z-50`, fermeture au
clic extérieur + touche Échap, `role="dialog"`).

Props :

```ts
{
  initial?: Embed;            // présent = mode édition
  onSave: (embed: Embed) => void;  // remonte au parent (met à jour le state local)
  onClose: () => void;
}
```

Contenu :

- Un champ « Coller le lien ». En **édition**, pré-rempli avec le `src` actuel.
- Au collage / blur du champ : appel `resolveEmbed` (dans un `useTransition`).
  - Succès → affiche `✓ Spotify · album détecté` (badge plateforme/type déduit du
    `src`), pré-remplit le champ **Titre** (éditable), et rend l'aperçu live.
  - Échec → message d'erreur, bouton de validation désactivé.
- **Aperçu live** : on réutilise `<EmbedPlayer embed={{ type, title, src }} />`
  une fois `src` résolu.
- Footer : `Annuler` (ghost) / `Ajouter` ou `Enregistrer` (accent), désactivé tant
  que `src` n'est pas valide.
- À la validation : `onSave({ type, title, src })` puis `onClose()`.

### 4. `ArtistEditClient.tsx` — liste lecture seule + déclencheurs

Remplacer le bloc `embeds.map(... <select/><input/><input/> ...)`
([lignes 639-677](app/backoffice/artistes/[id]/ArtistEditClient.tsx#L639-L677))
par :

- Une liste **lecture seule** : par embed, un badge plateforme (Spotify/YouTube) +
  le titre, avec deux boutons **Modifier** / **Supprimer**.
- Le bouton **+ Ajouter un embed** ouvre `EmbedDialog` en mode création.
- **Modifier** ouvre `EmbedDialog` avec `initial={embed}`.
- État local : `dialog: { open: boolean; index: number | null }` (ou
  `editing: Embed | null` + flag). `onSave` insère (création) ou remplace
  (édition à l'index) dans le state `embeds`.
- Le bouton **« Enregistrer les lecteurs »** et `submitEmbeds()` → `saveEmbeds`
  restent inchangés.

## Flux de données

```
Admin colle un lien
   └─> EmbedDialog: resolveEmbed(rawUrl)  [server action]
          └─> parseEmbedUrl()  -> { type, src }
          └─> fetch oEmbed      -> title
       <- { type, src, title }
   └─> aperçu live <EmbedPlayer/>, titre éditable
   └─> "Ajouter/Enregistrer" -> onSave(embed) -> setEmbeds([...]) (state local)
Admin clique "Enregistrer les lecteurs"
   └─> saveEmbeds(artistId, embeds) [existant] -> DB + revalidate
```

## Gestion des erreurs

- Lien non reconnu → message inline dans la popup, validation bloquée.
- oEmbed indisponible → embed accepté avec titre vide (à compléter à la main).
- `embedsSchema` (validation serveur existante) inchangé : `src` doit être une URL
  valide et `title` non vide. La popup garantit déjà un `src` correct ; on garde
  la validation serveur comme filet.

## Tests

- **Unitaires** `lib/embeds.test.ts` sur `parseEmbedUrl` :
  - le lien d'exemple `…/intl-fr/album/0T5q…?si=…` → `https://open.spotify.com/embed/album/0T5qEo7UssRa1mnRR0LGx9`
  - Spotify `album`, `track`, `playlist`, `artist`, `episode`, `show`
  - Spotify déjà-`/embed/` → idempotent
  - URI `spotify:album:<id>`
  - YouTube `watch?v=`, `youtu.be/`, `shorts/`, `embed/` (+ params parasites)
  - liens invalides / autres domaines → `null`
- Le projet a déjà `lib/validation/artist.test.ts` → même runner.

## Hors périmètre (YAGNI)

- Pas de drag-and-drop pour réordonner les embeds (l'ordre du tableau suffit).
- Pas d'autres plateformes (SoundCloud, Bandcamp, Deezer, Apple Music) pour
  l'instant — l'archi `parseEmbedUrl` reste extensible si besoin plus tard.
- Pas de récupération de pochette/artwork ni de durée ; seul le titre est tiré de
  l'oEmbed.

## Fichiers touchés

| Fichier | Action |
|---|---|
| `lib/embeds.ts` | **nouveau** — `parseEmbedUrl` |
| `lib/embeds.test.ts` | **nouveau** — tests unitaires |
| `app/backoffice/artistes/actions.ts` | **+** `resolveEmbed` server action |
| `components/admin/EmbedDialog.tsx` | **nouveau** — la popup |
| `app/backoffice/artistes/[id]/ArtistEditClient.tsx` | liste inline → liste lecture seule + popup |
