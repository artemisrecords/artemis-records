# Demande de démo fonctionnelle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre le parcours « demande de démo » fonctionnel : le formulaire public `/demo` enregistre en base et notifie artiste + label ; le backoffice `/backoffice/demos` permet de noter/étiqueter/assigner/annoter, marquer « écouté », et retenir/refuser via un écran de confirmation éditable qui envoie les mails de décision.

**Architecture :** Next.js App Router, Server Actions (`"use server"`) gardées par `requireRole`, validation `zod`, Drizzle/Neon. Aucune migration : `demos` et `settings` ont déjà toutes les colonnes/lignes nécessaires. L'écriture en base est la source de vérité ; les envois de mail sont best-effort (try/catch, jamais bloquants). Mails via `sendEmail()` existant (Mailpit en dev).

**Tech Stack :** Next.js 15 (App Router), React 19 (`useActionState`), Drizzle ORM + `@neondatabase/serverless`, Nodemailer, Zod v4, Vitest (ajouté pour les unités pures).

**Spec :** `docs/superpowers/specs/2026-06-08-demande-demo-fonctionnelle-design.md`

---

## File Structure

**Nouveaux fichiers**
- `vitest.config.ts` — config Vitest (env node).
- `lib/validation/demo.ts` — schéma zod de soumission publique (pur, testable).
- `lib/validation/demo.test.ts` — tests du schéma.
- `lib/demoEmails.ts` — templates mail purs (`{subject,text,html}`), importables client + serveur.
- `lib/demoEmails.test.ts` — tests des templates.
- `lib/db/demo-mutations.ts` — écritures Drizzle sur `demos` (`server-only`).
- `app/(public)/demo/actions.ts` — Server Action `submitDemo`.
- `app/backoffice/demos/actions.ts` — Server Actions `markListenedAction`, `decideDemoAction`, `updateDemoMetaAction`.
- `app/backoffice/reglages/actions.ts` — Server Action `saveLabelSettingsAction`.
- `app/backoffice/reglages/ReglagesClient.tsx` — contenu client de la page réglages (extrait de l'actuel `page.tsx`).
- `components/admin/DecisionDialog.tsx` — modale de confirmation/édition du mail de décision.

**Fichiers modifiés**
- `package.json` — devDep `vitest` + script `test`.
- `components/Primitives.tsx` — `Btn` gagne une prop optionnelle `disabled`.
- `components/FormFields.tsx` — `Field`/`TextArea` gagnent `name`/`required`/`defaultValue`/`error`.
- `lib/db/queries.ts` — clés + helpers réglages label (`getLabelSettings`, `getLabelNotifyEmail`).
- `app/(public)/demo/page.tsx` — branché sur `submitDemo` via `useActionState`.
- `app/backoffice/demos/page.tsx` — charge aussi la liste des comptes assignables.
- `app/backoffice/demos/DemosPageClient.tsx` — contrôles câblés + ouverture de `DecisionDialog`.
- `app/backoffice/reglages/page.tsx` — devient un Server Component qui lit `settings` et rend `ReglagesClient`.

---

## Task 1: Setup Vitest + schéma de validation (TDD)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `lib/validation/demo.ts`
- Test: `lib/validation/demo.test.ts`

- [ ] **Step 1: Installer Vitest**

Run: `pnpm add -D vitest`
Expected: vitest ajouté à `devDependencies`.

- [ ] **Step 2: Ajouter le script de test**

Dans `package.json`, ajouter à la section `"scripts"` :

```json
    "test": "vitest run"
```

- [ ] **Step 3: Config Vitest**

Create `vitest.config.ts` :

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Écrire le test qui échoue**

Create `lib/validation/demo.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { demoSubmissionSchema } from "./demo";

const valid = {
  artist: "Nova",
  contact: "Jean Dupont",
  email: "Jean@Exemple.FR",
  listenUrl: "https://soundcloud.com/nova",
  socials: "@nova",
  pitch: "Trois titres pop.",
};

describe("demoSubmissionSchema", () => {
  it("accepte une soumission complète et trim/normalise", () => {
    const r = demoSubmissionSchema.safeParse({ ...valid, artist: "  Nova  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.artist).toBe("Nova");
  });

  it("rend socials et pitch optionnels (défaut chaîne vide)", () => {
    const { socials, pitch, ...rest } = valid;
    const r = demoSubmissionSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.socials).toBe("");
      expect(r.data.pitch).toBe("");
    }
  });

  it("rejette un courriel invalide", () => {
    const r = demoSubmissionSchema.safeParse({ ...valid, email: "pasunemail" });
    expect(r.success).toBe(false);
  });

  it("rejette un lien d'écoute non-URL", () => {
    const r = demoSubmissionSchema.safeParse({ ...valid, listenUrl: "soundcloud" });
    expect(r.success).toBe(false);
  });

  it("rejette un nom d'artiste vide", () => {
    const r = demoSubmissionSchema.safeParse({ ...valid, artist: "   " });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 5: Lancer le test, vérifier l'échec**

Run: `pnpm exec vitest run lib/validation/demo.test.ts`
Expected: FAIL — `Cannot find module './demo'`.

- [ ] **Step 6: Implémenter le schéma**

Create `lib/validation/demo.ts` :

```ts
import { z } from "zod";

// Validations regex maison pour rester indépendant des variations d'API
// email()/url() entre versions de zod.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const URL_RE = /^https?:\/\/.+/i;

export const demoSubmissionSchema = z.object({
  artist: z.string().trim().min(1, "Indiquez votre nom d'artiste."),
  contact: z.string().trim().min(1, "Indiquez votre nom civil."),
  email: z
    .string()
    .trim()
    .min(1, "Indiquez votre courriel.")
    .refine((v) => EMAIL_RE.test(v), "Courriel invalide."),
  listenUrl: z
    .string()
    .trim()
    .min(1, "Indiquez un lien d'écoute.")
    .refine((v) => URL_RE.test(v), "Lien d'écoute invalide (commencez par http…)."),
  socials: z.string().trim().optional().default(""),
  pitch: z.string().trim().optional().default(""),
});

export type DemoSubmission = z.infer<typeof demoSubmissionSchema>;
```

- [ ] **Step 7: Lancer le test, vérifier le succès**

Run: `pnpm exec vitest run lib/validation/demo.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts lib/validation/demo.ts lib/validation/demo.test.ts
git commit -m "feat(demo): schéma zod de soumission + setup vitest"
```

---

## Task 2: Templates mail (TDD)

**Files:**
- Create: `lib/demoEmails.ts`
- Test: `lib/demoEmails.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `lib/demoEmails.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import {
  demoReceiptArtist,
  demoNewLabel,
  demoDecisionLabel,
  demoDecisionArtistDefaults,
  wrapArtistHtml,
} from "./demoEmails";

describe("demoEmails", () => {
  it("accusé réception : nomme l'artiste, html + text non vides", () => {
    const m = demoReceiptArtist("Nova");
    expect(m.subject.length).toBeGreaterThan(0);
    expect(m.text).toContain("Nova");
    expect(m.html).toContain("Nova");
  });

  it("notif label : inclut artiste, contact et le lien backoffice", () => {
    const m = demoNewLabel({
      artist: "Nova",
      contact: "Jean Dupont",
      email: "jean@exemple.fr",
      backofficeUrl: "http://localhost:3000/backoffice/demos",
    });
    expect(m.text).toContain("Nova");
    expect(m.text).toContain("Jean Dupont");
    expect(m.html).toContain("http://localhost:3000/backoffice/demos");
  });

  it("défauts décision : sujet+corps distincts selon retenu/refuse", () => {
    const ok = demoDecisionArtistDefaults("Nova", "retenu");
    const ko = demoDecisionArtistDefaults("Nova", "refuse");
    expect(ok.body).toContain("Nova");
    expect(ko.body).toContain("Nova");
    expect(ok.subject).not.toBe(ko.subject);
  });

  it("récap label : mentionne décision et décideur", () => {
    const m = demoDecisionLabel({
      artist: "Nova",
      decision: "retenu",
      deciderName: "Margaux",
    });
    expect(m.text).toContain("Nova");
    expect(m.text).toContain("Margaux");
  });

  it("wrapArtistHtml : transforme les paragraphes texte en HTML", () => {
    const html = wrapArtistHtml("Sujet", "Bonjour,\n\nMerci.");
    expect(html).toContain("Bonjour,");
    expect(html).toContain("Merci.");
    expect(html).toContain("<");
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `pnpm exec vitest run lib/demoEmails.test.ts`
Expected: FAIL — `Cannot find module './demoEmails'`.

- [ ] **Step 3: Implémenter les templates**

Create `lib/demoEmails.ts` :

```ts
// Templates mail purs (aucun accès réseau / DB). Pas de `server-only` :
// `demoDecisionArtistDefaults` et `wrapArtistHtml` sont aussi utilisés côté
// client (DecisionDialog) pour pré-remplir le mot à l'artiste.

export type EmailContent = { subject: string; text: string; html: string };
export type Decision = "retenu" | "refuse";

const BRAND = "#c0356e"; // magenta
const INK = "#1b1c2e";
const PAPER = "#f4efe6";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function shell(eyebrow: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:${PAPER};font-family:Georgia,serif;color:${INK}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#fff;border:1px solid rgba(27,28,46,.12);border-radius:4px;padding:36px">
        <tr><td>
          <p style="text-transform:uppercase;letter-spacing:.18em;font-size:11px;font-weight:bold;color:${BRAND};margin:0 0 16px">ARTémis Records · ${eyebrow}</p>
          ${bodyHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function paras(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => escapeHtml(p).replace(/\n/g, "<br>"))
    .map(
      (p) =>
        `<p style="font-size:15px;line-height:1.65;color:#333;margin:0 0 16px">${p}</p>`,
    )
    .join("");
}

/** Accusé de réception envoyé à l'artiste à la soumission. */
export function demoReceiptArtist(artistName: string): EmailContent {
  const subject = "Votre démo est bien arrivée · ARTémis Records";
  const text = `Bonjour ${artistName},

Nous avons bien reçu votre démo. Merci de votre confiance.

Notre équipe l'écoute avec attention : vous aurez une réponse sous quinze jours ouvrés.

À très vite,
ARTémis Records`;
  return { subject, text, html: shell("Soumission reçue", paras(text)) };
}

/** Notification envoyée au label quand une démo arrive. */
export function demoNewLabel(input: {
  artist: string;
  contact: string;
  email: string;
  backofficeUrl: string;
}): EmailContent {
  const subject = `Nouvelle démo · ${input.artist}`;
  const text = `Une nouvelle démo vient d'arriver.

Projet : ${input.artist}
Contact : ${input.contact} (${input.email})

À traiter dans le backoffice : ${input.backofficeUrl}`;
  const html = shell(
    "Nouvelle démo",
    `${paras(`Projet : ${input.artist}\nContact : ${input.contact} (${input.email})`)}
     <a href="${input.backofficeUrl}" style="display:inline-block;background:${INK};color:${PAPER};text-decoration:none;font-size:13px;letter-spacing:.12em;text-transform:uppercase;font-weight:bold;padding:14px 28px;border-radius:2px">Ouvrir la boîte à démos →</a>`,
  );
  return { subject, text, html };
}

/** Sujet + corps PAR DÉFAUT du mail à l'artiste (éditable dans la modale). */
export function demoDecisionArtistDefaults(
  artistName: string,
  decision: Decision,
): { subject: string; body: string } {
  if (decision === "retenu") {
    return {
      subject: "Votre démo nous a touchés · ARTémis Records",
      body: `Bonjour ${artistName},

Votre démo a retenu toute notre attention. Nous aimerions échanger avec vous pour parler de la suite.

Nous revenons très vite vers vous pour convenir d'un moment.

Chaleureusement,
ARTémis Records`,
    };
  }
  return {
    subject: "Au sujet de votre démo · ARTémis Records",
    body: `Bonjour ${artistName},

Merci d'avoir partagé votre musique avec nous. Nous l'avons écoutée avec sincérité.

Nous ne donnerons pas suite cette fois-ci : ce choix tient à nos priorités du moment, pas à la valeur de votre travail. Continuez, nous serons heureux de vous réécouter.

Avec tout notre respect,
ARTémis Records`,
  };
}

/** Récap envoyé au label après une décision. */
export function demoDecisionLabel(input: {
  artist: string;
  decision: Decision;
  deciderName: string;
}): EmailContent {
  const verb = input.decision === "retenu" ? "retenue" : "refusée";
  const subject = `Démo ${verb} · ${input.artist}`;
  const text = `Décision enregistrée.

Projet : ${input.artist}
Décision : ${verb}
Par : ${input.deciderName}`;
  return { subject, text, html: shell("Décision démo", paras(text)) };
}

/** Enrobe le corps (texte édité par l'admin) dans le HTML de marque. */
export function wrapArtistHtml(_subject: string, body: string): string {
  return shell("Réponse à votre démo", paras(body));
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `pnpm exec vitest run lib/demoEmails.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/demoEmails.ts lib/demoEmails.test.ts
git commit -m "feat(demo): templates mail (accusé, notif label, décisions)"
```

---

## Task 3: Primitives — `Btn.disabled` + champs de formulaire

**Files:**
- Modify: `components/Primitives.tsx`
- Modify: `components/FormFields.tsx`

- [ ] **Step 1: Ajouter `disabled` à `Btn`**

Dans `components/Primitives.tsx`, modifier le type `BtnProps` (autour de la ligne 77) pour ajouter `disabled` :

```tsx
type BtnProps = {
  kind?: BtnKind;
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  type?: "button" | "submit";
  newTab?: boolean;
  disabled?: boolean;
};
```

Puis la signature du composant (autour de la ligne 100) pour récupérer et appliquer `disabled` sur le rendu `<button>`. Remplacer l'en-tête de fonction :

```tsx
export const Btn = ({
  kind = "primary",
  children,
  onClick,
  href,
  className = "",
  type = "button",
  newTab = false,
  disabled = false,
}: BtnProps) => {
  const classes = `${BTN_BASE} ${BTN_VARIANT[kind]} ${className} ${
    disabled ? "opacity-60 pointer-events-none" : ""
  }`;
```

Et, dans la branche `<button>` (rendu quand il n'y a pas de `href`), ajouter l'attribut `disabled={disabled}`. Repérer le `<button` de fin de composant et le passer de :

```tsx
    <button type={type} onClick={onClick} className={classes}>
```

à :

```tsx
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
```

> Note : la structure exacte de la branche bouton peut varier ; l'objectif est que le `<button>` natif reçoive `disabled={disabled}` et que `classes` inclue l'état désactivé. Ne pas toucher aux branches `href`.

- [ ] **Step 2: Étendre `Field` et `TextArea`**

Dans `components/FormFields.tsx`, remplacer entièrement les exports `Field` et `TextArea` par :

```tsx
export const Field = ({
  label,
  type = "text",
  placeholder,
  name,
  required,
  defaultValue,
  error,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  name?: string;
  required?: boolean;
  defaultValue?: string;
  error?: string;
}) => (
  <div className="mb-5.5">
    <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
      {label}
    </label>
    <input
      type={type}
      name={name}
      required={required}
      defaultValue={defaultValue}
      placeholder={placeholder}
      aria-invalid={error ? true : undefined}
      className={`w-full bg-transparent border-0 border-b px-0 py-2.5 font-serif text-[15px] text-ink outline-none transition-colors ${
        error ? "border-magenta" : "border-ink/30 focus:border-magenta"
      }`}
    />
    {error && (
      <div className="mt-1.5 text-[12px] italic text-magenta">{error}</div>
    )}
  </div>
);

export const TextArea = ({
  label,
  placeholder,
  rows = 4,
  name,
  required,
  defaultValue,
  error,
}: {
  label: string;
  placeholder?: string;
  rows?: number;
  name?: string;
  required?: boolean;
  defaultValue?: string;
  error?: string;
}) => (
  <div className="mb-7">
    <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
      {label}
    </label>
    <textarea
      name={name}
      required={required}
      defaultValue={defaultValue}
      rows={rows}
      placeholder={placeholder}
      aria-invalid={error ? true : undefined}
      className={`w-full bg-transparent border-0 border-b px-0 py-2.5 font-serif italic text-[15px] text-ink outline-none resize-y transition-colors ${
        error ? "border-magenta" : "border-ink/30 focus:border-magenta"
      }`}
    />
    {error && (
      <div className="mt-1.5 text-[12px] italic text-magenta not-italic">
        {error}
      </div>
    )}
  </div>
);
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS (aucune erreur). Les usages existants de `Field`/`TextArea`/`Btn` restent valides (props ajoutées toutes optionnelles).

- [ ] **Step 4: Commit**

```bash
git add components/Primitives.tsx components/FormFields.tsx
git commit -m "feat(ui): Btn.disabled + Field/TextArea name/required/error"
```

---

## Task 4: Helpers réglages label (lecture) + mutations `demos`

**Files:**
- Modify: `lib/db/queries.ts`
- Create: `lib/db/demo-mutations.ts`

- [ ] **Step 1: Ajouter les helpers réglages label dans `queries.ts`**

Dans `lib/db/queries.ts`, juste après les constantes newsletter existantes (`NEWSLETTER_DASHBOARD_KEY`), ajouter :

```ts
export const LABEL_EMAIL_KEY = "label_contact_email";
export const LABEL_PHONE_KEY = "label_phone";
export const LABEL_ADDRESS_KEY = "label_address";

export const LABEL_DEFAULTS = {
  email: "artemis.inscriptions@gmail.com",
  phone: "07 78 47 22 30",
  address: "22 rue des Épinettes, 95180 Menucourt",
};

export type LabelSettings = { email: string; phone: string; address: string };

export async function getLabelSettings(): Promise<LabelSettings> {
  const rows = await db
    .select()
    .from(settings)
    .where(
      inArray(settings.key, [LABEL_EMAIL_KEY, LABEL_PHONE_KEY, LABEL_ADDRESS_KEY]),
    );
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  return {
    email: byKey.get(LABEL_EMAIL_KEY) ?? LABEL_DEFAULTS.email,
    phone: byKey.get(LABEL_PHONE_KEY) ?? LABEL_DEFAULTS.phone,
    address: byKey.get(LABEL_ADDRESS_KEY) ?? LABEL_DEFAULTS.address,
  };
}

export async function getLabelNotifyEmail(): Promise<string> {
  return (await getLabelSettings()).email;
}
```

> `inArray` et `settings` sont déjà importés en tête de `queries.ts` — ne pas les redéclarer.

- [ ] **Step 2: Créer les mutations `demos`**

Create `lib/db/demo-mutations.ts` :

```ts
import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { demos } from "./schema";
import type { DemoLink, DemoRow } from "./schema";

export async function insertDemo(input: {
  artist: string;
  contact: string;
  email: string;
  pitch: string;
  links: DemoLink[];
}): Promise<string> {
  const id = randomUUID();
  await db.insert(demos).values({
    id,
    artist: input.artist,
    contact: input.contact,
    email: input.email,
    pitch: input.pitch,
    links: input.links,
    status: "nouveau",
  });
  return id;
}

export async function getDemoById(id: string): Promise<DemoRow | null> {
  const [row] = await db.select().from(demos).where(eq(demos.id, id)).limit(1);
  return row ?? null;
}

export async function setDemoStatus(
  id: string,
  status: string,
  notes?: string,
): Promise<void> {
  const patch: Partial<typeof demos.$inferInsert> = { status };
  if (notes !== undefined) patch.notes = notes;
  await db.update(demos).set(patch).where(eq(demos.id, id));
}

export async function updateDemoMeta(
  id: string,
  meta: {
    rating?: number | null;
    tags?: string[];
    assignedTo?: string | null;
    notes?: string;
  },
): Promise<void> {
  const patch: Partial<typeof demos.$inferInsert> = {};
  if (meta.rating !== undefined) patch.rating = meta.rating;
  if (meta.tags !== undefined) patch.tags = meta.tags;
  if (meta.assignedTo !== undefined) patch.assignedTo = meta.assignedTo;
  if (meta.notes !== undefined) patch.notes = meta.notes;
  if (Object.keys(patch).length === 0) return;
  await db.update(demos).set(patch).where(eq(demos.id, id));
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/db/queries.ts lib/db/demo-mutations.ts
git commit -m "feat(db): helpers réglages label + mutations demos"
```

---

## Task 5: Soumission publique — action + page `/demo`

**Files:**
- Create: `app/(public)/demo/actions.ts`
- Modify: `app/(public)/demo/page.tsx`

- [ ] **Step 1: Créer l'action de soumission**

Create `app/(public)/demo/actions.ts` :

```ts
"use server";

import { demoSubmissionSchema } from "@/lib/validation/demo";
import { insertDemo } from "@/lib/db/demo-mutations";
import { getLabelNotifyEmail } from "@/lib/db/queries";
import { sendEmail } from "@/lib/email";
import { demoReceiptArtist, demoNewLabel } from "@/lib/demoEmails";
import type { DemoLink } from "@/lib/db/schema";

export type DemoFormState = {
  ok?: boolean;
  errors?: Record<string, string>;
} | null;

function baseUrl() {
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

export async function submitDemo(
  _prev: DemoFormState,
  formData: FormData,
): Promise<DemoFormState> {
  const raw = {
    artist: String(formData.get("artist") ?? ""),
    contact: String(formData.get("contact") ?? ""),
    email: String(formData.get("email") ?? ""),
    listenUrl: String(formData.get("listenUrl") ?? ""),
    socials: String(formData.get("socials") ?? ""),
    pitch: String(formData.get("pitch") ?? ""),
  };

  const parsed = demoSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
    }
    return { errors };
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();

  const links: DemoLink[] = [{ label: "Lien d'écoute", href: data.listenUrl }];
  if (data.socials) links.push({ label: "Réseaux sociaux", href: data.socials });

  // Source de vérité : l'insertion. Si elle échoue, on laisse remonter.
  await insertDemo({
    artist: data.artist,
    contact: data.contact,
    email,
    pitch: data.pitch,
    links,
  });

  // Mails best-effort : un échec ne doit jamais perdre la démo.
  try {
    await sendEmail({ to: email, ...demoReceiptArtist(data.artist) });
  } catch (e) {
    console.warn("[demo] accusé réception échoué:", (e as Error).message);
  }

  try {
    const labelTo = await getLabelNotifyEmail();
    await sendEmail({
      to: labelTo,
      ...demoNewLabel({
        artist: data.artist,
        contact: data.contact,
        email,
        backofficeUrl: `${baseUrl()}/backoffice/demos`,
      }),
    });
  } catch (e) {
    console.warn("[demo] notif label échouée:", (e as Error).message);
  }

  return { ok: true };
}
```

- [ ] **Step 2: Brancher la page `/demo`**

Remplacer entièrement `app/(public)/demo/page.tsx` par :

```tsx
"use client";

import { useActionState } from "react";
import { Btn, ChapterTitle, Eyebrow } from "@/components/Primitives";
import { Field, SuccessPanel, TextArea } from "@/components/FormFields";
import { submitDemo, type DemoFormState } from "./actions";

const CHECKLIST = [
  ["Des démos finalisées", "Pas besoin de master, mais un mix lisible."],
  ["Deux à quatre titres", "De quoi entendre une direction."],
  ["Un mot sur vous", "Votre histoire, vos influences, vos envies."],
  ["Vos liens publics", "Un endroit où écouter / vous voir en live."],
] as const;

export default function DemoPage() {
  const [state, formAction, pending] = useActionState<DemoFormState, FormData>(
    submitDemo,
    null,
  );
  const errors = state?.errors;

  return (
    <section className="bg-paper px-[clamp(24px,4vw,56px)] py-[clamp(56px,8vw,96px)]">
      <ChapterTitle
        eyebrow="Soumettre · Démarche artiste"
        title="PROPOSER UNE DÉMO"
        italic="Écrivons la suite ensemble"
      />
      <div className="h-8" />
      <p className="italic text-[17px] text-ink-muted max-w-[640px]">
        Nous accueillons les démarches avec attention. Parlez-nous de vous, de
        votre musique, de vos envies. Réponse sous quinze jours ouvrés.
      </p>
      <div className="h-10" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-14">
        {state?.ok ? (
          <SuccessPanel
            title="Bien reçu."
            body="Nous écoutons votre démo sous quinze jours. Merci de votre confiance."
          />
        ) : (
          <form action={formAction}>
            <Field
              name="artist"
              label="Nom d'artiste"
              placeholder="Votre projet"
              required
              error={errors?.artist}
            />
            <Field
              name="contact"
              label="Nom civil"
              placeholder="Nom, prénom"
              required
              error={errors?.contact}
            />
            <Field
              name="email"
              label="Courriel"
              type="email"
              placeholder="vous@exemple.fr"
              required
              error={errors?.email}
            />
            <Field
              name="listenUrl"
              label="Lien d'écoute"
              type="url"
              placeholder="SoundCloud, Bandcamp, YouTube…"
              required
              error={errors?.listenUrl}
            />
            <Field
              name="socials"
              label="Réseaux sociaux"
              placeholder="Instagram, TikTok"
              error={errors?.socials}
            />
            <TextArea
              name="pitch"
              label="Votre démarche"
              placeholder="Qui êtes-vous ? Quelle musique ? Quelles envies ?"
              rows={6}
              error={errors?.pitch}
            />
            <div className="text-[12px] italic text-ink-muted mb-5">
              En envoyant ce formulaire, vous acceptez que nous conservions vos
              informations pendant 12 mois.
            </div>
            <Btn kind="accent" type="submit" disabled={pending}>
              {pending ? "Envoi…" : "Envoyer la démo"}
            </Btn>
          </form>
        )}
        <aside>
          <Eyebrow>Ce que nous écoutons</Eyebrow>
          <div className="mt-4.5">
            {CHECKLIST.map(([h, p]) => (
              <div key={h} className="py-4.5 border-t border-ink/15">
                <div className="font-display uppercase tracking-caps text-[16px] text-magenta mb-1.5 font-normal">
                  {h}
                </div>
                <div className="text-[14px] text-ink-muted italic">{p}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Vérification manuelle (dev + Mailpit)**

Démarrer Mailpit (si pas déjà lancé) puis `pnpm dev`. Aller sur `http://localhost:3000/demo`.
- Soumettre vide → messages d'erreur inline (artiste, contact, courriel, lien).
- Soumettre un lien sans `http` → erreur « Lien d'écoute invalide ».
- Soumettre valide → `SuccessPanel` « Bien reçu. ».
- Vérifier dans Mailpit (`http://localhost:8025`) : 2 mails (accusé artiste + notif label).
- Vérifier en base (drizzle studio ou `/backoffice/demos`) : la démo apparaît, statut « Nouveau ».

- [ ] **Step 5: Commit**

```bash
git add app/(public)/demo/actions.ts app/(public)/demo/page.tsx
git commit -m "feat(demo): soumission publique enregistrée + mails artiste/label"
```

---

## Task 6: Server Actions backoffice (décision, écouté, métadonnées)

**Files:**
- Create: `app/backoffice/demos/actions.ts`

- [ ] **Step 1: Créer les actions**

Create `app/backoffice/demos/actions.ts` :

```ts
"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import {
  setDemoStatus,
  updateDemoMeta,
  getDemoById,
} from "@/lib/db/demo-mutations";
import { getLabelNotifyEmail } from "@/lib/db/queries";
import { sendEmail } from "@/lib/email";
import { wrapArtistHtml, demoDecisionLabel } from "@/lib/demoEmails";

export type DecisionState = { ok?: boolean; error?: string } | null;

export async function markListenedAction(id: string): Promise<void> {
  await requireRole("superadmin", "admin");
  await setDemoStatus(id, "ecoute");
  revalidatePath("/backoffice/demos");
}

export async function decideDemoAction(
  _prev: DecisionState,
  formData: FormData,
): Promise<DecisionState> {
  const { user } = await requireRole("superadmin", "admin");

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const notesRaw = formData.get("notes");

  if (decision !== "retenu" && decision !== "refuse") {
    return { error: "Décision invalide." };
  }
  if (!subject || !body) {
    return { error: "Le sujet et le message à l'artiste sont requis." };
  }

  const demo = await getDemoById(id);
  if (!demo) return { error: "Démo introuvable." };

  // Source de vérité : le changement de statut. On le persiste d'abord.
  await setDemoStatus(
    id,
    decision,
    notesRaw !== null ? String(notesRaw) : undefined,
  );

  // Mail à l'artiste (corps édité par l'admin) — best-effort.
  try {
    await sendEmail({
      to: demo.email,
      subject,
      text: body,
      html: wrapArtistHtml(subject, body),
    });
  } catch (e) {
    console.warn("[demo] mail décision artiste échoué:", (e as Error).message);
  }

  // Récap au label — best-effort.
  try {
    const labelTo = await getLabelNotifyEmail();
    await sendEmail({
      to: labelTo,
      ...demoDecisionLabel({
        artist: demo.artist,
        decision,
        deciderName: user.name ?? "Un membre du label",
      }),
    });
  } catch (e) {
    console.warn("[demo] récap label décision échoué:", (e as Error).message);
  }

  revalidatePath("/backoffice/demos");
  return { ok: true };
}

export async function updateDemoMetaAction(formData: FormData): Promise<void> {
  await requireRole("superadmin", "admin");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const patch: {
    rating?: number | null;
    tags?: string[];
    assignedTo?: string | null;
    notes?: string;
  } = {};

  if (formData.has("rating")) {
    const r = Number(formData.get("rating"));
    patch.rating = Number.isFinite(r) && r >= 1 && r <= 5 ? r : null;
  }
  if (formData.has("tags")) {
    patch.tags = String(formData.get("tags") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (formData.has("assignedTo")) {
    const a = String(formData.get("assignedTo") ?? "").trim();
    patch.assignedTo = a || null;
  }
  if (formData.has("notes")) {
    patch.notes = String(formData.get("notes") ?? "");
  }

  await updateDemoMeta(id, patch);
  revalidatePath("/backoffice/demos");
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/backoffice/demos/actions.ts
git commit -m "feat(backoffice): actions décision/écouté/métadonnées démos"
```

---

## Task 7: Modale de décision (`DecisionDialog`)

**Files:**
- Create: `components/admin/DecisionDialog.tsx`

- [ ] **Step 1: Créer le composant**

Create `components/admin/DecisionDialog.tsx` :

```tsx
"use client";

import { useActionState, useEffect } from "react";
import { AdminBtn, AdminEyebrow } from "@/components/admin/AdminPrimitives";
import {
  demoDecisionArtistDefaults,
  type Decision,
} from "@/lib/demoEmails";
import {
  decideDemoAction,
  type DecisionState,
} from "@/app/backoffice/demos/actions";

export function DecisionDialog({
  demoId,
  artist,
  email,
  decision,
  onClose,
}: {
  demoId: string;
  artist: string;
  email: string;
  decision: Decision;
  onClose: () => void;
}) {
  const defaults = demoDecisionArtistDefaults(artist, decision);
  const [state, formAction, pending] = useActionState<DecisionState, FormData>(
    decideDemoAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  const title = decision === "retenu" ? "Retenir cette démo" : "Refuser avec tact";

  return (
    <div
      className="fixed inset-0 z-50 bg-bleu-nuit-900/60 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-paper border border-ink/15 rounded-[3px] w-full max-w-[560px] my-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-ink/10 flex items-center justify-between">
          <div>
            <AdminEyebrow className="!text-magenta">{title}</AdminEyebrow>
            <div className="font-serif text-[14px] text-ink mt-1">
              À {artist} · {email}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-subtle hover:text-ink text-[20px] leading-none cursor-pointer"
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        <form action={formAction} className="px-6 py-5 flex flex-col gap-4">
          <input type="hidden" name="id" value={demoId} />
          <input type="hidden" name="decision" value={decision} />

          <div>
            <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
              Sujet
            </label>
            <input
              name="subject"
              defaultValue={defaults.subject}
              required
              className="w-full bg-paper-soft border border-ink/15 px-3.5 py-2.5 font-serif text-[14px] text-ink outline-none focus:border-magenta transition-colors rounded-[2px]"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
              Message à l'artiste
            </label>
            <textarea
              name="body"
              defaultValue={defaults.body}
              required
              rows={12}
              className="w-full bg-paper-soft border border-ink/15 px-3.5 py-2.5 font-serif text-[14px] text-ink outline-none focus:border-magenta transition-colors rounded-[2px] resize-y leading-[1.6]"
            />
            <div className="mt-1.5 font-serif italic text-[12px] text-ink-subtle">
              Relisez, personnalisez. Ce texte part tel quel à l'artiste.
            </div>
          </div>

          {state?.error && (
            <div className="text-[13px] italic text-magenta">{state.error}</div>
          )}

          <div className="flex items-center gap-2 justify-end pt-2 border-t border-ink/10">
            <AdminBtn kind="ghost" onClick={onClose}>
              Annuler
            </AdminBtn>
            <AdminBtn kind="accent" type="submit" disabled={pending}>
              {pending ? "Envoi…" : "Envoyer la décision"}
            </AdminBtn>
          </div>
        </form>
      </div>
    </div>
  );
}
```

> `AdminBtn` accepte déjà `disabled`, `type` et `onClick` (voir `AdminPrimitives.tsx`).

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/admin/DecisionDialog.tsx
git commit -m "feat(backoffice): modale de décision éditable"
```

---

## Task 8: Câbler `DemosPageClient` + charger les comptes assignables

**Files:**
- Modify: `app/backoffice/demos/page.tsx`
- Modify: `app/backoffice/demos/DemosPageClient.tsx`

- [ ] **Step 1: Charger les comptes dans la page serveur**

Remplacer entièrement `app/backoffice/demos/page.tsx` par :

```tsx
import { getDemos } from "@/lib/db/admin-queries";
import { listAccounts } from "@/lib/invitations";
import { DemosPageClient } from "./DemosPageClient";

export default async function DemosPage() {
  const demos = await getDemos();
  const { users } = await listAccounts();
  const accounts = users
    .filter((u) => u.role === "admin" || u.role === "superadmin")
    .map((u) => ({ id: u.id, name: u.name }));
  return <DemosPageClient demos={demos} accounts={accounts} />;
}
```

- [ ] **Step 2: Étendre la signature + l'en-tête de `DemosPageClient`**

Dans `app/backoffice/demos/DemosPageClient.tsx`, mettre à jour les imports en tête. Remplacer le bloc d'imports actuel (lignes ~1-17) par :

```tsx
"use client";

import { useMemo, useState } from "react";
import {
  AdminBtn,
  AdminEyebrow,
  EmptyState,
  PageHeader,
  Pill,
} from "@/components/admin/AdminPrimitives";
import { MultiPillFilter } from "@/components/admin/MultiPillFilter";
import { DEMO_STATUS_LABEL, type Demo, type DemoStatus } from "@/lib/adminData";
import { formatDate } from "@/lib/data";
import { DecisionDialog } from "@/components/admin/DecisionDialog";
import type { Decision } from "@/lib/demoEmails";
import {
  markListenedAction,
  updateDemoMetaAction,
} from "./actions";

export type Account = { id: string; name: string };
```

- [ ] **Step 3: Accepter `accounts` et gérer l'état de la modale**

Remplacer la signature de `DemosPageClient` et le début du corps. Trouver :

```tsx
export function DemosPageClient({ demos }: { demos: Demo[] }) {
  const [selectedFilters, setSelectedFilters] = useState<Set<DemoStatus>>(
    new Set(),
  );
  const [selectedId, setSelectedId] = useState<string>(demos[0]?.id ?? "");
  const [query, setQuery] = useState("");
```

et le remplacer par :

```tsx
export function DemosPageClient({
  demos,
  accounts,
}: {
  demos: Demo[];
  accounts: Account[];
}) {
  const [selectedFilters, setSelectedFilters] = useState<Set<DemoStatus>>(
    new Set(),
  );
  const [selectedId, setSelectedId] = useState<string>(demos[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [decisionFor, setDecisionFor] = useState<{
    demo: Demo;
    decision: Decision;
  } | null>(null);
```

- [ ] **Step 4: Passer `accounts` + handler à `DemoDetail` et monter la modale**

Trouver la ligne de rendu du détail :

```tsx
        {selected && <DemoDetail demo={selected} />}
      </div>
    </div>
  );
}
```

et la remplacer par :

```tsx
        {selected && (
          <DemoDetail
            demo={selected}
            accounts={accounts}
            onDecide={(decision) =>
              setDecisionFor({ demo: selected, decision })
            }
          />
        )}
      </div>

      {decisionFor && (
        <DecisionDialog
          demoId={decisionFor.demo.id}
          artist={decisionFor.demo.artist}
          email={decisionFor.demo.email}
          decision={decisionFor.decision}
          onClose={() => setDecisionFor(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Remplacer entièrement le composant `DemoDetail`**

Remplacer toute la fonction `DemoDetail` (depuis `function DemoDetail({ demo }: { demo: Demo }) {` jusqu'à son `}` final) par la version câblée ci-dessous. Elle ajoute : note ✦ cliquable, étiquettes éditables, select d'assignation, notes enregistrables, bouton « Marquer écouté », et les boutons Retenir/Refuser qui ouvrent la modale.

```tsx
function DemoDetail({
  demo,
  accounts,
  onDecide,
}: {
  demo: Demo;
  accounts: Account[];
  onDecide: (decision: Decision) => void;
}) {
  const assignedName =
    accounts.find((a) => a.id === demo.assignedTo)?.name ?? "";

  return (
    <aside className="bg-paper-soft border border-ink/10 rounded-[2px] sticky top-[88px]">
      <header className="p-6 bg-bleu-nuit-700 text-beige-sable relative overflow-hidden rounded-t-[2px]">
        <div className="stars opacity-40" aria-hidden />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <AdminEyebrow className="!text-magenta">
              reçue le {formatDate(demo.receivedAt)}
            </AdminEyebrow>
            <Pill
              tone={
                demo.status === "nouveau"
                  ? "magenta"
                  : demo.status === "retenu"
                  ? "live"
                  : demo.status === "refuse"
                  ? "mute"
                  : "info"
              }
            >
              {DEMO_STATUS_LABEL[demo.status as DemoStatus]}
            </Pill>
          </div>
          <h2 className="font-display uppercase tracking-display text-[clamp(1.75rem,3vw,2.5rem)] mt-3 font-normal leading-[1.05]">
            {demo.artist}
          </h2>
          <div className="italic text-[14px] text-beige-sable/80 mt-1">
            {[demo.genre, demo.city, demo.duration].filter(Boolean).join(" · ")}
          </div>

          {/* Note ✦ cliquable */}
          <form action={updateDemoMetaAction} className="mt-3">
            <input type="hidden" name="id" value={demo.id} />
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="submit"
                  name="rating"
                  value={n}
                  aria-label={`Noter ${n} sur 5`}
                  className="text-magenta text-[16px] leading-none cursor-pointer hover:scale-110 transition-transform"
                >
                  <span className={demo.rating && n <= demo.rating ? "" : "opacity-35"}>
                    ✦
                  </span>
                </button>
              ))}
            </div>
          </form>
        </div>
      </header>

      <div className="p-6 flex flex-col gap-5">
        <div>
          <AdminEyebrow className="mb-2">Pitch</AdminEyebrow>
          <p className="font-serif text-[14px] leading-[1.65] text-ink">
            {demo.pitch}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <AdminEyebrow className="mb-1">Contact</AdminEyebrow>
            <div className="font-serif text-[14px] text-ink">{demo.contact}</div>
            <a
              href={`mailto:${demo.email}`}
              className="italic text-[13px] text-magenta hover:underline break-all"
            >
              {demo.email}
            </a>
          </div>
          <div>
            <AdminEyebrow className="mb-1">Assigné à</AdminEyebrow>
            <form action={updateDemoMetaAction}>
              <input type="hidden" name="id" value={demo.id} />
              <select
                name="assignedTo"
                defaultValue={demo.assignedTo ?? ""}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="w-full bg-paper border border-ink/15 px-2.5 py-1.5 font-serif text-[13px] rounded-[2px] outline-none focus:border-magenta"
              >
                <option value="">Personne</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </form>
            {assignedName && (
              <div className="italic text-[12px] text-ink-muted mt-1">
                Suivi par {assignedName}
              </div>
            )}
          </div>
        </div>

        <div>
          <AdminEyebrow className="mb-2">Liens</AdminEyebrow>
          <ul className="flex flex-col gap-1.5">
            {demo.links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="inline-flex items-center gap-2 font-serif italic text-[13px] text-ink hover:text-magenta transition-colors"
                >
                  <span className="text-ink-subtle">→</span>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Étiquettes éditables : un champ texte (séparé par virgules) */}
        <form action={updateDemoMetaAction}>
          <input type="hidden" name="id" value={demo.id} />
          <AdminEyebrow className="mb-2">
            Étiquettes (séparées par des virgules)
          </AdminEyebrow>
          <div className="flex items-center gap-2">
            <input
              name="tags"
              defaultValue={demo.tags?.join(", ") ?? ""}
              placeholder="pop, voix, prod léchée…"
              className="flex-1 bg-paper border border-ink/15 px-3 py-1.5 font-serif text-[13px] rounded-[2px] outline-none focus:border-magenta"
            />
            <AdminBtn kind="secondary" type="submit">
              OK
            </AdminBtn>
          </div>
        </form>

        {/* Notes internes enregistrables */}
        <form action={updateDemoMetaAction}>
          <input type="hidden" name="id" value={demo.id} />
          <AdminEyebrow className="mb-2">Notes internes</AdminEyebrow>
          <textarea
            name="notes"
            rows={3}
            defaultValue={demo.notes ?? ""}
            placeholder="Vos impressions à chaud : ce qui accroche, ce qui tempère, ce qu'il faut creuser…"
            className="w-full bg-paper border border-ink/15 px-3.5 py-2.5 font-serif text-[14px] italic text-ink outline-none focus:border-magenta transition-colors rounded-[2px] resize-y leading-[1.55]"
          />
          <div className="mt-2 flex justify-end">
            <AdminBtn kind="secondary" type="submit">
              Enregistrer les notes
            </AdminBtn>
          </div>
        </form>

        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-ink/10">
          <AdminBtn kind="accent" onClick={() => onDecide("retenu")}>
            Retenir
          </AdminBtn>
          <MarkListenedButton id={demo.id} />
          <AdminBtn kind="danger" onClick={() => onDecide("refuse")}>
            Refuser avec tact
          </AdminBtn>
        </div>
      </div>
    </aside>
  );
}

function MarkListenedButton({ id }: { id: string }) {
  return (
    <form action={markListenedAction.bind(null, id)}>
      <AdminBtn kind="secondary" type="submit">
        Marquer écouté
      </AdminBtn>
    </form>
  );
}
```

> Notes sur ce remplacement :
> - L'ancien lecteur audio factice (barre de progression « piste 1 / … ») et le bloc `id ·` sont retirés : ils référençaient un player non fonctionnel. On garde la fiche centrée sur l'utile.
> - `markListenedAction.bind(null, id)` permet d'appeler une action `(id) => void` depuis un `<form action>` sans wrapper supplémentaire.

- [ ] **Step 6: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Vérification manuelle (dev + Mailpit)**

`pnpm dev` → `http://localhost:3000/backoffice/demos`. Sur une démo :
- Cliquer une étoile → la note se met à jour après rechargement (revalidate).
- Changer l'assignation → « Suivi par … » s'affiche.
- Éditer étiquettes + OK → tags mis à jour.
- Écrire des notes + Enregistrer → persistées (rouvrir la démo pour confirmer).
- « Marquer écouté » → statut passe à « À écouter ».
- « Retenir » → modale ouverte, sujet/corps pré-remplis (ton positif) ; envoyer → statut « Retenu », mail artiste + récap label dans Mailpit.
- « Refuser avec tact » → modale ton délicat ; éditer le mot ; envoyer → statut « Refusé », mails présents.

- [ ] **Step 8: Commit**

```bash
git add app/backoffice/demos/page.tsx app/backoffice/demos/DemosPageClient.tsx
git commit -m "feat(backoffice): câblage notes/note/étiquettes/assignation + décisions"
```

---

## Task 9: Réglages label câblés

**Files:**
- Create: `app/backoffice/reglages/actions.ts`
- Create: `app/backoffice/reglages/ReglagesClient.tsx`
- Modify: `app/backoffice/reglages/page.tsx`

- [ ] **Step 1: Créer l'action de sauvegarde**

Create `app/backoffice/reglages/actions.ts` :

```ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import {
  LABEL_EMAIL_KEY,
  LABEL_PHONE_KEY,
  LABEL_ADDRESS_KEY,
} from "@/lib/db/queries";

export type ReglagesState = { ok?: boolean; error?: string } | null;

async function upsertSetting(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function saveLabelSettingsAction(
  _prev: ReglagesState,
  formData: FormData,
): Promise<ReglagesState> {
  await requireRole("superadmin", "admin");

  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!email.includes("@")) {
    return { error: "Email de contact invalide." };
  }

  await upsertSetting(LABEL_EMAIL_KEY, email);
  await upsertSetting(LABEL_PHONE_KEY, phone);
  await upsertSetting(LABEL_ADDRESS_KEY, address);

  revalidatePath("/backoffice/reglages");
  return { ok: true };
}
```

- [ ] **Step 2: Extraire le contenu client dans `ReglagesClient`**

Create `app/backoffice/reglages/ReglagesClient.tsx` (reprend la maquette existante, branche la section « Identité du label » sur l'action ; la section « Équipe » reste inchangée) :

```tsx
"use client";

import { useActionState, useState } from "react";
import {
  AdminBtn,
  AdminEyebrow,
  AdminField,
  PageHeader,
} from "@/components/admin/AdminPrimitives";
import { TEAM } from "@/lib/adminData";
import type { LabelSettings } from "@/lib/db/queries";
import {
  saveLabelSettingsAction,
  type ReglagesState,
} from "./actions";

type Section = "label" | "equipe";
const SECTIONS: { k: Section; label: string }[] = [
  { k: "label", label: "Identité du label" },
  { k: "equipe", label: "Équipe" },
];

export function ReglagesClient({ label }: { label: LabelSettings }) {
  const [sec, setSec] = useState<Section>("label");
  const [state, formAction, pending] = useActionState<ReglagesState, FormData>(
    saveLabelSettingsAction,
    null,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        chapter="10"
        eyebrow="Préférences du backoffice"
        title="Réglages"
        italic="Identité et équipe. La plomberie du label, tenue au propre."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
        <nav className="bg-paper-soft border border-ink/10 rounded-[2px] p-2 flex lg:flex-col flex-wrap">
          {SECTIONS.map((s) => {
            const active = s.k === sec;
            return (
              <button
                key={s.k}
                type="button"
                onClick={() => setSec(s.k)}
                className={`text-left relative font-serif text-[12px] tracking-[0.14em] uppercase font-bold px-4 py-3 cursor-pointer transition-colors ${
                  active
                    ? "text-ink bg-paper"
                    : "text-ink-muted hover:text-ink hover:bg-paper/60"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-magenta" />
                )}
                {s.label}
              </button>
            );
          })}
        </nav>

        <section className="bg-paper-soft border border-ink/10 rounded-[2px] p-7">
          {sec === "label" && (
            <form action={formAction}>
              <AdminEyebrow className="mb-4">Identité du label</AdminEyebrow>
              <div className="grid grid-cols-2 gap-4">
                <AdminField
                  label="Email de contact"
                  name="email"
                  type="email"
                  defaultValue={label.email}
                  hint="Reçoit les notifications de nouvelles démos et de décisions."
                />
                <AdminField
                  label="Téléphone"
                  name="phone"
                  defaultValue={label.phone}
                />
              </div>
              <AdminField
                label="Adresse postale"
                name="address"
                defaultValue={label.address}
              />
              {state?.error && (
                <div className="text-[13px] italic text-magenta mb-3">
                  {state.error}
                </div>
              )}
              {state?.ok && (
                <div className="text-[13px] italic text-vert-foret-700 mb-3">
                  Réglages enregistrés.
                </div>
              )}
              <div className="flex items-center gap-3 pt-4 border-t border-ink/10">
                <AdminBtn kind="accent" type="submit" disabled={pending}>
                  {pending ? "Enregistrement…" : "Enregistrer"}
                </AdminBtn>
              </div>
            </form>
          )}

          {sec === "equipe" && (
            <>
              <div className="flex items-center justify-between mb-5">
                <AdminEyebrow>Membres de l&apos;équipe</AdminEyebrow>
                <AdminBtn kind="accent">+ Inviter un membre</AdminBtn>
              </div>
              <ul className="divide-y divide-ink/10">
                {TEAM.map((m) => (
                  <li
                    key={m.id}
                    className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center py-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-bleu-nuit-700 text-beige-sable flex items-center justify-center font-display text-[13px]">
                      {m.name
                        .split(" ")
                        .map((x) => x[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <div className="font-serif text-[14px] text-ink">
                        {m.name}
                      </div>
                      <div className="italic text-[12px] text-ink-muted">
                        {m.role} · {m.email}
                      </div>
                    </div>
                    <select className="bg-paper border border-ink/15 px-2.5 py-1 font-serif text-[12px] rounded-[2px] outline-none">
                      <option>Admin</option>
                      <option>Éditeur</option>
                      <option>Lecteur</option>
                    </select>
                    <button
                      type="button"
                      className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle hover:text-magenta cursor-pointer"
                    >
                      Gérer ⟶
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-6 bg-paper border border-dashed border-ink/20 rounded-[2px] p-4">
                <AdminEyebrow className="mb-2">
                  Invitations en attente
                </AdminEyebrow>
                <div className="italic text-[13px] text-ink-muted">
                  Aucune invitation en cours. Les invités reçoivent un lien
                  valable 48h.
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Convertir `page.tsx` en Server Component**

Remplacer entièrement `app/backoffice/reglages/page.tsx` par :

```tsx
import { getLabelSettings } from "@/lib/db/queries";
import { ReglagesClient } from "./ReglagesClient";

export default async function ReglagesPage() {
  const label = await getLabelSettings();
  return <ReglagesClient label={label} />;
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Vérification manuelle**

`pnpm dev` → `http://localhost:3000/backoffice/reglages`.
- Section « Identité du label » pré-remplie (valeurs par défaut au premier passage).
- Modifier l'email de contact → Enregistrer → message « Réglages enregistrés. » ; recharger la page → valeur persistée.
- Soumettre une nouvelle démo depuis `/demo` → la notif label part vers la nouvelle adresse (vérifier dans Mailpit le destinataire).

- [ ] **Step 6: Commit**

```bash
git add app/backoffice/reglages/actions.ts app/backoffice/reglages/ReglagesClient.tsx app/backoffice/reglages/page.tsx
git commit -m "feat(backoffice): réglages label persistés (email destinataire des notifs)"
```

---

## Task 10: Vérification finale

**Files:** aucun (vérification).

- [ ] **Step 1: Lancer toute la suite de tests**

Run: `pnpm test`
Expected: PASS (validation + templates, 10 tests).

- [ ] **Step 2: Typecheck complet**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: aucune nouvelle erreur (warnings préexistants tolérés).

- [ ] **Step 4: Parcours bout-en-bout (dev + Mailpit)**

1. `/demo` : soumettre une démo valide → SuccessPanel + 2 mails (artiste, label) + ligne en base statut « Nouveau ».
2. `/backoffice/demos` : noter, étiqueter, assigner, annoter → tout persiste.
3. « Marquer écouté » → statut « À écouter ».
4. « Retenir » → modale, envoyer → statut « Retenu » + mail artiste (corps édité) + récap label.
5. Sur une autre démo, « Refuser avec tact » → statut « Refusé » + mails.
6. `/backoffice/reglages` : changer l'email destinataire → une nouvelle soumission notifie la nouvelle adresse.

- [ ] **Step 5: Commit final (si ajustements)**

```bash
git add -A
git commit -m "chore(demo): vérification bout-en-bout du parcours démo"
```

---

## Self-Review Notes

- **Couverture spec** : soumission publique (T5), accusé artiste + notif label (T2/T5), décision éditable + mails (T2/T6/T7/T8), récap label (T2/T6), métadonnées note/tags/assignation/notes (T6/T8), assignation aux vrais comptes (T8), réglages label persistés + destinataire configurable (T4/T9), principe best-effort (T5/T6), fallback adresse (T4). ✓
- **Pas de migration** : `demos` et `settings` ont déjà toutes les colonnes/lignes — confirmé sur `lib/db/schema.ts`. ✓
- **Cohérence des types** : `Decision` (`"retenu"|"refuse"`) partagé entre `demoEmails.ts`, `DecisionDialog`, `DemosPageClient`. `DemoFormState`/`DecisionState`/`ReglagesState` chacun défini dans son action et importé par son client. `updateDemoMetaAction` lit par présence de champ (patch partiel) — cohérent avec `updateDemoMeta`. ✓
- **Hors périmètre** (non traité, volontaire) : upload audio Blob, transport prod Resend, export CSV, ajout manuel de démo, câblage rôles/invitations de la section Équipe.
```
