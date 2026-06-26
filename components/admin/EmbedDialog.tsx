"use client";

import { useEffect, useState, useTransition } from "react";
import type { Embed } from "@/lib/data";
import { EmbedPlayer } from "@/components/EmbedPlayer";
import { AdminBtn, AdminEyebrow } from "@/components/admin/AdminPrimitives";
import { resolveEmbed } from "@/app/backoffice/artistes/actions";

type Resolved = { type: "spotify" | "youtube"; src: string };

const TYPE_LABEL: Record<string, string> = {
  album: "album",
  track: "titre",
  playlist: "playlist",
  artist: "artiste",
  episode: "épisode",
  show: "podcast",
};

// "https://open.spotify.com/embed/album/x" -> "Spotify · album"
function describe(r: Resolved): string {
  if (r.type === "youtube") return "YouTube · vidéo";
  const kind = r.src.split("/embed/")[1]?.split("/")[0] ?? "";
  return `Spotify · ${TYPE_LABEL[kind] ?? kind}`;
}

export function EmbedDialog({
  initial,
  onSave,
  onClose,
}: {
  initial?: Embed;
  onSave: (embed: Embed) => void;
  onClose: () => void;
}) {
  const [rawUrl, setRawUrl] = useState(initial?.src ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [resolved, setResolved] = useState<Resolved | null>(
    initial ? { type: initial.type, src: initial.src } : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startResolve] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const resolve = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setResolved(null);
      setError(null);
      return;
    }
    startResolve(async () => {
      const res = await resolveEmbed(trimmed);
      if (!res.ok) {
        setResolved(null);
        setError(res.error);
        return;
      }
      setError(null);
      setResolved({ type: res.type, src: res.src });
      // On ne pré-remplit le titre que s'il est vide (ne pas écraser une saisie).
      if (res.title && !title.trim()) setTitle(res.title);
    });
  };

  const canSave = !!resolved && !pending;
  const submit = () => {
    if (!resolved) return;
    onSave({ type: resolved.type, src: resolved.src, title: title.trim() });
    onClose();
  };

  const heading = initial ? "Modifier le lecteur" : "Ajouter un lecteur";

  return (
    <div
      className="fixed inset-0 z-50 bg-bleu-nuit-900/60 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      onClick={onClose}
    >
      <div
        className="bg-paper border border-ink/15 rounded-[3px] w-full max-w-[560px] my-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-ink/10 flex items-center justify-between">
          <AdminEyebrow className="!text-magenta">{heading}</AdminEyebrow>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-subtle hover:text-ink text-[20px] leading-none cursor-pointer"
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
              Lien Spotify ou YouTube
            </label>
            <input
              value={rawUrl}
              onChange={(e) => setRawUrl(e.target.value)}
              onBlur={(e) => resolve(e.target.value)}
              onPaste={(e) => resolve(e.clipboardData.getData("text"))}
              placeholder="Collez le lien de partage…"
              className="w-full bg-paper-soft border border-ink/15 px-3.5 py-2.5 font-serif text-[14px] text-ink outline-none focus:border-magenta transition-colors rounded-[2px]"
            />
            {pending && (
              <div className="mt-1.5 font-serif italic text-[12px] text-ink-subtle">
                Analyse du lien…
              </div>
            )}
            {error && (
              <div className="mt-1.5 font-serif text-[12px] text-magenta">{error}</div>
            )}
            {resolved && !error && (
              <div className="mt-1.5 font-serif text-[12px] text-vert-foret-700">
                ✓ {describe(resolved)} détecté
              </div>
            )}
          </div>

          {resolved && (
            <>
              <div>
                <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                  Titre affiché
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex. Pellicule · EP"
                  className="w-full bg-paper-soft border border-ink/15 px-3.5 py-2.5 font-serif text-[14px] text-ink outline-none focus:border-magenta transition-colors rounded-[2px]"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                  Aperçu
                </label>
                <EmbedPlayer embed={{ type: resolved.type, src: resolved.src, title }} />
              </div>
            </>
          )}

          <div className="flex items-center gap-2 justify-end pt-2 border-t border-ink/10">
            <AdminBtn kind="ghost" onClick={onClose}>
              Annuler
            </AdminBtn>
            <AdminBtn kind="accent" onClick={submit} disabled={!canSave}>
              {initial ? "Enregistrer" : "Ajouter"}
            </AdminBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
