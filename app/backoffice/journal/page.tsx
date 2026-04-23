"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AdminBtn,
  AdminEyebrow,
  PageHeader,
  Pill,
} from "@/components/admin/AdminPrimitives";
import { NEWS, formatDate } from "@/lib/data";

export default function JournalPage() {
  const [filter, setFilter] = useState<"tous" | "publies" | "brouillons">(
    "tous",
  );

  const filtered = NEWS.filter((n) => {
    if (filter === "publies") return n.published;
    if (filter === "brouillons") return !n.published;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        chapter="05"
        eyebrow={`Journal — ${NEWS.length} articles`}
        title="Actualités du label"
        italic="Sorties, signatures, coulisses, concerts — la voix du label, écrite de près."
        actions={
          <>
            <AdminBtn kind="secondary">Catégories</AdminBtn>
            <Link href="/backoffice/journal/nouveau">
              <AdminBtn kind="accent">+ Nouvelle entrée</AdminBtn>
            </Link>
          </>
        }
      />

      <div className="flex items-center gap-2 flex-wrap">
        {(
          [
            ["tous", "Tous"],
            ["publies", "En ligne"],
            ["brouillons", "Brouillons"],
          ] as const
        ).map(([k, l]) => {
          const active = filter === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`font-serif text-[11px] tracking-eyebrow uppercase font-bold px-3.5 py-2 rounded-full border cursor-pointer transition-colors ${
                active
                  ? "bg-bleu-nuit-700 border-bleu-nuit-700 text-beige-sable"
                  : "bg-paper-soft border-ink/15 text-ink-muted hover:text-ink hover:border-ink/40"
              }`}
            >
              {l}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((n) => (
          <article
            key={n.id}
            className="bg-paper-soft border border-ink/10 rounded-[2px] overflow-hidden flex flex-col"
          >
            <Link
              href={`/backoffice/journal/${n.id}`}
              className="block relative group"
            >
              <div
                className="aspect-[16/10] bg-cover bg-center grain"
                style={{ backgroundImage: `url(${n.image})` }}
              />
              <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                <Pill tone="magenta">{n.category}</Pill>
                <Pill tone={n.published ? "live" : "draft"}>
                  {n.published ? "En ligne" : "Brouillon"}
                </Pill>
              </div>
            </Link>
            <div className="p-5 flex flex-col flex-1">
              <div className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                {formatDate(n.date)}
              </div>
              <Link
                href={`/backoffice/journal/${n.id}`}
                className="block font-display uppercase tracking-[0.04em] text-[18px] leading-[1.2] mt-2 hover:text-magenta transition-colors"
              >
                {n.title}
              </Link>
              <p className="italic text-[13px] text-ink-muted leading-[1.55] mt-2 flex-1">
                {n.excerpt}
              </p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-ink/10">
                <span className="text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                  {n.id}
                </span>
                <Link
                  href={`/backoffice/journal/${n.id}`}
                  className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-magenta hover:opacity-80"
                >
                  Éditer ⟶
                </Link>
              </div>
            </div>
          </article>
        ))}
        <Link
          href="/backoffice/journal/nouveau"
          className="bg-paper border-2 border-dashed border-ink/25 rounded-[2px] min-h-[360px] flex flex-col items-center justify-center gap-3 text-center p-7 hover:border-magenta hover:bg-magenta/5 transition-colors cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full border border-ink/30 flex items-center justify-center text-[22px] text-ink-muted">
            +
          </div>
          <AdminEyebrow>Prochain article</AdminEyebrow>
          <div className="font-display uppercase tracking-display text-[20px] font-normal">
            Écrire une entrée
          </div>
          <div className="italic text-[12px] text-ink-muted max-w-[220px]">
            Sortie, signature, portrait, journal de tournée…
          </div>
        </Link>
      </div>
    </div>
  );
}
