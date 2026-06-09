"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AdminBtn,
  AdminEyebrow,
  AdminField,
  AdminTextarea,
  PageHeader,
} from "@/components/admin/AdminPrimitives";
import { createArtistAction } from "@/app/backoffice/artistes/actions";

export default function NouvelArtisteClient() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    start(async () => {
      const res = await createArtistAction({
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        tagline: String(formData.get("tagline") ?? ""),
        genre: String(formData.get("genre") ?? ""),
        signedYear: String(formData.get("signedYear") ?? ""),
        bioShort: String(formData.get("bioShort") ?? ""),
      });
      // En cas de succès, createArtistAction redirige et ne renvoie rien.
      if (res && !res.ok) setError(res.error);
    });
  }

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

      <form action={onSubmit} className="bg-paper-soft border border-ink/10 rounded-[2px] p-7 max-w-[760px]">
        <AdminEyebrow className="mb-4">Identité</AdminEyebrow>
        <div className="grid grid-cols-2 gap-4">
          <AdminField name="name" label="Nom d'artiste" placeholder="Caëlya, Allicyone…" />
          <AdminField
            name="slug"
            label="Slug URL"
            placeholder="genere-automatiquement"
            hint="Laissez vide pour générer depuis le nom. Définitif une fois créé."
          />
        </div>
        <AdminField name="tagline" label="Accroche" placeholder="Folk mythologique…" />
        <div className="grid grid-cols-2 gap-4">
          <AdminField name="genre" label="Genre principal" placeholder="Folk · Pop onirique" />
          <AdminField name="signedYear" label="Année de signature" placeholder="2026" />
        </div>
        <AdminTextarea
          name="bioShort"
          label="Bio courte (≤ 280 caractères)"
          rows={3}
          placeholder="Deux phrases qui donnent envie d'en savoir plus."
        />

        {error && (
          <div className="mb-3 font-serif text-[12px] text-magenta">{error}</div>
        )}

        <div className="flex items-center gap-3 pt-4 mt-2 border-t border-ink/10">
          <AdminBtn kind="accent" type="submit" disabled={pending}>
            {pending ? "Création…" : "Créer la fiche"}
          </AdminBtn>
          <Link
            href="/backoffice/artistes"
            className="font-serif italic text-[13px] text-ink-muted hover:text-ink"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
