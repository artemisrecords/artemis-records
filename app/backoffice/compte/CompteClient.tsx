"use client";

import { useActionState } from "react";
import {
  AdminBtn,
  AdminEyebrow,
  AdminField,
  Pill,
} from "@/components/admin/AdminPrimitives";
import {
  updateProfileAction,
  changeEmailAction,
  signOutAction,
  type ProfileState,
} from "./actions";

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Super admin",
  admin: "Admin",
  artiste: "Artiste",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Feedback({ state }: { state: ProfileState }) {
  if (state?.ok && state.message) {
    return (
      <span className="font-serif italic text-[13px] text-ink-muted">
        {state.message}
      </span>
    );
  }
  if (state?.error) {
    return (
      <span className="font-serif italic text-[13px] text-magenta">
        {state.error}
      </span>
    );
  }
  return null;
}

export function CompteClient({
  firstName,
  lastName,
  email,
  role,
  createdAt,
}: {
  firstName: string;
  lastName: string;
  email: string;
  role: string | null;
  createdAt: string;
}) {
  const [profileState, profileAction, profilePending] = useActionState<
    ProfileState,
    FormData
  >(updateProfileAction, null);
  const [emailState, emailAction, emailPending] = useActionState<
    ProfileState,
    FormData
  >(changeEmailAction, null);

  return (
    <div className="flex flex-col gap-6 max-w-[720px]">
      {/* Identité */}
      <section className="bg-paper-soft border border-ink/10 rounded-[2px] p-7">
        <AdminEyebrow className="mb-4">Mon profil</AdminEyebrow>
        <form action={profileAction}>
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-5">
            <AdminField label="Prénom" name="firstName" defaultValue={firstName} />
            <AdminField
              label="Nom"
              name="lastName"
              defaultValue={lastName}
              hint="Facultatif"
            />
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-ink/10 flex-wrap">
            <AdminBtn kind="accent" type="submit" disabled={profilePending}>
              {profilePending ? "Enregistrement…" : "Enregistrer"}
            </AdminBtn>
            <Feedback state={profileState} />
          </div>
        </form>
      </section>

      {/* Adresse de connexion */}
      <section className="bg-paper-soft border border-ink/10 rounded-[2px] p-7">
        <AdminEyebrow className="mb-4">Adresse de connexion</AdminEyebrow>
        <form action={emailAction}>
          <AdminField
            label="Courriel"
            name="email"
            type="email"
            defaultValue={email}
            hint="La connexion se fait par lien magique envoyé à cette adresse. Tout changement doit être confirmé via un lien envoyé à votre adresse actuelle."
          />
          <div className="flex items-center gap-3 pt-4 border-t border-ink/10 flex-wrap">
            <AdminBtn kind="primary" type="submit" disabled={emailPending}>
              {emailPending ? "Envoi…" : "Changer d'adresse"}
            </AdminBtn>
            <Feedback state={emailState} />
          </div>
        </form>
      </section>

      {/* Session */}
      <section className="bg-paper-soft border border-ink/10 rounded-[2px] p-7">
        <AdminEyebrow className="mb-4">Session</AdminEyebrow>
        <dl className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
              Rôle
            </dt>
            <dd>
              <Pill tone="magenta">{ROLE_LABEL[role ?? ""] ?? role ?? "—"}</Pill>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
              Membre depuis
            </dt>
            <dd className="font-serif text-[14px] text-ink-muted">
              {fmtDate(createdAt)}
            </dd>
          </div>
        </dl>
        <div className="flex items-center gap-3 pt-5 mt-4 border-t border-ink/10">
          <form action={signOutAction}>
            <AdminBtn kind="danger" type="submit">
              Se déconnecter
            </AdminBtn>
          </form>
        </div>
      </section>
    </div>
  );
}
