"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AdminBtn,
  AdminEyebrow,
  AdminField,
  AdminSelect,
  AdminTextarea,
  PageHeader,
} from "@/components/admin/AdminPrimitives";
import { createNewsAction } from "@/app/backoffice/journal/actions";

export default function NouvelArticleClient() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    start(async () => {
      const res = await createNewsAction({
        title: String(formData.get("title") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        category: String(formData.get("category") ?? ""),
        date: String(formData.get("date") ?? ""),
      });
      // En cas de succès, createNewsAction redirige et ne renvoie rien.
      if (res && !res.ok) setError(res.error);
    });
  }

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
        italic="Créez l'entrée, puis enrichissez-la (corps, image) dans l'éditeur."
      />

      <form action={onSubmit} className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-6 items-start">
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-7">
          <AdminField
            name="title"
            label="Titre"
            placeholder="Une accroche courte, comme un titre de chapitre."
          />
          <AdminField
            name="slug"
            label="Slug (optionnel)"
            placeholder="auto-généré depuis le titre"
            hint="Définitif une fois créé."
          />
          {error && (
            <div className="mb-3 font-serif text-[12px] text-magenta">{error}</div>
          )}
          <div className="flex items-center gap-3 pt-2">
            <AdminBtn kind="accent" type="submit" disabled={pending}>
              {pending ? "Création…" : "Créer l'entrée"}
            </AdminBtn>
            <Link
              href="/backoffice/journal"
              className="font-serif italic text-[13px] text-ink-muted hover:text-ink"
            >
              Annuler
            </Link>
          </div>
        </div>

        <aside className="flex flex-col gap-4 sticky top-[88px]">
          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5 flex flex-col gap-0">
            <AdminSelect
              name="category"
              label="Catégorie"
              options={[
                { value: "Sortie", label: "Sortie" },
                { value: "Signature", label: "Signature" },
                { value: "Label", label: "Label" },
                { value: "Tournée", label: "Tournée" },
                { value: "Portrait", label: "Portrait" },
              ]}
            />
            <AdminField name="date" label="Date de publication" type="date" />
          </div>
        </aside>
      </form>
    </div>
  );
}
