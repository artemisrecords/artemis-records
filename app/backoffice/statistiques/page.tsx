"use client";

import { useState } from "react";
import {
  AdminBtn,
  AdminEyebrow,
  KPI,
  PageFooter,
  PageHeader,
  Pill,
  RuledDivider,
} from "@/components/admin/AdminPrimitives";
import { BarChart, Donut, Sparkline } from "@/components/admin/Charts";
import { ARTISTS } from "@/lib/data";

const RANGES = [
  { k: "7j", label: "7 jours" },
  { k: "30j", label: "30 jours" },
  { k: "90j", label: "3 mois" },
  { k: "12m", label: "12 mois" },
] as const;

const STREAMS_BY_ARTIST = [
  { artist: "Allicyone", spotify: 184200, youtube: 62400, bandcamp: 4100 },
  { artist: "Caëlya", spotify: 42600, youtube: 18100, bandcamp: 6800 },
];

const CITIES = [
  { city: "Paris", listeners: 12840 },
  { city: "Lyon", listeners: 4120 },
  { city: "Marseille", listeners: 3810 },
  { city: "Toulouse", listeners: 2960 },
  { city: "Bordeaux", listeners: 2470 },
  { city: "Bruxelles", listeners: 2240 },
  { city: "Lille", listeners: 1980 },
  { city: "Nantes", listeners: 1640 },
];

export default function StatistiquesPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]["k"]>("30j");

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        chapter="08"
        eyebrow="Lecture des chiffres · mis à jour il y a 4 h"
        title="Statistiques"
        italic="Chiffres agrégés depuis Spotify, YouTube et Bandcamp — à lire comme une météo, pas comme un oracle."
        actions={
          <>
            <AdminBtn kind="secondary">Télécharger le rapport</AdminBtn>
            <AdminBtn kind="primary">Connecter une plateforme</AdminBtn>
          </>
        }
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

      {/* Global KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Streams cumulés"
          value="320 420"
          delta="+12,4 %"
          hint="tous artistes, toutes plateformes"
          spark={<Sparkline data={[50, 58, 62, 70, 74, 82, 90, 98, 110, 124]} />}
        />
        <KPI
          label="Auditeurs uniques · 28j"
          value="48 120"
          delta="+8,1 %"
          hint="41 pays"
          spark={
            <Sparkline
              data={[30, 32, 34, 36, 38, 40, 42, 45, 46, 48]}
              stroke="var(--color-bleu-nuit-700)"
              fill="rgba(28,31,74,0.1)"
            />
          }
        />
        <KPI
          label="Ajouts en playlists"
          value="2 418"
          delta="+4 éditoriales"
          hint="dont 2 Spotify France"
          spark={
            <Sparkline
              data={[1800, 1920, 1980, 2040, 2120, 2200, 2280, 2340, 2380, 2418]}
              stroke="var(--color-vert-foret-700)"
              fill="rgba(35,52,15,0.1)"
            />
          }
        />
        <KPI
          label="Revenus estimés"
          value="1 284 €"
          delta="à recevoir · 30j"
          hint="avant commissions distributeur"
          spark={
            <Sparkline
              data={[420, 480, 540, 620, 700, 820, 940, 1060, 1180, 1284]}
              stroke="var(--color-taupe-700)"
              fill="rgba(141,123,104,0.14)"
            />
          }
        />
      </section>

      <RuledDivider label="Par artiste" />

      {/* Per artist */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ARTISTS.map((a, i) => {
          const s = STREAMS_BY_ARTIST[i];
          const total = s.spotify + s.youtube + s.bandcamp;
          return (
            <div
              key={a.id}
              className="bg-paper-soft border border-ink/10 rounded-[2px] overflow-hidden"
            >
              <div
                className="h-[120px] bg-cover bg-center grain relative"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(28,31,74,0.15), rgba(28,31,74,0.55)), url(${a.cover})`,
                }}
              >
                <div className="absolute inset-0 flex items-end p-5 text-beige-sable">
                  <div className="flex items-end justify-between gap-3 w-full">
                    <div>
                      <div className="text-[10px] tracking-eyebrow uppercase font-bold text-magenta">
                        {a.genre}
                      </div>
                      <div className="font-display uppercase tracking-display text-[28px] leading-none mt-1">
                        {a.name}
                      </div>
                    </div>
                    <Pill tone="magenta">+{10 + i * 3}% vs 30j</Pill>
                  </div>
                </div>
              </div>
              <div className="p-5 grid grid-cols-2 gap-5">
                <div>
                  <AdminEyebrow className="mb-2">
                    Sources · {total.toLocaleString("fr-FR")} écoutes
                  </AdminEyebrow>
                  <Donut
                    size={100}
                    thickness={12}
                    segments={[
                      {
                        label: "Spotify",
                        value: s.spotify,
                        color: "var(--color-vert-foret-700)",
                      },
                      {
                        label: "YouTube",
                        value: s.youtube,
                        color: "var(--color-magenta)",
                      },
                      {
                        label: "Bandcamp",
                        value: s.bandcamp,
                        color: "var(--color-bleu-nuit-700)",
                      },
                    ]}
                  />
                </div>
                <div>
                  <AdminEyebrow className="mb-2">
                    Courbe mensuelle
                  </AdminEyebrow>
                  <BarChart
                    height={100}
                    data={Array.from({ length: 12 }, (_, m) => ({
                      label: new Date(2025, m, 1)
                        .toLocaleDateString("fr-FR", { month: "narrow" })
                        .toUpperCase(),
                      value: 20 + Math.round(Math.sin(m + i) * 6 + m * (i + 1)),
                      accent: m === 11,
                    }))}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <RuledDivider label="Où nous écoute-t-on" />

      {/* Geography */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-6">
          <AdminEyebrow className="mb-4">Top villes</AdminEyebrow>
          <ul className="flex flex-col gap-3">
            {CITIES.map((c, i) => {
              const pct = (c.listeners / CITIES[0].listeners) * 100;
              return (
                <li key={c.city} className="grid grid-cols-[28px_1fr_auto] gap-4 items-center">
                  <span className="font-display text-[14px] text-ink-subtle">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="font-serif text-[14px]">{c.city}</span>
                      <span className="italic text-[12px] text-ink-muted">
                        {c.listeners.toLocaleString("fr-FR")} auditeurs
                      </span>
                    </div>
                    <div className="h-[4px] bg-ink/8 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-magenta"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                    {pct > 80 ? "★" : pct > 40 ? "·" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-6 flex flex-col gap-5">
          <div>
            <AdminEyebrow className="mb-3">Répartition par pays</AdminEyebrow>
            <Donut
              size={140}
              thickness={16}
              segments={[
                { label: "France", value: 72, color: "var(--color-bleu-nuit-700)" },
                { label: "Belgique", value: 11, color: "var(--color-magenta)" },
                { label: "Suisse", value: 6, color: "var(--color-vert-foret-700)" },
                { label: "Québec", value: 5, color: "var(--color-taupe-700)" },
                { label: "Reste", value: 6, color: "var(--color-bleu-nuit-300)" },
              ]}
              centerLabel="41"
              centerHint="Pays"
            />
          </div>
          <div className="pt-4 border-t border-ink/10">
            <AdminEyebrow className="mb-2">À noter</AdminEyebrow>
            <p className="italic text-[13px] text-ink-muted leading-[1.55]">
              Forte progression au Québec ce mois-ci (+34 %) — à suivre pour
              une éventuelle programmation côté Montréal à l&apos;automne.
            </p>
          </div>
        </div>
      </section>

      <PageFooter page="08 / 10" chapter="Statistiques" />
    </div>
  );
}
