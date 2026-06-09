import "server-only";
import { desc } from "drizzle-orm";
import { db } from "./index";
import { demos, demands, subscribers } from "./schema";
import type { DemoRow, DemandRow, SubscriberRow } from "./schema";
import { getArtists, getAllNews } from "./queries";

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
  kind: "demo" | "demande" | "news" | "abonne";
  date: string; // ISO yyyy-mm-dd
};

export type LabelStats = {
  artists: { total: number; published: number };
  news: { total: number; published: number };
  demos: { total: number; nouveau: number; retenu: number; refuse: number };
  demands: { total: number; ouverte: number; en_cours: number; close: number };
  subscribers: { total: number; confirmed: number };
  shows: { total: number; upcoming: number };
  events: StatEvent[];
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

export async function getLabelStats(): Promise<LabelStats> {
  const [artists, news, demoRows, demandRows, subs] = await Promise.all([
    getArtists(),
    getAllNews(),
    getDemos(),
    getDemands(),
    getSubscribers(),
  ]);

  const today = iso(new Date());
  const shows = artists.flatMap((a) => a.shows);

  const events: StatEvent[] = [
    ...demoRows.map((d) => ({ kind: "demo" as const, date: iso(d.receivedAt) })),
    ...demandRows.map((d) => ({ kind: "demande" as const, date: iso(d.receivedAt) })),
    ...news.map((n) => ({ kind: "news" as const, date: n.date })),
    ...subs.map((s) => ({ kind: "abonne" as const, date: iso(s.subscribedAt) })),
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
    subscribers: {
      total: subs.length,
      confirmed: subs.filter((s) => s.confirmedAt !== null).length,
    },
    shows: {
      total: shows.length,
      upcoming: shows.filter((s) => s.date >= today).length,
    },
    events,
  };
}

export type NotifItem = {
  id: string;
  kind: "demo" | "demande";
  label: string;
  href: string;
};

/** Éléments nécessitant une action : démos « nouveau » + demandes « ouverte ». */
export async function getPendingNotifications(): Promise<NotifItem[]> {
  const [demoRows, demandRows] = await Promise.all([getDemos(), getDemands()]);
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
  return items;
}
