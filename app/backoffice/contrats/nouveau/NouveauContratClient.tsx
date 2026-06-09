"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AdminBtn,
  AdminField,
  AdminSelect,
  AdminTextarea,
  PageHeader,
} from "@/components/admin/AdminPrimitives";
import { createContractAction } from "@/app/backoffice/contrats/actions";

const STATUS_OPTIONS = [
  { value: "a_signer", label: "À signer" },
  { value: "en_cours", label: "En vigueur" },
  { value: "echu", label: "Arrive à échéance" },
  { value: "archive", label: "Archivé" },
];

export default function NouveauContratClient({
  artistOptions,
}: {
  artistOptions: { id: string; name: string }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    start(async () => {
      const res = await createContractAction({
        title: String(formData.get("title") ?? ""),
        party: String(formData.get("party") ?? ""),
        artistId: String(formData.get("artistId") ?? ""),
        type: String(formData.get("type") ?? ""),
        startDate: String(formData.get("startDate") ?? ""),
        endDate: String(formData.get("endDate") ?? ""),
        amount: String(formData.get("amount") ?? ""),
        status: String(formData.get("status") ?? "a_signer"),
        notes: String(formData.get("notes") ?? ""),
        signedBy: String(formData.get("signedBy") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle">
        <Link href="/backoffice/contrats" className="hover:text-ink">
          ← Contrats
        </Link>
      </div>

      <PageHeader
        eyebrow="Juridique & production"
        title="Nouveau contrat"
        italic="La référence (ct-AAAA-NNN) est attribuée automatiquement à la création."
      />

      <form action={onSubmit} className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-6 items-start">
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-7">
          <AdminField
            name="title"
            label="Intitulé"
            placeholder="Contrat d'artiste · Allicyone"
          />
          <AdminField
            name="type"
            label="Type"
            placeholder="Contrat d'artiste · 3 ans · Synchronisation · Booking…"
          />
          <AdminField
            name="party"
            label="Partie / cocontractant"
            placeholder="Arte France, Believe Digital, Allicyone…"
            hint="Texte libre. Si le contrat lie un artiste du roster, sélectionnez-le à droite."
          />
          <AdminTextarea
            name="notes"
            label="Notes (optionnel)"
            rows={4}
            placeholder="Points d'attention, clauses à surveiller…"
          />
          {error && <div className="mb-3 font-serif text-[12px] text-magenta">{error}</div>}
          <div className="flex items-center gap-3 pt-2">
            <AdminBtn kind="accent" type="submit" disabled={pending}>
              {pending ? "Création…" : "Créer le contrat"}
            </AdminBtn>
            <Link
              href="/backoffice/contrats"
              className="font-serif italic text-[13px] text-ink-muted hover:text-ink"
            >
              Annuler
            </Link>
          </div>
        </div>

        <aside className="flex flex-col gap-4 sticky top-[88px]">
          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
            <AdminSelect name="status" label="Statut" defaultValue="a_signer" options={STATUS_OPTIONS} />
            <AdminSelect
              name="artistId"
              label="Artiste lié (optionnel)"
              defaultValue=""
              options={[
                { value: "", label: "— Aucun (hors roster) —" },
                ...artistOptions.map((a) => ({ value: a.id, label: a.name })),
              ]}
            />
            <AdminField name="startDate" label="Début" type="date" />
            <AdminField name="endDate" label="Fin" type="date" />
            <AdminField name="amount" label="Montant" placeholder="3 500 €, 50/50, %…" />
            <AdminField
              name="signedBy"
              label="Signataires"
              placeholder="Allicyone, M. Villeneuve"
              hint="Séparés par des virgules."
            />
          </div>
        </aside>
      </form>
    </div>
  );
}
