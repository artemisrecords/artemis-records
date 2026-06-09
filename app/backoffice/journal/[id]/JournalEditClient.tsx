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
import { formatDate } from "@/lib/data";
import {
  saveNews,
  saveNewsImage,
  setNewsPublished,
  deleteNews,
} from "@/app/backoffice/journal/actions";
import type { NewsRow } from "@/lib/db/schema";

type Status = { tone: "ok" | "error"; message: string } | null;

export function JournalEditClient({
  news,
  others,
}: {
  news: NewsRow;
  others: NewsRow[];
}) {
  const dateISO = news.date;

  // Publication (action instantanée).
  const [published, setPublished] = useState(news.published);
  const [pubPending, startPub] = useTransition();
  const togglePublished = (next: boolean) => {
    setPublished(next);
    startPub(async () => {
      const res = await setNewsPublished(news.id, next);
      if (!res.ok) setPublished(!next);
    });
  };

  // Contenu (un seul enregistrement pour titre/chapô/corps/catégorie/date).
  const [status, setStatus] = useState<Status>(null);
  const [savePending, startSave] = useTransition();
  const submitNews = (formData: FormData) => {
    setStatus(null);
    startSave(async () => {
      const res = await saveNews(news.id, {
        title: String(formData.get("title") ?? ""),
        excerpt: String(formData.get("excerpt") ?? ""),
        body: String(formData.get("body") ?? ""),
        category: String(formData.get("category") ?? ""),
        date: String(formData.get("date") ?? ""),
      });
      setStatus(
        res.ok
          ? { tone: "ok", message: "Article enregistré." }
          : { tone: "error", message: res.error },
      );
    });
  };

  // Image à la une (upload Blob direct).
  const [imageUrl, setImageUrl] = useState(news.imageUrl);
  const [imgStatus, setImgStatus] = useState<Status>(null);
  const [imgPending, startImg] = useTransition();
  const uploadImage = (file: File) => {
    setImgStatus(null);
    startImg(async () => {
      try {
        const blob = await upload(`news/${news.id}/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
        });
        setImageUrl(blob.url);
        const res = await saveNewsImage(news.id, blob.url);
        setImgStatus(
          res.ok ? { tone: "ok", message: "Image enregistrée." } : { tone: "error", message: res.error },
        );
      } catch (err) {
        setImgStatus({ tone: "error", message: (err as Error).message });
      }
    });
  };

  // Suppression (dure, avec confirmation tapée).
  const [confirmDelete, setConfirmDelete] = useState("");
  const [delPending, startDel] = useTransition();
  const [delError, setDelError] = useState<string | null>(null);
  const doDelete = () => {
    setDelError(null);
    startDel(async () => {
      const res = await deleteNews(news.id, confirmDelete);
      if (res && !res.ok) setDelError(res.error);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle">
        <Link href="/backoffice/journal" className="hover:text-ink">
          ← Journal
        </Link>
      </div>

      <header className="flex items-end justify-between gap-6 flex-wrap pb-6 border-b border-ink/15">
        <div>
          <AdminEyebrow className="mb-2">
            {news.id} · mis à jour le {formatDate(news.date)}
          </AdminEyebrow>
          <h1 className="font-display uppercase tracking-display leading-[1.05] font-normal text-[clamp(1.9rem,3.4vw,2.6rem)] text-ink">
            Éditer l&apos;article
          </h1>
          <div className="flex items-center gap-2 mt-3">
            <Pill tone="magenta">{news.category || "Sans catégorie"}</Pill>
            <Pill tone={published ? "live" : "draft"}>
              {published ? "En ligne" : "Brouillon"}
            </Pill>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
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
              {published ? "Publié" : "Masqué"}
            </span>
          </label>
          <Link href={`/news/${news.id}`} target="_blank">
            <AdminBtn kind="secondary">Aperçu ↗</AdminBtn>
          </Link>
        </div>
      </header>

      <form action={submitNews} className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-6 items-start">
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-7">
          <AdminField name="title" label="Titre" defaultValue={news.title} />
          <AdminField name="excerpt" label="Chapô (excerpt)" defaultValue={news.excerpt} />
          <AdminTextarea
            name="body"
            label="Corps de l'article"
            rows={14}
            defaultValue={news.body}
            placeholder="Rédigez le corps de votre article. Markdown léger pris en charge."
          />
          <div className="italic text-[12px] text-ink-subtle">
            Markdown pris en charge : #, ##, *italique*, **gras**, liens
            [texte](url), images ![alt](url).
          </div>
          <div className="mt-5 flex items-center gap-3">
            <AdminBtn kind="accent" type="submit" disabled={savePending}>
              {savePending ? "…" : "Enregistrer"}
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
        </div>

        <aside className="flex flex-col gap-4 sticky top-[88px]">
          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
            <AdminEyebrow className="mb-3">Image à la une</AdminEyebrow>
            {imageUrl ? (
              <div
                className="aspect-[16/10] bg-cover bg-center rounded-[2px] grain"
                style={{ backgroundImage: `url(${imageUrl})` }}
              />
            ) : (
              <div className="aspect-[16/10] border-2 border-dashed border-ink/25 rounded-[2px] flex items-center justify-center text-ink-muted text-[12px] italic">
                Aucune image
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <label className="text-[11px] tracking-eyebrow uppercase font-bold text-magenta cursor-pointer hover:underline">
                {imgPending ? "Envoi…" : "Changer l'image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage(f);
                  }}
                />
              </label>
            </div>
            {imgStatus && (
              <div
                className={`mt-2 font-serif text-[12px] ${
                  imgStatus.tone === "ok" ? "text-vert-foret-700" : "text-magenta"
                }`}
              >
                {imgStatus.message}
              </div>
            )}
          </div>

          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
            <AdminSelect
              name="category"
              label="Catégorie"
              defaultValue={news.category}
              options={[
                { value: "Sortie", label: "Sortie" },
                { value: "Signature", label: "Signature" },
                { value: "Label", label: "Label" },
                { value: "Tournée", label: "Tournée" },
                { value: "Portrait", label: "Portrait" },
              ]}
            />
            <AdminField
              name="date"
              label="Date de publication"
              type="date"
              defaultValue={dateISO}
            />
            <AdminField
              label="URL (slug)"
              defaultValue={news.id}
              hint="Définitif (clé publique). Non modifiable."
            />
          </div>

          <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5">
            <AdminEyebrow className="mb-3">Zone dangereuse</AdminEyebrow>
            <p className="italic text-[12px] text-ink-muted leading-[1.5]">
              Supprimer retire définitivement l&apos;article. Tapez « oui » pour confirmer.
            </p>
            <input
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder="oui"
              className="mt-3 w-full bg-paper border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta"
            />
            <div className="flex flex-col gap-2 mt-2">
              <AdminBtn kind="danger" onClick={doDelete} disabled={delPending}>
                {delPending ? "…" : "Supprimer l'article"}
              </AdminBtn>
              {delError && (
                <span className="font-serif text-[12px] text-magenta">{delError}</span>
              )}
            </div>
          </div>
        </aside>
      </form>

      <div className="bg-paper border border-ink/10 rounded-[2px] p-5">
        <div className="flex items-center justify-between mb-3">
          <AdminEyebrow>Autres entrées</AdminEyebrow>
          <Link
            href="/backoffice/journal"
            className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-magenta hover:opacity-80"
          >
            Tout voir ⟶
          </Link>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {others.slice(0, 3).map((n) => (
            <li key={n.id}>
              <Link
                href={`/backoffice/journal/${n.id}`}
                className="block border border-ink/10 bg-paper-soft rounded-[2px] p-3 hover:border-ink/25"
              >
                <div className="text-[10px] tracking-eyebrow uppercase font-bold text-magenta">
                  {n.category}
                </div>
                <div className="font-display uppercase tracking-[0.04em] text-[14px] mt-1 line-clamp-2">
                  {n.title}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
