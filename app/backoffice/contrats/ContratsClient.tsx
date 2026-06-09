"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AdminEyebrow,
  KPI,
  PageFooter,
  PageHeader,
  Pill,
  RuledDivider,
} from "@/components/admin/AdminPrimitives";
import type { ContractListItem } from "@/lib/db/contract-queries";
import type { ContractStatus } from "@/lib/validation/contract";

// Même rendu qu'un <AdminBtn kind="accent">, mais en <Link> (pas de <button> dans <a>).
const ACCENT_LINK =
  "font-serif text-[11px] tracking-[0.18em] uppercase font-bold inline-flex items-center gap-2 rounded-[2px] cursor-pointer transition-colors px-4 py-2.5 bg-magenta text-white hover:opacity-90";

const STATUS_LABEL: Record<ContractStatus, string> = {
  en_cours: "En vigueur",
  a_signer: "À signer",
  echu: "Arrive à échéance",
  archive: "Archivé",
};

const STATUS_TONE: Record<ContractStatus, "live" | "magenta" | "warn" | "mute"> = {
  en_cours: "live",
  a_signer: "magenta",
  echu: "warn",
  archive: "mute",
};

const FR_DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
function frDate(iso: string): string {
  // iso = AAAA-MM-JJ ; on évite tout décalage de fuseau.
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return FR_DATE.format(new Date(Date.UTC(y, m - 1, d)));
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function ContratsClient({ contracts }: { contracts: ContractListItem[] }) {
  const [selected, setSelected] = useState<ContractStatus | null>(null);

  const today = todayIso();
  const in6Months = isoInDays(180);

  const filtered = useMemo(
    () => (selected === null ? contracts : contracts.filter((c) => c.status === selected)),
    [contracts, selected],
  );

  const counts = useMemo(() => {
    const c = { tous: contracts.length, en_cours: 0, a_signer: 0, echu: 0, archive: 0 };
    for (const x of contracts) c[x.status as ContractStatus]++;
    return c;
  }, [contracts]);

  // Échéances ≤ 6 mois : contrats non archivés dont la fin tombe dans la fenêtre.
  const soon = useMemo(
    () =>
      contracts
        .filter((c) => c.status !== "archive" && c.endDate >= today && c.endDate <= in6Months)
        .sort((a, b) => a.endDate.localeCompare(b.endDate)),
    [contracts, today, in6Months],
  );

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        chapter="09"
        eyebrow="Juridique & production"
        title="Contrats"
        italic="Artistes, synchros, bookings, distribution. La paperasse qui fait tenir les promesses."
        actions={
          <Link href="/backoffice/contrats/nouveau" className={ACCENT_LINK}>
            + Nouveau contrat
          </Link>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPI label="Contrats en vigueur" value={counts.en_cours} hint="tout roster confondu" />
        <KPI
          label="À signer"
          value={counts.a_signer}
          delta={counts.a_signer > 0 ? "action requise" : undefined}
        />
        <KPI label="Échéances ≤ 6 mois" value={soon.length} hint="à renégocier" />
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
          const active = k === "tous" ? selected === null : selected === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setSelected(k === "tous" ? null : (k as ContractStatus))}
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
        {filtered.length === 0 ? (
          <p className="italic text-[13px] text-ink-muted px-6 py-10 text-center">
            Aucun contrat pour ce filtre.
          </p>
        ) : (
          <ul>
            {filtered.map((c, i) => (
              <li key={c.id} className={i > 0 ? "border-t border-ink/8" : ""}>
                <Link
                  href={`/backoffice/contrats/${c.id}`}
                  className="grid grid-cols-[auto_1.4fr_1fr_auto_auto_auto] gap-4 items-center px-6 py-4 hover:bg-paper/60 transition-colors"
                >
                  <span className="font-display text-[12px] text-ink-subtle tracking-[0.04em]">
                    {c.id}
                  </span>
                  <div className="min-w-0">
                    <div className="font-display uppercase tracking-[0.04em] text-[14px] truncate">
                      {c.title}
                    </div>
                    <div className="italic text-[12px] text-ink-muted truncate">{c.type}</div>
                  </div>
                  <span className="text-[13px] text-ink truncate">
                    {c.artistName ?? c.party}
                  </span>
                  <div className="text-[12px] text-ink-muted whitespace-nowrap">
                    <div>{c.startDate.slice(0, 7)}</div>
                    <div className="italic text-[11px]">→ {c.endDate.slice(0, 7)}</div>
                  </div>
                  <span className="text-[13px] font-serif whitespace-nowrap">{c.amount || "—"}</span>
                  <Pill tone={STATUS_TONE[c.status as ContractStatus]}>
                    {STATUS_LABEL[c.status as ContractStatus]}
                  </Pill>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <RuledDivider label="À surveiller" />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-6">
          <AdminEyebrow className="mb-3">Échéances à venir · 6 mois</AdminEyebrow>
          {soon.length === 0 ? (
            <p className="italic text-[13px] text-ink-muted py-6">
              Aucune échéance dans les six prochains mois.
            </p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {soon.map((c) => (
                <li key={c.id} className="grid grid-cols-[auto_1fr_auto] gap-3 py-3 items-center">
                  <span className="text-[10px] tracking-eyebrow uppercase font-bold text-magenta whitespace-nowrap">
                    {frDate(c.endDate)}
                  </span>
                  <span className="italic text-[13px] text-ink truncate">{c.title}</span>
                  <Link
                    href={`/backoffice/contrats/${c.id}`}
                    className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle hover:text-magenta cursor-pointer"
                  >
                    Ouvrir
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-bleu-nuit-700 text-beige-sable rounded-[2px] p-6 relative overflow-hidden">
          <div className="stars opacity-40" aria-hidden />
          <div className="relative z-10">
            <AdminEyebrow className="!text-magenta mb-3">Charte contractuelle</AdminEyebrow>
            <p className="italic text-[14px] leading-[1.6] text-beige-sable/85">
              Chez ARTémis, nous privilégions les contrats lisibles, les durées courtes et les
              clauses de sortie négociables. Aucun contrat ne quitte le label sans relecture à deux
              voix.
            </p>
            <div className="mt-4">
              <Link href="/charte" className={ACCENT_LINK}>
                Lire la charte
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PageFooter page="09 / 10" chapter="Contrats" />
    </div>
  );
}
