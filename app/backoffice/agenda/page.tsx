"use client";

import {
  AdminBtn,
  AdminEyebrow,
  PageHeader,
  Pill,
} from "@/components/admin/AdminPrimitives";
import { ARTISTS } from "@/lib/data";

type Show = ReturnType<typeof listShows>[number];

function listShows() {
  return ARTISTS.flatMap((a) =>
    a.shows.map((s) => ({ ...s, artist: a.name, artistId: a.id })),
  ).sort((a, b) => a.date.localeCompare(b.date));
}

export default function AgendaPage() {
  const shows = listShows();

  // Group by month
  const byMonth = new Map<string, Show[]>();
  for (const s of shows) {
    const key = s.date.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(s);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        chapter="06"
        eyebrow={`Agenda — ${shows.length} dates`}
        title="Concerts & tournées"
        italic="Planifier, suivre, annoncer — le calendrier vivant du label, soir par soir."
        actions={
          <>
            <AdminBtn kind="secondary">Exporter .ics</AdminBtn>
            <AdminBtn kind="accent">+ Ajouter une date</AdminBtn>
          </>
        }
      />

      <div className="flex items-center gap-2 flex-wrap">
        {["Toutes", "À venir", "Complètes", "Passées"].map((l, i) => (
          <button
            key={l}
            type="button"
            className={`font-serif text-[11px] tracking-eyebrow uppercase font-bold px-3.5 py-2 rounded-full border cursor-pointer transition-colors ${
              i === 1
                ? "bg-bleu-nuit-700 border-bleu-nuit-700 text-beige-sable"
                : "bg-paper-soft border-ink/15 text-ink-muted hover:text-ink hover:border-ink/40"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {[...byMonth.entries()].map(([month, list]) => {
        const monthLabel = new Date(month + "-01").toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        });
        return (
          <section key={month} className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <AdminEyebrow className="shrink-0">{monthLabel}</AdminEyebrow>
              <span className="h-px flex-1 bg-ink/15" />
              <span className="text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                {list.length} date{list.length > 1 ? "s" : ""}
              </span>
            </div>
            <ul className="bg-paper-soft border border-ink/10 rounded-[2px] overflow-hidden">
              {list.map((s, i) => (
                <li
                  key={`${s.artistId}-${s.id}`}
                  className={`grid grid-cols-[100px_1fr_1fr_auto_auto] gap-4 items-center px-6 py-4 hover:bg-paper/60 ${
                    i > 0 ? "border-t border-ink/8" : ""
                  }`}
                >
                  <div className="font-display">
                    <div className="text-[28px] leading-none">
                      {s.date.slice(8)}
                    </div>
                    <div className="text-[10px] tracking-eyebrow uppercase text-ink-subtle mt-1">
                      {new Date(s.date).toLocaleDateString("fr-FR", {
                        weekday: "short",
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="font-display uppercase tracking-[0.04em] text-[15px]">
                      {s.artist}
                    </div>
                    <div className="italic text-[12px] text-ink-muted">
                      {s.venue} · {s.city}
                    </div>
                  </div>
                  <div className="italic text-[13px] text-ink-muted">
                    {s.ticketUrl || (s.free ? "Gratuit" : "Billetterie à venir")}
                  </div>
                  <Pill
                    tone={
                      s.free
                        ? "live"
                        : s.status === "Complet"
                        ? "mute"
                        : "magenta"
                    }
                  >
                    {s.status}
                  </Pill>
                  <button
                    type="button"
                    className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle hover:text-magenta cursor-pointer"
                  >
                    Éditer ⟶
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
