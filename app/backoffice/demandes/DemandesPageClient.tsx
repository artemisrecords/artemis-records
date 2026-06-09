"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AdminBtn,
  AdminEyebrow,
  PageHeader,
  Pill,
} from "@/components/admin/AdminPrimitives";
import { SelectMenu } from "@/components/admin/SelectMenu";
import {
  DEMAND_CATEGORY_LABEL,
  DEMAND_STATUS_LABEL,
  type Demand,
  type DemandCategory,
} from "@/lib/adminData";
import { formatDate } from "@/lib/data";
import { updateDemandStatus, updateDemandAssignee } from "./actions";

export type Account = { id: string; name: string };

type CatFilter = "tous" | DemandCategory;
const CAT_FILTERS: { k: CatFilter; label: string }[] = [
  { k: "tous", label: "Toutes" },
  { k: "presse", label: "Presse" },
  { k: "booking", label: "Booking" },
  { k: "partenariat", label: "Partenariat" },
  { k: "licence", label: "Synchro" },
  { k: "autre", label: "Autre" },
];

type StatusFilter = "tous" | "ouverte" | "en_cours" | "close";
type StatusKey = Exclude<StatusFilter, "tous">;

const STATUS_OPTIONS: { value: StatusKey; label: string }[] = [
  { value: "ouverte", label: "Ouverte" },
  { value: "en_cours", label: "En cours" },
  { value: "close", label: "Close" },
];

export function DemandesPageClient({
  demands,
  accounts,
}: {
  demands: Demand[];
  accounts: Account[];
}) {
  const [cat, setCat] = useState<CatFilter>("tous");
  const [status, setStatus] = useState<StatusFilter>("tous");
  const [selectedId, setSelectedId] = useState<string>(demands[0]?.id ?? "");

  const filtered = useMemo(() => {
    return demands.filter((d) => {
      if (cat !== "tous" && d.category !== cat) return false;
      if (status !== "tous" && d.status !== status) return false;
      return true;
    });
  }, [demands, cat, status]);

  const selected = demands.find((d) => d.id === selectedId) ?? filtered[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        chapter="03"
        eyebrow={`Demandes entrantes · ${demands.length} au total`}
        title="Demandes"
        italic="Presse, booking, partenariats, synchros : tout ce qui arrive par le formulaire contact, rangé pour mieux répondre."
      />

      <div className="flex flex-col gap-3">
        <div className="flex gap-2 flex-wrap">
          {CAT_FILTERS.map((f) => {
            const active = f.k === cat;
            return (
              <button
                key={f.k}
                type="button"
                onClick={() => setCat(f.k)}
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
        </div>
        <div className="flex items-center gap-2 flex-wrap text-[10px] tracking-eyebrow uppercase font-bold">
          <span className="text-ink-subtle">Statut</span>
          {(
            [
              ["tous", "Tous"],
              ["ouverte", "Ouvertes"],
              ["en_cours", "En cours"],
              ["close", "Closes"],
            ] as const
          ).map(([k, l]) => {
            const active = status === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setStatus(k)}
                className={`px-2.5 py-1.5 rounded-full cursor-pointer transition-colors ${
                  active
                    ? "text-magenta bg-magenta/10"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-6 items-start">
        <div className="bg-paper-soft border border-ink/10 rounded-[2px] overflow-hidden">
          <div className="grid grid-cols-[100px_1fr_auto_auto] gap-4 px-6 py-3 border-b border-ink/10 text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
            <div>Type</div>
            <div>Sujet & expéditeur</div>
            <div>Reçue</div>
            <div>Statut</div>
          </div>
          <ul>
            {filtered.map((d) => {
              const active = selected?.id === d.id;
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(d.id)}
                    className={`w-full grid grid-cols-[100px_1fr_auto_auto] gap-4 px-6 py-4 items-center cursor-pointer border-t border-ink/8 text-left transition-colors relative ${
                      active ? "bg-paper" : "hover:bg-paper/60"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-magenta" />
                    )}
                    <Pill tone="neutral">
                      {DEMAND_CATEGORY_LABEL[d.category as DemandCategory]}
                    </Pill>
                    <div className="min-w-0">
                      <div className="font-display uppercase tracking-[0.04em] text-[14px] truncate">
                        {d.subject}
                      </div>
                      <div className="italic text-[12px] text-ink-muted truncate mt-0.5">
                        {d.name}
                        {d.org && <span> · {d.org}</span>} · {d.email}
                      </div>
                    </div>
                    <div className="italic text-[12px] text-ink-muted whitespace-nowrap">
                      {formatDate(d.receivedAt)}
                    </div>
                    <Pill
                      tone={
                        d.status === "ouverte"
                          ? "magenta"
                          : d.status === "en_cours"
                          ? "info"
                          : "mute"
                      }
                    >
                      {DEMAND_STATUS_LABEL[d.status as StatusKey]}
                    </Pill>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {selected && (
          <DemandDetail key={selected.id} demand={selected} accounts={accounts} />
        )}
      </div>
    </div>
  );
}

function DemandDetail({
  demand,
  accounts,
}: {
  demand: Demand;
  accounts: Account[];
}) {
  const [status, setStatus] = useState<string>(demand.status);
  const [assignedTo, setAssignedTo] = useState<string>(demand.assignedTo ?? "");
  const [, startTransition] = useTransition();

  const assigneeName =
    accounts.find((a) => a.id === assignedTo)?.name ?? (assignedTo || null);

  const changeStatus = (v: string) => {
    setStatus(v);
    startTransition(async () => {
      await updateDemandStatus(demand.id, v);
    });
  };
  const changeAssignee = (v: string) => {
    setAssignedTo(v);
    startTransition(async () => {
      await updateDemandAssignee(demand.id, v);
    });
  };

  const tone =
    status === "ouverte" ? "magenta" : status === "en_cours" ? "info" : "mute";

  return (
    <aside className="bg-paper-soft border border-ink/10 rounded-[2px] sticky top-[88px]">
      <header className="p-6 border-b border-ink/10">
        <div className="flex items-center justify-between">
          <AdminEyebrow>
            {demand.id} · {formatDate(demand.receivedAt)}
          </AdminEyebrow>
          <Pill tone={tone}>{DEMAND_STATUS_LABEL[status as StatusKey]}</Pill>
        </div>
        <h2 className="font-display uppercase tracking-display text-[clamp(1.35rem,2.4vw,1.85rem)] mt-2 font-normal leading-[1.15]">
          {demand.subject}
        </h2>
        <div className="flex items-center gap-2 mt-3">
          <Pill tone="neutral">
            {DEMAND_CATEGORY_LABEL[demand.category as DemandCategory]}
          </Pill>
          {assigneeName && <Pill tone="info">Suivi · {assigneeName}</Pill>}
        </div>
      </header>

      <div className="p-6 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <AdminEyebrow className="mb-1">Expéditeur</AdminEyebrow>
            <div className="font-serif text-[14px] text-ink">{demand.name}</div>
            {demand.org && (
              <div className="italic text-[12px] text-ink-muted">{demand.org}</div>
            )}
          </div>
          <div>
            <AdminEyebrow className="mb-1">Contact</AdminEyebrow>
            <a
              href={`mailto:${demand.email}`}
              className="block italic text-[13px] text-magenta hover:underline break-all"
            >
              {demand.email}
            </a>
            {demand.phone && (
              <div className="font-serif text-[13px] text-ink mt-1">
                {demand.phone}
              </div>
            )}
          </div>
        </div>

        <div>
          <AdminEyebrow className="mb-2">Message</AdminEyebrow>
          <div className="bg-paper border border-ink/10 p-4 rounded-[2px]">
            <p className="font-serif text-[14px] leading-[1.65] text-ink m-0">
              {demand.message}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-ink/10">
          <div>
            <AdminEyebrow className="mb-1">Statut</AdminEyebrow>
            <SelectMenu value={status} onChange={changeStatus} options={STATUS_OPTIONS} />
          </div>
          <div>
            <AdminEyebrow className="mb-1">Assigné à</AdminEyebrow>
            <SelectMenu
              value={assignedTo}
              onChange={changeAssignee}
              placeholder="Personne"
              options={[
                { value: "", label: "Personne" },
                ...accounts.map((a) => ({ value: a.id, label: a.name })),
              ]}
            />
          </div>
        </div>

        <a
          href={`mailto:${demand.email}?subject=${encodeURIComponent(`Re: ${demand.subject}`)}`}
        >
          <AdminBtn kind="primary">Répondre par email ↗</AdminBtn>
        </a>
      </div>
    </aside>
  );
}
