"use client";

import { useMemo, useState } from "react";
import {
  AdminBtn,
  AdminEyebrow,
  EmptyState,
  PageHeader,
  Pill,
} from "@/components/admin/AdminPrimitives";
import { MultiPillFilter } from "@/components/admin/MultiPillFilter";
import {
  DEMOS,
  DEMO_STATUS_LABEL,
  type Demo,
  type DemoStatus,
} from "@/lib/adminData";

const FILTER_OPTIONS: { k: DemoStatus | "tous"; label: string }[] = [
  { k: "tous", label: "Tous" },
  { k: "nouveau", label: "Nouveaux" },
  { k: "ecoute", label: "À écouter" },
  { k: "retenu", label: "Retenus" },
  { k: "refuse", label: "Refusés" },
];

export default function DemosPage() {
  const [selectedFilters, setSelectedFilters] = useState<Set<DemoStatus>>(
    new Set()
  );
  const [selectedId, setSelectedId] = useState<string>(DEMOS[0].id);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return DEMOS.filter((d) => {
      if (selectedFilters.size > 0 && !selectedFilters.has(d.status))
        return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !d.artist.toLowerCase().includes(q) &&
          !d.genre.toLowerCase().includes(q) &&
          !d.city.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [selectedFilters, query]);

  const selected = DEMOS.find((d) => d.id === selectedId) ?? filtered[0];

  const counts = useMemo(() => {
    const c: Record<DemoStatus | "tous", number> = {
      tous: DEMOS.length,
      nouveau: 0,
      ecoute: 0,
      retenu: 0,
      refuse: 0,
    };
    for (const d of DEMOS) c[d.status]++;
    return c;
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        chapter="02"
        eyebrow="Boîte à démos · 7 soumissions"
        title="Démos reçues"
        italic="Trier, écouter, répondre. Chaque retour compte — même un refus mérite une phrase choisie."
        actions={
          <>
            <AdminBtn kind="secondary">Exporter CSV</AdminBtn>
            <AdminBtn kind="accent">+ Ajouter manuellement</AdminBtn>
          </>
        }
      />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <MultiPillFilter
          all="tous"
          options={FILTER_OPTIONS.map((f) => ({ ...f, count: counts[f.k] }))}
          selected={selectedFilters}
          onChange={setSelectedFilters}
        />

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher — artiste, genre, ville…"
            className="bg-paper-soft border border-ink/15 rounded-full pl-10 pr-4 py-2 font-serif text-[13px] w-[320px] outline-none focus:border-magenta transition-colors placeholder:italic placeholder:text-ink-subtle"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle text-[13px]">
            ⌕
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6 items-start">
        {/* List */}
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-3 border-b border-ink/10 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
            <div>Projet</div>
            <div>Reçue</div>
            <div>Statut</div>
          </div>
          <ul>
            {filtered.length === 0 && (
              <li className="p-6">
                <EmptyState
                  title="Silence radio"
                  body="Aucune démo ne correspond à ces filtres. Essayez d'élargir la recherche ou attendez la prochaine soumission — elles arrivent toujours."
                  action={
                    <AdminBtn
                      kind="secondary"
                      onClick={() => {
                        setSelectedFilters(new Set());
                        setQuery("");
                      }}
                    >
                      Réinitialiser les filtres
                    </AdminBtn>
                  }
                />
              </li>
            )}
            {filtered.map((d) => {
              const active = selected?.id === d.id;
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(d.id)}
                    className={`w-full grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-4 items-center cursor-pointer border-t border-ink/8 transition-colors text-left ${
                      active
                        ? "bg-paper relative"
                        : "hover:bg-paper/60"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-magenta" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <div className="font-display uppercase tracking-[0.06em] text-[16px] truncate">
                          {d.artist}
                        </div>
                        {d.rating && (
                          <span
                            className="text-magenta text-[12px] tracking-[0.2em]"
                            aria-label={`${d.rating} étoiles`}
                          >
                            {"✦".repeat(d.rating)}
                          </span>
                        )}
                      </div>
                      <div className="italic text-[12px] text-ink-muted truncate mt-0.5">
                        {d.genre} · {d.city} · {d.duration}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {d.tags?.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] tracking-[0.12em] uppercase font-bold text-ink-subtle bg-ink/6 px-2 py-0.5 rounded-full"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="italic text-[12px] text-ink-muted whitespace-nowrap">
                      {d.received.slice(5)}
                    </div>
                    <Pill
                      tone={
                        d.status === "nouveau"
                          ? "magenta"
                          : d.status === "retenu"
                          ? "live"
                          : d.status === "refuse"
                          ? "mute"
                          : "info"
                      }
                    >
                      {DEMO_STATUS_LABEL[d.status]}
                    </Pill>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Detail */}
        {selected && <DemoDetail demo={selected} />}
      </div>
    </div>
  );
}

function DemoDetail({ demo }: { demo: Demo }) {
  return (
    <aside className="bg-paper-soft border border-ink/10 rounded-[2px] sticky top-[88px]">
      <header className="p-6 bg-bleu-nuit-700 text-beige-sable relative overflow-hidden rounded-t-[2px]">
        <div className="stars opacity-40" aria-hidden />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <AdminEyebrow className="!text-magenta">
              {demo.id} · reçue le {demo.received}
            </AdminEyebrow>
            <Pill
              tone={
                demo.status === "nouveau"
                  ? "magenta"
                  : demo.status === "retenu"
                  ? "live"
                  : demo.status === "refuse"
                  ? "mute"
                  : "info"
              }
            >
              {DEMO_STATUS_LABEL[demo.status]}
            </Pill>
          </div>
          <h2 className="font-display uppercase tracking-display text-[clamp(1.75rem,3vw,2.5rem)] mt-3 font-normal leading-[1.05]">
            {demo.artist}
          </h2>
          <div className="italic text-[14px] text-beige-sable/80 mt-1">
            {demo.genre} · {demo.city} · {demo.duration}
          </div>
          {demo.rating && (
            <div className="text-magenta text-[14px] tracking-[0.25em] mt-3">
              {"✦".repeat(demo.rating)}
              <span className="opacity-35">{"✦".repeat(5 - demo.rating)}</span>
            </div>
          )}
        </div>
      </header>

      {/* Fake audio player */}
      <div className="px-6 py-4 border-b border-ink/10 bg-paper">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="w-11 h-11 rounded-full bg-magenta text-white flex items-center justify-center text-[14px] cursor-pointer hover:opacity-90"
            aria-label="Lire"
          >
            ▶
          </button>
          <div className="flex-1">
            <div className="text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle">
              Lecture · piste 1 / {demo.links.length}
            </div>
            <div className="relative h-[6px] bg-ink/10 rounded-full mt-2 overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-[34%] bg-bleu-nuit-700" />
            </div>
            <div className="flex justify-between mt-1 text-[11px] text-ink-subtle font-serif italic">
              <span>1:17</span>
              <span>3:42</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-5">
        <div>
          <AdminEyebrow className="mb-2">Pitch</AdminEyebrow>
          <p className="font-serif text-[14px] leading-[1.65] text-ink">
            {demo.pitch}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <AdminEyebrow className="mb-1">Contact</AdminEyebrow>
            <div className="font-serif text-[14px] text-ink">{demo.contact}</div>
            <a
              href={`mailto:${demo.email}`}
              className="italic text-[13px] text-magenta hover:underline break-all"
            >
              {demo.email}
            </a>
          </div>
          <div>
            <AdminEyebrow className="mb-1">Assigné à</AdminEyebrow>
            <div className="font-serif text-[14px] text-ink">
              {demo.assignedTo || (
                <span className="italic text-ink-subtle">
                  Personne — assigner
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          <AdminEyebrow className="mb-2">Liens</AdminEyebrow>
          <ul className="flex flex-col gap-1.5">
            {demo.links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="inline-flex items-center gap-2 font-serif italic text-[13px] text-ink hover:text-magenta transition-colors"
                >
                  <span className="text-ink-subtle">→</span>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {demo.tags && demo.tags.length > 0 && (
          <div>
            <AdminEyebrow className="mb-2">Étiquettes</AdminEyebrow>
            <div className="flex flex-wrap gap-1.5">
              {demo.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] tracking-[0.12em] uppercase font-bold text-ink-subtle bg-ink/6 px-2 py-0.5 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <AdminEyebrow className="mb-2">Notes internes</AdminEyebrow>
          <textarea
            rows={3}
            placeholder="Vos impressions à chaud — ce qui accroche, ce qui tempère, ce qu'il faut creuser…"
            className="w-full bg-paper border border-ink/15 px-3.5 py-2.5 font-serif text-[14px] italic text-ink outline-none focus:border-magenta transition-colors rounded-[2px] resize-y leading-[1.55]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-ink/10">
          <AdminBtn kind="accent">Retenir</AdminBtn>
          <AdminBtn kind="secondary">Marquer écouté</AdminBtn>
          <AdminBtn kind="danger">Refuser avec tact</AdminBtn>
        </div>
      </div>
    </aside>
  );
}
