"use client";

import { useActionState } from "react";
import { Eyebrow } from "@/components/Primitives";
import { acceptInvitationAction, type AcceptState } from "./actions";

export function AcceptForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState<AcceptState, FormData>(
    acceptInvitationAction,
    null,
  );

  if (state?.ok) {
    return (
      <div className="border border-ink/15 p-7 bg-paper-soft">
        <Eyebrow className="!text-magenta">Compte activé</Eyebrow>
        <div className="font-display uppercase tracking-display text-[24px] mt-2 font-normal">
          Vérifiez vos emails
        </div>
        <p className="italic text-[14px] text-ink-muted mt-3 leading-[1.6]">
          Votre compte est créé. Un lien de connexion vient d&apos;être envoyé à{" "}
          <strong>{state.email}</strong> : cliquez dessus pour entrer dans votre
          espace.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8">
      <input type="hidden" name="token" value={token} />

      <div className="mb-5">
        <span className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
          Courriel
        </span>
        <div className="mt-1.5 w-full border-b border-ink/15 px-0 py-2.5 font-serif text-[15px] text-ink-muted">
          {email}
        </div>
      </div>

      <div className="mb-5">
        <label
          htmlFor="firstName"
          className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle"
        >
          Prénom
        </label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          required
          minLength={2}
          autoFocus
          placeholder="Prénom"
          className="mt-1.5 w-full bg-transparent border-0 border-b border-ink/30 px-0 py-2.5 font-serif text-[15px] text-ink outline-none focus:border-magenta transition-colors"
        />
      </div>

      <div className="mb-5">
        <label
          htmlFor="lastName"
          className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle"
        >
          Nom <span className="normal-case font-normal italic text-ink-subtle">(facultatif)</span>
        </label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          placeholder="Nom"
          className="mt-1.5 w-full bg-transparent border-0 border-b border-ink/30 px-0 py-2.5 font-serif text-[15px] text-ink outline-none focus:border-magenta transition-colors"
        />
      </div>

      {state?.error && (
        <p className="font-serif italic text-[13px] text-magenta mb-4">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full font-serif text-[12px] tracking-[0.22em] uppercase font-bold bg-bleu-nuit-700 text-beige-sable px-6 py-4 rounded-[2px] cursor-pointer hover:bg-bleu-nuit-800 transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
      >
        {pending ? "Activation…" : "Activer mon compte"}
        {!pending && <span className="text-magenta">⟶</span>}
      </button>
    </form>
  );
}
