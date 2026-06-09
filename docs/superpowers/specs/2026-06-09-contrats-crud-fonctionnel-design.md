# Contrats fonctionnel — Design

**Date :** 2026-06-09
**Statut :** validé

## Objectif

Câbler la section `app/backoffice/contrats` au pattern CRUD établi pour les 5 autres
sections (Zod → mutations `server-only` → server actions `"use server"` → `revalidatePath`).
C'est la dernière section encore 100 % mockée : la page est `"use client"` avec un tableau
`CONTRACTS` inline et des boutons inertes. Aucune table `contracts` n'existe en base.

## Modèle de données — nouvelle table `contracts`

```ts
export const contracts = pgTable(
  "contracts",
  {
    id: text("id").primaryKey(),                 // réf affichée, immuable : ct-YYYY-NNN
    title: text("title").notNull(),
    party: text("party").notNull(),              // texte libre de la partie
    artistId: text("artist_id").references(() => artists.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    amount: text("amount").notNull().default(""),
    status: text("status").notNull().default("a_signer"), // en_cours|a_signer|echu|archive
    notes: text("notes"),
    signedBy: jsonb("signed_by").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("contracts_status_idx").on(t.status, t.endDate)],
);
```

- `id` = la réf humaine `ct-YYYY-NNN` (séquence par année, génération anti-collision comme `uniqueSlug` de `news-mutations.ts`). Immuable après création.
- `artistId` optionnel : rattachement à une fiche roster. `set null` si l'artiste est supprimé.
- Statut manuel à 4 valeurs (vocabulaire conservé de l'UI). L'« échéance ≤ 6 mois » est **dérivée** des `endDate`, ce n'est pas un statut.

## Couches

### `lib/validation/contract.ts`
- `CONTRACT_STATUSES = ["en_cours","a_signer","echu","archive"] as const`
- `contractStatusSchema` = `z.enum(CONTRACT_STATUSES)`
- `createContractSchema` : `title` (1..160), `party` (1..120), `artistId` (string optionnel, "" → undefined), `type` (1..120), `startDate`/`endDate` (`DATE_RE` YYYY-MM-DD), `amount` (max 60, default ""), `status` (default "a_signer"), `notes` (max 4000, optionnel), `signedBy` (array string, default []). Refine : `endDate >= startDate`.
- `updateContractSchema` = même chose sans contrainte de génération d'id (id passé à part).

### `lib/db/contract-mutations.ts` (`server-only`)
- `uniqueRef(year)` : `ct-${year}-${NNN}` zero-paddé sur 3, incrémente tant qu'une collision existe.
- `createContract(input)` : génère la réf depuis l'année de `startDate`, insère, retourne l'id.
- `updateContract(id, input)` : `set` des champs + `updatedAt = now`.
- `setContractStatus(id, status)`.
- `deleteContract(id)` : hard delete.

### `lib/db/contract-queries.ts`
- `listContracts()` : `select` joint sur `artists.name` (left join) → `ContractListItem[]` triés par `createdAt desc`.
- `getContract(id)` : la ligne + `artistName`.

### `app/backoffice/contrats/actions.ts` (`"use server"`)
Toutes gardées par `requireRole("superadmin","admin")`. Retour `{ok:true}` | `{ok:false,error}` sauf création (redirect).
- `createContractAction(input)` → valide, `createContract`, `revalidatePath("/backoffice/contrats")`, `redirect("/backoffice/contrats/<id>")`.
- `updateContractAction(id, input)` → valide, `updateContract`, revalidate liste + fiche.
- `deleteContractAction(id, confirm)` → exige `confirm === "oui"`, `deleteContract`, revalidate, redirect liste.

## Pages

- **`page.tsx`** → Server Component : `listContracts()` + `listArtistOptions()` → `<ContratsClient>`.
- **`ContratsClient.tsx`** (`"use client"`) : UI actuelle, données par props.
  - KPIs : actifs (`en_cours`), à signer (`a_signer`), **échéances ≤ 6 mois dérivées** (non-archivés dont `endDate` ∈ [aujourd'hui, +180 j]), archivés.
  - Filtres de statut conservés (single-select, « Tous » reset).
  - Lignes **cliquables → `/backoffice/contrats/[id]`**.
  - Bloc « À surveiller » : rappels **dérivés des échéances proches** triés par date (« Ouvrir » → lien fiche) ; « Lire la charte » → lien `/charte` ; bouton « Modèles de contrat » **retiré**.
- **`contrats/nouveau/`** : `page.tsx` + `NouveauContratClient.tsx` → formulaire → `createContractAction`.
- **`contrats/[id]/`** : `page.tsx` (fetch `getContract`, 404 si absent) + `ContratEditClient.tsx` → édition de tous les champs sauf `id`, sélecteur de statut, zone danger suppression (confirmation tapée `oui`).

## Bonus de cohérence

- `getLabelStats()` : ajoute `contracts: { total, active }` + un KPI dans Statistiques.
- `getPendingNotifications()` : ajoute contrats `a_signer` + échéances proches au feed Notifications.
- `scripts/seed.ts` : seed des 6 contrats du mock en **dev** (idempotent : `onConflictDoNothing`).

## Choix notables / hors périmètre

- Réf `id` immuable (cohérent avec slugs artistes / ids news).
- Suppression = hard delete + confirmation `oui`.
- Pas de PDF / pièce jointe, pas de « modèles de contrat » (hors périmètre v1).
- Migration appliquée en **dev uniquement** (jamais preview/prod).
