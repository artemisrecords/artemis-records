# Contrats fonctionnel — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Rendre la section backoffice Contrats fonctionnelle (CRUD réel sur une nouvelle table `contracts`).

**Architecture:** Nouvelle table Drizzle `contracts` + migration (dev only). Pattern établi : Zod → mutations `server-only` → server actions → `revalidatePath`. Page serveur + client, formulaires nouveau/édition.

**Tech Stack:** Next 16 App Router, Drizzle/Neon, Zod 4, Vitest. Gates : `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm exec next build`.

---

### Task 1: Schéma + migration

**Files:** Modify `lib/db/schema.ts`

- [ ] Ajouter `export const contracts = pgTable("contracts", {...})` avec les colonnes du spec + index `contracts_status_idx` sur `(status, endDate)`.
- [ ] Ajouter `export type ContractRow = typeof contracts.$inferSelect;` et `NewContract`.
- [ ] `pnpm db:generate` → génère `lib/db/migrations/0005_*.sql`.
- [ ] `pnpm db:migrate` (applique en **dev**, endpoint `ep-little-block`).
- [ ] Vérifier : `pnpm exec tsc --noEmit` passe.
- [ ] Commit : `feat(contrats): add contracts table + migration`.

### Task 2: Validation Zod

**Files:** Create `lib/validation/contract.ts`, `lib/validation/contract.test.ts`

- [ ] Écrire les tests : statut valide/invalide, `endDate < startDate` rejeté, `artistId` "" → undefined, champs requis.
- [ ] `pnpm test contract` → échoue (module absent).
- [ ] Implémenter `CONTRACT_STATUSES`, `contractStatusSchema`, `createContractSchema` (avec `.refine` endDate>=startDate), `updateContractSchema`. Réutiliser `DATE_RE` (copier le pattern de `lib/validation/artist.ts`).
- [ ] `pnpm test contract` → passe.
- [ ] Commit : `feat(contrats): zod validation`.

### Task 3: Mutations + queries

**Files:** Create `lib/db/contract-mutations.ts`, `lib/db/contract-queries.ts`

- [ ] `contract-mutations.ts` (`import "server-only"`) : `uniqueRef(year)`, `createContract`, `updateContract`, `setContractStatus`, `deleteContract`.
- [ ] `contract-queries.ts` : `listContracts()` (left join `artists.name`), `getContract(id)`. Exporter types `ContractListItem`, `ContractDetail`.
- [ ] `pnpm exec tsc --noEmit` passe.
- [ ] Commit : `feat(contrats): mutations + queries`.

### Task 4: Server actions

**Files:** Create `app/backoffice/contrats/actions.ts`

- [ ] `"use server"`, `createContractAction`/`updateContractAction`/`deleteContractAction`, toutes `requireRole("superadmin","admin")`. Pattern retour `{ok}` / redirect (copier `app/backoffice/journal/actions.ts`).
- [ ] `pnpm exec tsc --noEmit` passe.
- [ ] Commit : `feat(contrats): server actions`.

### Task 5: Liste (page serveur + client)

**Files:** Modify `app/backoffice/contrats/page.tsx`; Create `app/backoffice/contrats/ContratsClient.tsx`

- [ ] `page.tsx` → Server Component async : `listContracts()` + options artistes → `<ContratsClient>`.
- [ ] `ContratsClient.tsx` : reprendre l'UI actuelle, données par props. KPIs (échéance dérivée), filtres, lignes `<Link href="/backoffice/contrats/{id}">`, bloc « À surveiller » dérivé, charte→`/charte`, retirer « Modèles de contrat ».
- [ ] `pnpm exec tsc --noEmit` + `pnpm exec next build` passent.
- [ ] Commit : `feat(contrats): wire list page to DB`.

### Task 6: Création + édition

**Files:** Create `app/backoffice/contrats/nouveau/{page.tsx,NouveauContratClient.tsx}`, `app/backoffice/contrats/[id]/{page.tsx,ContratEditClient.tsx}`

- [ ] `nouveau/` : formulaire → `createContractAction`. Bouton « + Nouveau contrat » de la liste → `Link` vers `/backoffice/contrats/nouveau`.
- [ ] `[id]/page.tsx` : `getContract` (notFound si absent) → `ContratEditClient`.
- [ ] `[id]/ContratEditClient.tsx` : champs éditables, sélecteur statut, sélecteur artiste optionnel, zone danger suppression (`oui`).
- [ ] `pnpm exec tsc --noEmit` + `pnpm exec next build` passent.
- [ ] Commit : `feat(contrats): create + edit forms`.

### Task 7: Bonus cohérence (stats, notifs, seed)

**Files:** Modify `lib/db/admin-queries.ts`, `app/backoffice/statistiques/StatistiquesClient.tsx`, `scripts/seed.ts`

- [ ] `getLabelStats()` : ajouter `contracts: { total, active }`. Afficher un KPI dans Statistiques.
- [ ] `getPendingNotifications()` : ajouter contrats `a_signer` + échéances proches.
- [ ] `scripts/seed.ts` : seed des 6 contrats du mock (`onConflictDoNothing`), exécuter en dev.
- [ ] `pnpm test` + `pnpm exec tsc --noEmit` + `pnpm exec next build` passent.
- [ ] Commit : `feat(contrats): stats KPI, notifications, dev seed`.

### Task 8: Finition

- [ ] `pnpm test` (suite complète verte), `pnpm exec next build` final.
- [ ] Push `preview`, ouvrir PR vers `master`, merge.
