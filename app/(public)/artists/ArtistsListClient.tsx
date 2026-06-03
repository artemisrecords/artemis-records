"use client";

import { useMemo, useState } from "react";
import type { Artist } from "@/lib/data";
import { ChapterTitle } from "@/components/Primitives";
import { ArtistCard } from "@/components/ArtistCard";

export function ArtistsListClient({ artists }: { artists: Artist[] }) {
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("Tous");

  const genres = useMemo(
    () => ["Tous", ...new Set(artists.flatMap((a) => a.genres || []))],
    [artists],
  );

  const filtered = artists.filter((a) => {
    if (genre !== "Tous" && !(a.genres || []).includes(genre)) return false;
    if (q && !(a.name + " " + a.tagline).toLowerCase().includes(q.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div>
      <section className="px-[clamp(24px,4vw,56px)] pt-[clamp(56px,8vw,96px)] pb-[clamp(32px,4vw,48px)]">
        <ChapterTitle
          eyebrow="Roster · 2026"
          title="ARTISTES"
          italic="Celles et ceux que nous accompagnons"
        />
        <div className="h-9" />
        <div className="flex items-center flex-wrap gap-4 border-t border-b border-ink/15 py-4.5">
          <div className="text-[10px] tracking-eyebrow uppercase text-ink-subtle font-bold">
            Filtrer
          </div>
          {genres.map((g) => {
            const active = genre === g;
            return (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`text-[11px] tracking-[0.18em] uppercase font-bold px-3.5 py-1.5 rounded-full border border-ink/30 cursor-pointer transition-colors ${
                  active
                    ? "bg-bleu-nuit-700 text-beige-sable border-bleu-nuit-700"
                    : "bg-transparent text-ink hover:border-ink/50"
                }`}
              >
                {g}
              </button>
            );
          })}
          <div className="flex-1" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un·e artiste…"
            className="bg-transparent border-0 border-b border-ink/30 font-serif italic text-[14px] px-1 py-2 outline-none min-w-[220px] focus:border-magenta"
          />
        </div>
      </section>

      <section className="px-[clamp(24px,4vw,56px)] pb-[clamp(72px,9vw,110px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {filtered.map((a) => (
            <ArtistCard key={a.id} artist={a} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="py-20 text-center italic text-ink-muted">
            Aucun·e artiste ne correspond à cette recherche.
          </div>
        )}
      </section>
    </div>
  );
}
