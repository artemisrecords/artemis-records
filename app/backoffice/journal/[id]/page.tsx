"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminBtn,
  AdminEyebrow,
  AdminField,
  AdminSelect,
  AdminTextarea,
  Pill,
} from "@/components/admin/AdminPrimitives";
import { NEWS, findNews, formatDate } from "@/lib/data";

export default function JournalEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const news = findNews(id);
  if (!news) notFound();

  const [published, setPublished] = useState(news.published);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle">
        <Link href="/backoffice/journal" className="hover:text-ink">
          ← Journal
        </Link>
      </div>

      <header className="flex items-end justify-between gap-6 flex-wrap pb-6 border-b border-ink/15">
        <div>
          <AdminEyebrow className="mb-2">
            {news.id} · mis à jour le {formatDate(news.date)}
          </AdminEyebrow>
          <h1 className="font-display uppercase tracking-display leading-[1.05] font-normal text-[clamp(1.9rem,3.4vw,2.6rem)] text-ink">
            Éditer l&apos;article
          </h1>
          <div className="flex items-center gap-2 mt-3">
            <Pill tone="magenta">{news.category}</Pill>
            <Pill tone={published ? "live" : "draft"}>
              {published ? "En ligne" : "Brouillon"}
            </Pill>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span
              className={`relative w-10 h-[22px] rounded-full transition-colors ${
                published ? "bg-vert-foret-700" : "bg-ink/25"
              }`}
            >
              <span
                className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-beige-sable transition-all ${
                  published ? "left-[20px]" : "left-0.5"
                }`}
              />
            </span>
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="sr-only"
            />
            <span className="text-[11px] tracking-eyebrow uppercase font-bold">
              {published ? "Publié" : "Masqué"}
            </span>
          </label>
          <AdminBtn kind="secondary">Aperçu</AdminBtn>
          <AdminBtn kind="accent">Enregistrer</AdminBtn>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-6 items-start">
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-7">
          <AdminField label="Titre" defaultValue={news.title} />
          <AdminField label="Chapô (excerpt)" defaultValue={news.excerpt} />
          <AdminTextarea
            label="Corps de l'article"
            rows={14}
            defaultValue={news.body}
            placeholder="Rédigez le corps de votre article. Markdown léger pris en charge."
          />
          <div className="italic text-[12px] text-ink-subtle">
            Markdown pris en charge : #, ##, *italique*, **gras**, liens
            [texte](url), images ![alt](url).
          </div>
        </div>

        <aside className="flex flex-col gap-4 sticky top-[88px]">
          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
            <AdminEyebrow className="mb-3">Image à la une</AdminEyebrow>
            <div
              className="aspect-[16/10] bg-cover bg-center rounded-[2px] grain"
              style={{ backgroundImage: `url(${news.image})` }}
            />
            <div className="mt-3 flex gap-2">
              <AdminBtn kind="secondary" className="flex-1">
                Changer l&apos;image
              </AdminBtn>
            </div>
          </div>

          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
            <AdminSelect
              label="Catégorie"
              defaultValue={news.category}
              options={[
                { value: "Sortie", label: "Sortie" },
                { value: "Signature", label: "Signature" },
                { value: "Label", label: "Label" },
                { value: "Tournée", label: "Tournée" },
                { value: "Portrait", label: "Portrait" },
              ]}
            />
            <AdminField
              label="Date de publication"
              type="date"
              defaultValue={news.date}
            />
            <AdminField label="URL (slug)" defaultValue={news.id} />
          </div>

          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
            <AdminEyebrow className="mb-3">Liens artistes</AdminEyebrow>
            <p className="italic text-[12px] text-ink-muted">
              Associez cet article à un ou plusieurs artistes du roster.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <Pill tone="info">Allicyone ×</Pill>
              <button
                type="button"
                className="text-[11px] tracking-[0.12em] uppercase font-bold text-magenta border border-magenta/40 px-2.5 py-1 rounded-full hover:bg-magenta/10"
              >
                + Associer
              </button>
            </div>
          </div>

          <AdminBtn kind="danger">Supprimer l&apos;article</AdminBtn>
        </aside>
      </div>

      {/* Versions */}
      <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-6">
        <AdminEyebrow className="mb-3">Historique</AdminEyebrow>
        <ul className="divide-y divide-ink/10">
          {[
            {
              who: "Margaux",
              when: "il y a 2 jours",
              what: "Édition du chapô",
            },
            { who: "Inès", when: "la semaine dernière", what: "Création" },
          ].map((h, i) => (
            <li
              key={i}
              className="grid grid-cols-[auto_1fr_auto] gap-3 items-center py-3"
            >
              <span className="text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                {h.when}
              </span>
              <span className="italic text-[13px] text-ink">
                {h.who} — {h.what}
              </span>
              <button
                type="button"
                className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-ink-muted hover:text-magenta"
              >
                Restaurer
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Peek of the full list so navigation feels connected */}
      <div className="bg-paper border border-ink/10 rounded-[2px] p-5">
        <div className="flex items-center justify-between mb-3">
          <AdminEyebrow>Autres entrées</AdminEyebrow>
          <Link
            href="/backoffice/journal"
            className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-magenta hover:opacity-80"
          >
            Tout voir ⟶
          </Link>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {NEWS.filter((n) => n.id !== news.id)
            .slice(0, 3)
            .map((n) => (
              <li key={n.id}>
                <Link
                  href={`/backoffice/journal/${n.id}`}
                  className="block border border-ink/10 bg-paper-soft rounded-[2px] p-3 hover:border-ink/25"
                >
                  <div className="text-[10px] tracking-eyebrow uppercase font-bold text-magenta">
                    {n.category}
                  </div>
                  <div className="font-display uppercase tracking-[0.04em] text-[14px] mt-1 line-clamp-2">
                    {n.title}
                  </div>
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
