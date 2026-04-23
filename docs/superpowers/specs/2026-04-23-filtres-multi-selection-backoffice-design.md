# Filtres multi-sélection dans le backoffice

**Date** : 2026-04-23
**Statut** : Design validé, prêt pour plan d'implémentation

## Contexte

Trois pages du backoffice utilisent des barres de filtres à boutons « pilules » fonctionnant en mono-sélection :

- `/backoffice/demos` — une barre (Tous, Nouveaux, À écouter, Retenus, Refusés) avec compteurs
- `/backoffice/demandes` — deux barres (catégories en pilules, statut en texte plus léger)
- `/backoffice/contrats` — une barre (Tous, En vigueur, À signer, Échéance, Archivés)

Les trois pages ré-implémentent le même pattern de filtre et le même markup Tailwind. Il n'existe pas de composant partagé.

## Objectif

Permettre la sélection et désélection multiple sur tous les filtres concernés, avec un texte discret annonçant la capacité.

## Non-objectifs

- Persistance des filtres (URL, localStorage) — rien en place aujourd'hui, hors scope
- Refonte visuelle des barres — on conserve strictement les styles existants
- Filtres sur les autres pages du backoffice (agenda, artistes, compte, journal, newsletter, reglages, statistiques) — pas de barres de type pilule à transformer à ce jour

## Décisions de design

### Sémantique de sélection (option 3 validée)

- L'état interne est un `Set<FilterKey>`.
- **Invariant** : la clé « Tous » n'est jamais présente dans le `Set`. Le `Set` ne contient que des clés concrètes.
- `Set` vide ≡ « Tous » actif — la liste affiche tout.
- Cliquer « Tous » vide le `Set` ; « Tous » devient visuellement actif.
- Cliquer un autre filtre le bascule (toggle) dans le `Set` ; « Tous » se désactive automatiquement (car le `Set` devient non-vide).
- Si l'utilisateur décoche tous les autres filtres un par un, le `Set` redevient vide et « Tous » redevient actif naturellement.

### Logique de filtrage

```ts
const matches = selected.size === 0 || selected.has(item.status);
```

### Texte d'annonce (option 1 validée)

Sous la rangée de pills, un hint en italique discret :

> *Cliquez plusieurs filtres pour les combiner · recliquez pour désélectionner.*

Style : `font-serif italic text-[11px] text-ink-subtle mt-1.5`.

Le texte est toujours visible (ne se masque pas après première interaction) — c'est la convention éditoriale du backoffice (phrases italiques courtes).

### Rendu visuel

- Chaque pilule active garde son style actuel (`bg-bleu-nuit-700 text-beige-sable`). Plusieurs pilules peuvent être dans cet état simultanément sans aucune adaptation visuelle — c'est lisible immédiatement.
- Pour la variante subtle (2e barre de `/demandes`), pilules actives en `text-magenta bg-magenta/10`, identique à l'existant.

## Architecture

### Nouveau composant : `MultiPillFilter`

Placé dans `components/admin/MultiPillFilter.tsx` (même dossier que `AdminPrimitives.tsx`).

**Props** :

```ts
type MultiPillFilterOption<K extends string> = {
  k: K;
  label: string;
  count?: number;
};

type MultiPillFilterProps<K extends string, A extends string> = {
  all: A;                                  // clé correspondant à « Tous/Toutes »
  options: MultiPillFilterOption<K | A>[]; // inclut la pilule « Tous » en tête
  selected: Set<K>;                        // invariant : ne contient jamais `all` ; Set vide = « Tous » actif
  onChange: (next: Set<K>) => void;
  variant?: "pill" | "subtle";             // default "pill"
  label?: string;                          // optionnel, affiché en eyebrow à gauche (ex. "Statut")
  hint?: string;                           // override du hint par défaut si besoin
};
```

Le paramètre générique séparé `A` (typiquement le littéral `"tous"`) permet d'exclure du `Set` la clé « Tous », conformément à l'invariant.

**Comportement** :

- Clic sur `all` → `onChange(new Set())`
- Clic sur une autre clé :
  - si présente dans `selected` → retirer
  - sinon → ajouter
  - `onChange(nextSet)`
- Visuellement actif quand : `k === all ? selected.size === 0 : selected.has(k)`
- Hint par défaut affiché sous les pills : *Cliquez plusieurs filtres pour les combiner · recliquez pour désélectionner.*

**Rendu** : réutilise exactement les classes Tailwind actuellement utilisées dans les 3 pages (rien de nouveau).

### Pages consommatrices

#### `/backoffice/demos` (`app/backoffice/demos/page.tsx`)

- Remplacer `useState<Filter>("tous")` par `useState<Set<Filter>>(new Set())`
- Remplacer le bloc de boutons par `<MultiPillFilter>`
- Adapter `filtered` useMemo : `(filter !== "tous" && d.status !== filter)` → `(selected.size > 0 && !selected.has(d.status))`
- Le reset de l'EmptyState (`setFilter("tous")`) devient `setSelected(new Set())`

#### `/backoffice/demandes` (`app/backoffice/demandes/page.tsx`)

- Deux barres → deux `<MultiPillFilter>`
- Barre 1 (catégories) : `variant="pill"`, options inchangées
- Barre 2 (statut) : `variant="subtle"`, label `"Statut"`
- Deux `Set` indépendants dans le state
- Filtrage combiné : `(catSet.size === 0 || catSet.has(d.category)) && (statusSet.size === 0 || statusSet.has(d.status))`

#### `/backoffice/contrats` (`app/backoffice/contrats/page.tsx`)

- Remplacer `useState<"tous" | ContractStatus>("tous")` par `useState<Set<ContractStatus>>(new Set())` (on exclut `"tous"` du type — invariant ci-dessus)
- Remplacer le bloc de boutons par `<MultiPillFilter all="tous" ...>` 
- `filtered` useMemo devient : `selected.size === 0 ? CONTRACTS : CONTRACTS.filter(c => selected.has(c.status))`
- Les compteurs `counts` restent calculés comme aujourd'hui (indépendants de la sélection)

## Testing

Pas de suite de tests automatisés dans le repo actuellement. Vérification manuelle :

- Ouvrir les 3 pages en dev, vérifier pour chacune :
  1. Par défaut, « Tous/Toutes » est actif, toute la liste s'affiche
  2. Cliquer un filtre → « Tous » se désactive, liste filtrée
  3. Cliquer un deuxième filtre → deux filtres actifs, liste combinée
  4. Recliquer un filtre actif → désélection, liste se réduit
  5. Décocher le dernier filtre → « Tous » redevient actif
  6. Cliquer « Tous » avec plusieurs filtres actifs → tout se désélectionne, liste entière
  7. Le hint est visible et lisible
- Sur `/backoffice/demandes` : les deux barres fonctionnent indépendamment ; les filtres se combinent correctement (AND).

## Risques

- Les types des clés de filtre varient par page (ex. `Filter` dans demos, `CatFilter`/`StatusFilter` dans demandes, `"tous" | ContractStatus` dans contrats). Le composant doit être générique sur la clé (`<K extends string>`).
- Le reset dans l'`EmptyState` de `/demos` réinitialisait aussi `query`. Préserver ce comportement en passant par une fonction locale qui vide les deux.

## Plan de livraison

1. Créer `components/admin/MultiPillFilter.tsx`
2. Migrer `app/backoffice/demos/page.tsx`
3. Migrer `app/backoffice/contrats/page.tsx`
4. Migrer `app/backoffice/demandes/page.tsx` (les deux barres)
5. Vérification manuelle dans le navigateur sur les 3 pages
