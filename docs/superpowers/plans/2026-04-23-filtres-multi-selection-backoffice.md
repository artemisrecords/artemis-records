# Filtres multi-sélection backoffice : Plan d'implémentation

> **Pour les agents** : ce plan est à exécuter tâche par tâche. Chaque étape est une case à cocher (`- [ ]`). Respecter l'ordre.

**Spec** : `docs/superpowers/specs/2026-04-23-filtres-multi-selection-backoffice-design.md`

**Objectif** : Permettre la sélection/désélection multiple sur tous les filtres du backoffice (demos, demandes, contrats), avec un hint textuel discret.

**Architecture** : Un nouveau composant partagé `MultiPillFilter` dans `components/admin/`, consommé par les 3 pages existantes. État `Set<K>` vide ≡ « Tous » actif.

**Tech stack** : Next.js 16 (App Router), React 19, TypeScript, Tailwind 4. Package manager : `pnpm`. Pas de framework de tests : vérification par `pnpm exec tsc --noEmit`, `pnpm lint`, et navigateur.

**Contraintes du repo** :
- Pas de tests automatisés → vérifications = typecheck + lint + test manuel navigateur
- Pas de git dans ce répertoire → pas d'étapes `git commit`
- Dev server lancé via `pnpm dev` sur `http://localhost:3001`

---

## Vue d'ensemble des fichiers

**À créer** :
- `components/admin/MultiPillFilter.tsx` : composant partagé

**À modifier** :
- `app/backoffice/demos/page.tsx` : 1 barre de filtres
- `app/backoffice/contrats/page.tsx` : 1 barre de filtres
- `app/backoffice/demandes/page.tsx` : 2 barres de filtres (variant `pill` + `subtle`)

---

## Task 1 : Créer le composant `MultiPillFilter`

**Files:**
- Create: `components/admin/MultiPillFilter.tsx`

- [ ] **Step 1 : Écrire le composant**

Créer `components/admin/MultiPillFilter.tsx` avec le contenu suivant :

```tsx
"use client";

export type MultiPillFilterOption<K extends string> = {
  k: K;
  label: string;
  count?: number;
};

type Props<K extends string, A extends string> = {
  all: A;
  options: MultiPillFilterOption<K | A>[];
  selected: Set<K>;
  onChange: (next: Set<K>) => void;
  variant?: "pill" | "subtle";
  label?: string;
  hint?: string;
};

const DEFAULT_HINT =
  "Cliquez plusieurs filtres pour les combiner · recliquez pour désélectionner.";

export function MultiPillFilter<K extends string, A extends string>({
  all,
  options,
  selected,
  onChange,
  variant = "pill",
  label,
  hint = DEFAULT_HINT,
}: Props<K, A>) {
  const isActive = (k: K | A) =>
    k === all ? selected.size === 0 : selected.has(k as K);

  const handleClick = (k: K | A) => {
    if (k === all) {
      onChange(new Set());
      return;
    }
    const next = new Set(selected);
    const key = k as K;
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={
          variant === "pill"
            ? "flex gap-2 flex-wrap items-center"
            : "flex items-center gap-2 flex-wrap text-[10px] tracking-eyebrow uppercase font-bold"
        }
      >
        {label && variant === "subtle" && (
          <span className="text-ink-subtle">{label}</span>
        )}
        {options.map((opt) => {
          const active = isActive(opt.k);
          const classes =
            variant === "pill"
              ? `font-serif text-[11px] tracking-eyebrow uppercase font-bold px-3.5 py-2 rounded-full border cursor-pointer transition-colors ${
                  active
                    ? "bg-bleu-nuit-700 border-bleu-nuit-700 text-beige-sable"
                    : "bg-paper-soft border-ink/15 text-ink-muted hover:text-ink hover:border-ink/40"
                }`
              : `px-2.5 py-1.5 rounded-full cursor-pointer transition-colors ${
                  active
                    ? "text-magenta bg-magenta/10"
                    : "text-ink-muted hover:text-ink"
                }`;
          return (
            <button
              key={opt.k}
              type="button"
              onClick={() => handleClick(opt.k)}
              className={classes}
              aria-pressed={active}
            >
              {opt.label}
              {typeof opt.count === "number" && (
                <span
                  className={`ml-2 ${
                    variant === "pill"
                      ? active
                        ? "text-beige-sable/70"
                        : "text-ink-subtle"
                      : "text-ink-subtle"
                  }`}
                >
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="font-serif italic text-[11px] text-ink-subtle m-0">
        {hint}
      </p>
    </div>
  );
}
```

- [ ] **Step 2 : Typecheck**

Run : `pnpm exec tsc --noEmit`
Expected : 0 erreur sur `components/admin/MultiPillFilter.tsx`.

- [ ] **Step 3 : Lint**

Run : `pnpm lint`
Expected : 0 erreur/warning sur le nouveau fichier.

---

## Task 2 : Migrer `/backoffice/demos`

**Files:**
- Modify: `app/backoffice/demos/page.tsx`

Contexte : la page a aujourd'hui un state `filter: Filter` (avec `Filter = "tous" | DemoStatus`). On passe à un `Set<DemoStatus>` (sans `"tous"`). Le reset de l'EmptyState appelait `setFilter("tous")` et `setQuery("")`. Préserver ce double reset.

- [ ] **Step 1 : Remplacer l'import et l'état**

Dans `app/backoffice/demos/page.tsx`, en tête du fichier ajouter l'import du composant :

```tsx
import { MultiPillFilter } from "@/components/admin/MultiPillFilter";
```

Remplacer les lignes 18–25 (type `Filter` et tableau `FILTERS`) par :

```tsx
const FILTER_OPTIONS: { k: DemoStatus | "tous"; label: string }[] = [
  { k: "tous", label: "Tous" },
  { k: "nouveau", label: "Nouveaux" },
  { k: "ecoute", label: "À écouter" },
  { k: "retenu", label: "Retenus" },
  { k: "refuse", label: "Refusés" },
];
```

Remplacer la ligne 28 `const [filter, setFilter] = useState<Filter>("tous");` par :

```tsx
const [selected, setSelected] = useState<Set<DemoStatus>>(new Set());
```

- [ ] **Step 2 : Adapter le useMemo `filtered`**

Remplacer la ligne 34 `if (filter !== "tous" && d.status !== filter) return false;` par :

```tsx
if (selected.size > 0 && !selected.has(d.status)) return false;
```

Et mettre à jour les dépendances du `useMemo` : `[filter, query]` → `[selected, query]`.

- [ ] **Step 3 : Adapter le useMemo `counts`**

Remplacer le type de `counts` (lignes 50–60) pour typer les clés sur `DemoStatus | "tous"` et garder le calcul identique :

```tsx
const counts = useMemo(() => {
  const c: Record<DemoStatus | "tous", number> = {
    tous: DEMOS.length,
    nouveau: 0,
    ecoute: 0,
    retenu: 0,
    refuse: 0,
  };
  for (const d of DEMOS) c[d.status]++;
  return c;
}, []);
```

- [ ] **Step 4 : Remplacer le bloc de boutons par `<MultiPillFilter>`**

Remplacer le bloc `<div className="flex gap-2 flex-wrap">...</div>` (lignes 78–103) par :

```tsx
<MultiPillFilter
  all="tous"
  options={FILTER_OPTIONS.map((f) => ({ ...f, count: counts[f.k] }))}
  selected={selected}
  onChange={setSelected}
/>
```

- [ ] **Step 5 : Adapter le reset de l'`EmptyState`**

Remplacer le `onClick` du bouton `Réinitialiser les filtres` (ligne 136) :

```tsx
onClick={() => {
  setSelected(new Set());
  setQuery("");
}}
```

- [ ] **Step 6 : Nettoyer le type mort**

Si le type `Filter` n'est plus utilisé nulle part dans le fichier après les modifs, supprimer sa définition.

- [ ] **Step 7 : Typecheck + lint**

Run : `pnpm exec tsc --noEmit`
Expected : 0 erreur.

Run : `pnpm lint`
Expected : 0 erreur/warning.

- [ ] **Step 8 : Test manuel navigateur**

Lancer `pnpm dev` (si pas déjà lancé) et ouvrir `http://localhost:3001/backoffice/demos`. Vérifier :

1. Au chargement : « Tous » actif (fond bleu-nuit), la liste affiche les 7 démos
2. Cliquer « Nouveaux » → « Tous » se désactive, la liste se réduit aux nouveaux, « Nouveaux » actif
3. Cliquer « Retenus » → deux filtres actifs en même temps, la liste montre nouveaux + retenus
4. Recliquer « Nouveaux » → seul « Retenus » actif, liste réduite aux retenus
5. Cliquer « Retenus » (déselection) → « Tous » redevient actif, toute la liste revient
6. Avec plusieurs filtres actifs, cliquer « Tous » → tous les autres se désélectionnent
7. Le hint *Cliquez plusieurs filtres pour les combiner · recliquez pour désélectionner.* est visible sous les pilules
8. Les compteurs sur chaque pilule sont inchangés
9. La recherche texte (`query`) fonctionne toujours en combinaison

---

## Task 3 : Migrer `/backoffice/contrats`

**Files:**
- Modify: `app/backoffice/contrats/page.tsx`

- [ ] **Step 1 : Import du composant**

Ajouter en tête :

```tsx
import { MultiPillFilter } from "@/components/admin/MultiPillFilter";
```

- [ ] **Step 2 : Remplacer l'état**

Remplacer la ligne 104 `const [filter, setFilter] = useState<"tous" | ContractStatus>("tous");` par :

```tsx
const [selected, setSelected] = useState<Set<ContractStatus>>(new Set());
```

- [ ] **Step 3 : Adapter le useMemo `filtered`**

Remplacer les lignes 106–109 :

```tsx
const filtered = useMemo(() => {
  if (selected.size === 0) return CONTRACTS;
  return CONTRACTS.filter((c) => selected.has(c.status));
}, [selected]);
```

- [ ] **Step 4 : Remplacer le bloc de boutons par `<MultiPillFilter>`**

Remplacer le bloc de la ligne 149 à 175 (les `<div className="flex items-center gap-2 flex-wrap">...</div>`) par :

```tsx
<MultiPillFilter
  all="tous"
  options={[
    { k: "tous", label: "Tous", count: counts.tous },
    { k: "en_cours", label: "En vigueur", count: counts.en_cours },
    { k: "a_signer", label: "À signer", count: counts.a_signer },
    { k: "echu", label: "Échéance", count: counts.echu },
    { k: "archive", label: "Archivés", count: counts.archive },
  ]}
  selected={selected}
  onChange={setSelected}
/>
```

Note : dans la version actuelle, seul « Tous » avait un compteur intégré au label (`Tous (${counts.tous})`). On uniformise en utilisant la prop `count` de `MultiPillFilter` pour toutes les pilules. C'est plus lisible et cohérent avec la page démos.

- [ ] **Step 5 : Typecheck + lint**

Run : `pnpm exec tsc --noEmit`
Expected : 0 erreur.

Run : `pnpm lint`
Expected : 0 erreur/warning.

- [ ] **Step 6 : Test manuel navigateur**

Ouvrir `http://localhost:3001/backoffice/contrats`. Vérifier :

1. Au chargement : « Tous » actif, les 6 contrats affichés, tous les compteurs visibles
2. Cliquer « À signer » → filtre seul, 1 contrat affiché
3. Cliquer « En vigueur » → deux filtres actifs simultanément, 3 contrats affichés (3 en vigueur + 1 à signer = 4, vérifier que l'OR fonctionne)
4. Recliquer « En vigueur » → seul « À signer » actif
5. Cliquer « Tous » → tout se déselectionne, 6 contrats
6. Le hint italique est visible sous les pilules

---

## Task 4 : Migrer `/backoffice/demandes`

**Files:**
- Modify: `app/backoffice/demandes/page.tsx`

Contexte : deux barres indépendantes. La première (catégories) est en pilules (`variant="pill"`), la seconde (statut) est en texte subtil (`variant="subtle"` avec un label `"Statut"` à gauche).

- [ ] **Step 1 : Import du composant**

Ajouter en tête :

```tsx
import { MultiPillFilter } from "@/components/admin/MultiPillFilter";
```

- [ ] **Step 2 : Remplacer les états**

Remplacer les lignes 31–32 :

```tsx
const [selectedCats, setSelectedCats] = useState<Set<DemandCategory>>(new Set());
const [selectedStatuses, setSelectedStatuses] =
  useState<Set<"ouverte" | "en_cours" | "close">>(new Set());
```

Supprimer également les anciens types `CatFilter` et `StatusFilter` (lignes 18–28) et le tableau `CAT_FILTERS`, puisqu'on les reconstruit sous forme d'options inline plus bas.

- [ ] **Step 3 : Adapter le useMemo `filtered`**

Remplacer les lignes 35–41 :

```tsx
const filtered = useMemo(() => {
  return DEMANDS.filter((d) => {
    if (selectedCats.size > 0 && !selectedCats.has(d.category)) return false;
    if (selectedStatuses.size > 0 && !selectedStatuses.has(d.status))
      return false;
    return true;
  });
}, [selectedCats, selectedStatuses]);
```

- [ ] **Step 4 : Remplacer les deux barres de boutons**

Remplacer le bloc `<div className="flex flex-col gap-3">...</div>` entier (lignes 60–107) par :

```tsx
<div className="flex flex-col gap-3">
  <MultiPillFilter
    all="tous"
    options={[
      { k: "tous", label: "Toutes" },
      { k: "presse", label: "Presse" },
      { k: "booking", label: "Booking" },
      { k: "partenariat", label: "Partenariat" },
      { k: "licence", label: "Synchro" },
      { k: "autre", label: "Autre" },
    ]}
    selected={selectedCats}
    onChange={setSelectedCats}
  />
  <MultiPillFilter
    all="tous"
    variant="subtle"
    label="Statut"
    options={[
      { k: "tous", label: "Tous" },
      { k: "ouverte", label: "Ouvertes" },
      { k: "en_cours", label: "En cours" },
      { k: "close", label: "Closes" },
    ]}
    selected={selectedStatuses}
    onChange={setSelectedStatuses}
  />
</div>
```

- [ ] **Step 5 : Vérifier les imports**

Les imports `type Demand`, `type DemandCategory`, `DEMAND_CATEGORY_LABEL`, `DEMAND_STATUS_LABEL`, `DEMANDS` restent tous utilisés (détail à droite + typage du `Set` + labels dans les Pills). Aucun import à supprimer.

- [ ] **Step 6 : Typecheck + lint**

Run : `pnpm exec tsc --noEmit`
Expected : 0 erreur.

Run : `pnpm lint`
Expected : 0 erreur/warning.

- [ ] **Step 7 : Test manuel navigateur**

Ouvrir `http://localhost:3001/backoffice/demandes`. Vérifier :

1. Au chargement : « Toutes » (catégories) et « Tous » (statut) actifs, toutes les demandes affichées
2. Cliquer « Presse » → « Toutes » se désactive, liste filtrée presse uniquement
3. Cliquer « Booking » → presse + booking actifs, liste combinée (OR dans la catégorie)
4. Cliquer « Ouvertes » (barre statut) → filtre combiné AND : (presse ∪ booking) ∩ ouvertes
5. Recliquer « Presse » → booking seul côté cat, ouvertes seul côté statut
6. Cliquer « Tous » (statut) → statut reset, booking seul restant
7. Cliquer « Toutes » (catégorie) → cat reset, ouvertes peut être recliqué
8. Les deux barres fonctionnent indépendamment, chacune avec son hint italique en dessous

---

## Task 5 : Vérification globale

- [ ] **Step 1 : Build complet**

Run : `pnpm build`
Expected : build réussi, aucune erreur TypeScript, aucun warning critique sur les 3 pages modifiées.

- [ ] **Step 2 : Parcours utilisateur complet**

Dans un navigateur avec `pnpm dev`, parcourir les 3 pages en séquence :

1. `/backoffice/demos` : combiner filtres + recherche, reset via EmptyState
2. `/backoffice/contrats` : combiner 2–3 statuts
3. `/backoffice/demandes` : combiner catégorie + statut

Vérifier le même hint italique sous chaque barre. Vérifier qu'aucune régression visuelle n'apparaît ailleurs sur la page (détail à droite, header, footer).

- [ ] **Step 3 : Vérifier l'accessibilité basique**

Sur chaque barre, vérifier que les boutons ont `aria-pressed="true"` quand actifs (inspecteur DOM). Vérifier la navigation au clavier : Tab pour se déplacer, Espace/Enter pour toggler.

---

## Notes

- Le composant `MultiPillFilter` utilise les classes Tailwind déjà présentes dans le projet. Aucune nouvelle classe à définir dans `tailwind.config` / `globals.css`.
- Si TypeScript râle sur le générique inféré à l'appel, typer explicitement : `<MultiPillFilter<DemoStatus, "tous">>`. L'inférence devrait suffire pour les 3 usages prévus.
- Aucune migration de données / API : travail purement front.
