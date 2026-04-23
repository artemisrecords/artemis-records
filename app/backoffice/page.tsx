import Link from "next/link";
import {
  AdminBtn,
  AdminEyebrow,
  KPI,
  PageFooter,
  PageHeader,
  Pill,
  PullQuote,
} from "@/components/admin/AdminPrimitives";
import { BarChart, Donut, Sparkline } from "@/components/admin/Charts";
import { BowMark } from "@/components/Primitives";
import { getArtists, getNews } from "@/lib/db/queries";
import { formatDate } from "@/lib/data";
import { getDemands, getDemos, getSubscribers } from "@/lib/db/admin-queries";
import { DEMAND_CATEGORY_LABEL, DEMO_STATUS_LABEL } from "@/lib/adminData";

export default async function DashboardPage() {
  const [artists, news, demos, demands, subscribers] = await Promise.all([
    getArtists(),
    getNews(),
    getDemos(),
    getDemands(),
    getSubscribers(),
  ]);
  const newDemos = demos.filter((d) => d.status === "nouveau");
  const openDemands = demands.filter((d) => d.status === "ouverte");

  return (
    <div className="flex flex-col gap-10">
      <div className="relative">
        <span
          aria-hidden
          className="absolute right-0 top-0 opacity-20 pointer-events-none"
        >
          <BowMark size={64} />
        </span>
        <PageHeader
          chapter="01"
          eyebrow="Pilotage — Semaine 17 · 2026"
          title="Bonsoir, Margaux."
          italic="Voici ce qui attend le label cette semaine — les démos qui dorment encore, les demandes à ne pas laisser refroidir, les dates à tenir."
          actions={
            <>
              <AdminBtn kind="secondary">Exporter la semaine</AdminBtn>
              <AdminBtn kind="accent">+ Nouvelle entrée journal</AdminBtn>
            </>
          }
        />
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Démos reçues · 7j"
          value={demos.length}
          delta={`+${newDemos.length} cette semaine`}
          hint={`${newDemos.length} non écoutées`}
          spark={<Sparkline data={[2, 3, 1, 4, 2, 5, 3, 6, 4, 7]} />}
        />
        <KPI
          label="Demandes ouvertes"
          value={openDemands.length}
          delta="2 urgentes"
          hint="presse · booking · sync"
          spark={
            <Sparkline
              data={[4, 3, 5, 4, 6, 5, 7, 5, 4, 6]}
              stroke="var(--color-bleu-nuit-700)"
              fill="rgba(28,31,74,0.1)"
            />
          }
        />
        <KPI
          label="Artistes au roster"
          value={artists.length}
          hint={`${artists.filter((a) => a.published).length} publiés · ${artists.filter((a) => !a.published).length} en attente`}
          spark={
            <Sparkline
              data={[1, 1, 1, 2, 2, 2, 2, 2, 2, 2]}
              stroke="var(--color-vert-foret-700)"
              fill="rgba(35,52,15,0.1)"
            />
          }
        />
        <KPI
          label="Abonnés newsletter"
          value={`${subscribers.length + 148}`}
          delta="+12 ce mois-ci"
          hint="ouverture moyenne 42%"
          spark={
            <Sparkline
              data={[120, 128, 134, 139, 142, 148, 150, 152, 152, 152]}
              stroke="var(--color-taupe-700)"
              fill="rgba(141,123,104,0.14)"
            />
          }
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-6">
          <div className="flex items-end justify-between mb-5 gap-3 flex-wrap">
            <div>
              <AdminEyebrow>Entrées — 10 dernières semaines</AdminEyebrow>
              <div className="font-display uppercase tracking-display text-[22px] font-normal mt-1">
                Courbe d&apos;activité
              </div>
            </div>
            <div className="flex gap-4 text-[11px] tracking-eyebrow uppercase font-bold">
              <span className="inline-flex items-center gap-2 text-ink-muted">
                <span className="w-2.5 h-2.5 rounded-sm bg-magenta" /> Démos
              </span>
              <span className="inline-flex items-center gap-2 text-ink-muted">
                <span className="w-2.5 h-2.5 rounded-sm bg-bleu-nuit-700" />{" "}
                Demandes
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <BarChart
              data={[
                { label: "S08", value: 3 },
                { label: "S09", value: 5 },
                { label: "S10", value: 4 },
                { label: "S11", value: 6 },
                { label: "S12", value: 4 },
                { label: "S13", value: 8 },
                { label: "S14", value: 5 },
                { label: "S15", value: 9 },
                { label: "S16", value: 6 },
                { label: "S17", value: 7, accent: true },
              ]}
              ariaLabel="Démos reçues par semaine"
            />
            <BarChart
              data={[
                { label: "S08", value: 2 },
                { label: "S09", value: 4 },
                { label: "S10", value: 3 },
                { label: "S11", value: 5 },
                { label: "S12", value: 6 },
                { label: "S13", value: 4 },
                { label: "S14", value: 7 },
                { label: "S15", value: 5 },
                { label: "S16", value: 8 },
                { label: "S17", value: 6 },
              ]}
              ariaLabel="Demandes entrantes par semaine"
            />
          </div>
        </div>

        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-6">
          <AdminEyebrow className="mb-4">Répartition des démos</AdminEyebrow>
          <Donut
            segments={[
              { label: "Nouveaux", value: 3, color: "var(--color-magenta)" },
              {
                label: "À écouter",
                value: 2,
                color: "var(--color-bleu-nuit-700)",
              },
              {
                label: "Retenus",
                value: 1,
                color: "var(--color-vert-foret-700)",
              },
              { label: "Refusés", value: 1, color: "var(--color-taupe-700)" },
            ]}
            centerLabel={`${demos.length}`}
            centerHint="Ce mois"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
        <div className="bg-paper-soft border border-ink/10 rounded-[2px]">
          <div className="flex items-center justify-between px-6 py-5 border-b border-ink/10">
            <div>
              <AdminEyebrow>Dernières démos reçues</AdminEyebrow>
              <div className="font-display uppercase tracking-display text-[22px] font-normal mt-1">
                Boîte à démos
              </div>
            </div>
            <Link
              href="/backoffice/demos"
              className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-magenta hover:opacity-80"
            >
              Tout écouter ⟶
            </Link>
          </div>
          <ul>
            {demos.slice(0, 5).map((d, i) => (
              <li
                key={d.id}
                className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-6 py-4 ${
                  i > 0 ? "border-t border-ink/8" : ""
                }`}
              >
                <span className="w-10 h-10 rounded-full bg-bleu-nuit-700 text-beige-sable flex items-center justify-center font-display text-[13px]">
                  {d.artist
                    .split(" ")
                    .map((x) => x[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="min-w-0">
                  <div className="font-display uppercase tracking-[0.06em] text-[15px] truncate">
                    {d.artist}
                  </div>
                  <div className="italic text-[12px] text-ink-muted truncate">
                    {d.genre} · {d.city} · {d.duration}
                  </div>
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
                  {DEMO_STATUS_LABEL[d.status as keyof typeof DEMO_STATUS_LABEL]}
                </Pill>
                <Link
                  href={`/backoffice/demos?id=${d.id}`}
                  className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle hover:text-ink"
                >
                  Ouvrir ⟶
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-paper-soft border border-ink/10 rounded-[2px]">
          <div className="flex items-center justify-between px-6 py-5 border-b border-ink/10">
            <div>
              <AdminEyebrow>Demandes en attente</AdminEyebrow>
              <div className="font-display uppercase tracking-display text-[22px] font-normal mt-1">
                À traiter
              </div>
            </div>
            <Link
              href="/backoffice/demandes"
              className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-magenta hover:opacity-80"
            >
              Voir tout ⟶
            </Link>
          </div>
          <ul>
            {openDemands
              .concat(demands.filter((d) => d.status === "en_cours"))
              .slice(0, 5)
              .map((d, i) => (
                <li
                  key={d.id}
                  className={`flex flex-col gap-2 px-6 py-4 ${
                    i > 0 ? "border-t border-ink/8" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Pill tone="neutral">
                      {DEMAND_CATEGORY_LABEL[d.category as keyof typeof DEMAND_CATEGORY_LABEL]}
                    </Pill>
                    <span className="italic text-[11px] text-ink-muted">
                      {formatDate(d.receivedAt)}
                    </span>
                  </div>
                  <div className="font-display uppercase tracking-[0.04em] text-[15px]">
                    {d.subject}
                  </div>
                  <div className="italic text-[12px] text-ink-muted line-clamp-2 leading-[1.5]">
                    {d.message}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[12px] text-ink">
                      {d.name}
                      {d.org && (
                        <span className="text-ink-subtle"> · {d.org}</span>
                      )}
                    </span>
                    <Link
                      href={`/backoffice/demandes?id=${d.id}`}
                      className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-magenta hover:opacity-80"
                    >
                      Répondre ⟶
                    </Link>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <AdminEyebrow>Prochaines dates</AdminEyebrow>
              <div className="font-display uppercase tracking-display text-[22px] font-normal mt-1">
                Agenda
              </div>
            </div>
            <Link
              href="/backoffice/agenda"
              className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-magenta hover:opacity-80"
            >
              Tout voir ⟶
            </Link>
          </div>
          <ul className="divide-y divide-ink/10">
            {artists
              .flatMap((a) =>
                a.shows.map((s) => ({ ...s, artist: a.name })),
              )
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 5)
              .map((s) => (
                <li
                  key={`${s.artist}-${s.id}`}
                  className="grid grid-cols-[80px_1fr_auto] items-center gap-4 py-4"
                >
                  <div className="font-display text-[18px] leading-none">
                    {s.date.slice(8)}
                    <div className="text-[10px] tracking-eyebrow uppercase text-ink-subtle mt-1">
                      {new Date(s.date).toLocaleDateString("fr-FR", {
                        month: "short",
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="font-serif text-[14px] text-ink">
                      {s.artist} — {s.venue}
                    </div>
                    <div className="italic text-[12px] text-ink-muted">
                      {s.city}
                    </div>
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
                    {s.status ?? "—"}
                  </Pill>
                </li>
              ))}
          </ul>
        </div>

        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <AdminEyebrow>Publications récentes</AdminEyebrow>
              <div className="font-display uppercase tracking-display text-[22px] font-normal mt-1">
                Journal
              </div>
            </div>
            <Link
              href="/backoffice/journal"
              className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-magenta hover:opacity-80"
            >
              Gérer ⟶
            </Link>
          </div>
          <ul className="divide-y divide-ink/10">
            {news.slice(0, 4).map((n) => (
              <li
                key={n.id}
                className="grid grid-cols-[72px_1fr_auto] gap-4 py-4 items-center"
              >
                <div
                  className="w-[72px] h-[54px] bg-center bg-cover rounded-[2px] grain"
                  style={{ backgroundImage: `url(${n.imageUrl})` }}
                />
                <div className="min-w-0">
                  <div className="text-[10px] tracking-eyebrow uppercase font-bold text-magenta">
                    {n.category} · {formatDate(n.date)}
                  </div>
                  <div className="font-display uppercase tracking-[0.04em] text-[15px] truncate mt-0.5">
                    {n.title}
                  </div>
                  <div className="italic text-[12px] text-ink-muted truncate">
                    {n.excerpt}
                  </div>
                </div>
                <Pill tone={n.published ? "live" : "draft"}>
                  {n.published ? "En ligne" : "Brouillon"}
                </Pill>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-bleu-nuit-700 text-beige-sable rounded-[2px] p-8 relative overflow-hidden grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
        <div className="stars opacity-60" aria-hidden />
        <div className="relative z-10">
          <div className="text-[10px] tracking-eyebrow uppercase font-bold text-magenta mb-2">
            Rappel éditorial · à voix haute
          </div>
          <PullQuote author="charte interne · ARTémis">
            <span className="text-beige-sable">
              Chaque démo reçue mérite une réponse humaine. Même un non, surtout un non.
            </span>
          </PullQuote>
        </div>
        <div className="relative z-10 flex flex-col gap-3">
          <div className="text-[10px] tracking-eyebrow uppercase font-bold text-beige-sable/60">
            À faire avant vendredi
          </div>
          <ul className="text-[13px] italic text-beige-sable/85 leading-[1.6] space-y-1.5">
            <li>· Terminer la triage des démos non écoutées</li>
            <li>· Planifier les retours personnalisés</li>
            <li>· Valider la prochaine newsletter avec Inès</li>
          </ul>
          <div className="mt-2">
            <Link href="/backoffice/demos">
              <AdminBtn kind="accent">Écouter les démos</AdminBtn>
            </Link>
          </div>
        </div>
      </section>

      <PageFooter page="01 / 10" chapter="Pilotage" />
    </div>
  );
}
