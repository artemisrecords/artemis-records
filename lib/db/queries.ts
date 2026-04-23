import "server-only";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "./index";
import { artists, artistShows, news } from "./schema";
import type { Artist, ArtistShow, NewsRow } from "./schema";

export type ArtistWithShows = Artist & { shows: ArtistShow[] };

export async function getArtists(): Promise<ArtistWithShows[]> {
  const rows = await db.select().from(artists).orderBy(asc(artists.name));
  if (rows.length === 0) return [];
  const shows = await db
    .select()
    .from(artistShows)
    .orderBy(asc(artistShows.date));
  const byArtist = new Map<string, ArtistShow[]>();
  for (const s of shows) {
    const list = byArtist.get(s.artistId) ?? [];
    list.push(s);
    byArtist.set(s.artistId, list);
  }
  return rows.map((r) => ({ ...r, shows: byArtist.get(r.id) ?? [] }));
}

export async function findArtist(id: string): Promise<ArtistWithShows | undefined> {
  const rows = await db.select().from(artists).where(eq(artists.id, id)).limit(1);
  if (rows.length === 0) return undefined;
  const shows = await db
    .select()
    .from(artistShows)
    .where(eq(artistShows.artistId, id))
    .orderBy(asc(artistShows.date));
  return { ...rows[0], shows };
}

export async function getNews(): Promise<NewsRow[]> {
  return db
    .select()
    .from(news)
    .where(eq(news.published, true))
    .orderBy(desc(news.date));
}

export async function findNews(id: string): Promise<NewsRow | undefined> {
  const rows = await db.select().from(news).where(eq(news.id, id)).limit(1);
  return rows[0];
}
