"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import {
  AdminBtn,
  AdminEyebrow,
  AdminField,
  AdminSelect,
  AdminTextarea,
  Pill,
} from "@/components/admin/AdminPrimitives";
import { saveArtistNewsletter } from "@/app/backoffice/newsletter/actions";
import {
  saveIdentity,
  saveBio,
  setArtistPublished,
  saveSocials,
  saveEmbeds,
  saveDiscography,
  saveShow,
  removeShow,
  saveMedia,
  archiveArtist,
} from "@/app/backoffice/artistes/actions";
import type { ArtistWithShows } from "@/lib/db/queries";

type Tab = "identite" | "bio" | "discographie" | "agenda" | "reseaux" | "medias";

const TABS: { k: Tab; label: string }[] = [
  { k: "identite", label: "Identité" },
  { k: "bio", label: "Biographie" },
  { k: "discographie", label: "Discographie" },
  { k: "agenda", label: "Concerts" },
  { k: "reseaux", label: "Réseaux" },
  { k: "medias", label: "Médias" },
];

type Status = { tone: "ok" | "error"; message: string } | null;

// Petit bandeau de statut réutilisé par chaque onglet.
function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <div
      className={`mt-2 font-serif text-[12px] ${
        status.tone === "ok" ? "text-vert-foret-700" : "text-magenta"
      }`}
    >
      {status.message}
    </div>
  );
}

export function ArtistEditClient({ artist }: { artist: ArtistWithShows }) {
  const [tab, setTab] = useState<Tab>("identite");

  // Publication (action instantanée).
  const [published, setPublished] = useState(artist.published);
  const [pubPending, startPub] = useTransition();
  const togglePublished = (next: boolean) => {
    setPublished(next);
    startPub(async () => {
      const res = await setArtistPublished(artist.id, next);
      if (!res.ok) setPublished(!next); // rollback visuel si échec
    });
  };

  // Identité.
  const [genres, setGenres] = useState<string[]>(artist.genres);
  const [newGenre, setNewGenre] = useState("");
  const [identityStatus, setIdentityStatus] = useState<Status>(null);
  const [identityPending, startIdentity] = useTransition();

  // Bio.
  const [bioStatus, setBioStatus] = useState<Status>(null);
  const [bioPending, startBio] = useTransition();

  // Newsletter (existant).
  const [newsletterUrl, setNewsletterUrl] = useState(artist.newsletterUrl ?? "");
  const [nlStatus, setNlStatus] = useState<Status>(null);
  const [nlPending, startNlTransition] = useTransition();

  const saveNewsletter = () => {
    setNlStatus(null);
    startNlTransition(async () => {
      const res = await saveArtistNewsletter({ artistId: artist.id, url: newsletterUrl });
      setNlStatus(
        res.ok
          ? { tone: "ok", message: "Lien enregistré." }
          : { tone: "error", message: res.error },
      );
    });
  };

  const submitIdentity = (formData: FormData) => {
    setIdentityStatus(null);
    startIdentity(async () => {
      const res = await saveIdentity(artist.id, {
        name: String(formData.get("name") ?? ""),
        tagline: String(formData.get("tagline") ?? ""),
        genre: String(formData.get("genre") ?? ""),
        signedYear: String(formData.get("signedYear") ?? ""),
        primaryColor: String(formData.get("primaryColor") ?? ""),
        quote: String(formData.get("quote") ?? ""),
        genres,
      });
      setIdentityStatus(
        res.ok
          ? { tone: "ok", message: "Identité enregistrée." }
          : { tone: "error", message: res.error },
      );
    });
  };

  const submitBio = (formData: FormData) => {
    setBioStatus(null);
    startBio(async () => {
      const res = await saveBio(artist.id, {
        bioShort: String(formData.get("bioShort") ?? ""),
        bioLong: String(formData.get("bioLong") ?? ""),
      });
      setBioStatus(
        res.ok
          ? { tone: "ok", message: "Biographie enregistrée." }
          : { tone: "error", message: res.error },
      );
    });
  };

  const addGenre = () => {
    const g = newGenre.trim();
    if (g && !genres.includes(g)) setGenres([...genres, g]);
    setNewGenre("");
  };

  // Réseaux : socials (liste de paires clef/valeur) + embeds.
  const [socials, setSocials] = useState<{ key: string; url: string }[]>(
    Object.entries(artist.socials).map(([key, url]) => ({ key, url })),
  );
  const [socialsStatus, setSocialsStatus] = useState<Status>(null);
  const [socialsPending, startSocials] = useTransition();

  const [embeds, setEmbeds] = useState(artist.embeds);
  const [embedsStatus, setEmbedsStatus] = useState<Status>(null);
  const [embedsPending, startEmbeds] = useTransition();

  const submitSocials = () => {
    setSocialsStatus(null);
    startSocials(async () => {
      const record: Record<string, string> = {};
      for (const s of socials) if (s.key.trim()) record[s.key.trim()] = s.url.trim();
      const res = await saveSocials(artist.id, record);
      setSocialsStatus(
        res.ok ? { tone: "ok", message: "Réseaux enregistrés." } : { tone: "error", message: res.error },
      );
    });
  };

  const submitEmbeds = () => {
    setEmbedsStatus(null);
    startEmbeds(async () => {
      const res = await saveEmbeds(artist.id, embeds);
      setEmbedsStatus(
        res.ok ? { tone: "ok", message: "Lecteurs enregistrés." } : { tone: "error", message: res.error },
      );
    });
  };

  // Discographie.
  const [disco, setDisco] = useState(artist.discography);
  const [discoStatus, setDiscoStatus] = useState<Status>(null);
  const [discoPending, startDisco] = useTransition();

  const updateDisco = (i: number, patch: Partial<(typeof disco)[number]>) =>
    setDisco(disco.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const moveDisco = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= disco.length) return;
    const next = [...disco];
    [next[i], next[j]] = [next[j], next[i]];
    setDisco(next);
  };
  const addDisco = () =>
    setDisco([
      ...disco,
      { id: crypto.randomUUID(), kind: "Single", title: "", year: "", cover: "", note: "" },
    ]);

  const submitDisco = () => {
    setDiscoStatus(null);
    startDisco(async () => {
      const res = await saveDiscography(artist.id, disco);
      setDiscoStatus(
        res.ok ? { tone: "ok", message: "Discographie enregistrée." } : { tone: "error", message: res.error },
      );
    });
  };

  // Concerts (artist_shows). On édite des lignes locales ; chaque ligne se
  // sauvegarde/supprime indépendamment via les actions upsert/delete.
  type ShowRow = {
    id: string | null;
    date: string;
    city: string;
    venue: string;
    status: string;
    free: boolean;
    ticketUrl: string;
  };
  const [shows, setShows] = useState<ShowRow[]>(
    artist.shows.map((s) => ({
      id: s.id,
      date: s.date,
      city: s.city,
      venue: s.venue,
      status: s.status ?? "",
      free: s.free,
      ticketUrl: s.ticketUrl ?? "",
    })),
  );
  const [showStatus, setShowStatus] = useState<Status>(null);
  const [showPending, startShow] = useTransition();

  const updateShow = (i: number, patch: Partial<ShowRow>) =>
    setShows(shows.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const addShowRow = () =>
    setShows([...shows, { id: null, date: "", city: "", venue: "", status: "", free: false, ticketUrl: "" }]);

  const saveShowRow = (i: number) => {
    setShowStatus(null);
    startShow(async () => {
      const row = shows[i];
      const res = await saveShow(artist.id, row.id ? { ...row, id: row.id } : row);
      setShowStatus(
        res.ok ? { tone: "ok", message: "Date enregistrée." } : { tone: "error", message: res.error },
      );
    });
  };

  const deleteShowRow = (i: number) => {
    const row = shows[i];
    if (!row.id) {
      setShows(shows.filter((_, j) => j !== i));
      return;
    }
    startShow(async () => {
      const res = await removeShow(artist.id, row.id as string);
      if (res.ok) setShows(shows.filter((_, j) => j !== i));
      else setShowStatus({ tone: "error", message: res.error });
    });
  };

  // Médias.
  const [portraitUrl, setPortraitUrl] = useState(artist.portraitUrl);
  const [coverUrl, setCoverUrl] = useState(artist.coverUrl);
  const [gallery, setGallery] = useState<string[]>(artist.gallery);
  const [mediaStatus, setMediaStatus] = useState<Status>(null);
  const [mediaPending, startMedia] = useTransition();

  const uploadAndSave = (file: File, target: "portrait" | "cover" | "gallery") => {
    setMediaStatus(null);
    startMedia(async () => {
      try {
        const blob = await upload(`artists/${artist.id}/${target}/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
        });
        let res;
        if (target === "portrait") {
          setPortraitUrl(blob.url);
          res = await saveMedia(artist.id, { portraitUrl: blob.url });
        } else if (target === "cover") {
          setCoverUrl(blob.url);
          res = await saveMedia(artist.id, { coverUrl: blob.url });
        } else {
          const next = [...gallery, blob.url];
          setGallery(next);
          res = await saveMedia(artist.id, { gallery: next });
        }
        setMediaStatus(
          res.ok ? { tone: "ok", message: "Image enregistrée." } : { tone: "error", message: res.error },
        );
      } catch (err) {
        setMediaStatus({ tone: "error", message: (err as Error).message });
      }
    });
  };

  const removeGalleryImage = (url: string) => {
    const next = gallery.filter((g) => g !== url);
    setGallery(next);
    startMedia(async () => {
      await saveMedia(artist.id, { gallery: next });
    });
  };

  // Archivage (suppression dure).
  const [confirmArchive, setConfirmArchive] = useState("");
  const [archivePending, startArchive] = useTransition();
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const doArchive = () => {
    setArchiveError(null);
    startArchive(async () => {
      const res = await archiveArtist(artist.id, confirmArchive);
      // En cas de succès, archiveArtist redirige ; on ne lit l'erreur que sinon.
      if (res && !res.ok) setArchiveError(res.error);
    });
  };

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
            backgroundImage: `linear-gradient(180deg, rgba(28,31,74,0.1), rgba(28,31,74,0.55)), url(${coverUrl})`,
          }}
        >
          <div className="absolute inset-0 flex items-end px-8 py-6 text-beige-sable">
            <div className="flex items-end gap-5 w-full">
              <div
                className="w-24 h-24 rounded-full bg-cover bg-center border-2 border-beige-sable shrink-0 -mb-8"
                style={{ backgroundImage: `url(${portraitUrl})` }}
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
                disabled={pubPending}
                onChange={(e) => togglePublished(e.target.checked)}
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
          <div className="flex gap-2 items-center">
            <span className="font-serif italic text-[12px] text-ink-subtle">
              Chaque onglet s&apos;enregistre séparément.
            </span>
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
            <form action={submitIdentity}>
              <AdminEyebrow className="mb-4">Identité du projet</AdminEyebrow>
              <div className="grid grid-cols-2 gap-4">
                <AdminField name="name" label="Nom d'artiste" defaultValue={artist.name} />
                <AdminField
                  label="Slug URL"
                  defaultValue={artist.id}
                  hint="Définitif (clé publique). Non modifiable."
                />
              </div>
              <AdminField name="tagline" label="Accroche (tagline)" defaultValue={artist.tagline} />
              <div className="grid grid-cols-2 gap-4">
                <AdminField name="genre" label="Genre principal" defaultValue={artist.genre} />
                <AdminField name="signedYear" label="Année de signature" defaultValue={artist.signedYear} />
              </div>
              <AdminField
                name="primaryColor"
                label="Couleur signature (hex)"
                defaultValue={artist.primaryColor ?? ""}
                hint="Utilisée sur la page publique comme accent."
              />
              <AdminTextarea name="quote" label="Citation en exergue" rows={2} defaultValue={artist.quote ?? ""} />
              <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                {genres.map((g) => (
                  <span
                    key={g}
                    className="text-[11px] tracking-[0.12em] uppercase font-bold text-ink-muted bg-ink/6 px-2.5 py-1 rounded-full"
                  >
                    {g}{" "}
                    <button
                      type="button"
                      onClick={() => setGenres(genres.filter((x) => x !== g))}
                      className="text-ink-subtle hover:text-magenta cursor-pointer"
                      aria-label={`Retirer ${g}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addGenre();
                    }
                  }}
                  placeholder="Ajouter un genre"
                  className="text-[12px] bg-paper-soft border border-ink/15 px-2.5 py-1 rounded-full outline-none focus:border-magenta"
                />
              </div>
              <div className="mt-5 flex items-center gap-3">
                <AdminBtn kind="accent" type="submit" disabled={identityPending}>
                  {identityPending ? "…" : "Enregistrer l'identité"}
                </AdminBtn>
              </div>
              <StatusLine status={identityStatus} />
            </form>
          )}

          {tab === "bio" && (
            <form action={submitBio}>
              <AdminEyebrow className="mb-4">Biographie</AdminEyebrow>
              <AdminTextarea name="bioShort" label="Bio courte (carte)" rows={3} defaultValue={artist.bioShort} />
              <AdminTextarea name="bioLong" label="Bio longue (fiche)" rows={10} defaultValue={artist.bioLong} />
              <div className="italic text-[12px] text-ink-subtle">
                Markdown léger accepté : *italique*, **gras**, double saut de ligne pour paragraphes.
              </div>
              <div className="mt-5 flex items-center gap-3">
                <AdminBtn kind="accent" type="submit" disabled={bioPending}>
                  {bioPending ? "…" : "Enregistrer la biographie"}
                </AdminBtn>
              </div>
              <StatusLine status={bioStatus} />
            </form>
          )}

          {tab === "discographie" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <AdminEyebrow>Sorties · {disco.length}</AdminEyebrow>
                <AdminBtn kind="secondary" onClick={addDisco}>+ Ajouter une sortie</AdminBtn>
              </div>
              <ul className="flex flex-col gap-3">
                {disco.map((d, i) => (
                  <li key={d.id} className="grid grid-cols-[1fr_auto] gap-3 items-start p-3 border border-ink/10 rounded-[2px] bg-paper">
                    <div className="grid grid-cols-2 gap-2">
                      <input value={d.kind} onChange={(e) => updateDisco(i, { kind: e.target.value })} placeholder="Type (Album, EP…)" className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <input value={d.title} onChange={(e) => updateDisco(i, { title: e.target.value })} placeholder="Titre" className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <input value={d.year} onChange={(e) => updateDisco(i, { year: e.target.value })} placeholder="Année" className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <input value={d.cover} onChange={(e) => updateDisco(i, { cover: e.target.value })} placeholder="URL pochette (https://…)" className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <input value={d.note ?? ""} onChange={(e) => updateDisco(i, { note: e.target.value })} placeholder="Note (optionnel)" className="col-span-2 bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <AdminBtn kind="ghost" onClick={() => moveDisco(i, -1)}>↑</AdminBtn>
                      <AdminBtn kind="ghost" onClick={() => moveDisco(i, 1)}>↓</AdminBtn>
                      <AdminBtn kind="ghost" onClick={() => setDisco(disco.filter((_, j) => j !== i))}>Suppr.</AdminBtn>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <AdminBtn kind="accent" onClick={submitDisco} disabled={discoPending}>
                  {discoPending ? "…" : "Enregistrer la discographie"}
                </AdminBtn>
                <StatusLine status={discoStatus} />
              </div>
            </>
          )}

          {tab === "agenda" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <AdminEyebrow>Concerts · {shows.length}</AdminEyebrow>
                <AdminBtn kind="secondary" onClick={addShowRow}>+ Ajouter une date</AdminBtn>
              </div>
              <ul className="flex flex-col gap-3">
                {shows.map((s, i) => (
                  <li key={s.id ?? `new-${i}`} className="grid grid-cols-[1fr_auto] gap-3 items-start p-3 border border-ink/10 rounded-[2px] bg-paper">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={s.date} onChange={(e) => updateShow(i, { date: e.target.value })} className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <input value={s.city} onChange={(e) => updateShow(i, { city: e.target.value })} placeholder="Ville" className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <input value={s.venue} onChange={(e) => updateShow(i, { venue: e.target.value })} placeholder="Lieu" className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <input value={s.status} onChange={(e) => updateShow(i, { status: e.target.value })} placeholder="Statut (Complet, En vente…)" className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <input value={s.ticketUrl} onChange={(e) => updateShow(i, { ticketUrl: e.target.value })} placeholder="Lien billetterie (optionnel)" className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta" />
                      <label className="flex items-center gap-2 text-[12px] text-ink-muted">
                        <input type="checkbox" checked={s.free} onChange={(e) => updateShow(i, { free: e.target.checked })} />
                        Gratuit
                      </label>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <AdminBtn kind="accent" onClick={() => saveShowRow(i)} disabled={showPending}>Enregistrer</AdminBtn>
                      <AdminBtn kind="ghost" onClick={() => deleteShowRow(i)} disabled={showPending}>Suppr.</AdminBtn>
                    </div>
                  </li>
                ))}
              </ul>
              <StatusLine status={showStatus} />
            </>
          )}

          {tab === "reseaux" && (
            <>
              <AdminEyebrow className="mb-1">Newsletter de l&apos;artiste</AdminEyebrow>
              <p className="font-serif italic text-[12px] text-ink-muted mb-3 leading-[1.55]">
                Lien du formulaire d&apos;inscription du prestataire externe.
              </p>
              <div className="flex gap-2 items-center mb-1.5">
                <input
                  type="url"
                  value={newsletterUrl}
                  onChange={(e) => setNewsletterUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-paper-soft border border-ink/15 px-3.5 py-2.5 font-serif text-[14px] text-ink outline-none focus:border-magenta transition-colors rounded-[2px]"
                />
                <AdminBtn kind="accent" onClick={saveNewsletter} disabled={nlPending}>
                  {nlPending ? "…" : "Enregistrer"}
                </AdminBtn>
              </div>
              <StatusLine status={nlStatus} />

              <div className="mt-8 mb-4 border-t border-ink/10 pt-6 flex items-center justify-between">
                <AdminEyebrow>Réseaux & plateformes</AdminEyebrow>
                <AdminBtn kind="secondary" onClick={() => setSocials([...socials, { key: "", url: "" }])}>
                  + Ajouter une plateforme
                </AdminBtn>
              </div>
              <div className="flex flex-col gap-2">
                {socials.map((s, i) => (
                  <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center">
                    <input
                      value={s.key}
                      onChange={(e) =>
                        setSocials(socials.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))
                      }
                      placeholder="instagram"
                      className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta"
                    />
                    <input
                      value={s.url}
                      onChange={(e) =>
                        setSocials(socials.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
                      }
                      placeholder="https://..."
                      className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta"
                    />
                    <AdminBtn kind="ghost" onClick={() => setSocials(socials.filter((_, j) => j !== i))}>
                      Supprimer
                    </AdminBtn>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <AdminBtn kind="accent" onClick={submitSocials} disabled={socialsPending}>
                  {socialsPending ? "…" : "Enregistrer les réseaux"}
                </AdminBtn>
                <StatusLine status={socialsStatus} />
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <AdminEyebrow>Lecteurs intégrés</AdminEyebrow>
                  <AdminBtn
                    kind="secondary"
                    onClick={() => setEmbeds([...embeds, { type: "spotify", title: "", src: "" }])}
                  >
                    + Ajouter un embed
                  </AdminBtn>
                </div>
                <ul className="flex flex-col gap-2">
                  {embeds.map((e, i) => (
                    <li key={i} className="grid grid-cols-[120px_1fr_1.5fr_auto] gap-2 items-center">
                      <select
                        value={e.type}
                        onChange={(ev) =>
                          setEmbeds(
                            embeds.map((x, j) =>
                              j === i ? { ...x, type: ev.target.value as "spotify" | "youtube" } : x,
                            ),
                          )
                        }
                        className="bg-paper-soft border border-ink/15 px-2 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta"
                      >
                        <option value="spotify">spotify</option>
                        <option value="youtube">youtube</option>
                      </select>
                      <input
                        value={e.title}
                        onChange={(ev) =>
                          setEmbeds(embeds.map((x, j) => (j === i ? { ...x, title: ev.target.value } : x)))
                        }
                        placeholder="Titre"
                        className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta"
                      />
                      <input
                        value={e.src}
                        onChange={(ev) =>
                          setEmbeds(embeds.map((x, j) => (j === i ? { ...x, src: ev.target.value } : x)))
                        }
                        placeholder="https://..."
                        className="bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta"
                      />
                      <AdminBtn kind="ghost" onClick={() => setEmbeds(embeds.filter((_, j) => j !== i))}>
                        Supprimer
                      </AdminBtn>
                    </li>
                  ))}
                </ul>
                <div className="mt-3">
                  <AdminBtn kind="accent" onClick={submitEmbeds} disabled={embedsPending}>
                    {embedsPending ? "…" : "Enregistrer les lecteurs"}
                  </AdminBtn>
                  <StatusLine status={embedsStatus} />
                </div>
              </div>
            </>
          )}

          {tab === "medias" && (
            <>
              <AdminEyebrow className="mb-4">Portrait & couverture</AdminEyebrow>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="aspect-square bg-cover bg-center rounded-[2px] grain mb-2" style={{ backgroundImage: `url(${portraitUrl})` }} />
                  <label className="text-[11px] tracking-eyebrow uppercase font-bold text-magenta cursor-pointer hover:underline">
                    Changer le portrait
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAndSave(f, "portrait"); }} />
                  </label>
                </div>
                <div>
                  <div className="aspect-[16/9] bg-cover bg-center rounded-[2px] grain mb-2" style={{ backgroundImage: `url(${coverUrl})` }} />
                  <label className="text-[11px] tracking-eyebrow uppercase font-bold text-magenta cursor-pointer hover:underline">
                    Changer la couverture
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAndSave(f, "cover"); }} />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <AdminEyebrow>Galerie · {gallery.length}</AdminEyebrow>
                {mediaPending && <span className="text-[11px] text-ink-subtle italic">Envoi…</span>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gallery.map((src) => (
                  <div key={src} className="aspect-[4/3] bg-cover bg-center rounded-[2px] relative group grain" style={{ backgroundImage: `url(${src})` }}>
                    <div className="absolute inset-0 bg-bleu-nuit-900/0 group-hover:bg-bleu-nuit-900/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button type="button" onClick={() => removeGalleryImage(src)} className="text-[10px] tracking-eyebrow uppercase font-bold text-beige-sable border border-beige-sable/40 px-3 py-1.5 rounded-full cursor-pointer hover:border-magenta">
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
                <label className="aspect-[4/3] border-2 border-dashed border-ink/25 rounded-[2px] flex flex-col items-center justify-center gap-1 text-ink-muted hover:border-magenta hover:text-magenta cursor-pointer">
                  <div className="text-[20px]">+</div>
                  <div className="text-[10px] tracking-eyebrow uppercase font-bold">Ajouter</div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAndSave(f, "gallery"); }} />
                </label>
              </div>
              <StatusLine status={mediaStatus} />
            </>
          )}
        </div>

        <aside className="flex flex-col gap-4 sticky top-[88px]">
          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
            <AdminEyebrow className="mb-3">Aperçu rapide</AdminEyebrow>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="font-display text-[22px]">{disco.length}</div>
                <div className="text-[9px] tracking-eyebrow uppercase font-bold text-ink-subtle mt-1">
                  Sorties
                </div>
              </div>
              <div>
                <div className="font-display text-[22px]">{shows.length}</div>
                <div className="text-[9px] tracking-eyebrow uppercase font-bold text-ink-subtle mt-1">
                  Concerts
                </div>
              </div>
              <div>
                <div className="font-display text-[22px]">{socials.length}</div>
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
              style={{ backgroundImage: `url(${coverUrl})` }}
            />
          </div>

          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
            <AdminEyebrow className="mb-3">Zone dangereuse</AdminEyebrow>
            <p className="italic text-[12px] text-ink-muted leading-[1.5]">
              Archiver supprime définitivement la fiche et ses concerts. Tapez « oui » pour confirmer.
            </p>
            <input
              value={confirmArchive}
              onChange={(e) => setConfirmArchive(e.target.value)}
              placeholder="oui"
              className="mt-3 w-full bg-paper border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta"
            />
            <div className="flex flex-col gap-2 mt-2">
              <AdminBtn kind="danger" onClick={doArchive} disabled={archivePending}>
                {archivePending ? "…" : "Archiver la fiche"}
              </AdminBtn>
              {archiveError && (
                <span className="font-serif text-[12px] text-magenta">{archiveError}</span>
              )}
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
