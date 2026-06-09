# Demande de démo fonctionnelle — design

**Date :** 2026-06-08
**Statut :** validé, prêt pour plan d'implémentation

## Objectif

Rendre le parcours « demande de démo » réellement fonctionnel de bout en bout :

1. Le formulaire public `/demo` enregistre la soumission en base et notifie l'artiste (accusé de réception) et le label (nouvelle démo).
2. Le backoffice `/backoffice/demos` permet de trier (note, étiquettes, assignation, notes internes), de marquer une démo « écoutée », et de la **retenir** ou **refuser** via un écran de confirmation éditable qui envoie un mail à l'artiste et un récap au label.

## Décisions de cadrage

- **Matrice mails complète** : accusé réception artiste + notif label à la soumission ; mail artiste + récap label à la décision (accept/refus).
- **Audio = liens uniquement** pour cette itération (pas d'upload Blob). Le champ « lien d'écoute » et les réseaux sociaux alimentent `demos.links`.
- **Décision = écran de confirmation éditable** : clic sur Retenir/Refuser ouvre une modale avec sujet + corps pré-remplis depuis un template ; l'admin relit/édite le mot à l'artiste avant d'envoyer.
- **Destinataire label = adresse configurable** depuis `/backoffice/reglages`, persistée dans `settings` (clé `label_contact_email`), fallback `artemis.inscriptions@gmail.com`.
- **Assignation = vrais comptes** : le select « Assigné à » liste les admins/superadmins réels (`listAccounts()`), stocke `user.id` dans `demos.assignedTo`, affiche le nom. Purement informatif, aucune restriction d'accès.
- **Périmètre étendu** : note ✦, étiquettes, assignation et notes internes sont câblés (sauvegardables à tout moment), en plus du cœur du flux.

## Principe transversal

**L'écriture en base est la source de vérité ; les mails sont best-effort.** Chaque envoi SMTP est enveloppé `try/catch` dans la Server Action : un échec (typiquement en prod, où Resend n'est pas encore branché) est journalisé mais ne bloque ni la soumission ni la décision. La démo / le changement de statut reste persisté.

## Architecture

Server Actions partout (pattern déjà en place dans `app/backoffice/comptes/actions.ts`), pas de routes API. Validation `zod` (déjà en dépendances). IDs via `randomUUID()` (pattern de `lib/invitations.ts`). Envoi via `sendEmail()` existant (`lib/email.ts`, Mailpit en dev).

### 1. Flux de soumission publique (`/demo`)

```
Formulaire (client, useActionState) ──submitDemo(prev, formData)──▶ valider (zod)
                                                                    ├─▶ INSERT demos (status "nouveau", id randomUUID)
                                                                    ├─▶ mail accusé réception → artiste   (best-effort)
                                                                    └─▶ mail "nouvelle démo" → label      (best-effort)
                                                                    ◀── { ok } ⇒ SuccessPanel | { errors } ⇒ inline
```

- **`components/FormFields.tsx`** : étendre `Field`/`TextArea` avec props optionnelles `name`, `required`, `defaultValue`, `error?`. Additif — les usages existants (contact, etc.) ne changent pas. L'erreur s'affiche sous le champ en magenta.
- **`lib/validation/demo.ts`** : schéma zod. Requis : nom d'artiste, nom civil, courriel valide, lien d'écoute (URL). Libres : réseaux sociaux, démarche (pitch).
- **`app/(public)/demo/actions.ts`** → `submitDemo(prev, formData)` `"use server"`, non authentifié. Valide, mappe lien d'écoute + réseaux en `links: DemoLink[]`, insère via `lib/db/demo-mutations.ts`, déclenche les deux mails (best-effort), renvoie l'état.
- **`app/(public)/demo/page.tsx`** : passe à `useActionState(submitDemo)`. Visuel identique ; `SuccessPanel` sur `ok` ; erreurs serveur affichées par champ.

### 2. Flux de décision (`/backoffice/demos`)

```
"Marquer écouté" ─▶ markListenedAction(id) ─▶ status "ecoute"

"Retenir" / "Refuser avec tact"
   └─▶ ouvre DecisionDialog (modale)
         • sujet + corps PRÉ-REMPLIS depuis template (accept|refus, nom artiste)
         • admin édite librement le mot à l'artiste
         • [Envoyer] ─▶ decideDemoAction(formData)
                          ├─▶ status "retenu"|"refuse" (+ notes)
                          ├─▶ mail à l'artiste = corps édité   (best-effort)
                          └─▶ mail récap décision → label        (best-effort)
```

- **`app/backoffice/demos/actions.ts`** — toutes gardées par `requireRole("superadmin","admin")` :
  - `markListenedAction(id)` → status `ecoute`, `revalidatePath`.
  - `decideDemoAction(formData)` : `id`, `decision` (`retenu`|`refuse`), `subject`, `body` (mail artiste édité), `notes?` → update status + notes, mail artiste (corps édité), récap label, `revalidatePath`.
  - `updateDemoMetaAction(formData)` : `rating`, `tags`, `assignedTo`, `notes` → sauvegardables à tout moment, `revalidatePath`.
- **`components/admin/DecisionDialog.tsx`** : modale client (overlay). Pré-remplissage éditable via fonctions de template pures de `lib/demoEmails.ts` (importables côté client). Le récap label est généré côté serveur dans l'action.

### 3. Métadonnées (périmètre étendu) — dans `DemoDetail` (`DemosPageClient.tsx`)

- **Note ✦** : clic sur les étoiles → `updateDemoMetaAction` (rating 1–5).
- **Étiquettes** : ajout/suppression de tags.
- **Assigné à** : `<select>` des admins réels (passés en prop depuis la page serveur via `listAccounts()`), stocke `user.id`, affiche le nom.
- **Notes internes** : `textarea` + enregistrer.

`app/backoffice/demos/page.tsx` charge en plus la liste des comptes assignables et la passe au client.

### 4. Adresse de notification (réglages)

- **`lib/db/queries.ts`** : clés `label_contact_email`, `label_phone`, `label_address` + helpers de lecture (`getLabelSettings()` avec fallbacks vers les valeurs actuelles en dur ; `getLabelNotifyEmail()` = email, fallback `artemis.inscriptions@gmail.com`).
- **`app/backoffice/reglages/actions.ts`** → `saveLabelSettingsAction(formData)` (`requireRole`) : persiste email/tél/adresse dans `settings` (upsert).
- **`app/backoffice/reglages/page.tsx`** : la section « Identité du label » (aujourd'hui maquette) devient un vrai formulaire alimenté par `settings` (defaults = valeurs actuelles en dur) et sauvegardé par l'action.

### 5. Mails — `lib/demoEmails.ts` (templates purs) + `lib/email.ts` (envoi existant)

| Mail | Déclencheur | Destinataire | Contenu |
|---|---|---|---|
| Accusé réception | soumission | artiste | « Bien reçu, réponse sous 15 j » |
| Nouvelle démo | soumission | label | récap + lien `/backoffice/demos` |
| Décision artiste | Retenir / Refuser | artiste | **corps édité par l'admin** |
| Récap décision | Retenir / Refuser | label | qui, quoi, décision |

`lib/demoEmails.ts` exporte des fonctions pures `{ subject, text, html }` — pas de `server-only`, pour que `DecisionDialog` (client) puisse pré-remplir le défaut accept/refus. En dev, tous les mails sont visibles dans **Mailpit** (`localhost:8025`).

## Gestion d'erreurs

- **Validation** : erreurs renvoyées par l'action, affichées inline sous chaque champ (`Field`/`TextArea` `error?`).
- **Mails** : best-effort, jamais bloquants (cf. principe transversal).
- **Autorisation** : actions backoffice et réglages gardées par `requireRole`. L'action de soumission publique est volontairement non authentifiée.

## Tests / vérification

- Schéma zod : testable unitairement (cas requis/optionnels, URL invalide).
- E2E manuel en dev via Mailpit : soumettre une démo → vérifier insertion + accusé réception + notif label ; depuis le backoffice marquer écouté, puis retenir et refuser → vérifier statut, mail artiste (corps édité) et récap label.

## Fichiers

**Nouveaux**
- `app/(public)/demo/actions.ts`
- `app/backoffice/demos/actions.ts`
- `app/backoffice/reglages/actions.ts`
- `lib/validation/demo.ts`
- `lib/demoEmails.ts`
- `lib/db/demo-mutations.ts`
- `components/admin/DecisionDialog.tsx`

**Modifiés**
- `app/(public)/demo/page.tsx`
- `components/FormFields.tsx`
- `app/backoffice/demos/page.tsx`
- `app/backoffice/demos/DemosPageClient.tsx`
- `app/backoffice/reglages/page.tsx`
- `lib/db/queries.ts`

## Hors périmètre (volontairement)

- Upload de fichiers audio (Blob) — liens uniquement pour l'instant.
- Transport mail production (Resend) — déjà identifié comme TODO dans `lib/email.ts`.
- Export CSV, ajout manuel de démo (boutons présents mais hors sujet ici).
