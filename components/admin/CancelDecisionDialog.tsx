"use client";

import { useActionState, useEffect, useState } from "react";
import { AdminBtn, AdminEyebrow } from "@/components/admin/AdminPrimitives";
import {
  cancelDecisionAction,
  type CancelState,
} from "@/app/backoffice/demos/actions";
import type { DemoStatus } from "@/lib/adminData";

/**
 * Confirmation avant d'annuler une décision déjà notifiée à l'artiste.
 * L'annulation n'est validée que si l'admin tape « oui » à la question
 * « Avez-vous contacté l'artiste ? » (contrôlé aussi côté serveur).
 */
export function CancelDecisionDialog({
  demoId,
  artist,
  status,
  onClose,
}: {
  demoId: string;
  artist: string;
  status: DemoStatus;
  onClose: () => void;
}) {
  const [confirm, setConfirm] = useState("");
  const [state, formAction, pending] = useActionState<CancelState, FormData>(
    cancelDecisionAction,
    null,
  );
  const ready = confirm.trim().toLowerCase() === "oui";
  const decisionLabel = status === "retenu" ? "retenue" : "refusée";

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

  return (
    <div
      className="fixed inset-0 z-50 bg-bleu-nuit-900/60 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Annuler la décision"
      onClick={onClose}
    >
      <div
        className="bg-paper border border-ink/15 rounded-[3px] w-full max-w-[480px] my-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-ink/10 flex items-center justify-between">
          <div>
            <AdminEyebrow className="!text-magenta">
              Annuler la décision
            </AdminEyebrow>
            <div className="font-serif text-[14px] text-ink mt-1">
              {artist} · démo {decisionLabel}
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

          <div className="bg-[#C8A74E]/12 border border-[#C8A74E]/40 rounded-[2px] px-4 py-3 text-[13px] leading-[1.55] text-ink">
            <strong className="font-bold">Attention.</strong> L&apos;artiste a
            déjà reçu un message lui annonçant que sa démo était {decisionLabel}.
            Avant d&apos;annuler cette décision, contactez-le pour l&apos;informer
            du changement — sans quoi il recevra des signaux contradictoires.
          </div>

          <div>
            <label
              htmlFor="cancel-confirm"
              className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle"
            >
              Avez-vous contacté l&apos;artiste ? Tapez « oui » pour confirmer.
            </label>
            <input
              id="cancel-confirm"
              name="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
              placeholder="oui"
              className="w-full bg-paper-soft border border-ink/15 px-3.5 py-2.5 font-serif text-[14px] text-ink outline-none focus:border-magenta transition-colors rounded-[2px]"
            />
          </div>

          {state?.error && (
            <div className="text-[13px] italic text-magenta">{state.error}</div>
          )}

          <div className="flex items-center gap-2 justify-end pt-2 border-t border-ink/10">
            <AdminBtn kind="ghost" onClick={onClose}>
              Fermer
            </AdminBtn>
            <AdminBtn kind="danger" type="submit" disabled={!ready || pending}>
              {pending ? "Annulation…" : "Annuler la décision"}
            </AdminBtn>
          </div>
        </form>
      </div>
    </div>
  );
}
