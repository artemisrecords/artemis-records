import "server-only";
import { eq, desc, asc, inArray } from "drizzle-orm";
import { db } from "./index";
import { artists, artistShows, news, settings } from "./schema";
import type { Artist, ArtistShow, NewsRow } from "./schema";

export const NEWSLETTER_SIGNUP_KEY = "newsletter_signup_url";
export const NEWSLETTER_DASHBOARD_KEY = "newsletter_dashboard_url";

export const LABEL_EMAIL_KEY = "label_contact_email";
export const LABEL_PHONE_KEY = "label_phone";
export const LABEL_ADDRESS_KEY = "label_address";

export const LABEL_DEFAULTS = {
  email: "artemis.inscriptions@gmail.com",
  phone: "07 78 47 22 30",
  address: "22 rue des Épinettes, 95180 Menucourt",
};

export type LabelSettings = { email: string; phone: string; address: string };

export async function getLabelSettings(): Promise<LabelSettings> {
  const rows = await db
    .select()
    .from(settings)
    .where(
      inArray(settings.key, [LABEL_EMAIL_KEY, LABEL_PHONE_KEY, LABEL_ADDRESS_KEY]),
    );
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  return {
    email: byKey.get(LABEL_EMAIL_KEY) ?? LABEL_DEFAULTS.email,
    phone: byKey.get(LABEL_PHONE_KEY) ?? LABEL_DEFAULTS.phone,
    address: byKey.get(LABEL_ADDRESS_KEY) ?? LABEL_DEFAULTS.address,
  };
}

export async function getLabelNotifyEmail(): Promise<string> {
  return (await getLabelSettings()).email;
}

export type NewsletterSettings = {
  signupUrl: string | null;
  dashboardUrl: string | null;
};

export async function getNewsletterSettings(): Promise<NewsletterSettings> {
  const rows = await db
    .select()
    .from(settings)
    .where(inArray(settings.key, [NEWSLETTER_SIGNUP_KEY, NEWSLETTER_DASHBOARD_KEY]));
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  return {
    signupUrl: byKey.get(NEWSLETTER_SIGNUP_KEY) ?? null,
    dashboardUrl: byKey.get(NEWSLETTER_DASHBOARD_KEY) ?? null,
  };
}

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

export async function getAllNews(): Promise<NewsRow[]> {
  return db.select().from(news).orderBy(desc(news.date));
}

export async function findNews(id: string): Promise<NewsRow | undefined> {
  const rows = await db.select().from(news).where(eq(news.id, id)).limit(1);
  return rows[0];
}
