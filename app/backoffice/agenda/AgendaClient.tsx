"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AdminBtn,
  AdminEyebrow,
  PageHeader,
  Pill,
} from "@/components/admin/AdminPrimitives";
import { SelectMenu } from "@/components/admin/SelectMenu";
import { saveShow, removeShow } from "./actions";

export type AgendaShow = {
  id: string;
  artistId: string;
  artist: string;
  date: string;
  city: string;
  venue: string;
  status: string;
  free: boolean;
  ticketUrl: string;
};

type ArtistOption = { id: string; name: string };
type Filter = "toutes" | "avenir" | "completes" | "passees";
type Draft = {
  artistId: string;
  date: string;
  city: string;
  venue: string;
  status: string;
  free: boolean;
  ticketUrl: string;
};
type Status = { tone: "ok" | "error"; message: string } | null;

const emptyDraft: Draft = {
  artistId: "",
  date: "",
  city: "",
  venue: "",
  status: "",
  free: false,
  ticketUrl: "",
};

const FILTERS: { k: Filter; label: string }[] = [
  { k: "toutes", label: "Toutes" },
  { k: "avenir", label: "À venir" },
  { k: "completes", label: "Complètes" },
  { k: "passees", label: "Passées" },
];

function icsEscape(v: string): string {
  return v.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

function downloadIcs(shows: AgendaShow[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ARTemis Records//Agenda//FR",
  ];
  for (const s of shows) {
    const d = s.date.replace(/-/g, "");
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${s.id}@artemis-records`);
    lines.push(`DTSTART;VALUE=DATE:${d}`);
    lines.push(`SUMMARY:${icsEscape(`${s.artist} — ${s.venue}, ${s.city}`)}`);
    if (s.ticketUrl) lines.push(`URL:${icsEscape(s.ticketUrl)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "agenda-artemis.ics";
  a.click();
  URL.revokeObjectURL(url);
}

const inputCls =
  "bg-paper-soft border border-ink/15 px-3 py-2 text-[13px] rounded-[2px] outline-none focus:border-magenta w-full";

// Défini au niveau module (et non dans AgendaClient) : une fonction recréée à
// chaque rendu donnerait un nouveau type de composant → remount des inputs →
// perte du focus à chaque frappe.
function DraftFields({
  draft,
  set,
  withArtist,
  artistOptions,
}: {
  draft: Draft;
  set: (d: Draft) => void;
  withArtist: boolean;
  artistOptions: { value: string; label: string }[];
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {withArtist && (
        <div className="md:col-span-3">
          <SelectMenu
            value={draft.artistId}
            onChange={(v) => set({ ...draft, artistId: v })}
            options={artistOptions}
            placeholder="— Choisir un artiste —"
          />
        </div>
      )}
      <input type="date" value={draft.date} onChange={(e) => set({ ...draft, date: e.target.value })} className={inputCls} />
      <input value={draft.city} onChange={(e) => set({ ...draft, city: e.target.value })} placeholder="Ville" className={inputCls} />
      <input value={draft.venue} onChange={(e) => set({ ...draft, venue: e.target.value })} placeholder="Lieu" className={inputCls} />
      <input value={draft.status} onChange={(e) => set({ ...draft, status: e.target.value })} placeholder="Statut (Complet, En vente…)" className={inputCls} />
      <input value={draft.ticketUrl} onChange={(e) => set({ ...draft, ticketUrl: e.target.value })} placeholder="Lien billetterie" className={inputCls} />
      <label className="flex items-center gap-2 text-[12px] text-ink-muted">
        <input type="checkbox" checked={draft.free} onChange={(e) => set({ ...draft, free: e.target.checked })} />
        Gratuit
      </label>
    </div>
  );
}

export function AgendaClient({
  shows,
  artists,
}: {
  shows: AgendaShow[];
  artists: ArtistOption[];
}) {
  const [filter, setFilter] = useState<Filter>("toutes");
  const [adding, setAdding] = useState(false);
  const [addDraft, setAddDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);
  const [msg, setMsg] = useState<Status>(null);
  const [pending, start] = useTransition();

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    return shows.filter((s) => {
      if (filter === "avenir") return s.date >= today;
      if (filter === "passees") return s.date < today;
      if (filter === "completes") return s.status === "Complet";
      return true;
    });
  }, [shows, filter, today]);

  const byMonth = useMemo(() => {
    const map = new Map<string, AgendaShow[]>();
    for (const s of filtered) {
      const key = s.date.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()];
  }, [filtered]);

  const submitAdd = () => {
    setMsg(null);
    start(async () => {
      const res = await saveShow(addDraft.artistId, {
        date: addDraft.date,
        city: addDraft.city,
        venue: addDraft.venue,
        status: addDraft.status,
        free: addDraft.free,
        ticketUrl: addDraft.ticketUrl,
      });
      if (res.ok) {
        setAdding(false);
        setAddDraft(emptyDraft);
        setMsg({ tone: "ok", message: "Date ajoutée." });
      } else {
        setMsg({ tone: "error", message: res.error });
      }
    });
  };

  const startEdit = (s: AgendaShow) => {
    setEditingId(s.id);
    setEditDraft({
      artistId: s.artistId,
      date: s.date,
      city: s.city,
      venue: s.venue,
      status: s.status,
      free: s.free,
      ticketUrl: s.ticketUrl,
    });
  };

  const submitEdit = (id: string) => {
    setMsg(null);
    start(async () => {
      const res = await saveShow(editDraft.artistId, {
        id,
        date: editDraft.date,
        city: editDraft.city,
        venue: editDraft.venue,
        status: editDraft.status,
        free: editDraft.free,
        ticketUrl: editDraft.ticketUrl,
      });
      if (res.ok) {
        setEditingId(null);
        setMsg({ tone: "ok", message: "Date enregistrée." });
      } else {
        setMsg({ tone: "error", message: res.error });
      }
    });
  };

  const doRemove = (id: string) => {
    setMsg(null);
    start(async () => {
      const res = await removeShow(id);
      if (res.ok) {
        setEditingId(null);
        setMsg({ tone: "ok", message: "Date supprimée." });
      } else {
        setMsg({ tone: "error", message: res.error });
      }
    });
  };

  const artistSelectOptions = [
    { value: "", label: "— Choisir un artiste —" },
    ...artists.map((a) => ({ value: a.id, label: a.name })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        chapter="06"
        eyebrow={`Agenda · ${shows.length} dates`}
        title="Concerts & tournées"
        italic="Planifier, suivre, annoncer. Le calendrier vivant du label, soir par soir."
        actions={
          <>
            <AdminBtn kind="secondary" onClick={() => downloadIcs(filtered)}>
              Exporter .ics
            </AdminBtn>
            <AdminBtn kind="accent" onClick={() => setAdding((v) => !v)}>
              {adding ? "Fermer" : "+ Ajouter une date"}
            </AdminBtn>
          </>
        }
      />

      {adding && (
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] p-5 flex flex-col gap-3">
          <AdminEyebrow>Nouvelle date</AdminEyebrow>
          <DraftFields draft={addDraft} set={setAddDraft} withArtist artistOptions={artistSelectOptions} />
          <div className="flex items-center gap-3">
            <AdminBtn kind="accent" onClick={submitAdd} disabled={pending}>
              {pending ? "…" : "Ajouter la date"}
            </AdminBtn>
            <AdminBtn kind="ghost" onClick={() => { setAdding(false); setAddDraft(emptyDraft); }}>
              Annuler
            </AdminBtn>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const active = f.k === filter;
          return (
            <button
              key={f.k}
              type="button"
              onClick={() => setFilter(f.k)}
              className={`font-serif text-[11px] tracking-eyebrow uppercase font-bold px-3.5 py-2 rounded-full border cursor-pointer transition-colors ${
                active
                  ? "bg-bleu-nuit-700 border-bleu-nuit-700 text-beige-sable"
                  : "bg-paper-soft border-ink/15 text-ink-muted hover:text-ink hover:border-ink/40"
              }`}
            >
              {f.label}
            </button>
          );
        })}
        {msg && (
          <span
            className={`ml-2 font-serif text-[12px] ${
              msg.tone === "ok" ? "text-vert-foret-700" : "text-magenta"
            }`}
          >
            {msg.message}
          </span>
        )}
      </div>

      {byMonth.length === 0 && (
        <p className="italic text-[13px] text-ink-muted">Aucune date pour ce filtre.</p>
      )}

      {byMonth.map(([month, list]) => {
        const monthLabel = new Date(month + "-01").toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        });
        return (
          <section key={month} className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <AdminEyebrow className="shrink-0">{monthLabel}</AdminEyebrow>
              <span className="h-px flex-1 bg-ink/15" />
              <span className="text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                {list.length} date{list.length > 1 ? "s" : ""}
              </span>
            </div>
            <ul className="bg-paper-soft border border-ink/10 rounded-[2px] overflow-hidden">
              {list.map((s, i) => {
                const isEditing = editingId === s.id;
                return (
                  <li
                    key={`${s.artistId}-${s.id}`}
                    className={`px-6 py-4 ${i > 0 ? "border-t border-ink/8" : ""} ${
                      isEditing ? "bg-paper" : "hover:bg-paper/60"
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex flex-col gap-3">
                        <div className="text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                          {s.artist}
                        </div>
                        <DraftFields draft={editDraft} set={setEditDraft} withArtist={false} artistOptions={artistSelectOptions} />
                        <div className="flex items-center gap-2">
                          <AdminBtn kind="accent" onClick={() => submitEdit(s.id)} disabled={pending}>
                            {pending ? "…" : "Enregistrer"}
                          </AdminBtn>
                          <AdminBtn kind="ghost" onClick={() => setEditingId(null)}>
                            Annuler
                          </AdminBtn>
                          <AdminBtn kind="danger" onClick={() => doRemove(s.id)} disabled={pending}>
                            Supprimer
                          </AdminBtn>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-[100px_1fr_1fr_auto_auto] gap-4 items-center">
                        <div className="font-display">
                          <div className="text-[28px] leading-none">{s.date.slice(8)}</div>
                          <div className="text-[10px] tracking-eyebrow uppercase text-ink-subtle mt-1">
                            {new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short" })}
                          </div>
                        </div>
                        <div>
                          <div className="font-display uppercase tracking-[0.04em] text-[15px]">
                            {s.artist}
                          </div>
                          <div className="italic text-[12px] text-ink-muted">
                            {s.venue} · {s.city}
                          </div>
                        </div>
                        <div className="italic text-[13px] text-ink-muted truncate">
                          {s.ticketUrl || (s.free ? "Gratuit" : "Billetterie à venir")}
                        </div>
                        <Pill
                          tone={s.free ? "live" : s.status === "Complet" ? "mute" : "magenta"}
                        >
                          {s.status || "-"}
                        </Pill>
                        <button
                          type="button"
                          onClick={() => startEdit(s)}
                          className="font-serif text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle hover:text-magenta cursor-pointer"
                        >
                          Éditer ⟶
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
