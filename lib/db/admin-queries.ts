import "server-only";
import { desc } from "drizzle-orm";
import { db } from "./index";
import { demos, demands, subscribers } from "./schema";
import type { DemoRow, DemandRow, SubscriberRow } from "./schema";
import { getArtists, getAllNews } from "./queries";
import { listContracts } from "./contract-queries";

export async function getDemos(): Promise<DemoRow[]> {
  return db.select().from(demos).orderBy(desc(demos.receivedAt));
}

export async function getDemands(): Promise<DemandRow[]> {
  return db.select().from(demands).orderBy(desc(demands.receivedAt));
}

export async function getSubscribers(): Promise<SubscriberRow[]> {
  return db.select().from(subscribers).orderBy(desc(subscribers.subscribedAt));
}

export type StatEvent = {
  kind: "demo" | "demande" | "news";
  date: string; // ISO yyyy-mm-dd
};

export type LabelStats = {
  artists: { total: number; published: number };
  news: { total: number; published: number };
  demos: { total: number; nouveau: number; retenu: number; refuse: number };
  demands: { total: number; ouverte: number; en_cours: number; close: number };
  shows: { total: number; upcoming: number };
  contracts: { total: number; active: number };
  events: StatEvent[];
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

export async function getLabelStats(): Promise<LabelStats> {
  const [artists, news, demoRows, demandRows, contractRows] = await Promise.all([
    getArtists(),
    getAllNews(),
    getDemos(),
    getDemands(),
    listContracts(),
  ]);

  const today = iso(new Date());
  const shows = artists.flatMap((a) => a.shows);

  const events: StatEvent[] = [
    ...demoRows.map((d) => ({ kind: "demo" as const, date: iso(d.receivedAt) })),
    ...demandRows.map((d) => ({ kind: "demande" as const, date: iso(d.receivedAt) })),
    ...news.map((n) => ({ kind: "news" as const, date: n.date })),
  ];

  return {
    artists: {
      total: artists.length,
      published: artists.filter((a) => a.published).length,
    },
    news: {
      total: news.length,
      published: news.filter((n) => n.published).length,
    },
    demos: {
      total: demoRows.length,
      nouveau: demoRows.filter((d) => d.status === "nouveau").length,
      retenu: demoRows.filter((d) => d.status === "retenu").length,
      refuse: demoRows.filter((d) => d.status === "refuse").length,
    },
    demands: {
      total: demandRows.length,
      ouverte: demandRows.filter((d) => d.status === "ouverte").length,
      en_cours: demandRows.filter((d) => d.status === "en_cours").length,
      close: demandRows.filter((d) => d.status === "close").length,
    },
    shows: {
      total: shows.length,
      upcoming: shows.filter((s) => s.date >= today).length,
    },
    contracts: {
      total: contractRows.length,
      active: contractRows.filter((c) => c.status === "en_cours").length,
    },
    events,
  };
}

export type NotifItem = {
  id: string;
  kind: "demo" | "demande" | "contrat";
  label: string;
  href: string;
};

/**
 * Éléments nécessitant une action : démos « nouveau », demandes « ouverte »,
 * contrats « à signer » + contrats arrivant à échéance dans les 6 mois.
 */
export async function getPendingNotifications(): Promise<NotifItem[]> {
  const [demoRows, demandRows, contractRows] = await Promise.all([
    getDemos(),
    getDemands(),
    listContracts(),
  ]);
  const items: NotifItem[] = [];
  for (const d of demoRows.filter((x) => x.status === "nouveau")) {
    items.push({
      id: `demo-${d.id}`,
      kind: "demo",
      label: `Nouvelle démo · ${d.artist}`,
      href: "/backoffice/demos",
    });
  }
  for (const d of demandRows.filter((x) => x.status === "ouverte")) {
    items.push({
      id: `demande-${d.id}`,
      kind: "demande",
      label: `Demande ouverte · ${d.subject}`,
      href: "/backoffice/demandes",
    });
  }
  const today = iso(new Date());
  const in6Months = iso(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000));
  for (const c of contractRows.filter((x) => x.status === "a_signer")) {
    items.push({
      id: `contrat-signer-${c.id}`,
      kind: "contrat",
      label: `Contrat à signer · ${c.title}`,
      href: `/backoffice/contrats/${c.id}`,
    });
  }
  for (const c of contractRows.filter(
    (x) => x.status !== "archive" && x.status !== "a_signer" && x.endDate >= today && x.endDate <= in6Months,
  )) {
    items.push({
      id: `contrat-echeance-${c.id}`,
      kind: "contrat",
      label: `Échéance proche · ${c.title}`,
      href: `/backoffice/contrats/${c.id}`,
    });
  }
  return items;
}
