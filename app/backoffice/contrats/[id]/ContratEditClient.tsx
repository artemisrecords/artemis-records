"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AdminBtn,
  AdminEyebrow,
  AdminField,
  AdminSelect,
  AdminTextarea,
  Pill,
} from "@/components/admin/AdminPrimitives";
import { updateContractAction, deleteContractAction } from "@/app/backoffice/contrats/actions";
import type { ContractDetail } from "@/lib/db/contract-queries";
import type { ContractStatus } from "@/lib/validation/contract";

type Status = { tone: "ok" | "error"; message: string } | null;

const STATUS_OPTIONS = [
  { value: "a_signer", label: "À signer" },
  { value: "en_cours", label: "En vigueur" },
  { value: "echu", label: "Arrive à échéance" },
  { value: "archive", label: "Archivé" },
];

const STATUS_LABEL: Record<ContractStatus, string> = {
  en_cours: "En vigueur",
  a_signer: "À signer",
  echu: "Arrive à échéance",
  archive: "Archivé",
};
const STATUS_TONE: Record<ContractStatus, "live" | "magenta" | "warn" | "mute"> = {
  en_cours: "live",
  a_signer: "magenta",
  echu: "warn",
  archive: "mute",
};

export function ContratEditClient({
  contract,
  artistOptions,
}: {
  contract: ContractDetail;
  artistOptions: { id: string; name: string }[];
}) {
  const [status, setStatus] = useState<Status>(null);
  const [savePending, startSave] = useTransition();
  const submit = (formData: FormData) => {
    setStatus(null);
    startSave(async () => {
      const res = await updateContractAction(contract.id, {
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
      setStatus(
        res.ok
          ? { tone: "ok", message: "Contrat enregistré." }
          : { tone: "error", message: res.error },
      );
    });
  };

  const [confirmDelete, setConfirmDelete] = useState("");
  const [delPending, startDel] = useTransition();
  const [delError, setDelError] = useState<string | null>(null);
  const doDelete = () => {
    setDelError(null);
    startDel(async () => {
      const res = await deleteContractAction(contract.id, confirmDelete);
      if (res && !res.ok) setDelError(res.error);
    });
  };

  const st = contract.status as ContractStatus;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle">
        <Link href="/backoffice/contrats" className="hover:text-ink">
          ← Contrats
        </Link>
      </div>

      <header className="flex items-end justify-between gap-6 flex-wrap pb-6 border-b border-ink/15">
        <div>
          <AdminEyebrow className="mb-2">{contract.id}</AdminEyebrow>
          <h1 className="font-display uppercase tracking-display leading-[1.05] font-normal text-[clamp(1.9rem,3.4vw,2.6rem)] text-ink">
            Éditer le contrat
          </h1>
          <div className="flex items-center gap-2 mt-3">
            <Pill tone={STATUS_TONE[st]}>{STATUS_LABEL[st]}</Pill>
            {contract.artistName && <Pill tone="magenta">{contract.artistName}</Pill>}
          </div>
        </div>
      </header>

      <form action={submit} className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-6 items-start">
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-7">
          <AdminField name="title" label="Intitulé" defaultValue={contract.title} />
          <AdminField name="type" label="Type" defaultValue={contract.type} />
          <AdminField
            name="party"
            label="Partie / cocontractant"
            defaultValue={contract.party}
            hint="Texte libre. Si le contrat lie un artiste du roster, sélectionnez-le à droite."
          />
          <AdminTextarea
            name="notes"
            label="Notes (optionnel)"
            rows={5}
            defaultValue={contract.notes ?? ""}
            placeholder="Points d'attention, clauses à surveiller…"
          />
          <div className="mt-2 flex items-center gap-3">
            <AdminBtn kind="accent" type="submit" disabled={savePending}>
              {savePending ? "…" : "Enregistrer"}
            </AdminBtn>
            {status && (
              <span
                className={`font-serif text-[12px] ${
                  status.tone === "ok" ? "text-vert-foret-700" : "text-magenta"
                }`}
              >
                {status.message}
              </span>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4 sticky top-[88px]">
          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
            <AdminSelect
              name="status"
              label="Statut"
              defaultValue={contract.status}
              options={STATUS_OPTIONS}
            />
            <AdminSelect
              name="artistId"
              label="Artiste lié (optionnel)"
              defaultValue={contract.artistId ?? ""}
              options={[
                { value: "", label: "— Aucun (hors roster) —" },
                ...artistOptions.map((a) => ({ value: a.id, label: a.name })),
              ]}
            />
            <AdminField name="startDate" label="Début" type="date" defaultValue={contract.startDate} />
            <AdminField name="endDate" label="Fin" type="date" defaultValue={contract.endDate} />
            <AdminField name="amount" label="Montant" defaultValue={contract.amount} />
            <AdminField
              name="signedBy"
              label="Signataires"
              defaultValue={contract.signedBy.join(", ")}
              hint="Séparés par des virgules."
            />
            <AdminField
              label="Référence"
              defaultValue={contract.id}
              hint="Définitif (clé). Non modifiable."
            />
          </div>

          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
            <AdminEyebrow className="mb-3">Zone dangereuse</AdminEyebrow>
            <p className="italic text-[12px] text-ink-muted leading-[1.5]">
              Supprimer retire définitivement le contrat. Tapez « oui » pour confirmer.
            </p>
            <input
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder="oui"
              className="mt-3 w-full bg-paper border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta"
            />
            <div className="flex flex-col gap-2 mt-2">
              <AdminBtn kind="danger" onClick={doDelete} disabled={delPending}>
                {delPending ? "…" : "Supprimer le contrat"}
              </AdminBtn>
              {delError && <span className="font-serif text-[12px] text-magenta">{delError}</span>}
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
