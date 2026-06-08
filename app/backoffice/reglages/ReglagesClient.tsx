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
