"use client";

import { useActionState, useState } from "react";
import {
  AdminBtn,
  AdminEyebrow,
  AdminField,
  PageHeader,
} from "@/components/admin/AdminPrimitives";
import type { LabelSettings } from "@/lib/db/queries";
import {
  saveLabelSettingsAction,
  type ReglagesState,
} from "./actions";

const INPUT_CLASS =
  "w-full bg-paper-soft border border-ink/15 px-3.5 py-2.5 font-serif text-[14px] text-ink outline-none focus:border-magenta transition-colors rounded-[2px]";

function ListField({
  label,
  name,
  type = "text",
  addLabel,
  hint,
  initial,
}: {
  label: string;
  name: string;
  type?: string;
  addLabel: string;
  hint?: string;
  initial: string[];
}) {
  const [items, setItems] = useState<string[]>(
    initial.length > 0 ? initial : [""],
  );

  return (
    <div className="mb-5">
      <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
        {label}
      </label>
      <div className="flex flex-col gap-2">
        {items.map((value, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type={type}
              name={name}
              value={value}
              onChange={(e) =>
                setItems(items.map((v, j) => (j === i ? e.target.value : v)))
              }
              className={INPUT_CLASS}
            />
            <button
              type="button"
              onClick={() => setItems(items.filter((_, j) => j !== i))}
              aria-label={`Retirer ${label.toLowerCase()} ${i + 1}`}
              className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[2px] border border-ink/15 text-ink-muted hover:text-magenta hover:border-magenta/40 transition-colors cursor-pointer"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M5 5L19 19" />
                <path d="M19 5L5 19" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setItems([...items, ""])}
        className="mt-2 inline-flex items-center gap-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-muted hover:text-magenta transition-colors cursor-pointer"
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 4v16" />
          <path d="M4 12h16" />
        </svg>
        {addLabel}
      </button>
      {hint && (
        <div className="mt-1.5 font-serif italic text-[12px] text-ink-subtle">
          {hint}
        </div>
      )}
    </div>
  );
}

export function ReglagesClient({ label }: { label: LabelSettings }) {
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
        italic="Identité du label. La plomberie, tenue au propre."
      />

      <section className="bg-paper-soft border border-ink/10 rounded-[2px] p-7 max-w-[720px]">
        <form action={formAction}>
          <AdminEyebrow className="mb-4">Identité du label</AdminEyebrow>
          <div className="grid grid-cols-2 gap-4">
            <ListField
              label="Emails de contact"
              name="emails"
              type="email"
              addLabel="Ajouter un email"
              initial={label.emails}
              hint="Le premier reçoit les notifications de nouvelles démos et de décisions."
            />
            <ListField
              label="Téléphones"
              name="phones"
              addLabel="Ajouter un téléphone"
              initial={label.phones}
            />
          </div>
          <AdminField
            label="Adresse postale"
            name="address"
            defaultValue={label.address}
          />
          <div className="font-serif italic text-[12px] text-ink-subtle mb-4 -mt-3">
            Les champs laissés vides ne sont pas affichés sur le site public
            (footer et page contact).
          </div>
          {state?.error && (
            <div role="alert" className="text-[13px] italic text-magenta mb-3">
              {state.error}
            </div>
          )}
          {state?.ok && (
            <div role="status" className="text-[13px] italic text-vert-foret-700 mb-3">
              Réglages enregistrés.
            </div>
          )}
          <div className="flex items-center gap-3 pt-4 border-t border-ink/10">
            <AdminBtn kind="accent" type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer"}
            </AdminBtn>
          </div>
        </form>
      </section>
    </div>
  );
}
