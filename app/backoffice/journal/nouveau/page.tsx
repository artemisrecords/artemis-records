"use client";

import Link from "next/link";
import {
  AdminBtn,
  AdminEyebrow,
  AdminField,
  AdminSelect,
  AdminTextarea,
  PageHeader,
} from "@/components/admin/AdminPrimitives";

export default function NouvelArticlePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle">
        <Link href="/backoffice/journal" className="hover:text-ink">
          ← Journal
        </Link>
      </div>

      <PageHeader
        eyebrow="Journal"
        title="Nouvelle entrée"
        italic="Un nouveau billet : annonce, portrait, coulisses."
        actions={
          <>
            <AdminBtn kind="secondary">Enregistrer comme brouillon</AdminBtn>
            <AdminBtn kind="accent">Publier maintenant</AdminBtn>
          </>
        }
      />

      <form className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-6 items-start">
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-7">
          <AdminField label="Titre" placeholder="Une accroche courte, comme un titre de chapitre." />
          <AdminField
            label="Chapô"
            placeholder="La première phrase. Elle doit tenir sur une ligne et donner envie."
          />
          <AdminTextarea
            label="Corps de l'article"
            rows={16}
            placeholder="Racontez sans fard. Markdown léger pris en charge."
          />
        </div>

        <aside className="flex flex-col gap-4 sticky top-[88px]">
          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
            <AdminEyebrow className="mb-3">Image à la une</AdminEyebrow>
            <div className="aspect-[16/10] border-2 border-dashed border-ink/25 rounded-[2px] flex flex-col items-center justify-center gap-1 text-ink-muted hover:border-magenta hover:text-magenta cursor-pointer">
              <div className="text-[22px]">+</div>
              <div className="text-[10px] tracking-eyebrow uppercase font-bold">
                Téléverser
              </div>
              <div className="italic text-[11px] text-ink-subtle">
                16:10 · 2000px min
              </div>
            </div>
          </div>

          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5 flex flex-col gap-0">
            <AdminSelect
              label="Catégorie"
              options={[
                { value: "Sortie", label: "Sortie" },
                { value: "Signature", label: "Signature" },
                { value: "Label", label: "Label" },
                { value: "Tournée", label: "Tournée" },
                { value: "Portrait", label: "Portrait" },
              ]}
            />
            <AdminField label="Date de publication" type="date" />
            <AdminField label="Slug (optionnel)" placeholder="auto-généré" />
          </div>

          <div className="bg-bleu-nuit-700 text-beige-sable rounded-[2px] p-5 relative overflow-hidden">
            <div className="stars opacity-50" aria-hidden />
            <div className="relative z-10">
              <AdminEyebrow className="!text-magenta">
                Avant de publier
              </AdminEyebrow>
              <ul className="mt-2 space-y-1.5 text-[12px] italic text-beige-sable/85 leading-[1.55]">
                <li>· Vérifier les citations et les noms propres.</li>
                <li>· Associer l&apos;article aux artistes concernés.</li>
                <li>· Ajouter une image à la une (16:10).</li>
              </ul>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
