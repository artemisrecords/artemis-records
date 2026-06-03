"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AdminBtn, AdminEyebrow, Pill } from "@/components/admin/AdminPrimitives";
import {
  saveNewsletterSettings,
  saveArtistNewsletter,
  type ActionResult,
} from "./actions";

const INPUT_CLASS =
  "w-full bg-paper-soft border border-ink/15 px-3.5 py-2.5 font-serif text-[14px] text-ink outline-none focus:border-magenta transition-colors rounded-[2px]";

type Status = { tone: "ok" | "error"; message: string } | null;

function OpenLink({ href }: { href: string | null }) {
  if (!href) {
    return (
      <span className="font-serif italic text-[12px] text-ink-subtle">
        Aucun lien
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-magenta hover:opacity-80"
    >
      Ouvrir ↗
    </a>
  );
}

export function NewsletterAdminClient({
  signupUrl,
  dashboardUrl,
  artists,
}: {
  signupUrl: string | null;
  dashboardUrl: string | null;
  artists: { id: string; name: string; newsletterUrl: string | null }[];
}) {
  const [signup, setSignup] = useState(signupUrl ?? "");
  const [dashboard, setDashboard] = useState(dashboardUrl ?? "");
  const [status, setStatus] = useState<Status>(null);
  const [pending, startTransition] = useTransition();

  const onSaveLabel = () => {
    setStatus(null);
    startTransition(async () => {
      const res = await saveNewsletterSettings({
        signupUrl: signup,
        dashboardUrl: dashboard,
      });
      setStatus(
        res.ok
          ? { tone: "ok", message: "Liens enregistrés." }
          : { tone: "error", message: res.error },
      );
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6 items-start">
      {/* Label newsletter config */}
      <section className="bg-paper-soft border border-ink/10 rounded-[2px] p-7">
        <AdminEyebrow className="mb-1">Newsletter du label</AdminEyebrow>
        <p className="font-serif italic text-[13px] text-ink-muted mb-5 leading-[1.55]">
          Collez le lien du formulaire d&apos;inscription de votre prestataire
          externe. C&apos;est ce lien qui s&apos;ouvre depuis le site public.
        </p>

        <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
          Lien du formulaire d&apos;inscription
        </label>
        <div className="flex gap-2 items-center mb-1.5">
          <input
            type="url"
            value={signup}
            onChange={(e) => setSignup(e.target.value)}
            placeholder="https://..."
            className={INPUT_CLASS}
          />
          <OpenLink href={signupUrl} />
        </div>
        <div className="mb-5 font-serif italic text-[12px] text-ink-subtle">
          Affiché dans le bandeau newsletter de la page d&apos;accueil.
        </div>

        <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
          Raccourci vers le dashboard du prestataire
        </label>
        <div className="flex gap-2 items-center mb-1.5">
          <input
            type="url"
            value={dashboard}
            onChange={(e) => setDashboard(e.target.value)}
            placeholder="https://..."
            className={INPUT_CLASS}
          />
          <OpenLink href={dashboardUrl} />
        </div>
        <div className="mb-5 font-serif italic text-[12px] text-ink-subtle">
          Lien privé pour gérer vos campagnes (visible uniquement ici).
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-ink/10">
          <AdminBtn kind="accent" onClick={onSaveLabel} className={pending ? "opacity-60" : ""}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </AdminBtn>
          {status && (
            <span
              className={`font-serif text-[12px] ${
                status.tone === "ok" ? "text-vert-foret-700" : "text-magenta"
              }`}
            >
              {status.message}
            </span>
          )}
        </div>
      </section>

      {/* Artist newsletters table */}
      <section className="bg-paper-soft border border-ink/10 rounded-[2px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink/10">
          <AdminEyebrow>Newsletters des artistes</AdminEyebrow>
          <Pill tone="neutral">{artists.length} artistes</Pill>
        </div>
        {artists.length === 0 ? (
          <div className="px-6 py-8 font-serif italic text-[13px] text-ink-muted">
            Aucun artiste pour le moment.
          </div>
        ) : (
          <ul className="divide-y divide-ink/8">
            {artists.map((a) => (
              <ArtistNewsletterRow key={a.id} artist={a} />
            ))}
          </ul>
        )}
        <div className="px-6 py-3 border-t border-ink/10 font-serif italic text-[12px] text-ink-subtle">
          Chaque lien est aussi modifiable depuis la fiche de l&apos;artiste.
        </div>
      </section>
    </div>
  );
}

function ArtistNewsletterRow({
  artist,
}: {
  artist: { id: string; name: string; newsletterUrl: string | null };
}) {
  const [url, setUrl] = useState(artist.newsletterUrl ?? "");
  const [status, setStatus] = useState<Status>(null);
  const [pending, startTransition] = useTransition();
  const dirty = url.trim() !== (artist.newsletterUrl ?? "");

  const onSave = () => {
    setStatus(null);
    startTransition(async () => {
      const res: ActionResult = await saveArtistNewsletter({
        artistId: artist.id,
        url,
      });
      setStatus(
        res.ok
          ? { tone: "ok", message: "Enregistré." }
          : { tone: "error", message: res.error },
      );
    });
  };

  return (
    <li className="px-6 py-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <Link
          href={`/backoffice/artistes/${artist.id}`}
          className="font-display uppercase tracking-[0.04em] text-[15px] hover:text-magenta"
        >
          {artist.name}
        </Link>
        <OpenLink href={artist.newsletterUrl} />
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://... (lien du formulaire)"
          className={INPUT_CLASS}
        />
        <AdminBtn
          kind={dirty ? "accent" : "secondary"}
          onClick={onSave}
          className={pending ? "opacity-60" : ""}
        >
          {pending ? "…" : "Enregistrer"}
        </AdminBtn>
      </div>
      {status && (
        <div
          className={`mt-1.5 font-serif text-[12px] ${
            status.tone === "ok" ? "text-vert-foret-700" : "text-magenta"
          }`}
        >
          {status.message}
        </div>
      )}
    </li>
  );
}
