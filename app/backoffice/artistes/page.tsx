"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AdminBtn,
  AdminEyebrow,
  PageHeader,
  Pill,
} from "@/components/admin/AdminPrimitives";
import { ARTISTS } from "@/lib/data";

export default function ArtistesPage() {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        chapter="04"
        eyebrow={`Roster — ${ARTISTS.length} artistes`}
        title="Artistes"
        italic="Fiches, biographies, discographies, concerts — piloter le roster comme une collection vivante."
        actions={
          <>
            <AdminBtn kind="secondary">Exporter le roster</AdminBtn>
            <Link href="/backoffice/artistes/nouveau">
              <AdminBtn kind="accent">+ Signer un artiste</AdminBtn>
            </Link>
          </>
        }
      />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Filtrer le roster par nom, genre, ville…"
              aria-label="Filtrer le roster"
              className="bg-paper-soft border border-ink/15 rounded-full pl-10 pr-4 py-2 font-serif text-[13px] w-[280px] outline-none focus:border-magenta transition-colors placeholder:italic placeholder:text-ink-subtle"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle text-[13px]">
              ⌕
            </span>
          </div>
          <select className="bg-paper-soft border border-ink/15 rounded-full px-4 py-2 font-serif text-[12px] text-ink outline-none focus:border-magenta cursor-pointer">
            <option>Tous les genres</option>
            <option>Folk</option>
            <option>Pop française</option>
            <option>Soul</option>
          </select>
        </div>
        <div className="flex items-center gap-1 bg-paper-soft border border-ink/15 rounded-full p-1">
          {([
            ["grid", "Vignettes"],
            ["list", "Liste"],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setView(k)}
              className={`font-serif text-[10px] tracking-eyebrow uppercase font-bold px-3.5 py-1.5 rounded-full cursor-pointer transition-colors ${
                view === k
                  ? "bg-bleu-nuit-700 text-beige-sable"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ARTISTS.map((a) => (
            <Link
              key={a.id}
              href={`/backoffice/artistes/${a.id}`}
              className="group bg-paper-soft border border-ink/10 rounded-[2px] overflow-hidden hover:border-ink/25 transition-colors cursor-pointer"
            >
              <div
                className="h-[200px] bg-cover bg-center grain relative"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(28,31,74,0.05), rgba(28,31,74,0.45)), url(${a.cover})`,
                }}
              >
                <div className="absolute top-3 right-3">
                  <Pill tone={a.published ? "live" : "draft"}>
                    {a.published ? "En ligne" : "Brouillon"}
                  </Pill>
                </div>
                <div className="absolute bottom-3 left-4 text-beige-sable">
                  <div className="font-display uppercase tracking-display text-[28px] leading-none">
                    {a.name}
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="italic text-[13px] text-ink-muted line-clamp-2">
                  {a.tagline}
                </div>
                <div className="flex items-center justify-between mt-4 gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {a.genres.slice(0, 2).map((g) => (
                      <span
                        key={g}
                        className="text-[10px] tracking-[0.12em] uppercase font-bold text-ink-subtle bg-ink/6 px-2 py-0.5 rounded-full"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] tracking-eyebrow uppercase font-bold text-magenta opacity-0 group-hover:opacity-100 transition-opacity">
                    Éditer ⟶
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-ink/10 grid grid-cols-3 gap-3 text-center">
                  <MiniStat label="Signé" value={a.signed} />
                  <MiniStat label="Sorties" value={`${a.discography.length}`} />
                  <MiniStat label="Concerts" value={`${a.shows.length}`} />
                </div>
              </div>
            </Link>
          ))}
          <Link
            href="/backoffice/artistes/nouveau"
            className="bg-paper border-2 border-dashed border-ink/25 rounded-[2px] min-h-[360px] flex flex-col items-center justify-center gap-3 text-center p-7 hover:border-magenta hover:bg-magenta/5 transition-colors cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full border border-ink/30 flex items-center justify-center text-[22px] text-ink-muted">
              +
            </div>
            <AdminEyebrow>Prochaine signature</AdminEyebrow>
            <div className="font-display uppercase tracking-display text-[20px] font-normal">
              Créer une fiche
            </div>
            <div className="italic text-[12px] text-ink-muted max-w-[220px]">
              Chaque signature est une rencontre. Commencez par l&apos;essentiel.
            </div>
          </Link>
        </div>
      ) : (
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] overflow-hidden">
          <div className="grid grid-cols-[60px_1.2fr_1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-ink/10 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
            <div></div>
            <div>Artiste</div>
            <div>Genre</div>
            <div>Signé</div>
            <div>Statut</div>
            <div></div>
          </div>
          <ul>
            {ARTISTS.map((a, i) => (
              <li
                key={a.id}
                className={`grid grid-cols-[60px_1.2fr_1fr_auto_auto_auto] gap-4 items-center px-6 py-4 ${
                  i > 0 ? "border-t border-ink/8" : ""
                } hover:bg-paper/60`}
              >
                <div
                  className="w-10 h-10 rounded-full bg-cover bg-center grain"
                  style={{ backgroundImage: `url(${a.portrait})` }}
                />
                <div>
                  <div className="font-display uppercase tracking-[0.04em] text-[15px]">
                    {a.name}
                  </div>
                  <div className="italic text-[12px] text-ink-muted">
                    {a.tagline}
                  </div>
                </div>
                <div className="text-[13px] text-ink-muted">{a.genre}</div>
                <div className="text-[13px]">{a.signed}</div>
                <Pill tone={a.published ? "live" : "draft"}>
                  {a.published ? "En ligne" : "Brouillon"}
                </Pill>
                <Link
                  href={`/backoffice/artistes/${a.id}`}
                  className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-magenta hover:opacity-80"
                >
                  Éditer ⟶
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-[18px] leading-none">{value}</div>
      <div className="text-[9px] tracking-eyebrow uppercase font-bold text-ink-subtle mt-1">
        {label}
      </div>
    </div>
  );
}
