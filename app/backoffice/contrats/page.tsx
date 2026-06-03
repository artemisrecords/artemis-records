"use client";

import { useMemo, useState } from "react";
import {
  AdminBtn,
  AdminEyebrow,
  KPI,
  PageFooter,
  PageHeader,
  Pill,
  RuledDivider,
} from "@/components/admin/AdminPrimitives";
import { MultiPillFilter } from "@/components/admin/MultiPillFilter";

type ContractStatus = "en_cours" | "a_signer" | "echu" | "archive";
type Contract = {
  id: string;
  title: string;
  party: string;
  type: string;
  start: string;
  end: string;
  amount: string;
  status: ContractStatus;
  notes?: string;
  signedBy?: string[];
};

const CONTRACTS: Contract[] = [
  {
    id: "ct-2026-004",
    title: "Contrat d'artiste · Allicyone",
    party: "Allicyone",
    type: "Contrat d'artiste · 3 ans",
    start: "2024-03-01",
    end: "2027-02-28",
    amount: "-",
    status: "en_cours",
    signedBy: ["Allicyone", "M. Villeneuve"],
  },
  {
    id: "ct-2026-003",
    title: "Contrat d'artiste · Caëlya",
    party: "Caëlya",
    type: "Contrat d'artiste · 2 ans",
    start: "2025-09-15",
    end: "2027-09-14",
    amount: "-",
    status: "en_cours",
    signedBy: ["Caëlya", "M. Villeneuve"],
  },
  {
    id: "ct-2026-005",
    title: "Synchro · Arte documentaire 'Rivières'",
    party: "Arte France",
    type: "Synchronisation · usage docu",
    start: "2026-04-18",
    end: "2026-12-31",
    amount: "3 500 €",
    status: "a_signer",
    notes: "En attente du retour d'Arte sur le périmètre diffusion non-linéaire.",
  },
  {
    id: "ct-2026-002",
    title: "Booking · Rock School Barbey",
    party: "Rock School Barbey, Bordeaux",
    type: "Engagement scène · 28.05.2026",
    start: "2026-03-10",
    end: "2026-05-28",
    amount: "1 200 € net",
    status: "en_cours",
    signedBy: ["J. Antonin"],
  },
  {
    id: "ct-2025-018",
    title: "Distribution numérique · 2025",
    party: "Believe Digital",
    type: "Distribution · reconduction tacite",
    start: "2024-01-01",
    end: "2025-12-31",
    amount: "%",
    status: "echu",
    notes: "À renégocier avant fin novembre si prolongation souhaitée.",
  },
  {
    id: "ct-2025-012",
    title: "Licence d'édition · Les Ruisseaux",
    party: "Caëlya / Éditions Nord",
    type: "Licence d'édition musicale",
    start: "2025-10-12",
    end: "2028-10-11",
    amount: "50/50",
    status: "archive",
  },
];

const STATUS_LABEL: Record<ContractStatus, string> = {
  en_cours: "En vigueur",
  a_signer: "À signer",
  echu: "Arrive à échéance",
  archive: "Archivé",
};

export default function ContratsPage() {
  const [selectedFilters, setSelectedFilters] = useState<Set<ContractStatus>>(
    new Set()
  );

  const filtered = useMemo(() => {
    if (selectedFilters.size === 0) return CONTRACTS;
    return CONTRACTS.filter((c) => selectedFilters.has(c.status));
  }, [selectedFilters]);

  const counts = useMemo(() => {
    const c: Record<ContractStatus | "tous", number> = {
      tous: CONTRACTS.length,
      en_cours: 0,
      a_signer: 0,
      echu: 0,
      archive: 0,
    };
    for (const x of CONTRACTS) c[x.status]++;
    return c;
  }, []);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        chapter="09"
        eyebrow="Juridique & production"
        title="Contrats"
        italic="Artistes, synchros, bookings, distribution. La paperasse qui fait tenir les promesses."
        actions={
          <>
            <AdminBtn kind="secondary">Modèles de contrat</AdminBtn>
            <AdminBtn kind="accent">+ Nouveau contrat</AdminBtn>
          </>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPI label="Contrats actifs" value={counts.en_cours} hint="tout roster confondu" />
        <KPI
          label="À signer"
          value={counts.a_signer}
          delta={counts.a_signer > 0 ? "action requise" : undefined}
        />
        <KPI label="Échéances ≤ 6 mois" value={counts.echu} hint="à renégocier" />
        <KPI label="Archivés" value={counts.archive} hint="historique complet" />
      </section>

      <div className="flex items-center gap-2 flex-wrap">
        {(
          [
            ["tous", `Tous (${counts.tous})`],
            ["en_cours", "En vigueur"],
            ["a_signer", "À signer"],
            ["echu", "Échéance"],
            ["archive", "Archivés"],
          ] as const
        ).map(([k, l]) => {
          const active =
            k === "tous"
              ? selectedFilters.size === 0
              : selectedFilters.has(k as ContractStatus);
          return (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (k === "tous") {
                  setSelectedFilters(new Set());
                } else {
                  setSelectedFilters(new Set([k as ContractStatus]));
                }
              }}
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

      <div className="bg-paper-soft border border-ink/10 rounded-[2px] overflow-hidden">
        <div className="grid grid-cols-[auto_1.4fr_1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-ink/10 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
          <div>Réf</div>
          <div>Contrat</div>
          <div>Partie</div>
          <div>Période</div>
          <div>Montant</div>
          <div>Statut</div>
        </div>
        <ul>
          {filtered.map((c, i) => (
            <li
              key={c.id}
              className={`grid grid-cols-[auto_1.4fr_1fr_auto_auto_auto] gap-4 items-center px-6 py-4 ${
                i > 0 ? "border-t border-ink/8" : ""
              } hover:bg-paper/60`}
            >
              <span className="font-display text-[12px] text-ink-subtle tracking-[0.04em]">
                {c.id}
              </span>
              <div className="min-w-0">
                <div className="font-display uppercase tracking-[0.04em] text-[14px] truncate">
                  {c.title}
                </div>
                <div className="italic text-[12px] text-ink-muted truncate">
                  {c.type}
                </div>
              </div>
              <span className="text-[13px] text-ink truncate">{c.party}</span>
              <div className="text-[12px] text-ink-muted whitespace-nowrap">
                <div>{c.start.slice(0, 7)}</div>
                <div className="italic text-[11px]">→ {c.end.slice(0, 7)}</div>
              </div>
              <span className="text-[13px] font-serif whitespace-nowrap">
                {c.amount}
              </span>
              <Pill
                tone={
                  c.status === "en_cours"
                    ? "live"
                    : c.status === "a_signer"
                    ? "magenta"
                    : c.status === "echu"
                    ? "warn"
                    : "mute"
                }
              >
                {STATUS_LABEL[c.status]}
              </Pill>
            </li>
          ))}
        </ul>
      </div>

      <RuledDivider label="À surveiller" />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-6">
          <AdminEyebrow className="mb-3">Rappels à venir</AdminEyebrow>
          <ul className="divide-y divide-ink/10">
            {[
              {
                d: "15 mai 2026",
                l: "Relance Arte sur synchro 'Rivières'",
              },
              {
                d: "30 juin 2026",
                l: "Revue annuelle contrat Allicyone",
              },
              {
                d: "30 novembre 2026",
                l: "Décision reconduction Believe Digital",
              },
            ].map((r, i) => (
              <li key={i} className="grid grid-cols-[auto_1fr_auto] gap-3 py-3 items-center">
                <span className="text-[10px] tracking-eyebrow uppercase font-bold text-magenta">
                  {r.d}
                </span>
                <span className="italic text-[13px] text-ink">{r.l}</span>
                <button
                  type="button"
                  className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle hover:text-magenta cursor-pointer"
                >
                  Ouvrir
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-bleu-nuit-700 text-beige-sable rounded-[2px] p-6 relative overflow-hidden">
          <div className="stars opacity-40" aria-hidden />
          <div className="relative z-10">
            <AdminEyebrow className="!text-magenta mb-3">
              Charte contractuelle
            </AdminEyebrow>
            <p className="italic text-[14px] leading-[1.6] text-beige-sable/85">
              Chez ARTémis, nous privilégions les contrats lisibles, les
              durées courtes et les clauses de sortie négociables. Aucun
              contrat ne quitte le label sans relecture à deux voix.
            </p>
            <div className="mt-4">
              <AdminBtn kind="accent">Lire la charte</AdminBtn>
            </div>
          </div>
        </div>
      </section>

      <PageFooter page="09 / 10" chapter="Contrats" />
    </div>
  );
}
