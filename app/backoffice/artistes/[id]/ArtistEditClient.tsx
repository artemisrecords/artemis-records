"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AdminBtn,
  AdminEyebrow,
  AdminField,
  AdminSelect,
  AdminTextarea,
  Pill,
} from "@/components/admin/AdminPrimitives";
import type { Artist } from "@/lib/data";

type Tab = "identite" | "bio" | "discographie" | "agenda" | "reseaux" | "medias";

const TABS: { k: Tab; label: string }[] = [
  { k: "identite", label: "Identité" },
  { k: "bio", label: "Biographie" },
  { k: "discographie", label: "Discographie" },
  { k: "agenda", label: "Concerts" },
  { k: "reseaux", label: "Réseaux" },
  { k: "medias", label: "Médias" },
];

export function ArtistEditClient({ artist }: { artist: Artist }) {
  const [tab, setTab] = useState<Tab>("identite");
  const [published, setPublished] = useState(artist.published);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle">
        <Link href="/backoffice/artistes" className="hover:text-ink">
          ← Roster
        </Link>
      </div>

      <div className="bg-paper-soft border border-ink/10 rounded-[2px] overflow-hidden">
        <div
          className="h-[180px] bg-center bg-cover grain relative"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(28,31,74,0.1), rgba(28,31,74,0.55)), url(${artist.coverUrl})`,
          }}
        >
          <div className="absolute inset-0 flex items-end px-8 py-6 text-beige-sable">
            <div className="flex items-end gap-5 w-full">
              <div
                className="w-24 h-24 rounded-full bg-cover bg-center border-2 border-beige-sable shrink-0 -mb-8"
                style={{ backgroundImage: `url(${artist.portraitUrl})` }}
              />
              <div className="flex-1 pb-1">
                <div className="text-[10px] tracking-eyebrow uppercase font-bold text-magenta">
                  Signé en {artist.signedYear} · {artist.genre}
                </div>
                <h1 className="font-display uppercase tracking-display text-[clamp(2.25rem,4vw,3.5rem)] leading-none mt-1 font-normal">
                  {artist.name}
                </h1>
                <div className="italic text-[14px] opacity-85 mt-1">
                  {artist.tagline}
                </div>
              </div>
              <div className="flex items-center gap-2 pb-1">
                <Link href={`/artists/${artist.id}`}>
                  <AdminBtn kind="secondary" className="!text-beige-sable !border-beige-sable/40 !bg-transparent">
                    Voir la fiche publique ↗
                  </AdminBtn>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pt-12 pb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <span
                className={`relative w-10 h-[22px] rounded-full transition-colors ${
                  published ? "bg-vert-foret-700" : "bg-ink/25"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-beige-sable transition-all ${
                    published ? "left-[20px]" : "left-0.5"
                  }`}
                />
              </span>
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="sr-only"
              />
              <span className="text-[11px] tracking-eyebrow uppercase font-bold">
                {published ? "En ligne" : "Hors ligne"}
              </span>
            </label>
            <Pill tone={published ? "live" : "draft"}>
              {published ? "Publié" : "Brouillon"}
            </Pill>
          </div>
          <div className="flex gap-2">
            <AdminBtn kind="secondary">Aperçu</AdminBtn>
            <AdminBtn kind="accent">Enregistrer les modifications</AdminBtn>
          </div>
        </div>
      </div>

      <div className="flex gap-0 border-b border-ink/15 flex-wrap">
        {TABS.map((t) => {
          const active = t.k === tab;
          return (
            <button
              key={t.k}
              type="button"
              onClick={() => setTab(t.k)}
              className={`relative font-serif text-[11px] tracking-eyebrow uppercase font-bold px-4 py-3 cursor-pointer transition-colors ${
                active ? "text-ink" : "text-ink-subtle hover:text-ink"
              }`}
            >
              {t.label}
              <span
                className={`absolute left-2 right-2 -bottom-px h-[2px] ${
                  active ? "bg-magenta" : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6 items-start">
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-7">
          {tab === "identite" && (
            <>
              <AdminEyebrow className="mb-4">Identité du projet</AdminEyebrow>
              <div className="grid grid-cols-2 gap-4">
                <AdminField label="Nom d'artiste" defaultValue={artist.name} />
                <AdminField label="Slug URL" defaultValue={artist.id} hint="Utilisé dans l'URL publique" />
              </div>
              <AdminField
                label="Accroche (tagline)"
                defaultValue={artist.tagline}
              />
              <div className="grid grid-cols-2 gap-4">
                <AdminField
                  label="Genre principal"
                  defaultValue={artist.genre}
                />
                <AdminField
                  label="Année de signature"
                  defaultValue={artist.signedYear}
                />
              </div>
              <AdminField
                label="Couleur signature (hex)"
                defaultValue={artist.primaryColor ?? ""}
                hint="Utilisée sur la page publique comme accent."
              />
              <AdminTextarea
                label="Citation en exergue"
                rows={2}
                defaultValue={artist.quote ?? ""}
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {artist.genres.map((g) => (
                  <span
                    key={g}
                    className="text-[11px] tracking-[0.12em] uppercase font-bold text-ink-muted bg-ink/6 px-2.5 py-1 rounded-full"
                  >
                    {g} <span className="text-ink-subtle">×</span>
                  </span>
                ))}
                <button
                  type="button"
                  className="text-[11px] tracking-[0.12em] uppercase font-bold text-magenta border border-magenta/40 px-2.5 py-1 rounded-full hover:bg-magenta/10"
                >
                  + Ajouter un genre
                </button>
              </div>
            </>
          )}

          {tab === "bio" && (
            <>
              <AdminEyebrow className="mb-4">Biographie</AdminEyebrow>
              <AdminTextarea
                label="Bio courte (carte)"
                rows={3}
                defaultValue={artist.bioShort}
              />
              <AdminTextarea
                label="Bio longue (fiche)"
                rows={10}
                defaultValue={artist.bioLong}
              />
              <div className="italic text-[12px] text-ink-subtle">
                Markdown léger accepté : *italique*, **gras**, double saut de
                ligne pour paragraphes.
              </div>
            </>
          )}

          {tab === "discographie" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <AdminEyebrow>
                  Sorties · {artist.discography.length}
                </AdminEyebrow>
                <AdminBtn kind="secondary">+ Ajouter une sortie</AdminBtn>
              </div>
              <ul className="flex flex-col gap-3">
                {artist.discography.map((d) => (
                  <li
                    key={d.id}
                    className="grid grid-cols-[72px_1fr_auto] gap-4 items-center p-3 border border-ink/10 rounded-[2px] bg-paper"
                  >
                    <div
                      className="w-[72px] h-[72px] bg-cover bg-center rounded-[2px]"
                      style={{ backgroundImage: `url(${d.cover})` }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Pill tone="neutral">{d.kind}</Pill>
                        <span className="font-display uppercase tracking-[0.04em] text-[16px]">
                          {d.title}
                        </span>
                      </div>
                      <div className="italic text-[12px] text-ink-muted mt-1">
                        {d.year} {d.note && `· ${d.note}`}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <AdminBtn kind="ghost">Éditer</AdminBtn>
                      <AdminBtn kind="ghost">↑↓</AdminBtn>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {tab === "agenda" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <AdminEyebrow>Concerts · {artist.shows.length}</AdminEyebrow>
                <AdminBtn kind="secondary">+ Ajouter une date</AdminBtn>
              </div>
              <ul className="flex flex-col gap-2">
                {artist.shows.map((s) => (
                  <li
                    key={s.id}
                    className="grid grid-cols-[90px_1fr_auto_auto] gap-4 items-center p-3 border border-ink/10 rounded-[2px] bg-paper"
                  >
                    <div className="font-display text-[22px] leading-none">
                      {s.date.slice(8)}
                      <div className="text-[9px] tracking-eyebrow uppercase text-ink-subtle mt-1">
                        {new Date(s.date).toLocaleDateString("fr-FR", {
                          month: "short",
                          year: "2-digit",
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="font-serif text-[14px]">{s.venue}</div>
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
                    <AdminBtn kind="ghost">Éditer</AdminBtn>
                  </li>
                ))}
              </ul>
            </>
          )}

          {tab === "reseaux" && (
            <>
              <AdminEyebrow className="mb-4">Réseaux & plateformes</AdminEyebrow>
              {Object.entries(artist.socials).map(([k, v]) => (
                <AdminField
                  key={k}
                  label={k}
                  defaultValue={v}
                  placeholder={`https://...`}
                />
              ))}
              <AdminBtn kind="secondary">+ Ajouter une plateforme</AdminBtn>

              <div className="mt-8">
                <AdminEyebrow className="mb-4">Lecteurs intégrés</AdminEyebrow>
                <ul className="flex flex-col gap-2">
                  {artist.embeds.map((e, i) => (
                    <li
                      key={i}
                      className="grid grid-cols-[auto_1fr_auto] gap-3 items-center p-3 border border-ink/10 rounded-[2px] bg-paper"
                    >
                      <Pill tone="neutral">{e.type}</Pill>
                      <div className="min-w-0">
                        <div className="font-serif text-[13px] truncate">
                          {e.title}
                        </div>
                        <div className="italic text-[11px] text-ink-subtle truncate">
                          {e.src}
                        </div>
                      </div>
                      <AdminBtn kind="ghost">Éditer</AdminBtn>
                    </li>
                  ))}
                </ul>
                <div className="mt-3">
                  <AdminBtn kind="secondary">+ Ajouter un embed</AdminBtn>
                </div>
              </div>
            </>
          )}

          {tab === "medias" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <AdminEyebrow>Médias & galerie</AdminEyebrow>
                <AdminBtn kind="secondary">+ Téléverser</AdminBtn>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[artist.portraitUrl, artist.coverUrl, ...artist.gallery].map(
                  (src, i) => (
                    <div
                      key={i}
                      className="aspect-[4/3] bg-cover bg-center rounded-[2px] relative group grain"
                      style={{ backgroundImage: `url(${src})` }}
                    >
                      <div className="absolute inset-0 bg-bleu-nuit-900/0 group-hover:bg-bleu-nuit-900/60 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          className="text-[10px] tracking-eyebrow uppercase font-bold text-beige-sable border border-beige-sable/40 px-3 py-1.5 rounded-full cursor-pointer hover:border-magenta"
                        >
                          Définir portrait
                        </button>
                        <button
                          type="button"
                          className="text-[10px] tracking-eyebrow uppercase font-bold text-beige-sable border border-beige-sable/40 px-3 py-1.5 rounded-full cursor-pointer hover:border-magenta"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ),
                )}
                <div className="aspect-[4/3] border-2 border-dashed border-ink/25 rounded-[2px] flex flex-col items-center justify-center gap-1 text-ink-muted hover:border-magenta hover:text-magenta cursor-pointer">
                  <div className="text-[20px]">+</div>
                  <div className="text-[10px] tracking-eyebrow uppercase font-bold">
                    Ajouter
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="flex flex-col gap-4 sticky top-[88px]">
          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
            <AdminEyebrow className="mb-3">Aperçu rapide</AdminEyebrow>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="font-display text-[22px]">
                  {artist.discography.length}
                </div>
                <div className="text-[9px] tracking-eyebrow uppercase font-bold text-ink-subtle mt-1">
                  Sorties
                </div>
              </div>
              <div>
                <div className="font-display text-[22px]">
                  {artist.shows.length}
                </div>
                <div className="text-[9px] tracking-eyebrow uppercase font-bold text-ink-subtle mt-1">
                  Concerts
                </div>
              </div>
              <div>
                <div className="font-display text-[22px]">
                  {Object.keys(artist.socials).length}
                </div>
                <div className="text-[9px] tracking-eyebrow uppercase font-bold text-ink-subtle mt-1">
                  Réseaux
                </div>
              </div>
            </div>
          </div>

          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
            <AdminEyebrow className="mb-3">Couverture</AdminEyebrow>
            <div
              className="aspect-[16/9] bg-center bg-cover rounded-[2px] grain"
              style={{ backgroundImage: `url(${artist.coverUrl})` }}
            />
            <div className="mt-3 flex gap-2">
              <AdminBtn kind="secondary" className="flex-1">
                Changer
              </AdminBtn>
              <AdminBtn kind="ghost">Recadrer</AdminBtn>
            </div>
          </div>

          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
            <AdminEyebrow className="mb-3">Zone dangereuse</AdminEyebrow>
            <p className="italic text-[12px] text-ink-muted leading-[1.5]">
              Dépublier une fiche la retire du site public mais conserve
              l&apos;historique et les contenus liés.
            </p>
            <div className="flex flex-col gap-2 mt-3">
              <AdminBtn kind="secondary">Dépublier</AdminBtn>
              <AdminBtn kind="danger">Archiver la fiche</AdminBtn>
            </div>
          </div>

          <AdminSelect
            label="Direction artistique référente"
            defaultValue="u1"
            options={[
              { value: "u1", label: "Margaux Villeneuve" },
              { value: "u2", label: "Jules Antonin" },
              { value: "u3", label: "Inès Rocher" },
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
