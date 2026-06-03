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

export default function NouvelArtistePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle">
        <Link href="/backoffice/artistes" className="hover:text-ink">
          ← Roster
        </Link>
      </div>

      <PageHeader
        eyebrow="Nouvelle signature"
        title="Créer une fiche artiste"
        italic="L'essentiel d'abord. Vous pourrez enrichir la fiche plus tard."
      />

      <form className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-6 items-start">
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-7">
          <AdminEyebrow className="mb-4">Identité</AdminEyebrow>
          <div className="grid grid-cols-2 gap-4">
            <AdminField label="Nom d'artiste" placeholder="Caëlya, Allicyone…" />
            <AdminField
              label="Slug URL"
              placeholder="genere-automatiquement"
              hint="Laissez vide pour générer depuis le nom."
            />
          </div>
          <AdminField
            label="Accroche"
            placeholder="Folk mythologique, écritures boisées…"
          />
          <div className="grid grid-cols-2 gap-4">
            <AdminField label="Genre principal" placeholder="Folk · Pop onirique" />
            <AdminField
              label="Année de signature"
              type="number"
              placeholder="2026"
            />
          </div>
          <AdminTextarea
            label="Bio courte (≤ 280 caractères)"
            rows={3}
            placeholder="Deux phrases qui donnent envie d'en savoir plus : une image, une tonalité, une promesse."
          />
          <AdminEyebrow className="mt-4 mb-3">Contact projet</AdminEyebrow>
          <div className="grid grid-cols-2 gap-4">
            <AdminField
              label="Personne référente"
              placeholder="Manager, artiste…"
            />
            <AdminField
              label="Courriel"
              type="email"
              placeholder="projet@exemple.fr"
            />
          </div>

          <div className="flex items-center gap-3 pt-4 mt-2 border-t border-ink/10">
            <AdminBtn kind="accent" type="submit">
              Créer la fiche
            </AdminBtn>
            <AdminBtn kind="secondary">Créer et éditer en détail</AdminBtn>
            <Link
              href="/backoffice/artistes"
              className="font-serif italic text-[13px] text-ink-muted hover:text-ink"
            >
              Annuler
            </Link>
          </div>
        </div>

        <aside className="flex flex-col gap-4 sticky top-[88px]">
          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
            <AdminEyebrow className="mb-3">Visuels</AdminEyebrow>
            <div className="flex flex-col gap-3">
              <div className="aspect-[4/3] border-2 border-dashed border-ink/25 rounded-[2px] flex flex-col items-center justify-center gap-1 text-ink-muted hover:border-magenta hover:text-magenta cursor-pointer">
                <div className="text-[22px]">+</div>
                <div className="text-[10px] tracking-eyebrow uppercase font-bold">
                  Portrait
                </div>
                <div className="italic text-[11px] text-ink-subtle">
                  1:1 recommandé
                </div>
              </div>
              <div className="aspect-[16/9] border-2 border-dashed border-ink/25 rounded-[2px] flex flex-col items-center justify-center gap-1 text-ink-muted hover:border-magenta hover:text-magenta cursor-pointer">
                <div className="text-[22px]">+</div>
                <div className="text-[10px] tracking-eyebrow uppercase font-bold">
                  Couverture
                </div>
                <div className="italic text-[11px] text-ink-subtle">
                  16:9 · 2400px min
                </div>
              </div>
            </div>
          </div>

          <AdminSelect
            label="Référent·e projet"
            options={[
              { value: "u1", label: "Margaux Villeneuve" },
              { value: "u2", label: "Jules Antonin" },
              { value: "u3", label: "Inès Rocher" },
            ]}
          />

          <div className="bg-bleu-nuit-700 text-beige-sable rounded-[2px] p-5 relative overflow-hidden">
            <div className="stars opacity-50" aria-hidden />
            <div className="relative z-10">
              <AdminEyebrow className="!text-magenta">
                Charte ARTémis
              </AdminEyebrow>
              <p className="italic text-[13px] leading-[1.55] mt-2 text-beige-sable/85">
                Chaque signature est une rencontre. Avant publication, vérifiez
                la charte graphique et l&apos;accord sur les conditions.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
