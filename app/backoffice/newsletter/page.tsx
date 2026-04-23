"use client";

import {
  AdminBtn,
  AdminEyebrow,
  KPI,
  PageHeader,
  Pill,
} from "@/components/admin/AdminPrimitives";
import { SUBSCRIBERS } from "@/lib/adminData";

const CAMPAIGNS = [
  {
    id: "c4",
    title: "Alice — le clip est sorti",
    sentAt: "2026-04-12",
    audience: 162,
    openRate: 48,
    status: "envoyée",
  },
  {
    id: "c3",
    title: "Caëlya rejoint ARTémis",
    sentAt: "2026-03-19",
    audience: 149,
    openRate: 51,
    status: "envoyée",
  },
  {
    id: "c2",
    title: "Bilan de notre première année",
    sentAt: "2026-02-12",
    audience: 134,
    openRate: 44,
    status: "envoyée",
  },
  {
    id: "c1",
    title: "Brouillon — Playlist de printemps",
    sentAt: "—",
    audience: 0,
    openRate: 0,
    status: "brouillon",
  },
];

export default function NewsletterPage() {
  const allSubs = SUBSCRIBERS.concat(
    Array.from({ length: 148 }, (_, i) => ({
      id: `g${i}`,
      email: `abonne-${i + 5}@exemple.fr`,
      subscribed: "2026-03-01",
      tags: ["newsletter"],
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        chapter="07"
        eyebrow="Lien direct"
        title="Newsletter"
        italic="Raconter. Partager. Inviter — pas plus d'une fois par mois, et toujours avec quelque chose à dire."
        actions={
          <>
            <AdminBtn kind="secondary">Importer des contacts</AdminBtn>
            <AdminBtn kind="accent">+ Nouvelle campagne</AdminBtn>
          </>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPI
          label="Abonnés"
          value={allSubs.length}
          delta="+12 ce mois"
          hint="désinscriptions : 2"
        />
        <KPI
          label="Ouverture moyenne"
          value="47,5 %"
          hint="3 dernières campagnes"
        />
        <KPI
          label="Campagnes envoyées"
          value={CAMPAIGNS.filter((c) => c.status === "envoyée").length}
          hint="1 brouillon en cours"
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-6">
        <div className="bg-paper-soft border border-ink/10 rounded-[2px]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-ink/10">
            <AdminEyebrow>Campagnes</AdminEyebrow>
            <button
              type="button"
              className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-magenta hover:opacity-80 cursor-pointer"
            >
              Tout voir
            </button>
          </div>
          <ul>
            {CAMPAIGNS.map((c, i) => (
              <li
                key={c.id}
                className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-6 py-4 ${
                  i > 0 ? "border-t border-ink/8" : ""
                } hover:bg-paper/60`}
              >
                <div>
                  <div className="font-display uppercase tracking-[0.04em] text-[14px]">
                    {c.title}
                  </div>
                  <div className="italic text-[12px] text-ink-muted mt-1">
                    {c.sentAt !== "—"
                      ? `Envoyée le ${c.sentAt}`
                      : "Jamais envoyée"}{" "}
                    · {c.audience} destinataires
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-display text-[16px]">
                    {c.openRate > 0 ? `${c.openRate}%` : "—"}
                  </div>
                  <div className="text-[9px] tracking-eyebrow uppercase font-bold text-ink-subtle mt-0.5">
                    Ouverture
                  </div>
                </div>
                <Pill tone={c.status === "envoyée" ? "live" : "draft"}>
                  {c.status}
                </Pill>
                <button
                  type="button"
                  className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle hover:text-magenta cursor-pointer"
                >
                  Ouvrir ⟶
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-6">
          <AdminEyebrow className="mb-4">Abonnés récents</AdminEyebrow>
          <ul className="divide-y divide-ink/10">
            {SUBSCRIBERS.map((s) => (
              <li
                key={s.id}
                className="grid grid-cols-[1fr_auto] gap-3 py-3 items-center"
              >
                <div className="min-w-0">
                  <div className="font-serif text-[13px] text-ink truncate">
                    {s.name || <span className="italic">— sans nom</span>}
                  </div>
                  <div className="italic text-[12px] text-ink-muted truncate">
                    {s.email}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {s.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] tracking-[0.12em] uppercase font-bold text-ink-subtle bg-ink/6 px-2 py-0.5 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 pt-5 border-t border-ink/10">
            <AdminBtn kind="secondary" className="w-full justify-center">
              Voir les {allSubs.length} abonnés ⟶
            </AdminBtn>
          </div>
        </div>
      </section>

      {/* Writing pane */}
      <section className="bg-paper-soft border border-ink/10 rounded-[2px] p-7">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
          <div>
            <AdminEyebrow>Brouillon en cours</AdminEyebrow>
            <div className="font-display uppercase tracking-display text-[22px] font-normal mt-1">
              Playlist de printemps
            </div>
          </div>
          <div className="flex gap-2">
            <AdminBtn kind="secondary">Prévisualiser</AdminBtn>
            <AdminBtn kind="primary">Envoyer un test</AdminBtn>
            <AdminBtn kind="accent">Planifier l&apos;envoi</AdminBtn>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-paper border border-ink/10 rounded-[2px] p-4">
            <div className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
              Objet
            </div>
            <div className="font-display text-[15px] mt-1">
              Nos écoutes de printemps · 9 titres choisis par Margaux
            </div>
            <div className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle mt-4">
              Pré-en-tête
            </div>
            <div className="italic text-[13px] text-ink-muted mt-1">
              Une heure de musique entre deux fraises, deux giboulées, et un
              nouveau titre d&apos;Allicyone.
            </div>
          </div>
          <div className="bg-paper border border-ink/10 rounded-[2px] p-4">
            <div className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
              Audience
            </div>
            <div className="font-display text-[15px] mt-1">
              Tous les abonnés ({allSubs.length})
            </div>
            <div className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle mt-4">
              Planification
            </div>
            <div className="italic text-[13px] text-ink-muted mt-1">
              Non planifiée — choisissez une date pour l&apos;envoi automatique.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
