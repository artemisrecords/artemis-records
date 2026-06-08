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
import { DEMO_STATUS_LABEL, type Demo, type DemoStatus } from "@/lib/adminData";
import { formatDate } from "@/lib/data";
import { DecisionDialog } from "@/components/admin/DecisionDialog";
import type { Decision } from "@/lib/demoEmails";
import {
  markListenedAction,
  updateDemoMetaAction,
} from "./actions";

export type Account = { id: string; name: string };

const FILTER_OPTIONS: { k: DemoStatus | "tous"; label: string }[] = [
  { k: "tous", label: "Tous" },
  { k: "nouveau", label: "Nouveaux" },
  { k: "ecoute", label: "À écouter" },
  { k: "retenu", label: "Retenus" },
  { k: "refuse", label: "Refusés" },
];

export function DemosPageClient({
  demos,
  accounts,
}: {
  demos: Demo[];
  accounts: Account[];
}) {
  const [selectedFilters, setSelectedFilters] = useState<Set<DemoStatus>>(
    new Set(),
  );
  const [selectedId, setSelectedId] = useState<string>(demos[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [decisionFor, setDecisionFor] = useState<{
    demo: Demo;
    decision: Decision;
  } | null>(null);

  const filtered = useMemo(() => {
    return demos.filter((d) => {
      if (selectedFilters.size > 0 && !selectedFilters.has(d.status as DemoStatus))
        return false;
      if (query) {
        const q = query.toLowerCase();
        const fields = [d.artist, d.genre ?? "", d.city ?? ""];
        if (!fields.some((s) => s.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [demos, selectedFilters, query]);

  const selected = demos.find((d) => d.id === selectedId) ?? filtered[0];

  const counts = useMemo(() => {
    const c: Record<DemoStatus | "tous", number> = {
      tous: demos.length,
      nouveau: 0,
      ecoute: 0,
      retenu: 0,
      refuse: 0,
    };
    for (const d of demos) {
      if (d.status in c) c[d.status as DemoStatus]++;
    }
    return c;
  }, [demos]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        chapter="02"
        eyebrow={`Boîte à démos · ${demos.length} soumissions`}
        title="Démos reçues"
        italic="Trier, écouter, répondre. Chaque retour compte. Même un refus mérite une phrase choisie."
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
            placeholder="Rechercher : artiste, genre, ville…"
            className="bg-paper-soft border border-ink/15 rounded-full pl-10 pr-4 py-2 font-serif text-[13px] w-[320px] outline-none focus:border-magenta transition-colors placeholder:italic placeholder:text-ink-subtle"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle text-[13px]">
            ⌕
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6 items-start">
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
                  body="Aucune démo ne correspond à ces filtres. Essayez d'élargir la recherche ou attendez la prochaine soumission. Elles arrivent toujours."
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
                      active ? "bg-paper relative" : "hover:bg-paper/60"
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
                      {formatDate(d.receivedAt)}
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
                      {DEMO_STATUS_LABEL[d.status as DemoStatus]}
                    </Pill>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {selected && (
          <DemoDetail
            demo={selected}
            accounts={accounts}
            onDecide={(decision) =>
              setDecisionFor({ demo: selected, decision })
            }
          />
        )}
      </div>

      {decisionFor && (
        <DecisionDialog
          key={`${decisionFor.demo.id}-${decisionFor.decision}`}
          demoId={decisionFor.demo.id}
          artist={decisionFor.demo.artist}
          email={decisionFor.demo.email}
          decision={decisionFor.decision}
          onClose={() => setDecisionFor(null)}
        />
      )}
    </div>
  );
}

function DemoDetail({
  demo,
  accounts,
  onDecide,
}: {
  demo: Demo;
  accounts: Account[];
  onDecide: (decision: Decision) => void;
}) {
  const assignedName =
    accounts.find((a) => a.id === demo.assignedTo)?.name ?? "";

  return (
    <aside className="bg-paper-soft border border-ink/10 rounded-[2px] sticky top-[88px]">
      <header className="p-6 bg-bleu-nuit-700 text-beige-sable relative overflow-hidden rounded-t-[2px]">
        <div className="stars opacity-40" aria-hidden />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <AdminEyebrow className="!text-magenta">
              reçue le {formatDate(demo.receivedAt)}
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
              {DEMO_STATUS_LABEL[demo.status as DemoStatus]}
            </Pill>
          </div>
          <h2 className="font-display uppercase tracking-display text-[clamp(1.75rem,3vw,2.5rem)] mt-3 font-normal leading-[1.05]">
            {demo.artist}
          </h2>
          <div className="italic text-[14px] text-beige-sable/80 mt-1">
            {[demo.genre, demo.city, demo.duration].filter(Boolean).join(" · ")}
          </div>

          {/* Note ✦ cliquable */}
          <form action={updateDemoMetaAction} className="mt-3">
            <input type="hidden" name="id" value={demo.id} />
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="submit"
                  name="rating"
                  value={n}
                  aria-label={`Noter ${n} sur 5`}
                  className="text-magenta text-[16px] leading-none cursor-pointer hover:scale-110 transition-transform"
                >
                  <span className={demo.rating && n <= demo.rating ? "" : "opacity-35"}>
                    ✦
                  </span>
                </button>
              ))}
            </div>
          </form>
        </div>
      </header>

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
            <form action={updateDemoMetaAction}>
              <input type="hidden" name="id" value={demo.id} />
              <select
                name="assignedTo"
                defaultValue={demo.assignedTo ?? ""}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="w-full bg-paper border border-ink/15 px-2.5 py-1.5 font-serif text-[13px] rounded-[2px] outline-none focus:border-magenta"
              >
                <option value="">Personne</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </form>
            {assignedName && (
              <div className="italic text-[12px] text-ink-muted mt-1">
                Suivi par {assignedName}
              </div>
            )}
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

        {/* Étiquettes éditables : un champ texte (séparé par virgules) */}
        <form action={updateDemoMetaAction}>
          <input type="hidden" name="id" value={demo.id} />
          <AdminEyebrow className="mb-2">
            Étiquettes (séparées par des virgules)
          </AdminEyebrow>
          <div className="flex items-center gap-2">
            <input
              name="tags"
              defaultValue={demo.tags?.join(", ") ?? ""}
              placeholder="pop, voix, prod léchée…"
              className="flex-1 bg-paper border border-ink/15 px-3 py-1.5 font-serif text-[13px] rounded-[2px] outline-none focus:border-magenta"
            />
            <AdminBtn kind="secondary" type="submit">
              OK
            </AdminBtn>
          </div>
        </form>

        {/* Notes internes enregistrables */}
        <form action={updateDemoMetaAction}>
          <input type="hidden" name="id" value={demo.id} />
          <AdminEyebrow className="mb-2">Notes internes</AdminEyebrow>
          <textarea
            name="notes"
            rows={3}
            defaultValue={demo.notes ?? ""}
            placeholder="Vos impressions à chaud : ce qui accroche, ce qui tempère, ce qu'il faut creuser…"
            className="w-full bg-paper border border-ink/15 px-3.5 py-2.5 font-serif text-[14px] italic text-ink outline-none focus:border-magenta transition-colors rounded-[2px] resize-y leading-[1.55]"
          />
          <div className="mt-2 flex justify-end">
            <AdminBtn kind="secondary" type="submit">
              Enregistrer les notes
            </AdminBtn>
          </div>
        </form>

        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-ink/10">
          <AdminBtn kind="accent" onClick={() => onDecide("retenu")}>
            Retenir
          </AdminBtn>
          <MarkListenedButton id={demo.id} />
          <AdminBtn kind="danger" onClick={() => onDecide("refuse")}>
            Refuser avec tact
          </AdminBtn>
        </div>
      </div>
    </aside>
  );
}

function MarkListenedButton({ id }: { id: string }) {
  return (
    <form action={markListenedAction.bind(null, id)}>
      <AdminBtn kind="secondary" type="submit">
        Marquer écouté
      </AdminBtn>
    </form>
  );
}
