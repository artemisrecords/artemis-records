"use client";

import { useActionState } from "react";
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
      </section>
    </div>
  );
}
