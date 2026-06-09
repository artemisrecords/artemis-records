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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title = decision === "retenu" ? "Retenir cette démo" : "Refuser avec tact";

  return (
    <div
      className="fixed inset-0 z-50 bg-bleu-nuit-900/60 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
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
