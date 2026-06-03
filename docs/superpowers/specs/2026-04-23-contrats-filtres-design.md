# Filtres de la page Contrats : refonte complète

**Date** : 2026-04-23
**Statut** : Design validé, prêt pour plan d'implémentation
**Page cible** : `/backoffice/contrats` (fichier `app/backoffice/contrats/page.tsx`)

## Contexte

La page `/backoffice/contrats` dispose aujourd'hui d'une seule barre de filtres (pills de statut, mono-sélection) et d'une rangée de 4 KPI non cliquables qui dupliquent partiellement l'information des pills. Il n'y a ni recherche, ni tri, ni filtres par type / partie / échéance / année. L'URL ne reflète jamais l'état des filtres.

Un spec antérieur (`2026-04-23-filtres-multi-selection-backoffice-design.md`) propose, sans avoir encore été implémenté, de passer les pills des 3 pages du backoffice (`demos`, `demandes`, `contrats`) en multi-sélection via un composant partagé `MultiPillFilter`, avec un hint éditorial en italique.

## Objectif

Refondre les filtres de `/backoffice/contrats` pour les rendre réellement utiles à mesure que le nombre de contrats augmente : recherche, 4 axes supplémentaires, tri, état dans l'URL, et fusion des KPI avec les pills de statut.

## Relation avec le spec multi-sélection précédent

Le spec `2026-04-23-filtres-multi-selection-backoffice-design.md` reste valable pour `/backoffice/demos` et `/backoffice/demandes`. Pour `/backoffice/contrats`, la présente refonte le remplace, **mais en conserve l'esprit** : la sélection du statut reste multi-sélection (sémantique `Set<ContractStatus>`, « Tous » = Set vide, cliquer une tuile active la toggle, cliquer « Tous » vide le Set). Le composant partagé `MultiPillFilter` n'est pas réutilisé ici car la forme visuelle choisie pour `/contrats` (tuiles unifiées KPI+pills) est différente des pills standard des deux autres pages.

## Non-objectifs

- Persistance en `localStorage` : l'URL suffit.
- Migration vers un vrai backend : `CONTRACTS` reste une constante locale dans ce spec. L'architecture permettra le remplacement ultérieur sans changer l'UI.
- Multi-sélection sur les axes autres que Statut : MVP mono-select. Peut être ajouté plus tard si besoin.
- Refonte du tableau de résultats lui-même : hors scope.
- Refonte des sections « Rappels à venir » et « Charte contractuelle » en bas de page : intactes.

## Décisions de design

### État dans l'URL (Next.js App Router)

Sept paramètres de recherche pilotent les filtres :

| Param    | Type                                | Défaut          | Sérialisation                       |
|----------|-------------------------------------|-----------------|-------------------------------------|
| `q`      | `string`                            | `""`            | tel quel, encodé URL                |
| `status` | `Set<ContractStatus>`               | `∅` (« Tous »)  | CSV : `en_cours,a_signer`           |
| `type`   | `string \| "tous"`                  | `"tous"`        | valeur brute ou omis                |
| `party`  | `string \| "toutes"`                | `"toutes"`      | valeur brute ou omis                |
| `due`    | `"3m" \| "6m" \| "12m" \| "expired" \| "toutes"` | `"toutes"` | valeur brute ou omis |
| `year`   | `string \| "toutes"` (ex. `"2026"`) | `"toutes"`      | valeur brute ou omis                |
| `sort`   | `"recent" \| "old" \| "end_asc" \| "amount_desc" \| "alpha"` | `"recent"` | valeur brute ou omis (`recent` omis) |

Valeurs par défaut (`""`, `∅`, `"tous"`, `"toutes"`, `"recent"`) sont **retirées** de l'URL pour la garder propre.

Hook Next.js standard : `useSearchParams()`, `usePathname()`, `useRouter()`. Les updates passent par `router.replace(...)` (sans push d'historique à chaque frappe) avec `{ scroll: false }`.

### Filtrage multi-sélection du statut

Conforme au spec multi-sélection antérieur :

- État interne : `Set<ContractStatus>`, invariant *« Tous » n'est jamais dans le Set*.
- `Set` vide ≡ « Tous » actif, tous les contrats matchent l'axe statut.
- Cliquer la tuile « Tous » vide le Set.
- Cliquer une autre tuile la toggle dans le Set.
- Si le Set est vide par toggle, « Tous » redevient actif automatiquement.

```ts
const statusMatches = (c: Contract) =>
  selectedStatus.size === 0 || selectedStatus.has(c.status);
```

### Axes mono-sélection

Pour Type, Partie, Échéance, Année, Tri : un `<select>` natif, une seule valeur à la fois. La valeur sentinelle `"tous"` / `"toutes"` signifie « pas de filtre » et est la valeur par défaut.

### Combinaison des axes

AND strict entre axes. Un contrat est inclus si, et seulement si, il passe tous les axes simultanément.

## Architecture

### Découpage fichiers

```
app/backoffice/contrats/page.tsx          ← assembleur, orchestre URL ↔ state
components/admin/ContractFilters.tsx      ← barre recherche + 5 dropdowns + chips actives + reset
components/admin/StatusTiles.tsx          ← 5 tuiles unifiées KPI+pills, multi-select
lib/contracts.ts                          ← données mockées + helpers dérivés + filtrage/tri
```

`page.tsx` reste court (~100 lignes max après refonte, contre ~290 aujourd'hui).

### `lib/contracts.ts`

Contient :

- Le type `Contract` et le type `ContractStatus` (migrés depuis `page.tsx`).
- La constante `CONTRACTS` (migrée telle quelle).
- `STATUS_LABEL` (migré).
- `STATUS_HINT : Record<ContractStatus | "tous", string>` pour les sous-titres des tuiles, dérivés des hints actuels des KPI (*« tout roster confondu »*, *« action requise »*, *« à renégocier »*, *« historique complet »*, et pour « Tous » : *« tout statut confondu »*).
- `deriveOptions(contracts)` → retourne `{ types: string[]; parties: string[]; years: string[] }` triés, dédupliqués. `type` est canonicalisé via `splitTypePrefix(raw)` qui renvoie le segment avant ` · ` (ex. `"Contrat d'artiste · 3 ans"` → `"Contrat d'artiste"`).
- `countByStatus(contracts)` → `Record<ContractStatus, number>` + `total`.
- `filterAndSort(contracts, params)` → `Contract[]` qui applique tous les axes (status Set, q normalisé, type, party, due, year) puis trie selon `sort`.
- `parseAmount(raw: string) : number | null` utilisé par le tri : extrait la valeur numérique en euros (ignore les `%`, `50/50`, `-` qui deviennent `null` ; dans le tri `amount_desc`, les `null` vont en fin de liste).

### `components/admin/StatusTiles.tsx`

Props :

```ts
type StatusTilesProps = {
  counts: Record<ContractStatus, number> & { total: number };
  selected: Set<ContractStatus>;
  onChange: (next: Set<ContractStatus>) => void;
};
```

Rendu : grille de 5 tuiles `grid grid-cols-2 sm:grid-cols-5 gap-3`. Chaque tuile est un `<button type="button">` avec 3 lignes :

1. Label en eyebrow (`font-serif text-[10px] tracking-eyebrow uppercase font-bold`)
2. Compte en chiffre (`font-display text-[28px] leading-none`)
3. Hint italique (`italic text-[11px] text-ink-muted`)

État actif (pour la tuile « Tous », `selected.size === 0` ; pour les autres, `selected.has(k)`) : `bg-bleu-nuit-700 border-bleu-nuit-700 text-beige-sable` ; hint `text-beige-sable/70`.
État neutre : `bg-paper-soft border-ink/10 hover:border-ink/40`.

Comportement :
- Clic « Tous » → `onChange(new Set())`
- Clic autre → toggle dans le Set, `onChange(nextSet)`

### `components/admin/ContractFilters.tsx`

Props :

```ts
type ContractFiltersProps = {
  q: string;
  onQChange: (next: string) => void;
  type: string;
  onTypeChange: (next: string) => void;
  typeOptions: string[];
  party: string;
  onPartyChange: (next: string) => void;
  partyOptions: string[];
  due: DueFilter;
  onDueChange: (next: DueFilter) => void;
  year: string;
  onYearChange: (next: string) => void;
  yearOptions: string[];
  sort: SortKey;
  onSortChange: (next: SortKey) => void;
  activeChips: { key: string; label: string; onRemove: () => void }[];
  onReset: () => void;
  hasActiveFilters: boolean;
};
```

Rendu en 2 rangées (ou 3 sur mobile) :

**Rangée 1** (`flex flex-wrap items-center gap-3`) :
- Input recherche à gauche, `flex-1` min-width, icône loupe SVG inline. Débounce 150 ms sur `onQChange` (le débounce est géré côté consommateur pour rester simple. Le composant appelle `onQChange` à chaque frappe, `page.tsx` débounce avant de pousser dans l'URL).
- 5 `<select>` : Type, Partie, Échéance, Année, Tri. Classes communes : `font-serif text-[12px] tracking-[0.02em] uppercase font-bold px-3 py-2 rounded-[2px] border border-ink/15 bg-paper-soft text-ink hover:border-ink/40 appearance-none` + chevron custom via `background-image`.
- Bouton reset `↻` à droite, visible uniquement si `hasActiveFilters`.

**Rangée 2 (chips actives)**. S'affiche uniquement si `activeChips.length > 0` :
- `flex flex-wrap items-center gap-2` avec label italique `« Filtres actifs : »` puis chaque chip = petit bouton avec `label ×` qui appelle `onRemove` au clic, puis un lien `« Réinitialiser »` à droite.

### `page.tsx`

Orchestration :

1. `useSearchParams()` + `useRouter()` + `usePathname()`.
2. Fonctions locales `setParam(key, value)` et `setStatusSet(next)` qui synchronisent les searchParams (en omettant les valeurs par défaut).
3. Décodage au mount + à chaque changement d'URL :
   ```ts
   const q = searchParams.get("q") ?? "";
   const status = decodeStatusSet(searchParams.get("status"));
   const type = searchParams.get("type") ?? "tous";
   // ... etc
   ```
4. Débounce local pour `q` : state local `qLocal` miroir de l'URL, `useEffect` avec `setTimeout(150ms)` qui fait `setParam("q", qLocal)`.
5. `useMemo` : options dérivées via `deriveOptions(CONTRACTS)`, comptes via `countByStatus(CONTRACTS)`, liste filtrée+triée via `filterAndSort(CONTRACTS, { q, status, type, party, due, year, sort })`.
6. Construction des `activeChips` : parcours des filtres non-défaut pour produire la liste.
7. Rendu : `<PageHeader />`, `<StatusTiles />`, `<ContractFilters />`, tableau ou empty state, divider, sections bas de page, footer.

### Empty state

Si `filtered.length === 0` :

```tsx
<div className="bg-paper-soft border border-ink/10 rounded-[2px] p-10 text-center">
  <p className="italic text-[14px] text-ink-muted mb-4">
    Aucun contrat ne correspond à ces filtres. Ajustez la recherche ou
    réinitialisez pour retrouver l'ensemble du dossier.
  </p>
  <button
    type="button"
    onClick={onReset}
    className="font-serif text-[11px] tracking-eyebrow uppercase font-bold px-3.5 py-2 rounded-full border border-ink/30 hover:border-ink cursor-pointer"
  >
    Réinitialiser les filtres
  </button>
</div>
```

## Comportement détaillé

### Recherche (`q`)

Match sur `title`, `party`, `id`. Normalisation accents + casse :

```ts
const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const qNorm = norm(q.trim());
const match = qNorm === "" ||
  norm(c.title).includes(qNorm) ||
  norm(c.party).includes(qNorm) ||
  norm(c.id).includes(qNorm);
```

### Statut

Multi-select via `Set<ContractStatus>` (voir Décisions de design).

### Type

Options dérivées de `deriveOptions(CONTRACTS).types`. La comparaison utilise la même canonicalisation (`splitTypePrefix(c.type) === type`). `"tous"` = pas de filtre.

### Partie

Options = valeurs uniques de `c.party`. Comparaison stricte. `"toutes"` = pas de filtre.

### Échéance (`due`)

Calculé à partir de la date du jour (`new Date()` au render). `endDate = new Date(c.end)`.

- `"3m"` : `endDate <= today + 3 mois` ET `endDate >= today`
- `"6m"` : idem avec 6 mois
- `"12m"` : idem avec 12 mois
- `"expired"` : `endDate < today`
- `"toutes"` : pas de filtre

Indépendant du statut (un contrat `archive` peut matcher `expired`).

### Année

Options = années distinctes extraites de `c.start.slice(0,4)`, triées desc. Filtrage : `c.start.startsWith(year)`. `"toutes"` = pas de filtre.

### Tri

- `"recent"` : `c.start` desc (défaut)
- `"old"` : `c.start` asc
- `"end_asc"` : `c.end` asc (fin la plus proche en premier)
- `"amount_desc"` : `parseAmount(c.amount)` desc, `null` en fin de liste
- `"alpha"` : `c.title` asc via `localeCompare("fr")`

## Fusion KPI ↔ Pills : qu'advient-il de l'existant

- La rangée `<section className="grid grid-cols-1 sm:grid-cols-4 gap-4">` avec les 4 `<KPI />` est **supprimée**.
- Le bloc `<div className="flex items-center gap-2 flex-wrap">` avec les 5 pills est **remplacé** par `<StatusTiles />`.
- Les hints des 4 KPI (*« tout roster confondu »*, *« action requise »*, *« à renégocier »*, *« historique complet »*) deviennent les sous-titres italiques des 4 tuiles correspondantes. La tuile « Tous » reçoit *« tout statut confondu »*.
- `KPI` (composant importé de `AdminPrimitives`) n'est plus utilisé par cette page ; on ne supprime pas le composant lui-même (il sert peut-être ailleurs, à vérifier au moment de l'implémentation).

## Testing

Pas de suite de tests automatisés dans le repo. Vérification manuelle dans le navigateur après `pnpm dev` :

1. Page par défaut : URL propre (`/backoffice/contrats`), tuile « Tous » active, 6 contrats affichés.
2. Cliquer tuile « À signer » : URL devient `?status=a_signer`, 1 contrat affiché, chip `« À signer × »` visible.
3. Ctrl+Cliquer (ou re-cliquer) tuile « En vigueur » : URL devient `?status=a_signer,en_cours`, 3 contrats affichés.
4. Taper « arte » dans recherche : après 150 ms, URL devient `?...&q=arte`, 1 contrat affiché.
5. Sélectionner Type = « Synchronisation » : URL ajoute `&type=Synchronisation`, filtre se combine.
6. Sélectionner Échéance = « ≤ 6 mois » : URL ajoute `&due=6m`, filtre sur `end`.
7. Cliquer « Réinitialiser » : URL retourne à `/backoffice/contrats`, tous les filtres sont effacés.
8. Cliquer la × d'une chip : le filtre correspondant disparaît de l'URL, les autres restent.
9. Recharger la page avec une URL filtrée : l'état visuel est restauré à l'identique.
10. Utiliser le bouton « Précédent » du navigateur : l'état précédent est restauré.
11. Combinaison vidant la liste (ex. `q=zzz`) : empty state affiché avec bouton reset fonctionnel.
12. Clavier : tab-order dans l'ordre visuel ; `Enter` dans la recherche ne fait rien de particulier (pas de submit), le débounce s'en occupe.

## Risques et points d'attention

- **Débounce et URL** : `router.replace` à chaque frappe serait coûteux et polluerait l'historique même en `replace`. Le débounce 150 ms sur `q` est nécessaire.
- **Hydratation SSR** : `useSearchParams` retourne un objet stable côté serveur et client, mais `new Date()` dans le filtre `due` peut produire un mismatch SSR/CSR si la page est prerendered. Solution : forcer le calcul du `due` dans un `useEffect` ou utiliser `"use client"` (déjà le cas dans `page.tsx` ligne 1).
- **Sérialisation `Set` → CSV** : si un jour un statut contient une virgule, ça casse. Les 4 valeurs actuelles (`en_cours`, `a_signer`, `echu`, `archive`) n'en contiennent pas. OK.
- **Canonicalisation de `type`** : `splitTypePrefix` suppose un séparateur ` · ` (espace + middle-dot + espace). Tous les contrats actuels respectent ce format. Si un futur contrat n'a pas de séparateur, la valeur entière est utilisée comme type. Comportement acceptable.
- **Un contrat sans `party` ou `type`** n'est pas géré dans le type actuel (ce sont des champs obligatoires). Aucun guard défensif ajouté.

## Plan de livraison

1. Créer `lib/contracts.ts` avec `Contract`, `ContractStatus`, `CONTRACTS`, `STATUS_LABEL`, `STATUS_HINT`, `deriveOptions`, `countByStatus`, `filterAndSort`, `parseAmount`, `splitTypePrefix`, `DueFilter`, `SortKey`.
2. Créer `components/admin/StatusTiles.tsx`.
3. Créer `components/admin/ContractFilters.tsx`.
4. Réécrire `app/backoffice/contrats/page.tsx` pour consommer les trois nouveaux modules, lire/écrire l'URL, gérer débounce.
5. Vérification manuelle (liste ci-dessus).
