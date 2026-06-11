# ARTémis Records · site vitrine

Site du label musical **ARTémis Records** (Paris · Menucourt, 2026), porté sur Next.js 16 + React 19 + Tailwind v4. Le design est issu d'un prototype HTML/CSS/JS exporté depuis [Claude Design](https://claude.ai/design) (bundle `art-mis-records-prototype`), ré‑implémenté pixel‑perfect en App Router.

---

## Stack

| Couche | Choix |
| --- | --- |
| Framework | **Next.js 16.2** (App Router, Turbopack) |
| Runtime | React 19 / TypeScript 5 |
| Style | **Tailwind CSS v4** (config `@theme` dans le CSS, pas de fichier JS) |
| Package manager | **pnpm** |
| Rendering | Statique (SSG), toutes les routes pré‑rendues au build |
| Fonts | Catchy Mager (self‑host `/public/fonts`) · Italiana + Libre Baskerville (Google Fonts via `<link>` dans `<head>`) |

Pas de base de données, pas d'auth, pas d'API côté serveur : tout le contenu est dans `lib/data.ts`. Le backoffice admin du prototype n'a pas été porté (hors scope de `index.html`).

---

## Démarrage

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # build prod (Turbopack)
pnpm start      # sert le build
```

Node ≥ 20 recommandé. Le projet a été validé avec Node 25 / pnpm 10.

---

## Structure

```
app/
  layout.tsx              # shell HTML, Nav + Footer, <link> fonts Google
  globals.css             # @import tailwindcss + @theme + utilitaires .stars/.grain/.legal-body
  page.tsx                # accueil (hero + roster + valeurs + journal)
  about/page.tsx          # manifeste, fondatrices, positionnement, valeurs
  artists/page.tsx        # roster filtrable (client component)
  artists/[id]/page.tsx   # détail artiste, generateStaticParams
  news/page.tsx           # journal
  news/[id]/page.tsx      # article, generateStaticParams
  contact/page.tsx        # formulaire (client)
  demo/page.tsx           # soumission démo (client)
  charte/page.tsx         # charte des valeurs & engagements du label
  charte-graphique/page.tsx # charte graphique (logos, couleurs, type)
  legal/ privacy/ cgu/    # mentions légales
  not-found.tsx           # 404

components/
  Nav.tsx                 # navbar sticky (inverse sur la home)
  Footer.tsx              # footer éditorial
  Primitives.tsx          # Wordmark / Eyebrow / ChapterTitle / Btn / BowMark / Badge
  ArtistCard.tsx          # carte roster
  NewsCard.tsx            # carte journal
  NewsletterBand.tsx      # bande newsletter magenta (client)
  EmbedPlayer.tsx         # lecteur Spotify / YouTube
  FormFields.tsx          # Field / TextArea / InfoRow / SuccessPanel (client)
  LegalPage.tsx           # layout pages légales

lib/
  data.ts                 # ARTISTS, NEWS, findArtist, findNews, formatDate

public/
  assets/                 # logos, icônes, portraits, cousines.webp, moodboards
```

La police display (Catchy Mager) n'est **pas dans le repo** : servie depuis Vercel Blob (voir « Polices : notes de licence »).

---

## Design tokens (Tailwind v4)

Tous les tokens sont dans `@theme` (`app/globals.css`). Utilisation directe en classes Tailwind :

| Token | Classe Tailwind |
| --- | --- |
| Couleurs primaires | `bg-bleu-nuit-{900,800,700,600,500,300,100}` · `bg-beige-sable{,-50,-100,-200,-300}` · `bg-taupe{,-300…900}` · `bg-vert-foret{,-500,-700,-900}` · `bg-magenta` |
| Alias sémantiques | `bg-paper`, `bg-paper-soft`, `text-ink`, `text-ink-muted`, `text-ink-subtle` |
| Polices | `font-display` (Catchy Mager → fallback Italiana) · `font-serif` (Libre Baskerville) |
| Letter‑spacing | `tracking-display` (0.02em) · `tracking-eyebrow` (0.22em) · `tracking-caps` (0.14em) |
| Ombres | `shadow-editorial-{xs,sm,md,lg}` |

Les opacités s'écrivent à la Tailwind : `text-beige-sable/70`, `border-ink/15`, etc.

### Utilitaires custom (CSS pur)

Dans `@layer utilities` :

- `.stars` : scintillement d'étoiles 4 branches (SVG inline), z‑index 0, posé en absolute derrière le texte des héros. Variantes `.stars-dense` possibles.
- `.grain` : overlay bruité subtil (mix‑blend multiply) pour les fonds image.
- `.legal-body` : typographie des pages légales (h3 didone + p 62ch).

Animations : `twinkle-a` / `twinkle-b` (respecte `prefers-reduced-motion`).

### Accent dynamique par artiste

Chaque artiste a un `primaryColor` (ex. Caëlya `#7800a8`). Dans `app/artists/[id]/page.tsx`, on réécrit `--color-magenta` en style inline sur la racine `<article>`. Tous les enfants qui utilisent `text-magenta` / `bg-magenta` / `border-magenta` héritent automatiquement via la cascade CSS.

---

## Polices : notes de licence

> ⚠️ **Catchy Mager** est une police de **Sensatype Studio** (2020), **gratuite en usage personnel**, **licence commerciale requise** pour la prod.

Le fichier woff (téléchargé à l'origine depuis [CDNFonts](https://www.cdnfonts.com/catchy-mager.font)) est **volontairement hors du repo** (repo public ≠ licence de redistribution) : il est hébergé sur **Vercel Blob** (`fonts/CatchyMager.woff` dans le store du projet) et référencé en URL absolue dans le `@font-face` de `app/globals.css`. Le `@font-face` tente d'abord `local('Catchy Mager')` puis retombe sur le fichier Blob.

**Avant mise en prod publique** (domaine `artemisrecordslabel.com` ou équivalent) :

1. Acheter une licence **web** chez Sensatype ([Creative Market](https://creativemarket.com/sensatype)), typiquement 20–40 $ selon le tier de pageviews.
2. Remplacer le fichier sur Vercel Blob par les fichiers reçus (souvent woff2 + woff) et mettre à jour le `@font-face`.
3. Stocker le PDF de licence hors‑repo (Drive / Notion) ; ne pas commiter.

Italiana + Libre Baskerville sont sous **SIL Open Font License** (libre, usage commercial OK).

---

## Data & contenu

- **`lib/data.ts`** contient `ARTISTS` et `NEWS` en dur, typés (`Artist`, `NewsItem`).
- Chaque artiste porte : portrait, cover, bioShort/bioLong, genres, socials, embeds (Spotify/YouTube), discographie, dates, galerie, primaryColor.
- Les routes dynamiques `/artists/[id]` et `/news/[id]` utilisent `generateStaticParams()` pour pré‑rendre toutes les pages au build.
- Ajouter un artiste = ajouter une entrée au tableau `ARTISTS` + la photo dans `public/assets/`.

---

## Ce qui n'est PAS porté

Volontairement, pour rester dans le scope de `index.html` :

- **Backoffice admin** (`admin.jsx`, `admin_editor.jsx`) : permettait d'éditer artistes/news via localStorage.
- **Variantes de layout de la home** (`magazine`, `immersive`) : seule `editorial` est en place.
- **Tweaks panel** (sélecteur live de thème, layouts, paramètres de vague).
- **Persistance localStorage** via `ARStore` : le contenu est maintenant statique.
- **Navigation side** : seule la navbar top.

Tous sont restaurables à la demande.

---

## Conventions

- Pages statiques par défaut (Server Components) ; `"use client"` uniquement si interactif (formulaires, filtres, `NewsletterBand`).
- Dynamic background‑image via `style={{ background: \`center/cover url(${x})\` }}`. Tailwind ne gère pas bien les URLs dynamiques.
- Pas de CSS‑in‑JS, pas de styled‑components. Tout est Tailwind + quelques utilitaires CSS globaux.
- Les textes sont en français, les identifiants / types / clés sont en anglais (`Artist`, `findArtist`, etc.).

---

## Crédits

- Identité visuelle & charte : ARTémis Records (2025)
- Prototype d'origine : export Claude Design, bundle `art-mis-records-prototype`
- Moodboards & photos fondatrices : `public/assets/`
- Police display : Catchy Mager © Sensatype Studio
