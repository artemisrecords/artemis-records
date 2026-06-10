# Auth backoffice + espace artiste : conception (Better Auth)

> Statut : conception validée le 2026-05-22. Remplace la décision « Clerk » de
> `2026-04-23-implémentation-neondb-et-gestion-fichier.md` (§5, §11.2), dont la
> question ouverte penchait déjà vers `next-auth`. Le paysage 2026 a tranché :
> on prend **Better Auth** (ce que Neon Auth fait tourner en managé, mais en
> direct, sans la beta et sans lock-in).

## 1. Décisions

| Sujet | Décision |
| --- | --- |
| Librairie | **Better Auth** en direct (pas Neon Auth managé, pas Clerk) |
| Méthode de connexion | **Magic link uniquement**. Pas de mot de passe, pas de Google. |
| Inscription publique | **Aucune**. `magicLink({ disableSignUp: true })` : seul un email déjà en base reçoit un lien. |
| Création de compte | **Sur invitation seulement**, avec page d'acceptation (token + onboarding). |
| Session | Quasi-permanente : `expiresIn` 1 an + refresh roulant, révoquée au `signOut`. |
| Rôles | `superadmin` > `admin` > `artiste`, via `createAccessControl` + plugin `admin`. |
| Espace artiste | Surface **séparée** à `/espace` (pas le chrome admin de `/backoffice`). |
| Email | Transport par environnement : **Mailpit** (dev) / SMTP sandbox via **Nodemailer** (preview) / **Resend** (prod). Resend préparé mais pas encore implémenté. |
| Driver DB auth | Neon **WebSocket (Pool)** dédié (transactions). Le reste de l'app garde `neon-http`. |

## 2. Rôles et permissions

```
superadmin  : gère les comptes admins (+ tout ce que peut admin)
admin       : gère les comptes artistes, + CRUD label (artistes, journal, démos, demandes…)
artiste      : aucune action admin ; voit et édite uniquement SA fiche artiste
```

Chaîne d'invitation calquée sur la hiérarchie : un superadmin invite des admins,
un admin invite des artistes. On n'invite que le niveau en dessous.

Implémentation : `createAccessControl(statement)` où `statement` liste les
ressources (`adminAccounts`, `artistAccounts`, `artists`, `journal`, `demos`,
`demands`…) et chaque rôle (`superadmin`, `admin`, `artiste`) reçoit un sous-ensemble.
Le rôle est stocké en champ additionnel `role` sur le user, en `input: false`
(non modifiable côté client : seul le serveur l'assigne, à l'invitation).

## 3. Modèle de données

Tables générées par Better Auth (via `@better-auth/cli generate`, intégrées au
schéma Drizzle puis migrées par `drizzle-kit`) :

- `user` : + champs additionnels `role` (text, input:false) et `artistId`
  (text nullable, FK vers `artists.id`, input:false ; renseigné seulement pour
  les comptes artiste).
- `session`, `account`, `verification` : standard Better Auth.

Table custom :

- `invitation` : `id`, `email`, `role`, `artistId` (nullable, pour un artiste),
  `token` (unique), `invitedBy` (FK user), `expiresAt`, `acceptedAt` (nullable),
  `createdAt`.

Lien artiste : un compte `artiste` pointe vers une fiche `artists` existante via
`user.artistId`. Inviter un artiste = choisir/lier une fiche, puis créer le compte
à l'acceptation.

## 4. Flux

### 4.1. Connexion (magic link)
1. `/auth` : un seul champ email. La maquette actuelle est conservée
   (design = cœur du projet) ; on retire l'onglet inscription, le mot de passe et
   le bouton Google.
2. Submit → `authClient.signIn.magicLink({ email })`. Si l'email n'existe pas en
   base, `disableSignUp: true` → pas de lien envoyé (message neutre, pas de fuite
   d'information sur l'existence du compte).
3. L'utilisateur clique le lien reçu → session créée → redirigé selon son rôle :
   `superadmin`/`admin` → `/backoffice`, `artiste` → `/espace`.

### 4.2. Invitation (avec page d'acceptation)
1. Dans le backoffice : superadmin (onglet comptes admins) ou admin (onglet
   comptes artistes) saisit email + rôle (+ fiche artiste si artiste).
2. Server Action : crée une ligne `invitation` (token + expiration), envoie un
   email Resend avec lien `/accept-invitation?token=…`.
3. `/accept-invitation` : valide le token (non expiré, non accepté), affiche un
   petit onboarding (nom à afficher). Submit → crée le `user` (rôle + artistId
   copiés depuis l'invitation), marque l'invitation acceptée, ouvre la session.
4. Ensuite, l'utilisateur se reconnecte toujours via magic link sur `/auth`.

### 4.3. Déconnexion
Bouton `signOut` dans le chrome admin et l'espace artiste → révoque la session.

## 5. Protection des routes

Next.js 16 → fichier **`proxy.ts`** (ex-`middleware.ts`).

- `/backoffice/**` : session requise ET rôle ∈ {superadmin, admin}.
- `/espace/**` : session requise ET rôle = artiste.
- Gestion des comptes admins : superadmin uniquement (garde au niveau page +
  Server Action, pas seulement proxy).
- Sans session → redirect `/auth`. Mauvais rôle → redirect vers sa propre surface.

Le proxy fait un check léger (présence + rôle via cookie/session) ; les Server
Actions sensibles revérifient le rôle côté serveur (defense in depth).

## 6. Variables d'environnement

| Var | Usage |
| --- | --- |
| `DATABASE_URL` | existante (Pool WS réutilise la même URL) |
| `BETTER_AUTH_SECRET` | secret de signature (généré) |
| `BETTER_AUTH_URL` | base URL (http://localhost:3000 en dev, domaine en prod) |
| `EMAIL_FROM` | expéditeur (ex. `ARTémis Records <no-reply@artemisrecordslabel.com>`) |
| `SMTP_HOST` / `SMTP_PORT` | cible Nodemailer (dev: `localhost`/`1025` ; preview: sandbox) |
| `SMTP_USER` / `SMTP_PASS` | auth SMTP (vide en dev/Mailpit ; renseigné en preview) |
| `RESEND_API_KEY` | prod seulement (préparé, pas encore utilisé) |

### 6.1. Transport email (`lib/email.ts`)

Un seul `sendEmail({ to, subject, html, text })`. Le transport est choisi sur
`process.env.VERCEL_ENV` (absent en local = dev) :

- **dev / preview** : Nodemailer SMTP via `SMTP_*`. En dev les défauts pointent
  Mailpit (`localhost:1025`, sans auth) ; en preview on renseigne `SMTP_*` pour
  un sandbox (Mailtrap / Ethereal) afin de ne pas consommer de crédits Resend.
- **prod** : Resend (`RESEND_API_KEY`). **Pas encore implémenté** : la branche
  existe avec un `TODO` et lève une erreur explicite tant qu'elle n'est pas câblée.

Mailpit en local (Windows) : Docker (`docker run -d -p 1025:1025 -p 8025:8025
axllent/mailpit`), Scoop (`scoop install mailpit`) ou le binaire `.exe` des
releases GitHub. Webmail sur http://localhost:8025.

## 7. Amorçage

Le premier `superadmin` ne peut pas être invité (personne pour l'inviter). On le
crée via `scripts/seed.ts` (insertion directe `user` avec `role: "superadmin"`),
à partir d'un email fourni. Ensuite tout passe par invitation.

## 8. Hors scope (pour l'instant)

- Pas de 2FA, pas de passkey (overkill pour 2-3 admins + artistes).
- Pas de gestion d'organisations multi-tenant (le plugin `organization` de Better
  Auth serait surdimensionné ; on reste sur un modèle de rôles plat).
- RGPD/rétention des comptes : à traiter avec le reste (voir spec NeonDB §11.4).
