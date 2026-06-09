# Artistes fonctionnel — CRUD + uploads (design)

Date : 2026-06-09
Statut : validé (en attente de plan d'implémentation)

## Contexte

Le backoffice est partiellement fonctionnel : démos, comptes, newsletter, réglages
et compte persistent déjà via des server actions (pattern validation Zod →
mutations `lib/db/*-mutations.ts` → action `"use server"` → `revalidatePath`).

La section **Artistes** est en revanche en lecture seule : `app/backoffice/artistes/`
lit la base (`getArtists`, `findArtist`) mais n'a **aucun `actions.ts`**. Dans
`ArtistEditClient.tsx`, tous les champs sont des `defaultValue` non contrôlés ;
seul le sous-formulaire « newsletter de l'artiste » sauvegarde réellement (via
`saveArtistNewsletter`). La page `/artistes/nouveau` est un formulaire inerte.

Les pages publiques `/artists` et `/artists/[id]` rendent déjà depuis la base via
`generateStaticParams`. Les écritures du backoffice devront donc revalider ces
chemins pour apparaître côté public.

Ce spec couvre **uniquement** la pièce « Artistes ». Les autres pièces (journal,
demandes, agenda, statistiques, bouton notifications) feront chacune leur propre
cycle spec → plan → implémentation.

## Périmètre

« Artistes fonctionnel » = persistance des **6 onglets** de la fiche, plus
création et suppression :

- **Identité** : nom, slug (lecture seule en édition), accroche, genre principal,
  année de signature, couleur signature (hex), citation, genres (liste de chips).
- **Biographie** : bio courte, bio longue.
- **Discographie** : liste de sorties (`DiscoItem[]`) — ajout / édition / suppression / réordonnancement.
- **Concerts** : dates (`artist_shows`) — ajout / édition / suppression.
- **Réseaux** : newsletter (déjà fonctionnel, conservé), réseaux/plateformes
  (`socials: Record<string,string>`), lecteurs intégrés (`embeds: Embed[]`).
- **Médias** : portrait, couverture, galerie — uploads via Vercel Blob (client upload).
- **Publication** : bascule publié / brouillon.
- **Création** : `/artistes/nouveau` → insertion + redirection vers l'édition.
- **Suppression** : « Archiver la fiche » = suppression dure avec confirmation.

Hors périmètre : refonte visuelle (on câble la maquette existante), gestion de
l'équipe/référent (champ `AdminSelect` laissé tel quel pour l'instant, valeurs
statiques), les autres sections du backoffice.

## Décisions actées

- **Un sous-projet à la fois** : Artistes en premier.
- **Sauvegarde par onglet** : chaque onglet possède son propre bouton + action +
  ligne de statut, à l'image du sous-formulaire newsletter déjà présent. Pas de
  bouton « Enregistrer » global trompeur ; la barre du haut porte la bascule de
  publication et un indicateur « modifié » par onglet.
- **Uploads = client upload Blob** : route token + `upload()` navigateur, pour
  contourner le plafond ~4,5 Mo des server actions (galerie, grandes images).
- **A — Slug/id immuable après création** : c'est la clé primaire, l'URL publique
  et la FK de `artist_shows`. Le champ Slug est rendu en lecture seule en édition.
  Le renommer proprement (re-keyer les lignes + redirection) n'est pas justifié ici.
- **B1 — Archivage = suppression dure** : « Dépublier » = `published:false` (la
  bascule existante) ; « Archiver la fiche » = `db.delete` avec confirmation tapée
  (`oui`, comme le pattern d'annulation de décision sur les démos), cascade sur
  `artist_shows` (déjà `onDelete: "cascade"`).

## Architecture

Trois couches + une route API, calquées sur le pattern démos.

### 1. `lib/validation/artist.ts` (Zod 4)

Un schéma par unité éditable, avec les regex maison déjà utilisées (`EMAIL_RE`,
`URL_RE`) pour rester indépendant des variations d'API entre versions de Zod :

- `identitySchema` : `name` (requis), `tagline` (requis), `genre` (requis),
  `signedYear` (requis), `primaryColor` (hex optionnel, regex `^#?[0-9a-fA-F]{3,8}$`),
  `quote` (optionnel), `genres` (string[]).
- `bioSchema` : `bioShort` (requis, ≤ 280), `bioLong` (requis).
- `discoItemSchema` : `id`, `kind`, `title`, `year`, `cover` (url), `note?`.
- `showSchema` : `date` (YYYY-MM-DD), `city`, `venue`, `status?`, `free` (bool), `ticketUrl?` (url).
- `embedSchema` : `type` (`"spotify"|"youtube"`), `title`, `src` (url).
- `socialsSchema` : `Record<string,string>` avec valeurs url.
- `createArtistSchema` : `name` (requis), `slug?`, `tagline?`, `genre?`,
  `signedYear?`, `bioShort?`.

Les schémas de listes valident le tableau complet (remplacement intégral, voir
ci-dessous).

### 2. `lib/db/artist-mutations.ts` (`server-only`)

Mutations ciblées, chacune `db.update(artists).set(patch).where(eq(artists.id, id))`
sauf indication, avec `updatedAt: new Date()` :

- `createArtist(input)` : `slugify(name)` si slug vide, collision vérifiée
  (suffixe `-2`, `-3`… si l'id existe), insertion avec `published:false` et
  chaînes vides pour les colonnes `notNull` non renseignées
  (`tagline`, `genre`, `signedYear`, `portraitUrl`, `coverUrl`, `bioShort`,
  `bioLong`). Retourne l'`id`.
- `updateIdentity(id, data)` — name, tagline, genre, signedYear, primaryColor,
  quote, genres.
- `updateBio(id, data)` — bioShort, bioLong.
- `setPublished(id, published)`.
- `replaceDiscography(id, items)` — écrit le `jsonb` complet.
- `replaceEmbeds(id, items)` / `replaceSocials(id, record)` — idem `jsonb`.
- `setMedia(id, { portraitUrl?, coverUrl?, gallery? })` — colonnes médias.
- `upsertShow(artistId, show)` / `deleteShow(showId)` — table `artist_shows`
  (id via `randomUUID()` à l'insert).
- `deleteArtist(id)` — `db.delete(artists)` (cascade `artist_shows`).

Stratégie listes : **remplacement intégral** du `jsonb` (`discography`, `embeds`,
`socials`, `genres`) à chaque sauvegarde de l'onglet — simple, cohérent, pas de
diff incrémental. Les `artist_shows` sont en table relationnelle → upsert/delete
ligne par ligne.

### 3. `app/backoffice/artistes/actions.ts` (`"use server"`)

Une action par onglet, signature `=> Promise<{ ok: true } | { ok: false; error: string }>`
(le sous-formulaire newsletter renvoie déjà cette forme) :

- `saveIdentity`, `saveBio`, `setArtistPublished`, `saveDiscography`,
  `saveShow`, `removeShow`, `saveEmbeds`, `saveSocials`, `saveMedia`,
  `createArtistAction`, `archiveArtist`.
- Chaque action : validation Zod → mutation → revalidation puis retour `{ok}`.
- `createArtistAction` fait `redirect('/backoffice/artistes/{id}')`.
- `archiveArtist` exige un argument de confirmation (`confirm === "oui"`).

Revalidation systématique après écriture :
`revalidatePath('/backoffice/artistes')`, `revalidatePath('/artists')`,
`revalidatePath('/artists/[id]', 'page')` (et `/backoffice/artistes/[id]` pour
l'édition).

### 4. `app/api/blob/upload/route.ts`

`handleUpload` de `@vercel/blob/client` (dépendance `^2.3.3` déjà présente) :
- `onBeforeGenerateToken` : restreint le `pathname` au préfixe `artists/{id}/`,
  types image, taille max raisonnable (ex. 8 Mo).
- Le navigateur appelle `upload(file, { handleUploadUrl: '/api/blob/upload' })`,
  reçoit l'URL Blob, puis appelle `saveMedia` pour persister l'URL.
- Disposition Blob : `artists/{id}/portrait-…`, `…/cover-…`, `…/gallery/…`.

## Flux de données (onglet Identité, exemple)

1. `ArtistEditPage` (server) → `findArtist(id)` → `ArtistEditClient`.
2. L'onglet Identité est un `<form action={saveIdentity.bind(null, id)}>` ;
   champs via `name=` (les primitives forwardent déjà `name`), genres en état
   contrôlé sérialisé dans un champ caché JSON.
3. Soumission → `saveIdentity` valide, `updateIdentity`, revalide, renvoie `{ok}`.
4. Le client affiche la ligne de statut (vert « Enregistré » / magenta erreur),
   via `useTransition` comme le sous-formulaire newsletter.

Onglets à listes (discographie, concerts, réseaux, médias) : état React contrôlé
(ajout/édition/suppression/réordonnancement local), bouton « Enregistrer
l'onglet » qui passe le tableau structuré à l'action correspondante.

## Découpage en unités (isolation)

| Unité | Rôle | Dépend de |
|---|---|---|
| `lib/validation/artist.ts` | valider les entrées | zod |
| `lib/db/artist-mutations.ts` | écrire en base | db, schema |
| `app/backoffice/artistes/actions.ts` | orchestrer valid.+mut.+revalidation | les deux ci-dessus |
| `app/api/blob/upload/route.ts` | tokens upload client | @vercel/blob/client |
| `ArtistEditClient.tsx` (refactor) | UI par onglet, états contrôlés | actions, route upload |
| `nouveau/page.tsx` + client | création | createArtistAction |

Chaque action est testable indépendamment ; chaque mutation a une responsabilité unique.

## Gestion d'erreurs

- Validation : `safeParse`, première erreur par champ renvoyée dans `{ok:false,error}`.
- Échec base : laissé remonter (l'action renvoie `{ok:false,error:"…"}`), le client
  affiche le message ; pas de perte silencieuse.
- Upload : erreurs réseau/Blob remontées au client, l'URL n'est persistée que sur
  succès de l'upload.
- Suppression : bloquée tant que la confirmation tapée ≠ `oui`.

## Tests

- `lib/validation/artist.test.ts` (vitest, comme `demo.test.ts`) : cas valides /
  invalides par schéma (slug, hex couleur, urls, year, embed type).
- Vérification manuelle : créer une fiche → éditer chaque onglet → uploader une
  image → publier → vérifier l'apparition sur `/artists/[id]` → archiver.

## Risques / notes

- Colonnes `notNull` sans défaut à la création → chaînes vides ; l'UI invite à
  compléter avant publication (pas de garde stricte « publiable » dans cette passe).
- `primaryColor` alimente l'accent CSS de la page publique : valider le format hex.
- Le champ « référent·e projet » (`AdminSelect`) reste statique ; sa persistance
  relève de la pièce Comptes/Équipe, hors périmètre.
