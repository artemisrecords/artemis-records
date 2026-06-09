"use client";

import { useMemo, useState } from "react";
import {
  AdminEyebrow,
  KPI,
  PageFooter,
  PageHeader,
  RuledDivider,
} from "@/components/admin/AdminPrimitives";
import { BarChart, Donut } from "@/components/admin/Charts";
import type { LabelStats } from "@/lib/db/admin-queries";

const RANGES = [
  { k: "7j", label: "7 jours", days: 7 },
  { k: "30j", label: "30 jours", days: 30 },
  { k: "90j", label: "3 mois", days: 90 },
  { k: "12m", label: "12 mois", days: 365 },
] as const;

type RangeKey = (typeof RANGES)[number]["k"];

const KIND_LABEL: Record<string, string> = {
  demo: "Démos",
  demande: "Demandes",
  news: "Actualités",
  abonne: "Abonnés",
};

export function StatistiquesClient({ stats }: { stats: LabelStats }) {
  const [range, setRange] = useState<RangeKey>("30j");

  const cutoff = useMemo(() => {
    const days = RANGES.find((r) => r.k === range)!.days;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }, [range]);

  const inRange = useMemo(
    () => stats.events.filter((e) => e.date >= cutoff),
    [stats.events, cutoff],
  );

  const byKind = useMemo(() => {
    const counts: Record<string, number> = { demo: 0, demande: 0, news: 0, abonne: 0 };
    for (const e of inRange) counts[e.kind] = (counts[e.kind] ?? 0) + 1;
    return counts;
  }, [inRange]);

  const demosTotal = stats.demos.total || 1;
  const demandsTotal = stats.demands.total || 1;

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        chapter="08"
        eyebrow="Activité du label · données internes"
        title="Statistiques"
        italic="Les chiffres réels du label : roster, journal, démos, demandes, agenda, abonnés. (Les statistiques de streaming nécessiteraient une connexion aux plateformes.)"
      />

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle mr-1">
          Période
        </span>
        {RANGES.map((r) => {
          const active = r.k === range;
          return (
            <button
              key={r.k}
              type="button"
              onClick={() => setRange(r.k)}
              className={`font-serif text-[11px] tracking-eyebrow uppercase font-bold px-3.5 py-2 rounded-full border cursor-pointer transition-colors ${
                active
                  ? "bg-bleu-nuit-700 border-bleu-nuit-700 text-beige-sable"
                  : "bg-paper-soft border-ink/15 text-ink-muted hover:text-ink hover:border-ink/40"
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Artistes en ligne"
          value={stats.artists.published}
          hint={`${stats.artists.total} fiches au total`}
        />
        <KPI
          label="Démos à traiter"
          value={stats.demos.nouveau}
          hint={`${stats.demos.total} démos reçues`}
        />
        <KPI
          label="Demandes ouvertes"
          value={stats.demands.ouverte}
          hint={`${stats.demands.total} demandes au total`}
        />
        <KPI
          label="Concerts à venir"
          value={stats.shows.upcoming}
          hint={`${stats.shows.total} dates planifiées`}
        />
      </section>

      <RuledDivider label={`Nouvelles entrées · ${RANGES.find((r) => r.k === range)!.label}`} />

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-6">
          <AdminEyebrow className="mb-4">Reçu sur la période</AdminEyebrow>
          <BarChart
            height={120}
            data={[
              { label: "DÉMOS", value: byKind.demo },
              { label: "DEM.", value: byKind.demande, accent: true },
              { label: "NEWS", value: byKind.news },
              { label: "ABO.", value: byKind.abonne },
            ]}
          />
          <div className="grid grid-cols-2 gap-3 mt-5">
            {(["demo", "demande", "news", "abonne"] as const).map((k) => (
              <div key={k} className="flex items-baseline justify-between border-t border-ink/8 pt-2">
                <span className="text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                  {KIND_LABEL[k]}
                </span>
                <span className="font-display text-[20px]">{byKind[k]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-6 flex flex-col items-center">
            <AdminEyebrow className="mb-4 self-start">Démos par statut</AdminEyebrow>
            {stats.demos.total === 0 ? (
              <p className="italic text-[13px] text-ink-muted py-8">Aucune démo.</p>
            ) : (
              <Donut
                size={140}
                thickness={16}
                centerLabel={String(stats.demos.total)}
                centerHint="Démos"
                segments={[
                  { label: "Nouveau", value: stats.demos.nouveau, color: "var(--color-magenta)" },
                  { label: "Retenu", value: stats.demos.retenu, color: "var(--color-vert-foret-700)" },
                  { label: "Refusé", value: stats.demos.refuse, color: "var(--color-taupe-700)" },
                ]}
              />
            )}
          </div>

          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-6 flex flex-col items-center">
            <AdminEyebrow className="mb-4 self-start">Demandes par statut</AdminEyebrow>
            {stats.demands.total === 0 ? (
              <p className="italic text-[13px] text-ink-muted py-8">Aucune demande.</p>
            ) : (
              <Donut
                size={140}
                thickness={16}
                centerLabel={String(stats.demands.total)}
                centerHint="Demandes"
                segments={[
                  { label: "Ouverte", value: stats.demands.ouverte, color: "var(--color-magenta)" },
                  { label: "En cours", value: stats.demands.en_cours, color: "var(--color-bleu-nuit-700)" },
                  { label: "Close", value: stats.demands.close, color: "var(--color-taupe-700)" },
                ]}
              />
            )}
          </div>
        </div>
      </section>

      <RuledDivider label="Contenu, audience & juridique" />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Actualités publiées"
          value={stats.news.published}
          hint={`${stats.news.total} articles au total`}
        />
        <KPI
          label="Abonnés newsletter"
          value={stats.subscribers.total}
          hint={`${stats.subscribers.confirmed} confirmés`}
        />
        <KPI
          label="Contrats en vigueur"
          value={stats.contracts.active}
          hint={`${stats.contracts.total} contrats au total`}
        />
        <KPI
          label="Taux de démos retenues"
          value={`${Math.round((stats.demos.retenu / demosTotal) * 100)} %`}
          hint={`${stats.demos.retenu} retenues · ${stats.demands.close}/${demandsTotal} demandes closes`}
        />
      </section>

      <PageFooter page="08 / 10" chapter="Statistiques" />
    </div>
  );
}
